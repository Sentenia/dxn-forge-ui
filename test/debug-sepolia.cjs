const { ethers } = require("ethers");

const SEPOLIA_RPC = process.env.VITE_SEPOLIA_RPC || process.env.SEPOLIA_RPC || "https://eth-sepolia.g.alchemy.com/v2/demo";
const WALLET = process.env.WALLET || "0x0000000000000000000000000000000000000000";

const FORGE = "0xCEb8775E050c0E66B6860854728943e3a415859C";
const DBXEN = "0x2E9a6ecC99d9259b7EDc5325799CeA0B385D1162";
const GOLD = "0x59416D0C2Fee58ce67c33a64B43159f1736b6809";
const DXN = "0x7276c4Ce66d472d2Bd23C06A3d4c34790111720A";

const FORGE_ABI = [
  "function epoch() view returns (uint256)",
  "function forgeCycle() view returns (uint256)",
  "function pendingBurn() view returns (uint256)",
  "function xenFeePool() view returns (uint256)",
  "function lastFeeTime() view returns (uint256)",
  "function feeInterval() view returns (uint256)",
  "function mult() view returns (uint256)",
  "function stakerTixEpoch() view returns (uint256)",
  "function getProtocolStats() view returns (tuple(uint256 epoch_, uint256 forgeCycle_, uint256 dbxenCycle, uint256 mult_, uint256 globalDisc_, uint256 dxnFresh_, uint256 dxnRipe_, uint256 dxnStaked_, uint256 totAutoGold_, uint256 goldFresh_, uint256 goldRipe_, uint256 goldStaked_, uint256 totEligGold_, uint256 pendingBurn_, uint256 ltsReserve_, uint256 goldEthReserve_, uint256 tixEpoch_, uint256 xenBurned_, uint256 xenFees_, uint256 globalLtsDXN_, uint256 globalLtsGold_, uint256 xenFeePool_, uint256 feeInterval_, uint256 dxnSupply_, uint256 dxnActualSupply_, uint256 xenSupply_))",
  "function getUserStats(address u) view returns (tuple(uint256 dxnFresh_, uint256 dxnFreshCy_, uint256 dxnRipe_, uint256 dxnRipeCy_, uint256 dxnStaked_, uint256 autoGold_, uint256 goldFresh_, uint256 goldFreshCy_, uint256 goldRipe_, uint256 goldRipeCy_, uint256 goldStaked_, uint256 pendEth_, uint256 pendTix_, uint256 userTix_, uint256 userWt_, uint256 eligGold_, uint256 ltsDXN_, uint256 ltsGold_, uint256 xenBurned_))",
];

const DBXEN_ABI = [
  "function currentCycle() view returns (uint256)",
];

const ERC20_ABI = [
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
];

