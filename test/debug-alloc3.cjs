const { ethers } = require("ethers");

const RPC = process.env.SEPOLIA_RPC || "https://rpc.sepolia.org";
const FORGE = "0xbcA92C437e7433390cE1D5aC5d4F54e9aBd0B146";
const USER = "0x8B15d4b385eeCeC23cA32C8Dc45a48876d5FcbF4";

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

async function main() {
  console.log("=== _allocGold Deep Debug ===\n");

  const provider = new ethers.JsonRpcProvider(RPC);
  const forge = new ethers.Contract(FORGE, FORGE_ABI, provider);

  // Current state
  const currentEpoch = await forge.epoch();
  const userTix = await forge.userTix(USER);
  const userTixDebt = await forge.userTixDebt(USER);
  const userWt = await forge.userWt(USER);
  const userTixEp = await forge.userTixEp(USER);
  const autoGold = await forge.autoGold(USER);

  console.log("=== Current User State (AFTER allocation) ===");
  console.log("epoch():", currentEpoch.toString());
  console.log("userTix:", userTix.toString(), `(${Number(userTix) / 1e18})`);
  console.log("userTixDebt:", userTixDebt.toString(), `(${Number(userTixDebt) / 1e18})`);
  console.log("userWt:", userWt.toString(), `(${Number(userWt) / 1e18})`);
  console.log("userTixEp:", userTixEp.toString());
  console.log("autoGold:", autoGold.toString(), `(${Number(autoGold) / 1e18})`);
  console.log("");

  // Epoch data
  const epochs = {};
  for (let i = 1; i <= 2; i++) {
    epochs[i] = {
      done: await forge.epDone(i),
      gold: await forge.epGold(i),
      tix: await forge.epTix(i),
      acc: await forge.epAcc(i),
    };
  }

  console.log("=== Epoch Data ===");
  for (let i = 1; i <= 2; i++) {
    const e = epochs[i];
    console.log(`Epoch ${i}:`);
    console.log(`  epDone: ${e.done}`);
    console.log(`  epGold: ${e.gold.toString()} (${Number(e.gold) / 1e18})`);
    console.log(`  epTix:  ${e.tix.toString()} (${Number(e.tix) / 1e18})`);
    console.log(`  epAcc:  ${e.acc.toString()} (${Number(e.acc) / 1e18})`);
  }
  console.log("");

  // Simulate _allocGold
  console.log("=== Simulating _allocGold ===");
  console.log("Contract logic:");
  console.log("  epTotalTix = userTix");
  console.log("  if (userWt > 0 && epAcc > 0):");
  console.log("    owed = userWt * epAcc / 1e18");
  console.log("    if (owed > userTixDebt) epTotalTix += owed - userTixDebt");
  console.log("  goldShare = epTotalTix * epGold / epTix");
  console.log("");

  const ACC = 10n ** 18n;
  let totalAllocated = 0n;

  // The key question: what were userTix and userTixDebt BEFORE _allocGold ran?
  // After _allocGold, userTix is reset to 0 and debt is reset.
  // So current userTix (0.01) is from the CURRENT epoch 3, not from past epochs.

  console.log("=== CRITICAL INSIGHT ===");
  console.log("When _allocGold runs for epoch N, it uses:");
  console.log("  - userTix: tickets from XEN burns in epoch N (before reset)");
  console.log("  - userTixDebt: staker ticket debt (to prevent double-counting)");
  console.log("  - userWt * epAcc: staker tickets earned from weight");
  console.log("");
  console.log("After processing each epoch, userTix and debt are RESET to 0.");
  console.log("Current userTix=0.01 is from epoch 3 (current), not past epochs.");
  console.log("");

  // Let's reverse-engineer what happened
  console.log("=== Reverse Engineering Allocation ===");

  for (let ep = 1; ep <= 2; ep++) {
    const e = epochs[ep];
    console.log(`\n--- Epoch ${ep} ---`);

    // What staker tickets would user have earned?
    const stakerTix = (userWt * e.acc) / ACC;
    console.log(`Staker tickets (userWt * epAcc / 1e18): ${stakerTix.toString()} (${Number(stakerTix) / 1e18})`);

    // What's the gap?
    const gap = e.tix - stakerTix;
    console.log(`Gap (epTix - stakerTix): ${gap.toString()} (${Number(gap) / 1e18})`);
    console.log(`This gap = burner tickets from XEN burns in epoch ${ep}`);

    // If user was only burner, gap should be their userTix at that time
    // Gold they got from staker tickets alone:
    const goldFromStaker = e.tix > 0n ? (stakerTix * e.gold) / e.tix : 0n;
    console.log(`GOLD from staker tickets only: ${goldFromStaker.toString()} (${Number(goldFromStaker) / 1e18})`);

    // Gold from full epTix (if they got 100%):
    console.log(`GOLD if 100% share: ${e.gold.toString()} (${Number(e.gold) / 1e18})`);

    // Missing gold:
    const missingGold = e.gold - goldFromStaker;
    console.log(`MISSING GOLD: ${missingGold.toString()} (${Number(missingGold) / 1e18})`);

    totalAllocated += goldFromStaker;
  }

  console.log("\n=== SUMMARY ===");
  console.log(`Total GOLD from staker tickets only: ${totalAllocated.toString()} (${Number(totalAllocated) / 1e18})`);
  console.log(`Actual autoGold: ${autoGold.toString()} (${Number(autoGold) / 1e18})`);
  console.log(`Difference: ${(autoGold - totalAllocated).toString()} (${Number(autoGold - totalAllocated) / 1e18})`);

  const totalEpGold = epochs[1].gold + epochs[2].gold;
  console.log(`\nTotal epGold (ep1 + ep2): ${totalEpGold.toString()} (${Number(totalEpGold) / 1e18})`);
  console.log(`User got: ${Number(autoGold) / 1e18} (${(Number(autoGold) / Number(totalEpGold) * 100).toFixed(2)}%)`);
  console.log(`Missing: ${Number(totalEpGold - autoGold) / 1e18} (${(Number(totalEpGold - autoGold) / Number(totalEpGold) * 100).toFixed(2)}%)`);

  console.log("\n=== ROOT CAUSE HYPOTHESIS ===");
  console.log("The burner tickets (from XEN burns) are in epTix but NOT in user's allocation.");
  console.log("Possible causes:");
  console.log("1. userTix was 0 when _allocGold ran (tickets added AFTER epoch closed?)");
  console.log("2. userTixDebt ate into the tickets");
  console.log("3. Timing issue: burns happen, epoch closes, but _allocGold runs before userTix updated");
  console.log("");
  console.log("The gap tickets are:");
  const gap1 = epochs[1].tix - (userWt * epochs[1].acc) / ACC;
  const gap2 = epochs[2].tix - (userWt * epochs[2].acc) / ACC;
  console.log(`  Epoch 1: ${Number(gap1) / 1e18} tickets unaccounted`);
  console.log(`  Epoch 2: ${Number(gap2) / 1e18} tickets unaccounted`);
  console.log("These are likely burner tickets that were counted in epTix but not in epTotalTix during allocation.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
