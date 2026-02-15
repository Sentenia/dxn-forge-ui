// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockERC20 is ERC20 {
    mapping(address => uint256) public lastFaucet;

    constructor(string memory name, string memory symbol, uint256 supply) ERC20(name, symbol) {
        _mint(msg.sender, supply);
    }
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
    function faucet() external {
        require(block.timestamp >= lastFaucet[msg.sender] + 1 days, "Wait 24h");
        lastFaucet[msg.sender] = block.timestamp;
        _transfer(address(this), msg.sender, 10_000 * 1e18);
    }
}

contract MockGOLD is ERC20 {
    address public minter;
    constructor() ERC20("GOLD", "GOLD") {}
    function setMinter(address _m) external { minter = _m; }
    function mint(address to, uint256 amount) external {
        require(msg.sender == minter, "not minter");
        _mint(to, amount);
    }
}

contract MockXEN is ERC20 {
    mapping(address => uint256) public lastFaucet;

    constructor(uint256 supply) ERC20("XEN", "XEN") {
        _mint(msg.sender, supply);
    }
    function burn(address user, uint256 amount) external {
        _burn(user, amount);
    }
    function faucet() external {
        require(block.timestamp >= lastFaucet[msg.sender] + 1 days, "Wait 24h");
        lastFaucet[msg.sender] = block.timestamp;
        _transfer(address(this), msg.sender, 1_000_000_000_000 * 1e18);
    }
}

contract MockDBXEN {
    uint256 public currentCycle = 1;
    function stake(uint256) external {}
    function unstake(uint256) external {}
    function claimFees() external {}
    function setCycle(uint256 c) external { currentCycle = c; }
}

contract MockRouter {
    address public dxn;
    constructor(address _dxn) { dxn = _dxn; }
    struct ExactInputSingleParams {
        address tokenIn;
        address tokenOut;
        uint24 fee;
        address recipient;
        uint256 deadline;
        uint256 amountIn;
        uint256 amountOutMinimum;
        uint160 sqrtPriceLimitX96;
    }
    // Fake swap: just send back DXN 1:1 ratio (for testing)
    function exactInputSingle(ExactInputSingleParams calldata params) external payable returns (uint256) {
        uint256 out = params.amountIn * 1000; // 1 ETH = 1000 DXN for testing
        MockERC20(dxn).mint(params.recipient, out);
        return out;
    }
}

contract MockWETH is ERC20 {
    constructor() ERC20("WETH", "WETH") {}
    function deposit() external payable {
        _mint(msg.sender, msg.value);
    }
    function withdraw(uint256 amt) external {
        _burn(msg.sender, amt);
        (bool ok,) = msg.sender.call{value: amt}("");
        require(ok);
    }
    receive() external payable {
        _mint(msg.sender, msg.value);
    }
}