async function main() {
  console.log("=== DXN Forge Sepolia Debug ===\n");
  console.log("RPC:", SEPOLIA_RPC.slice(0, 50) + "...");
  console.log("Wallet:", WALLET);
  console.log("");

  const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC);
  const forge = new ethers.Contract(FORGE, FORGE_ABI, provider);
  const dbxen = new ethers.Contract(DBXEN, DBXEN_ABI, provider);
  const gold = new ethers.Contract(GOLD, ERC20_ABI, provider);
  const dxn = new ethers.Contract(DXN, ERC20_ABI, provider);

  console.log("=== 1. Epoch & Cycle State ===");
  try {
    const [epoch, forgeCycle, dbxenCycle] = await Promise.all([
      forge.epoch(),
      forge.forgeCycle(),
      dbxen.currentCycle(),
    ]);
    console.log("Forge epoch():", epoch.toString());
    console.log("Forge forgeCycle():", forgeCycle.toString());
    console.log("DBXEN currentCycle():", dbxenCycle.toString());
  } catch (err) {
    console.error("Error reading epoch/cycle:", err.message);
  }

  console.log("\n=== 2. Protocol Stats ===");
  try {
    const ps = await forge.getProtocolStats();
    console.log("epoch_:", ps.epoch_.toString());
    console.log("forgeCycle_:", ps.forgeCycle_.toString());
    console.log("dbxenCycle:", ps.dbxenCycle.toString());
    console.log("mult_:", ps.mult_.toString(), `(${Number(ps.mult_) / 100}x)`);
    console.log("tixEpoch_:", ethers.formatEther(ps.tixEpoch_), "tickets");
    console.log("xenBurned_:", ethers.formatEther(ps.xenBurned_), "XEN");
    console.log("xenFeePool_:", ethers.formatEther(ps.xenFeePool_), "ETH");
    console.log("pendingBurn_:", ethers.formatEther(ps.pendingBurn_), "ETH");
    console.log("goldEthReserve_:", ethers.formatEther(ps.goldEthReserve_), "ETH");
    console.log("totAutoGold_:", ethers.formatEther(ps.totAutoGold_), "GOLD");
    console.log("dxnStaked_:", ethers.formatEther(ps.dxnStaked_), "DXN");
    console.log("dxnSupply_:", ethers.formatEther(ps.dxnSupply_), "DXN");
    console.log("xenSupply_:", ethers.formatEther(ps.xenSupply_), "XEN");
  } catch (err) {
    console.error("Error reading protocol stats:", err.message);
  }

  console.log("\n=== 3. Staker Tickets ===");
  try {
    const stakerTix = await forge.stakerTixEpoch();
    console.log("stakerTixEpoch():", ethers.formatEther(stakerTix), "tickets");
  } catch (err) {
    console.error("Error reading stakerTixEpoch:", err.message);
  }

  console.log("\n=== 4. User Stats ===");
  if (WALLET !== "0x0000000000000000000000000000000000000000") {
    try {
      const us = await forge.getUserStats(WALLET);
      console.log("userTix_:", ethers.formatEther(us.userTix_), "tickets");
      console.log("pendTix_:", ethers.formatEther(us.pendTix_), "tickets");
      console.log("dxnStaked_:", ethers.formatEther(us.dxnStaked_), "DXN");
      console.log("autoGold_:", ethers.formatEther(us.autoGold_), "GOLD");
      console.log("pendEth_:", ethers.formatEther(us.pendEth_), "ETH");
      console.log("xenBurned_:", ethers.formatEther(us.xenBurned_), "XEN");
    } catch (err) {
      console.error("Error reading user stats:", err.message);
    }
  } else {
    console.log("(Set WALLET env var to check user stats)");
  }

  console.log("\n=== 5. Token Supplies ===");
  try {
    const [goldSupply, dxnSupply] = await Promise.all([
      gold.totalSupply(),
      dxn.totalSupply(),
    ]);
    console.log("GOLD totalSupply():", ethers.formatEther(goldSupply), "GOLD");
    console.log("DXN totalSupply():", ethers.formatEther(dxnSupply), "DXN");

    if (goldSupply === 0n) {
      console.log("\n⚠️  GOLD supply is 0 — buyAndBurn has never succeeded!");
    }
  } catch (err) {
    console.error("Error reading token supplies:", err.message);
  }

  console.log("\n=== 6. Fee Timer ===");
  try {
    const [lastFeeTime, feeInterval] = await Promise.all([
      forge.lastFeeTime(),
      forge.feeInterval(),
    ]);
    const now = Math.floor(Date.now() / 1000);
    const nextFee = Number(lastFeeTime) + Number(feeInterval);
    const countdown = nextFee - now;
    console.log("lastFeeTime:", lastFeeTime.toString(), `(${new Date(Number(lastFeeTime) * 1000).toISOString()})`);
    console.log("feeInterval:", feeInterval.toString(), "seconds");
    console.log("Next fee in:", countdown > 0 ? `${countdown}s` : "READY NOW");
  } catch (err) {
    console.error("Error reading fee timer:", err.message);
  }

  console.log("\n=== Debug Complete ===");
}

main().catch(console.error);
