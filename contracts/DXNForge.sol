// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

interface IGOLDToken {
    function mint(address to, uint256 amount) external;
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

interface IDBXen {
    function stake(uint256 amount) external;
    function unstake(uint256 amount) external;
    function claimFees() external;
    function currentCycle() external view returns (uint256);
}

interface ISwapRouter {
    struct ExactInputSingleParams {
        address tokenIn;
        address tokenOut;
        uint24 fee;
        address recipient;
        uint256 amountIn;
        uint256 amountOutMinimum;
        uint160 sqrtPriceLimitX96;
    }
    function exactInputSingle(ExactInputSingleParams calldata params) external payable returns (uint256 amountOut);
}

interface IWETH {
    function deposit() external payable;
    function withdraw(uint256) external;
}

// ── XEN burn interfaces ──
interface IXEN {
    function burn(address user, uint256 amount) external;
    function totalSupply() external view returns (uint256);
}

interface IBurnRedeemable {
    function onTokenBurned(address user, uint256 amount) external;
}

contract DXNForge is Ownable, ReentrancyGuard, IBurnRedeemable {
    using SafeERC20 for IERC20;

    uint256 private constant ACC = 1e18;
    address private constant DEAD = 0x000000000000000000000000000000000000dEaD;

    // ── Fee split (basis points / 10000) ──
    uint256 public constant FEE_GOLD = 8800;
    uint256 public constant FEE_BURN = 888;
    uint256 public constant FEE_LTS  = 312;
    uint256 private constant FEE_BASE = 10000;

    uint256 public constant TIX_DEC = 1e18;

    // ── XEN burn constants ──
    uint256 public constant XEN_BATCH = 2_500_000 * 1e18;
    uint256 public constant XEN_BASE_FEE = 0.000012 ether;
    uint256 public constant XEN_BATCH_TIX = 10000;

    // ── External contracts ──
    IERC20     public DXN;
    IGOLDToken public GOLD;
    IDBXen     public DBXEN;
    ISwapRouter public ROUTER;
    address    public WETH;
    IXEN       public XEN;

    // ── LTS contract (set once) ──
    address public ltsContract;

    // ── Protocol state ──
    uint256 public epoch = 1;
    uint256 public immutable deployTime;
    uint256 public pendingBurn;
    uint256 public ltsReserve;

    // ── Epoch snapshots ──
    mapping(uint256 => uint256) public epAcc;
    mapping(uint256 => uint256) public epTix;
    mapping(uint256 => uint256) public epGold;
    mapping(uint256 => bool)    public epDone;

    // ── Fee timing ──
    uint256 public lastFeeTime;
    uint256 public feeInterval = 5 minutes;
    uint256 public xenFeePool;
    uint256 public constant MIN_BURN = 0.0001 ether;

    // ══════════════════════════════════════════════════
    // ── DXN Staking: 3-Bucket Pipeline ──
    // ══════════════════════════════════════════════════
    //
    //  fresh (cycle N) → ripe (cycle N+1) → staked (cycle N+2)
    //  All 3 buckets earn tickets.
    //  Only "staked" is withdrawable.
    //
    struct UserDXN {
        uint256 fresh;      // deposited this cycle, earning tickets, locked
        uint256 freshCy;    // cycle when fresh was deposited
        uint256 ripe;       // promoted from fresh, earning tickets, locked
        uint256 ripeCy;     // cycle when ripe becomes staked
        uint256 staked;     // fully staked, earning tickets, withdrawable
    }
    mapping(address => UserDXN) public userDXN;
    uint256 public dxnFresh;
    uint256 public dxnRipe;
    uint256 public dxnStaked;

    // ── Ticket system ──
    uint256 public accTix;
    uint256 public tixEpoch;
    uint256 public stakerTixEpoch;
    mapping(address => mapping(uint256 => uint256)) public userBurnTix;  // per-epoch burn tickets
    mapping(address => uint256) public userTixDebt;
    mapping(address => uint256) public userTixEp;

    // ══════════════════════════════════════════════════
    // ── GOLD Staking: 4-Bucket System ──
    // ══════════════════════════════════════════════════
    //
    //  Auto GOLD: earned from tickets after B&B. Earns ETH.
    //             Claimed in full via claimRewards() only.
    //
    //  Manual pipeline: fresh → ripe → staked
    //    fresh: NOT earning ETH
    //    ripe:  earning ETH (settlement on promotion)
    //    staked: earning ETH, partially withdrawable via unstakeGold()
    //
    mapping(address => uint256) public autoGold;
    uint256 public totAutoGold;

    struct ManualGold {
        uint256 fresh;      // deposited this cycle, not earning ETH
        uint256 freshCy;    // cycle when fresh was deposited
        uint256 ripe;       // promoted from fresh, earning ETH, locked
        uint256 ripeCy;     // cycle when ripe becomes staked
        uint256 staked;     // fully staked, earning ETH, withdrawable
    }
    mapping(address => ManualGold) public manualGold;
    uint256 public goldFresh;
    uint256 public goldRipe;
    uint256 public goldStaked;

    // ── ETH dividend accumulator ──
    uint256 public accEth;
    mapping(address => uint256) public ethDebt;
    mapping(address => uint256) public unclaimedEth;
    uint256 public goldEthReserve;

    // ── LTS weight tracking (Forge is source of truth) ──
    mapping(address => uint256) public userLtsDXN;
    mapping(address => uint256) public userLtsGold;
    uint256 public globalLtsDXN;
    uint256 public globalLtsGold;

    // ── XEN burn stats ──
    uint256 public xenBurned;
    uint256 public xenFees;
    mapping(address => uint256) public userXenBurned;

    // ── Events ──
    event Staked(address indexed u, uint256 amt);
    event Unstaked(address indexed u, uint256 amt);
    event Fees(uint256 total, uint256 gold, uint256 burn, uint256 lts);
    event Tix(uint256 wt, uint256 acc, uint256 add);
    event GoldAlloc(address indexed u, uint256 amt, uint256 ep);
    event Rewards(address indexed u, uint256 gold, uint256 eth);
    event GoldStaked(address indexed u, uint256 amt);
    event GoldUnstaked(address indexed u, uint256 amt);
    event EthClaimed(address indexed u, uint256 amt);
    event BuyBurn(uint256 indexed ep, uint256 eth, uint256 dxn, uint256 gold);
    event XenBurn(address indexed u, uint256 batches, uint256 tix, uint256 fee);
    event LtsDeposit(address indexed u, uint256 amt, bool isDXN);
    event LtsTransfer(address indexed from, address indexed to, uint256 amt, bool isDXN);
    event LtsWithdraw(address indexed u, uint256 amt, bool isDXN);
    event LtsEthPulled(uint256 amt);

    // ── Errors ──
    error Zero();
    error InsuffBal();
    error Cooldown();
    error Fail();
    error NoBurn();
    error NoTix();
    error AlreadySet();
    error NotLTS();
    error InsuffFee();
    error NoBatch();

    modifier onlyLTS() {
        if (msg.sender != ltsContract) revert NotLTS();
        _;
    }

    constructor(
        address _dxn,
        address _gold,
        address _dbxen,
        address _router,
        address _weth,
        address _xen,
        address _owner
    ) Ownable(_owner) {
        DXN    = IERC20(_dxn);
        GOLD   = IGOLDToken(_gold);
        DBXEN  = IDBXen(_dbxen);
        ROUTER = ISwapRouter(_router);
        WETH   = _weth;
        XEN    = IXEN(_xen);

        DXN.approve(_dbxen, type(uint256).max);
        DXN.approve(_router, type(uint256).max);

        deployTime = block.timestamp;
    }

    // ══════════════════════════════════════════════════
    // ── Owner functions (remove before mainnet) ──
    // ══════════════════════════════════════════════════

    function setLTS(address _lts) external onlyOwner {
        if (ltsContract != address(0)) revert AlreadySet();
        ltsContract = _lts;
    }

    function injectLts() external payable onlyOwner {
        ltsReserve += msg.value;
    }

    function fundBurn() external payable onlyOwner {
        pendingBurn += msg.value;
    }

    function resetFeeTimer() external onlyOwner {
        lastFeeTime = 0;
    }

    function setFeeInterval(uint256 _interval) external onlyOwner {
        feeInterval = _interval;
    }

    // ══════════════════════════════════════════════════
    // ── XEN Burning (merged from XenBurner) ──
    // ══════════════════════════════════════════════════

    function onTokenBurned(address, uint256) external override {
        require(msg.sender == address(XEN), "not XEN");
    }

    function supportsInterface(bytes4 interfaceId) public pure returns (bool) {
        return interfaceId == type(IBurnRedeemable).interfaceId ||
               interfaceId == 0x01ffc9a7;
    }

    /// @notice Quadratic community discount based on % of XEN supply burned
    /// @return disc Discount in basis points (0–4500)
    function _globalDisc() public view returns (uint256) {
        uint256 supply = XEN.totalSupply() + xenBurned;
        if (supply == 0) return 0;
        uint256 pct = (xenBurned * 10000) / supply;
        if (pct >= 9000) return 4500;
        uint256 disc = (4500 * pct * pct) / (9000 * 9000);
        return disc;
    }

    /// @notice Calculate XEN burn fee with batch + community discount, capped at 75%
    function calcXenFee(uint256 b) public view returns (uint256 fee, uint256 disc) {
        if (b == 0) return (0, 0);
        uint256 txDisc = (b * 5000) / 10000; // 50% at 10K batches
        if (txDisc > 5000) txDisc = 5000;
        uint256 gDisc = _globalDisc();
        disc = txDisc + gDisc;
        if (disc > 9500) disc = 9500; // never more than 95% off
        fee = (XEN_BASE_FEE * b * (10000 - disc)) / 10000;
    }

    function burnXEN(uint256 b) external payable nonReentrant {
        if (b == 0) revert NoBatch();
        (uint256 fee, ) = calcXenFee(b);
        if (msg.value < fee) revert InsuffFee();

        _sync(msg.sender);

        uint256 xenAmt = b * XEN_BATCH;
        XEN.burn(msg.sender, xenAmt);

        uint256 tix = (b * TIX_DEC) / XEN_BATCH_TIX;
        userBurnTix[msg.sender][epoch] += tix;
        tixEpoch += tix;

        xenBurned += xenAmt;
        xenFees += fee;
        xenFeePool += fee;
        userXenBurned[msg.sender] += xenAmt;

        if (msg.value > fee) {
            (bool ok, ) = msg.sender.call{value: msg.value - fee}("");
            if (!ok) revert Fail();
        }

        emit XenBurn(msg.sender, b, tix, fee);
    }

    // ══════════════════════════════════════════════════
    // ── View functions ──
    // ══════════════════════════════════════════════════

    function cycle() public view returns (uint256) { return DBXEN.currentCycle(); }

    function forgeCycle() public view returns (uint256) {
        return (block.timestamp - deployTime) / 1 days + 1;
    }

    function totWt() public view returns (uint256) {
        return dxnFresh + dxnRipe + dxnStaked + globalLtsDXN;
    }

    function userWt(address u) public view returns (uint256) {
        UserDXN storage d = userDXN[u];
        return d.fresh + d.ripe + d.staked + userLtsDXN[u];
    }

    function pendTix(address u) public view returns (uint256) {
        uint256 burnTix = userBurnTix[u][epoch];
        uint256 w = userWt(u);
        uint256 stakerTix = 0;
        if (w > 0) {
            uint256 owed = (w * accTix) / ACC;
            stakerTix = owed > userTixDebt[u] ? owed - userTixDebt[u] : 0;
        }
        return burnTix + stakerTix;
    }

    /// @notice Actual circulating DXN supply (excludes burned)
    function dxnActualSupply() public view returns (uint256) {
        uint256 burned = DXN.balanceOf(DEAD);
        uint256 total = DXN.totalSupply();
        return total > burned ? total - burned : 0;
    }

    /// @notice Staker multiplier: 1x–10x based on % of actual DXN supply staked
    function mult() public view returns (uint256) {
        uint256 supply = dxnActualSupply();
        if (supply == 0) return 100;
        uint256 tw = totWt();
        uint256 pct = (tw * 10000) / supply;
        if (pct > 10000) pct = 10000;
        return 100 + (900 * pct) / 10000;
    }

    /// @notice Eligible GOLD for ETH dividends: auto + ripe + staked + LTS
    ///         Fresh GOLD does NOT earn ETH.
    function userEligGold(address u) public view returns (uint256) {
        return autoGold[u] + manualGold[u].ripe + manualGold[u].staked + userLtsGold[u];
    }

    function totEligGold() public view returns (uint256) {
        return totAutoGold + goldRipe + goldStaked + globalLtsGold;
    }

    function _rawPendEth(address u) internal view returns (uint256) {
        uint256 e = userEligGold(u);
        if (e == 0) return 0;
        uint256 owed = (e * accEth) / ACC;
        return owed > ethDebt[u] ? owed - ethDebt[u] : 0;
    }

    function pendEth(address u) public view returns (uint256) {
        return unclaimedEth[u] + _rawPendEth(u);
    }

    function canFee() public view returns (bool) {
        return block.timestamp >= lastFeeTime + feeInterval;
    }

    // ══════════════════════════════════════════════════
    // ── Public sync ──
    // ══════════════════════════════════════════════════

    function sync() external nonReentrant {
        _sync(msg.sender);
    }

    // ══════════════════════════════════════════════════
    // ── DXN Staking ──
    // ══════════════════════════════════════════════════

    function stakeDXN(uint256 amt) external nonReentrant {
        if (amt == 0) revert Zero();
        _sync(msg.sender);

        DXN.safeTransferFrom(msg.sender, address(this), amt);
        DBXEN.stake(amt);

        UserDXN storage d = userDXN[msg.sender];
        d.fresh   += amt;
        d.freshCy  = forgeCycle();
        dxnFresh  += amt;

        _cpTix(msg.sender);
        emit Staked(msg.sender, amt);
    }

    function unstakeDXN(uint256 amt) external nonReentrant {
        if (amt == 0) revert Zero();
        _sync(msg.sender);
        if (userDXN[msg.sender].staked < amt) revert InsuffBal();

        userDXN[msg.sender].staked -= amt;
        dxnStaked -= amt;

        _cpTix(msg.sender);
        DBXEN.unstake(amt);
        DXN.safeTransfer(msg.sender, amt);
        emit Unstaked(msg.sender, amt);
    }

    // ══════════════════════════════════════════════════
    // ── GOLD Staking ──
    // ══════════════════════════════════════════════════

    /// @notice Stake GOLD to earn ETH dividends.
    ///         No pending guard — users can stake anytime.
    ///         Fresh GOLD does not change ETH eligibility (no settlement needed).
    function stakeGold(uint256 amt) external nonReentrant {
        if (amt == 0) revert Zero();
        _sync(msg.sender);

        IERC20(address(GOLD)).safeTransferFrom(msg.sender, address(this), amt);

        ManualGold storage m = manualGold[msg.sender];
        m.fresh   += amt;
        m.freshCy  = forgeCycle();
        goldFresh += amt;

        emit GoldStaked(msg.sender, amt);
    }

    /// @notice Unstake GOLD — only from staked bucket (partial OK)
    function unstakeGold(uint256 amt) external nonReentrant {
        if (amt == 0) revert Zero();
        _sync(msg.sender);
        if (manualGold[msg.sender].staked < amt) revert InsuffBal();

        _settleEth(msg.sender);
        manualGold[msg.sender].staked -= amt;
        goldStaked -= amt;
        _cpEth(msg.sender);

        IERC20(address(GOLD)).safeTransfer(msg.sender, amt);
        emit GoldUnstaked(msg.sender, amt);
    }

    // ══════════════════════════════════════════════════
    // ── Rewards (separated paths) ──
    // ══════════════════════════════════════════════════

    /// @notice Claim ALL auto-staked GOLD + ALL accrued ETH.
    ///         Auto GOLD is all-or-nothing.
    ///         Does NOT touch manual GOLD buckets.
    function claimRewards() external nonReentrant {
        _sync(msg.sender);

        uint256 g = autoGold[msg.sender];
        uint256 e = pendEth(msg.sender);
        if (g == 0 && e == 0) revert Zero();

        // Settle all ETH into unclaimedEth first
        _settleEth(msg.sender);

        // Remove autoGold (eligibility decreases)
        if (g > 0) {
            autoGold[msg.sender] = 0;
            totAutoGold -= g;
        }

        // Capture total ETH to send
        uint256 ethAmt = unclaimedEth[msg.sender];
        unclaimedEth[msg.sender] = 0;

        // Checkpoint debt to new eligibility
        _cpEth(msg.sender);

        // Send ETH
        if (ethAmt > 0) {
            goldEthReserve -= ethAmt;
            (bool ok, ) = msg.sender.call{value: ethAmt}("");
            if (!ok) revert Fail();
        }

        // Send GOLD
        if (g > 0) {
            IERC20(address(GOLD)).safeTransfer(msg.sender, g);
        }

        emit Rewards(msg.sender, g, ethAmt);
    }

    /// @notice Claim only accrued ETH. Auto GOLD stays and keeps earning.
    function claimEth() external nonReentrant {
        _sync(msg.sender);
        _settleEth(msg.sender);

        uint256 e = unclaimedEth[msg.sender];
        if (e == 0) revert Zero();

        unclaimedEth[msg.sender] = 0;
        _cpEth(msg.sender);

        goldEthReserve -= e;
        (bool ok, ) = msg.sender.call{value: e}("");
        if (!ok) revert Fail();

        emit EthClaimed(msg.sender, e);
    }

    // ══════════════════════════════════════════════════
    // ── Protocol Fee Claiming ──
    // ══════════════════════════════════════════════════

    function claimFees() external nonReentrant {
        _sync(msg.sender);

        if (block.timestamp < lastFeeTime + feeInterval) revert Cooldown();

        try DBXEN.claimFees() {} catch {}

        // Sweep xenFeePool
        xenFeePool = 0;

        uint256 tot = address(this).balance - pendingBurn - ltsReserve - goldEthReserve;

        if (tot > 0) {
            uint256 toGold = (tot * FEE_GOLD) / FEE_BASE;
            uint256 toBurn = (tot * FEE_BURN) / FEE_BASE;
            uint256 toLts  = tot - toGold - toBurn;

            uint256 elig = totEligGold();
            if (elig > 0) {
                accEth += (toGold * ACC) / elig;
                goldEthReserve += toGold;
            }

            pendingBurn += toBurn;
            ltsReserve  += toLts;

            emit Fees(tot, toGold, toBurn, toLts);
        }

        uint256 wt = totWt();
        if (wt > 0) {
            uint256 m = mult();
            accTix += (ACC * m * TIX_DEC) / (wt * 100);
            tixEpoch += (m * TIX_DEC) / 100;
            stakerTixEpoch += (m * TIX_DEC) / 100;
            emit Tix(wt, accTix, m);
        }

        lastFeeTime = block.timestamp;
    }

    // ══════════════════════════════════════════════════
    // ── Buy and Burn ──
    // ══════════════════════════════════════════════════

    function buyAndBurn(uint256 amount, uint256 minOut, uint24 fee) external nonReentrant {
        _transDXN(msg.sender);
        _transGold(msg.sender);

        if (pendingBurn < MIN_BURN) revert NoBurn();
        if (tixEpoch == 0) revert NoTix();

        if (fee == 0) fee = 10000;

        uint256 eth = pendingBurn;
        uint256 toBurn = (amount == 0 || amount >= eth) ? eth : amount;
        pendingBurn = eth - toBurn;

        IWETH(WETH).deposit{value: toBurn}();
        IERC20(WETH).approve(address(ROUTER), toBurn);

        uint256 dxn = ROUTER.exactInputSingle(
            ISwapRouter.ExactInputSingleParams(WETH, address(DXN), fee, address(this), toBurn, minOut, 0)
        );
        DXN.safeTransfer(DEAD, dxn);

        GOLD.mint(address(this), dxn);

        epAcc[epoch]  = accTix;
        epTix[epoch]  = tixEpoch;
        epGold[epoch] = dxn;
        epDone[epoch] = true;

        accTix = 0;
        tixEpoch = 0;
        stakerTixEpoch = 0;
        epoch++;

        emit BuyBurn(epoch - 1, toBurn, dxn, dxn);
    }

    /// @notice Combined claimFees + buyAndBurn in one atomic transaction
    function claimAndBurn(uint256 minOut, uint24 fee) external nonReentrant {
        _transDXN(msg.sender);
        _transGold(msg.sender);

        // === claimFees logic ===
        if (block.timestamp < lastFeeTime + feeInterval) revert Cooldown();
        try DBXEN.claimFees() {} catch {}
        xenFeePool = 0;
        uint256 tot = address(this).balance - pendingBurn - ltsReserve - goldEthReserve;
        if (tot > 0) {
            uint256 toGold = (tot * FEE_GOLD) / FEE_BASE;
            uint256 toBurnFee = (tot * FEE_BURN) / FEE_BASE;
            uint256 toLts  = tot - toGold - toBurnFee;
            uint256 elig = totEligGold();
            if (elig > 0) {
                accEth += (toGold * ACC) / elig;
                goldEthReserve += toGold;
            }
            pendingBurn += toBurnFee;
            ltsReserve  += toLts;
            emit Fees(tot, toGold, toBurnFee, toLts);
        }
        uint256 wt = totWt();
        if (wt > 0) {
            uint256 m = mult();
            accTix += (ACC * m * TIX_DEC) / (wt * 100);
            tixEpoch += (m * TIX_DEC) / 100;
            stakerTixEpoch += (m * TIX_DEC) / 100;
            emit Tix(wt, accTix, m);
        }
        lastFeeTime = block.timestamp;

        // === buyAndBurn logic ===
        if (pendingBurn < MIN_BURN) revert NoBurn();
        if (tixEpoch == 0) revert NoTix();
        if (fee == 0) fee = 10000;
        uint256 eth = pendingBurn;
        pendingBurn = 0;
        IWETH(WETH).deposit{value: eth}();
        IERC20(WETH).approve(address(ROUTER), eth);
        uint256 dxn = ROUTER.exactInputSingle(
            ISwapRouter.ExactInputSingleParams(WETH, address(DXN), fee, address(this), eth, minOut, 0)
        );
        DXN.safeTransfer(DEAD, dxn);
        GOLD.mint(address(this), dxn);
        epAcc[epoch]  = accTix;
        epTix[epoch]  = tixEpoch;
        epGold[epoch] = dxn;
        epDone[epoch] = true;
        accTix = 0;
        tixEpoch = 0;
        stakerTixEpoch = 0;
        epoch++;
        emit BuyBurn(epoch - 1, eth, dxn, dxn);
    }

    // ══════════════════════════════════════════════════
    // ── LTS Bridge Functions (callable only by LTS) ──
    // ══════════════════════════════════════════════════

    function ltsDeposit(address user, uint256 amt, bool isDXN) external onlyLTS {
        _sync(user);
        if (isDXN) {
            DXN.safeTransferFrom(user, address(this), amt);
            DBXEN.stake(amt);
            userLtsDXN[user] += amt;
            globalLtsDXN += amt;
            _cpTix(user);
        } else {
            _settleEth(user);
            IERC20(address(GOLD)).safeTransferFrom(user, address(this), amt);
            userLtsGold[user] += amt;
            globalLtsGold += amt;
            _cpEth(user);
        }
        emit LtsDeposit(user, amt, isDXN);
    }

    function ltsTransfer(address from, address to, uint256 amt, bool isDXN) external onlyLTS {
        _sync(from);
        _sync(to);
        if (isDXN) {
            userLtsDXN[from] -= amt;
            userLtsDXN[to]   += amt;
            _cpTix(from);
            _cpTix(to);
        } else {
            _settleEth(from);
            _settleEth(to);
            userLtsGold[from] -= amt;
            userLtsGold[to]   += amt;
            _cpEth(from);
            _cpEth(to);
        }
        emit LtsTransfer(from, to, amt, isDXN);
    }

    function ltsWithdraw(address user, uint256 amt, bool isDXN) external onlyLTS {
        _sync(user);
        if (isDXN) {
            userLtsDXN[user] -= amt;
            globalLtsDXN -= amt;
            _cpTix(user);
            DBXEN.unstake(amt);
            DXN.safeTransfer(user, amt);
        } else {
            _settleEth(user);
            userLtsGold[user] -= amt;
            globalLtsGold -= amt;
            _cpEth(user);
            IERC20(address(GOLD)).safeTransfer(user, amt);
        }
        emit LtsWithdraw(user, amt, isDXN);
    }

    function withdrawLts() external onlyLTS returns (uint256) {
        uint256 amt = ltsReserve;
        if (amt == 0) return 0;
        ltsReserve = 0;
        (bool ok, ) = msg.sender.call{value: amt}("");
        if (!ok) revert Fail();
        emit LtsEthPulled(amt);
        return amt;
    }

    // ══════════════════════════════════════════════════
    // ── Internal: DXN 3-bucket transition ──
    // ══════════════════════════════════════════════════

    function _transDXN(address u) internal {
        UserDXN storage d = userDXN[u];
        uint256 fc = forgeCycle();

        // Step 1: ripe → staked
        if (d.ripe > 0 && fc >= d.ripeCy) {
            dxnRipe   -= d.ripe;
            dxnStaked  += d.ripe;
            d.staked   += d.ripe;
            d.ripe      = 0;
        }

        // Step 2: fresh → ripe or straight to staked
        if (d.fresh > 0 && fc > d.freshCy) {
            uint256 matCy = d.freshCy + 2;
            if (fc >= matCy) {
                dxnFresh  -= d.fresh;
                dxnStaked += d.fresh;
                d.staked  += d.fresh;
                d.fresh    = 0;
            } else {
                dxnFresh -= d.fresh;
                dxnRipe  += d.fresh;
                d.ripe    = d.fresh;
                d.ripeCy  = matCy;
                d.fresh   = 0;
            }
        }
    }

    // ══════════════════════════════════════════════════
    // ── Internal: GOLD 3-bucket transition ──
    // ══════════════════════════════════════════════════

    function _transGold(address u) internal {
        ManualGold storage m = manualGold[u];
        uint256 fc = forgeCycle();

        // Step 1: ripe → staked (no settlement — both eligible)
        if (m.ripe > 0 && fc >= m.ripeCy) {
            goldRipe   -= m.ripe;
            goldStaked += m.ripe;
            m.staked   += m.ripe;
            m.ripe      = 0;
        }

        // Step 2: fresh → ripe or straight to staked (settlement needed — eligibility increases)
        if (m.fresh > 0 && fc > m.freshCy) {
            _settleEth(u);
            uint256 matCy = m.freshCy + 2;
            if (fc >= matCy) {
                goldFresh  -= m.fresh;
                goldStaked += m.fresh;
                m.staked   += m.fresh;
            } else {
                goldFresh -= m.fresh;
                goldRipe  += m.fresh;
                m.ripe     = m.fresh;
                m.ripeCy   = matCy;
            }
            m.fresh = 0;
            _cpEth(u);
        }
    }

    // ══════════════════════════════════════════════════
    // ── Internal: Ticket materialization + GOLD alloc ──
    // ══════════════════════════════════════════════════

    function _matTix(address u) internal {
        if (userTixEp[u] != 0 && userTixEp[u] < epoch) {
            _allocGold(u);
        }
        userTixDebt[u] = (userWt(u) * accTix) / ACC;
        userTixEp[u] = epoch;
    }

    function _allocGold(address u) internal {
        uint256 ep = userTixEp[u];
        if (ep == 0 || ep >= epoch) return;

        uint256 w = userWt(u);
        uint256 debt = userTixDebt[u];

        while (ep < epoch) {
            if (epDone[ep]) {
                uint256 epTotalTix = userBurnTix[u][ep];
                if (w > 0 && epAcc[ep] > 0) {
                    uint256 owed = (w * epAcc[ep]) / ACC;
                    if (owed > debt) epTotalTix += owed - debt;
                }
                if (epTotalTix > 0 && epTix[ep] > 0) {
                    uint256 g = (epTotalTix * epGold[ep]) / epTix[ep];
                    if (g > 0) {
                        _settleEth(u);
                        autoGold[u] += g;
                        totAutoGold += g;
                        _cpEth(u);
                        emit GoldAlloc(u, g, ep);
                    }
                }
            }
            debt = 0;
            ep++;
        }

        userTixDebt[u] = 0;
        userTixEp[u] = epoch;
    }

    function _cpTix(address u) internal {
        userTixDebt[u] = (userWt(u) * accTix) / ACC;
        userTixEp[u] = epoch;
    }

    // ══════════════════════════════════════════════════
    // ── Internal: ETH settlement ──
    // ══════════════════════════════════════════════════

    function _settleEth(address u) internal {
        uint256 e = userEligGold(u);
        if (e == 0) return;
        uint256 owed = (e * accEth) / ACC;
        if (owed > ethDebt[u]) {
            unclaimedEth[u] += owed - ethDebt[u];
        }
    }

    function _cpEth(address u) internal {
        ethDebt[u] = (userEligGold(u) * accEth) / ACC;
    }

    function _sync(address u) internal {
        _transDXN(u);
        _matTix(u);
        _transGold(u);
    }

    // ══════════════════════════════════════════════════
    // ── Convenience views for third-party trackers ──
    // ══════════════════════════════════════════════════

    struct ProtocolStats {
        uint256 epoch_;
        uint256 forgeCycle_;
        uint256 dbxenCycle;
        uint256 mult_;
        uint256 globalDisc_;
        uint256 dxnFresh_;
        uint256 dxnRipe_;
        uint256 dxnStaked_;
        uint256 totAutoGold_;
        uint256 goldFresh_;
        uint256 goldRipe_;
        uint256 goldStaked_;
        uint256 totEligGold_;
        uint256 pendingBurn_;
        uint256 ltsReserve_;
        uint256 goldEthReserve_;
        uint256 tixEpoch_;
        uint256 xenBurned_;
        uint256 xenFees_;
        uint256 globalLtsDXN_;
        uint256 globalLtsGold_;
        uint256 xenFeePool_;
        uint256 feeInterval_;
        uint256 dxnSupply_;
        uint256 dxnActualSupply_;
        uint256 xenSupply_;
    }

    function getProtocolStats() external view returns (ProtocolStats memory) {
        return ProtocolStats(
            epoch, forgeCycle(), cycle(), mult(), _globalDisc(),
            dxnFresh, dxnRipe, dxnStaked,
            totAutoGold, goldFresh, goldRipe, goldStaked,
            totEligGold(),
            pendingBurn, ltsReserve, goldEthReserve,
            tixEpoch, xenBurned, xenFees,
            globalLtsDXN, globalLtsGold,
            xenFeePool, feeInterval,
            DXN.totalSupply(), dxnActualSupply(), XEN.totalSupply()
        );
    }

    struct UserStats {
        uint256 dxnFresh_;
        uint256 dxnFreshCy_;
        uint256 dxnRipe_;
        uint256 dxnRipeCy_;
        uint256 dxnStaked_;
        uint256 autoGold_;
        uint256 goldFresh_;
        uint256 goldFreshCy_;
        uint256 goldRipe_;
        uint256 goldRipeCy_;
        uint256 goldStaked_;
        uint256 pendEth_;
        uint256 pendTix_;
        uint256 userTix_;
        uint256 userWt_;
        uint256 eligGold_;
        uint256 ltsDXN_;
        uint256 ltsGold_;
        uint256 xenBurned_;
    }

    function getUserStats(address u) external view returns (UserStats memory) {
        UserDXN storage d = userDXN[u];
        ManualGold storage m = manualGold[u];
        return UserStats(
            d.fresh, d.freshCy, d.ripe, d.ripeCy, d.staked,
            autoGold[u],
            m.fresh, m.freshCy, m.ripe, m.ripeCy, m.staked,
            pendEth(u), pendTix(u), userBurnTix[u][epoch],
            userWt(u), userEligGold(u),
            userLtsDXN[u], userLtsGold[u], userXenBurned[u]
        );
    }

    receive() external payable {}
}
