export const FORGE_ABI = [
  // ── Views ──
  "function getProtocolStats() view returns (tuple(uint256 epoch_, uint256 forgeCycle_, uint256 dbxenCycle, uint256 mult_, uint256 globalDisc_, uint256 dxnFresh_, uint256 dxnRipe_, uint256 dxnStaked_, uint256 totAutoGold_, uint256 goldFresh_, uint256 goldRipe_, uint256 goldStaked_, uint256 totEligGold_, uint256 pendingBurn_, uint256 ltsReserve_, uint256 goldEthReserve_, uint256 tixEpoch_, uint256 xenBurned_, uint256 xenFees_, uint256 globalLtsDXN_, uint256 globalLtsGold_, uint256 xenFeePool_, uint256 feeInterval_, uint256 dxnSupply_, uint256 dxnActualSupply_, uint256 xenSupply_))",
  "function getUserStats(address u) view returns (tuple(uint256 dxnFresh_, uint256 dxnFreshCy_, uint256 dxnRipe_, uint256 dxnRipeCy_, uint256 dxnStaked_, uint256 autoGold_, uint256 goldFresh_, uint256 goldFreshCy_, uint256 goldRipe_, uint256 goldRipeCy_, uint256 goldStaked_, uint256 pendEth_, uint256 pendTix_, uint256 userTix_, uint256 userWt_, uint256 eligGold_, uint256 ltsDXN_, uint256 ltsGold_, uint256 xenBurned_))",
  "function calcXenFee(uint256 b) view returns (uint256 fee, uint256 disc)",
  "function _globalDisc() view returns (uint256)",
  "function canFee() view returns (bool)",
  "function epoch() view returns (uint256)",
  "function pendingBurn() view returns (uint256)",
  "function xenFeePool() view returns (uint256)",
  "function mult() view returns (uint256)",
  "function totWt() view returns (uint256)",
  "function totEligGold() view returns (uint256)",
  "function lastFeeTime() view returns (uint256)",
  "function feeInterval() view returns (uint256)",
  "function stakerTixEpoch() view returns (uint256)",

  // ── Write ──
  "function burnXEN(uint256 b) payable",
  "function stakeDXN(uint256 amt)",
  "function unstakeDXN(uint256 amt)",
  "function stakeGold(uint256 amt)",
  "function unstakeGold(uint256 amt)",
  "function claimFees()",
  "function buyAndBurn(uint256 amount, uint256 minOut, uint24 fee)",
  "function claimRewards()",
  "function claimEth()",

  // ── Events ──
  "event XenBurn(address indexed u, uint256 batches, uint256 tix, uint256 fee)",
  "event Staked(address indexed u, uint256 amt)",
  "event Unstaked(address indexed u, uint256 amt)",
  "event Fees(uint256 total, uint256 gold, uint256 burn, uint256 lts)",
  "event BuyBurn(uint256 indexed ep, uint256 eth, uint256 dxn, uint256 gold)",
  "event GoldStaked(address indexed u, uint256 amt)",
  "event GoldUnstaked(address indexed u, uint256 amt)",
  "event Rewards(address indexed u, uint256 gold, uint256 eth)",
  "event EthClaimed(address indexed u, uint256 amt)",
];

export const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
];

export const DBXEN_VIEWS_ABI = [
  "function pendingFees(address) view returns (uint256)",
];

export const FAUCET_ABI = [
  "function faucet()",
  "function lastFaucet(address) view returns (uint256)",
];