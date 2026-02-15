const { ethers } = require("ethers");

const RPC = process.env.SEPOLIA_RPC || "https://rpc.sepolia.org";
const FORGE = "0xbcA92C437e7433390cE1D5aC5d4F54e9aBd0B146";
const USER = "0x8B15d4b385eeCeC23cA32C8Dc45a48876d5FcbF4";

const ABI = [
  "function epoch() view returns (uint256)",
  "function autoGold(address) view returns (uint256)",
  "function userTix(address) view returns (uint256)",
  "function userTixEp(address) view returns (uint256)",
  "function userWt(address) view returns (uint256)",
  "function epDone(uint256) view returns (bool)",
  "function epGold(uint256) view returns (uint256)",
  "function epTix(uint256) view returns (uint256)",
  "function epAcc(uint256) view returns (uint256)",
];

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC);
  const forge = new ethers.Contract(FORGE, ABI, provider);

  console.log("=== GOLD Allocation Debug ===");
  console.log("Forge:", FORGE);
  console.log("User:", USER);
  console.log("");

  // Global state
  const epoch = await forge.epoch();
  console.log("Current epoch():", epoch.toString());
  console.log("");

  // User state
  console.log("=== User State ===");
  const autoGold = await forge.autoGold(USER);
  const userTix = await forge.userTix(USER);
  const userTixEp = await forge.userTixEp(USER);
  const userWt = await forge.userWt(USER);

  console.log("autoGold(user):", ethers.formatEther(autoGold));
  console.log("userTix(user):", ethers.formatEther(userTix));
  console.log("userTixEp(user):", userTixEp.toString());
  console.log("userWt(user):", ethers.formatEther(userWt));
  console.log("");

  // Epoch 1 state
  console.log("=== Epoch 1 State ===");
  const ep1Done = await forge.epDone(1);
  const ep1Gold = await forge.epGold(1);
  const ep1Tix = await forge.epTix(1);
  const ep1Acc = await forge.epAcc(1);

  console.log("epDone(1):", ep1Done);
  console.log("epGold(1):", ethers.formatEther(ep1Gold));
  console.log("epTix(1):", ethers.formatEther(ep1Tix));
  console.log("epAcc(1):", ethers.formatEther(ep1Acc));
  console.log("");

  // Epoch 2 state
  console.log("=== Epoch 2 State ===");
  const ep2Done = await forge.epDone(2);
  const ep2Gold = await forge.epGold(2);
  const ep2Tix = await forge.epTix(2);
  const ep2Acc = await forge.epAcc(2);

  console.log("epDone(2):", ep2Done);
  console.log("epGold(2):", ethers.formatEther(ep2Gold));
  console.log("epTix(2):", ethers.formatEther(ep2Tix));
  console.log("epAcc(2):", ethers.formatEther(ep2Acc));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
