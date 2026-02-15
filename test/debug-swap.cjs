const { ethers } = require("ethers");

const SEPOLIA_RPC = "https://ethereum-sepolia-rpc.publicnode.com";

const FORGE = "0xCEb8775E050c0E66B6860854728943e3a415859C";
const DXN = "0x7276c4Ce66d472d2Bd23C06A3d4c34790111720A";
const WETH = "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14";
const ROUTER = "0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E";
const V3_FACTORY = "0x0227628f3F023bb0B980b67D528571c95c6DaC1c";

const FORGE_ABI = [
  "function buyAndBurn(uint256 amount, uint256 minOut, uint24 fee)",
  "function xenFeePool() view returns (uint256)",
  "function pendingBurn() view returns (uint256)",
  "function canFee() view returns (bool)",
  "function DXN() view returns (address)",
  "function WETH() view returns (address)",
  "function router() view returns (address)",
];

const FACTORY_ABI = [
  "function getPool(address tokenA, address tokenB, uint24 fee) view returns (address)",
];

const POOL_ABI = [
  "function liquidity() view returns (uint128)",
  "function slot0() view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)",
  "function token0() view returns (address)",
  "function token1() view returns (address)",
];

async function main() {
  console.log("=== Debug buyAndBurn Swap ===\n");

  const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC);
  const forge = new ethers.Contract(FORGE, FORGE_ABI, provider);
  const factory = new ethers.Contract(V3_FACTORY, FACTORY_ABI, provider);

  // 1. Check Forge's configured addresses
  console.log("=== 1. Forge Contract Config ===");
  try {
    const [dxnAddr, wethAddr, routerAddr, xenFeePool, pendingBurn, canFee] = await Promise.all([
      forge.DXN(),
      forge.WETH(),
      forge.router(),
      forge.xenFeePool(),
      forge.pendingBurn(),
      forge.canFee(),
    ]);
    console.log("DXN address:", dxnAddr);
    console.log("WETH address:", wethAddr);
    console.log("Router address:", routerAddr);
    console.log("xenFeePool:", ethers.formatEther(xenFeePool), "ETH");
    console.log("pendingBurn:", ethers.formatEther(pendingBurn), "ETH");
    console.log("canFee():", canFee);
  } catch (err) {
    console.error("Error reading Forge config:", err.message);
  }

  // 2. Check which pools exist
  console.log("\n=== 2. Uniswap V3 Pool Check ===");
  const feeTiers = [
    { fee: 100, label: "0.01%" },
    { fee: 500, label: "0.05%" },
    { fee: 3000, label: "0.3%" },
    { fee: 10000, label: "1%" },
  ];

  for (const tier of feeTiers) {
    try {
      const poolAddr = await factory.getPool(DXN, WETH, tier.fee);
      if (poolAddr === "0x0000000000000000000000000000000000000000") {
        console.log(`Pool ${tier.label} (fee=${tier.fee}): NOT CREATED`);
      } else {
        console.log(`Pool ${tier.label} (fee=${tier.fee}): ${poolAddr}`);

        // Check liquidity
        const pool = new ethers.Contract(poolAddr, POOL_ABI, provider);
        try {
          const [liquidity, slot0, token0, token1] = await Promise.all([
            pool.liquidity(),
            pool.slot0(),
            pool.token0(),
            pool.token1(),
          ]);
          console.log(`  - liquidity: ${liquidity.toString()}`);
          console.log(`  - sqrtPriceX96: ${slot0.sqrtPriceX96.toString()}`);
          console.log(`  - tick: ${slot0.tick}`);
          console.log(`  - token0: ${token0}`);
          console.log(`  - token1: ${token1}`);

          if (liquidity === 0n) {
            console.log(`  ⚠️  POOL EXISTS BUT HAS NO LIQUIDITY`);
          }
        } catch (poolErr) {
          console.log(`  - Error reading pool: ${poolErr.message}`);
        }
      }
    } catch (err) {
      console.error(`Error checking ${tier.label} pool:`, err.message);
    }
  }

  // 3. Try to simulate buyAndBurn
  console.log("\n=== 3. Simulate buyAndBurn ===");
  try {
    // Try with 1% fee tier (10000)
    console.log("Attempting staticCall: buyAndBurn(0, 0, 10000)...");
    await forge.buyAndBurn.staticCall(0, 0, 10000);
    console.log("✓ buyAndBurn would succeed with fee=10000");
  } catch (err) {
    console.log("✗ buyAndBurn(0, 0, 10000) reverts:");
    console.log("  Reason:", err.reason || err.message);
    if (err.data) console.log("  Data:", err.data);
  }

  try {
    // Try with 0.3% fee tier (3000)
    console.log("\nAttempting staticCall: buyAndBurn(0, 0, 3000)...");
    await forge.buyAndBurn.staticCall(0, 0, 3000);
    console.log("✓ buyAndBurn would succeed with fee=3000");
  } catch (err) {
    console.log("✗ buyAndBurn(0, 0, 3000) reverts:");
    console.log("  Reason:", err.reason || err.message);
  }

  try {
    // Try with 0.05% fee tier (500)
    console.log("\nAttempting staticCall: buyAndBurn(0, 0, 500)...");
    await forge.buyAndBurn.staticCall(0, 0, 500);
    console.log("✓ buyAndBurn would succeed with fee=500");
  } catch (err) {
    console.log("✗ buyAndBurn(0, 0, 500) reverts:");
    console.log("  Reason:", err.reason || err.message);
  }

  console.log("\n=== Debug Complete ===");
}

main().catch(console.error);
