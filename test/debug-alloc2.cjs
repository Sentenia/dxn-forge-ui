const { ethers } = require("ethers");

const RPC = process.env.SEPOLIA_RPC || "https://rpc.sepolia.org";
const FORGE = "0xbcA92C437e7433390cE1D5aC5d4F54e9aBd0B146";
const USER = "0x8B15d4b385eeCeC23cA32C8Dc45a48876d5FcbF4";
const DEPLOYER = "0x8B15d4b385eeCeC23cA32C8Dc45a48876d5FcbF4"; // same as USER
const GOLD = "0x59416D0C2Fee58ce67c33a64B43159f1736b6809";

const FORGE_ABI = [
  "function epoch() view returns (uint256)",
  "function epDone(uint256) view returns (bool)",
  "function epGold(uint256) view returns (uint256)",
  "function epTix(uint256) view returns (uint256)",
  "function epAcc(uint256) view returns (uint256)",
  "function autoGold(address) view returns (uint256)",
  "function userTix(address) view returns (uint256)",
  "function userWt(address) view returns (uint256)",
  "function userTixEp(address) view returns (uint256)",
  "function userTixDebt(address) view returns (uint256)",
];

const ERC20_ABI = [
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
];

function fmt(bn) {
  return `${bn.toString()} (${(Number(bn) / 1e18).toFixed(4)})`;
}

async function main() {
  console.log("=== GOLD Allocation Analysis ===");
  console.log("RPC:", RPC);
  console.log("Forge:", FORGE);
  console.log("User:", USER);
  console.log("GOLD:", GOLD);
  console.log("");

  const provider = new ethers.JsonRpcProvider(RPC);
  const forge = new ethers.Contract(FORGE, FORGE_ABI, provider);
  const gold = new ethers.Contract(GOLD, ERC20_ABI, provider);

  // GOLD token state
  console.log("=== GOLD Token State ===");
  const totalSupply = await gold.totalSupply();
  const forgeBalance = await gold.balanceOf(FORGE);
  const userGoldBalance = await gold.balanceOf(USER);
  console.log("GOLD.totalSupply():", fmt(totalSupply));
  console.log("GOLD.balanceOf(Forge):", fmt(forgeBalance));
  console.log("GOLD.balanceOf(User):", fmt(userGoldBalance));
  console.log("");

  // Forge global state
  console.log("=== Forge Global State ===");
  const currentEpoch = await forge.epoch();
  console.log("epoch():", currentEpoch.toString());
  console.log("");

  // Epoch 1 data
  console.log("=== Epoch 1 ===");
  const ep1Done = await forge.epDone(1);
  const ep1Gold = await forge.epGold(1);
  const ep1Tix = await forge.epTix(1);
  const ep1Acc = await forge.epAcc(1);
  console.log("epDone(1):", ep1Done);
  console.log("epGold(1):", fmt(ep1Gold));
  console.log("epTix(1):", fmt(ep1Tix));
  console.log("epAcc(1):", fmt(ep1Acc));
  console.log("");

  // Epoch 2 data
  console.log("=== Epoch 2 ===");
  const ep2Done = await forge.epDone(2);
  const ep2Gold = await forge.epGold(2);
  const ep2Tix = await forge.epTix(2);
  const ep2Acc = await forge.epAcc(2);
  console.log("epDone(2):", ep2Done);
  console.log("epGold(2):", fmt(ep2Gold));
  console.log("epTix(2):", fmt(ep2Tix));
  console.log("epAcc(2):", fmt(ep2Acc));
  console.log("");

  // User state
  console.log("=== User State ===");
  const autoGold = await forge.autoGold(USER);
  const userTix = await forge.userTix(USER);
  const userWt = await forge.userWt(USER);
  const userTixEp = await forge.userTixEp(USER);
  const userTixDebt = await forge.userTixDebt(USER);
  console.log("autoGold(user):", fmt(autoGold));
  console.log("userTix(user):", fmt(userTix));
  console.log("userWt(user):", fmt(userWt));
  console.log("userTixEp(user):", userTixEp.toString());
  console.log("userTixDebt(user):", fmt(userTixDebt));
  console.log("");

  // Check Forge address as potential staker
  console.log("=== Forge Address as Staker? ===");
  const forgeWt = await forge.userWt(FORGE);
  const forgeTix = await forge.userTix(FORGE);
  const forgeAutoGold = await forge.autoGold(FORGE);
  console.log("userWt(Forge):", fmt(forgeWt));
  console.log("userTix(Forge):", fmt(forgeTix));
  console.log("autoGold(Forge):", fmt(forgeAutoGold));
  console.log("");

  // Analysis
  console.log("=== ANALYSIS ===");
  const expectedTotal = ep1Gold + ep2Gold;
  console.log("Epoch 1 GOLD:", fmt(ep1Gold));
  console.log("Epoch 2 GOLD:", fmt(ep2Gold));
  console.log("Expected Total (ep1 + ep2):", fmt(expectedTotal));
  console.log("Actual autoGold(user):", fmt(autoGold));
  const missing = expectedTotal - autoGold;
  console.log("MISSING GOLD:", fmt(missing));
  console.log("");

  // Check if user got proportional share
  console.log("=== Proportional Share Check ===");
  console.log(`User weight: ${fmt(userWt)}`);
  console.log("");

  // Ticket analysis
  console.log("=== Ticket Analysis ===");
  console.log("If user is only staker, their tickets from weight should equal epTix");
  const ACC = 10n ** 18n;

  // What tickets should user have earned in epoch 1?
  const userTicketsEp1 = (userWt * ep1Acc) / ACC;
  console.log(`Epoch 1: userWt * epAcc / 1e18 = ${fmt(userTicketsEp1)}`);
  console.log(`Epoch 1: epTix = ${fmt(ep1Tix)}`);
  console.log(`Epoch 1: User share = ${ep1Tix > 0n ? ((Number(userTicketsEp1) / Number(ep1Tix)) * 100).toFixed(2) : 0}%`);

  const userTicketsEp2 = (userWt * ep2Acc) / ACC;
  console.log(`Epoch 2: userWt * epAcc / 1e18 = ${fmt(userTicketsEp2)}`);
  console.log(`Epoch 2: epTix = ${fmt(ep2Tix)}`);
  console.log(`Epoch 2: User share = ${ep2Tix > 0n ? ((Number(userTicketsEp2) / Number(ep2Tix)) * 100).toFixed(2) : 0}%`);
  console.log("");

  // Expected GOLD from tickets
  console.log("=== Expected GOLD from Tickets ===");
  const expectedGoldEp1 = ep1Tix > 0n ? (userTicketsEp1 * ep1Gold) / ep1Tix : 0n;
  const expectedGoldEp2 = ep2Tix > 0n ? (userTicketsEp2 * ep2Gold) / ep2Tix : 0n;
  console.log(`Epoch 1 expected GOLD: ${fmt(expectedGoldEp1)}`);
  console.log(`Epoch 2 expected GOLD: ${fmt(expectedGoldEp2)}`);
  console.log(`Total expected: ${fmt(expectedGoldEp1 + expectedGoldEp2)}`);
  console.log(`Actual autoGold: ${fmt(autoGold)}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
