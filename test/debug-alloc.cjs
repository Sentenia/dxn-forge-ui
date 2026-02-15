const { ethers } = require("ethers");

const RPC = process.env.SEPOLIA_RPC || "https://rpc.sepolia.org";
const FORGE = "0xbcA92C437e7433390cE1D5aC5d4F54e9aBd0B146";
const USER = "0x8B15d4b385eeCeC23cA32C8Dc45a48876d5FcbF4";

const ABI = [
  "function epoch() view returns (uint256)",
  "function userTix(address) view returns (uint256)",
  "function userTixDebt(address) view returns (uint256)",
  "function userTixEp(address) view returns (uint256)",
  "function userWt(address) view returns (uint256)",
  "function autoGold(address) view returns (uint256)",
  "function epDone(uint256) view returns (bool)",
  "function epGold(uint256) view returns (uint256)",
  "function epTix(uint256) view returns (uint256)",
  "function epAcc(uint256) view returns (uint256)",
];

function simulateAllocGold(userTix, userTixDebt, userWt, userTixEp, currentEpoch, epochs) {
  let tix = userTix;  // BigInt
  let debt = userTixDebt;  // BigInt
  let w = userWt;  // BigInt
  let ep = userTixEp;  // number
  let totalGold = 0n;
  const ACC = 10n**18n;

  console.log("\n=== Simulating _allocGold ===");
  console.log(`Starting: tix=${tix}, debt=${debt}, w=${w}, ep=${ep}, currentEpoch=${currentEpoch}`);
  console.log("");

  while (ep < currentEpoch) {
    if (!epochs[ep]) {
      console.log(`Epoch ${ep}: NO DATA`);
      ep++;
      continue;
    }
    let epTotalTix = tix;
    let owed = 0n;
    if (w > 0n && epochs[ep].acc > 0n) {
      owed = (w * epochs[ep].acc) / ACC;
      if (owed > debt) epTotalTix += owed - debt;
    }
    let g = 0n;
    if (epTotalTix > 0n && epochs[ep].tix > 0n) {
      g = (epTotalTix * epochs[ep].gold) / epochs[ep].tix;
    }
    console.log(`Epoch ${ep}:`);
    console.log(`  tix=${tix}, debt=${debt}`);
    console.log(`  w=${w}, epAcc=${epochs[ep].acc}`);
    console.log(`  owed=${owed}, epTotalTix=${epTotalTix}`);
    console.log(`  epTix=${epochs[ep].tix}, epGold=${epochs[ep].gold}`);
    console.log(`  goldShare=${g} (${Number(g) / 1e18} GOLD)`);
    console.log("");
    totalGold += g;
    tix = 0n;
    debt = 0n;
    ep++;
  }
  console.log(`Total GOLD allocated: ${totalGold}`);
  console.log(`Total GOLD formatted: ${Number(totalGold) / 1e18}`);
}

async function main() {
  console.log("=== _allocGold Debug ===");
  console.log("RPC:", RPC);
  console.log("Forge:", FORGE);
  console.log("User:", USER);
  console.log("");

  const provider = new ethers.JsonRpcProvider(RPC);
  const forge = new ethers.Contract(FORGE, ABI, provider);

  // Read all values as raw BigInt
  const currentEpoch = await forge.epoch();
  const userTix = await forge.userTix(USER);
  const userTixDebt = await forge.userTixDebt(USER);
  const userTixEp = await forge.userTixEp(USER);
  const userWt = await forge.userWt(USER);
  const autoGold = await forge.autoGold(USER);

  console.log("=== Raw Contract State ===");
  console.log("epoch():", currentEpoch.toString());
  console.log("userTix(user):", userTix.toString());
  console.log("userTixDebt(user):", userTixDebt.toString());
  console.log("userTixEp(user):", userTixEp.toString());
  console.log("userWt(user):", userWt.toString());
  console.log("autoGold(user):", autoGold.toString(), `(${Number(autoGold) / 1e18} GOLD)`);
  console.log("");

  // Read epoch data
  const epochs = {};

  console.log("=== Epoch 1 State ===");
  const ep1Done = await forge.epDone(1);
  const ep1Gold = await forge.epGold(1);
  const ep1Tix = await forge.epTix(1);
  const ep1Acc = await forge.epAcc(1);
  epochs[1] = { done: ep1Done, gold: ep1Gold, tix: ep1Tix, acc: ep1Acc };
  console.log("epDone(1):", ep1Done);
  console.log("epGold(1):", ep1Gold.toString());
  console.log("epTix(1):", ep1Tix.toString());
  console.log("epAcc(1):", ep1Acc.toString());
  console.log("");

  console.log("=== Epoch 2 State ===");
  const ep2Done = await forge.epDone(2);
  const ep2Gold = await forge.epGold(2);
  const ep2Tix = await forge.epTix(2);
  const ep2Acc = await forge.epAcc(2);
  epochs[2] = { done: ep2Done, gold: ep2Gold, tix: ep2Tix, acc: ep2Acc };
  console.log("epDone(2):", ep2Done);
  console.log("epGold(2):", ep2Gold.toString());
  console.log("epTix(2):", ep2Tix.toString());
  console.log("epAcc(2):", ep2Acc.toString());
  console.log("");

  // Also check epoch 0 in case
  console.log("=== Epoch 0 State ===");
  const ep0Done = await forge.epDone(0);
  const ep0Gold = await forge.epGold(0);
  const ep0Tix = await forge.epTix(0);
  const ep0Acc = await forge.epAcc(0);
  epochs[0] = { done: ep0Done, gold: ep0Gold, tix: ep0Tix, acc: ep0Acc };
  console.log("epDone(0):", ep0Done);
  console.log("epGold(0):", ep0Gold.toString());
  console.log("epTix(0):", ep0Tix.toString());
  console.log("epAcc(0):", ep0Acc.toString());

  // Simulate _allocGold
  simulateAllocGold(
    userTix,
    userTixDebt,
    userWt,
    Number(userTixEp),
    Number(currentEpoch),
    epochs
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
