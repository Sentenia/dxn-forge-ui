const { ethers } = require("ethers");

const SEPOLIA_RPC = "https://ethereum-sepolia-rpc.publicnode.com";
const FORGE = "0xCEb8775E050c0E66B6860854728943e3a415859C";

async function main() {
  console.log("=== Verify Contract Deployment ===\n");

  const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC);

  // 1. Check if contract exists
  console.log("=== 1. Contract Code Check ===");
  const code = await provider.getCode(FORGE);
  console.log("Code length:", code.length, "chars");
  console.log("Contract exists:", code !== "0x" ? "YES" : "NO - NOT DEPLOYED!");

  if (code === "0x") {
    console.log("\n⚠️  CONTRACT NOT DEPLOYED AT THIS ADDRESS!");
    return;
  }

  // 2. Try low-level eth_call for each function
  console.log("\n=== 2. Raw Function Calls ===");

  // Function selectors
  const selectors = {
    "pendingBurn()": "0x4c255c97",
    "tixEpoch()": "0x1a74dcf8", // Need to compute
    "epoch()": "0x900cf0cf",
    "xenFeePool()": "0xc84c15b7", // Need to compute
    "DXN()": "0xf887ea40",
    "WETH()": "0xad5c4648",
    "ROUTER()": "0xf5f3d4f7", // Need to compute
  };

  // Compute selectors
  const iface = new ethers.Interface([
    "function pendingBurn() view returns (uint256)",
    "function tixEpoch() view returns (uint256)",
    "function epoch() view returns (uint256)",
    "function xenFeePool() view returns (uint256)",
    "function DXN() view returns (address)",
    "function WETH() view returns (address)",
    "function ROUTER() view returns (address)",
    "function canFee() view returns (bool)",
    "function MIN_BURN() view returns (uint256)",
  ]);

  for (const fn of ["pendingBurn()", "epoch()", "DXN()", "WETH()", "canFee()", "MIN_BURN()"]) {
    try {
      const selector = iface.getFunction(fn.replace("()", "")).selector;
      const result = await provider.call({
        to: FORGE,
        data: selector,
      });
      console.log(`${fn}: ${result}`);
    } catch (err) {
      console.log(`${fn}: ERROR - ${err.message}`);
    }
  }

  // 3. Try calling buyAndBurn with actual trace
  console.log("\n=== 3. Trace buyAndBurn Call ===");

  const buyAndBurnSelector = "0xa9e56f3c"; // buyAndBurn(uint256,uint256,uint24)
  // Encode: buyAndBurn(0, 0, 10000)
  const buyAndBurnIface = new ethers.Interface([
    "function buyAndBurn(uint256 amount, uint256 minOut, uint24 fee)",
  ]);
  const calldata = buyAndBurnIface.encodeFunctionData("buyAndBurn", [0, 0, 10000]);
  console.log("Calldata:", calldata);

  try {
    const result = await provider.call({
      to: FORGE,
      data: calldata,
    });
    console.log("Result:", result);
  } catch (err) {
    console.log("Revert reason:", err.message);
    if (err.data) {
      console.log("Revert data:", err.data);
      // Try to decode custom error
      try {
        const forgeIface = new ethers.Interface([
          "error Zero()",
          "error InsuffBal()",
          "error Cooldown()",
          "error Fail()",
          "error NoBurn()",
          "error NoTix()",
          "error AlreadySet()",
          "error NotLTS()",
          "error InsuffFee()",
          "error NoBatch()",
        ]);
        const decoded = forgeIface.parseError(err.data);
        console.log("Decoded error:", decoded?.name);
      } catch (e) {
        console.log("Could not decode error");
      }
    }
  }

  // 4. Check if maybe there's a reentrancy lock issue
  console.log("\n=== 4. Check Contract Storage ===");
  // Slot 0 is typically owner in Ownable
  // ReentrancyGuard uses a specific slot pattern

  const slot0 = await provider.getStorage(FORGE, 0);
  const slot1 = await provider.getStorage(FORGE, 1);
  console.log("Slot 0 (owner?):", slot0);
  console.log("Slot 1 (reentrancy?):", slot1);

  // ReentrancyGuard in OZ 5.x uses a transient storage or specific slot
  // Check if _status is locked (value = 2 means locked)

  console.log("\n=== Debug Complete ===");
}

main().catch(console.error);
