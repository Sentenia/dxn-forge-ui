const { ethers } = require("ethers");

const SEPOLIA_RPC = "https://ethereum-sepolia-rpc.publicnode.com";

const FORGE = "0xCEb8775E050c0E66B6860854728943e3a415859C";
const DXN = "0x7276c4Ce66d472d2Bd23C06A3d4c34790111720A";
const WETH = "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14";

// Simpler ABI - just raw slot reads
const FORGE_ABI = [
  "function pendingBurn() view returns (uint256)",
  "function tixEpoch() view returns (uint256)",
  "function epoch() view returns (uint256)",
  "function xenFeePool() view returns (uint256)",
  "function MIN_BURN() view returns (uint256)",
];

const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
];

async function main() {
  console.log("=== Debug buyAndBurn Requirements ===\n");

  const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC);
  const forge = new ethers.Contract(FORGE, FORGE_ABI, provider);
  const weth = new ethers.Contract(WETH, ERC20_ABI, provider);
  const dxn = new ethers.Contract(DXN, ERC20_ABI, provider);

  console.log("=== 1. buyAndBurn Preconditions ===");
  try {
    const [pendingBurn, tixEpoch, epoch, minBurn] = await Promise.all([
      forge.pendingBurn(),
      forge.tixEpoch(),
      forge.epoch(),
      forge.MIN_BURN(),
    ]);

    console.log("pendingBurn:", ethers.formatEther(pendingBurn), "ETH");
    console.log("MIN_BURN:", ethers.formatEther(minBurn), "ETH");
    console.log("pendingBurn >= MIN_BURN:", pendingBurn >= minBurn ? "✓ PASS" : "✗ FAIL");
    console.log("");
    console.log("tixEpoch:", ethers.formatEther(tixEpoch), "tickets");
    console.log("tixEpoch > 0:", tixEpoch > 0n ? "✓ PASS" : "✗ FAIL (NoTix revert)");
    console.log("");
    console.log("epoch:", epoch.toString());
  } catch (err) {
    console.error("Error:", err.message);
  }

  console.log("\n=== 2. Forge Contract Balances ===");
  try {
    const [forgeEth, forgeWeth, forgeDxn] = await Promise.all([
      provider.getBalance(FORGE),
      weth.balanceOf(FORGE),
      dxn.balanceOf(FORGE),
    ]);
    console.log("Forge ETH balance:", ethers.formatEther(forgeEth), "ETH");
    console.log("Forge WETH balance:", ethers.formatEther(forgeWeth), "WETH");
    console.log("Forge DXN balance:", ethers.formatEther(forgeDxn), "DXN");
  } catch (err) {
    console.error("Error:", err.message);
  }

  console.log("\n=== 3. Check WETH Allowance to Router ===");
  const ROUTER = "0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E";
  try {
    const allowance = await weth.allowance(FORGE, ROUTER);
    console.log("WETH allowance (Forge → Router):", ethers.formatEther(allowance));
    console.log("Note: buyAndBurn calls approve() before swap, so this is just FYI");
  } catch (err) {
    console.error("Error:", err.message);
  }

  // Check pool liquidity at different price points
  console.log("\n=== 4. Pool State Analysis ===");
  const POOL = "0xB9847F6837B225260cCf5D5DC93a454232316Ce3";
  const POOL_ABI = [
    "function liquidity() view returns (uint128)",
    "function slot0() view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)",
    "function token0() view returns (address)",
    "function token1() view returns (address)",
    "function tickSpacing() view returns (int24)",
  ];

  try {
    const pool = new ethers.Contract(POOL, POOL_ABI, provider);
    const [liquidity, slot0, token0, token1, tickSpacing] = await Promise.all([
      pool.liquidity(),
      pool.slot0(),
      pool.token0(),
      pool.token1(),
      pool.tickSpacing(),
    ]);

    console.log("Pool:", POOL);
    console.log("token0:", token0, token0.toLowerCase() === DXN.toLowerCase() ? "(DXN)" : "(WETH)");
    console.log("token1:", token1, token1.toLowerCase() === WETH.toLowerCase() ? "(WETH)" : "(DXN)");
    console.log("liquidity:", liquidity.toString());
    console.log("sqrtPriceX96:", slot0.sqrtPriceX96.toString());
    console.log("tick:", slot0.tick);
    console.log("tickSpacing:", tickSpacing);
    console.log("unlocked:", slot0.unlocked);

    // Calculate approximate price
    const sqrtPrice = Number(slot0.sqrtPriceX96) / (2 ** 96);
    const price = sqrtPrice * sqrtPrice;
    console.log("\nApproximate price (token1/token0):", price.toFixed(10));
    console.log("If token0=DXN, token1=WETH: 1 DXN =", price.toFixed(10), "WETH");
    console.log("Inverse: 1 WETH =", (1/price).toFixed(2), "DXN");
  } catch (err) {
    console.error("Error:", err.message);
  }

  // Try to decode revert reason by reading bytecode
  console.log("\n=== 5. Direct ETH Check ===");
  try {
    const xenFeePool = await forge.xenFeePool();
    const pendingBurn = await forge.pendingBurn();
    const forgeBalance = await provider.getBalance(FORGE);

    console.log("xenFeePool:", ethers.formatEther(xenFeePool), "ETH");
    console.log("pendingBurn:", ethers.formatEther(pendingBurn), "ETH");
    console.log("Forge total ETH:", ethers.formatEther(forgeBalance), "ETH");
    console.log("");
    console.log("Available for WETH deposit:", ethers.formatEther(pendingBurn), "ETH");

    if (forgeBalance < pendingBurn) {
      console.log("⚠️  WARNING: Forge ETH balance < pendingBurn!");
      console.log("   WETH.deposit() will fail - not enough ETH!");
    }
  } catch (err) {
    console.error("Error:", err.message);
  }

  console.log("\n=== Debug Complete ===");
}

main().catch(console.error);
