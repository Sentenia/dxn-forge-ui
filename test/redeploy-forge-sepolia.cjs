const { ethers } = require("hardhat");

// Existing Sepolia contract addresses
const DXN = "0x7276c4Ce66d472d2Bd23C06A3d4c34790111720A";
const GOLD = "0x59416D0C2Fee58ce67c33a64B43159f1736b6809";
const DBXEN = "0x2E9a6ecC99d9259b7EDc5325799CeA0B385D1162";
const ROUTER = "0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E";
const WETH = "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14";
const XEN = "0xC63b6E79f952E086bFF4Fe8018062427616AdCd7";
const OWNER = "0x8B15d4b385eeCeC23cA32C8Dc45a48876d5FcbF4";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);
  console.log("");

  console.log("=== Deploying New DXNForge ===");
  console.log("Constructor args:");
  console.log("  DXN:   ", DXN);
  console.log("  GOLD:  ", GOLD);
  console.log("  DBXEN: ", DBXEN);
  console.log("  Router:", ROUTER);
  console.log("  WETH:  ", WETH);
  console.log("  XEN:   ", XEN);
  console.log("  Owner: ", OWNER);
  console.log("");

  const Forge = await ethers.getContractFactory("DXNForge");
  const forge = await Forge.deploy(DXN, GOLD, DBXEN, ROUTER, WETH, XEN, OWNER);
  await forge.waitForDeployment();

  const forgeAddr = await forge.getAddress();
  console.log("✓ DXNForge deployed:", forgeAddr);
  console.log("");

  // Set GOLD minter to new Forge
  console.log("=== Setting GOLD Minter ===");
  const goldAbi = ["function setMinter(address) external", "function minter() view returns (address)"];
  const gold = new ethers.Contract(GOLD, goldAbi, deployer);

  try {
    const currentMinter = await gold.minter();
    console.log("Current GOLD minter:", currentMinter);

    const tx = await gold.setMinter(forgeAddr);
    await tx.wait();
    console.log("✓ GOLD minter set to new Forge");

    const newMinter = await gold.minter();
    console.log("New GOLD minter:", newMinter);
  } catch (err) {
    console.log("⚠️  Could not set GOLD minter:", err.message);
    console.log("   You may need to call setMinter() manually from the GOLD owner account.");
  }

  console.log("");
  console.log("=== DONE ===");
  console.log("");
  console.log("New Forge address:", forgeAddr);
  console.log("");
  console.log("TODO: Update src/config/chains.js Sepolia entry:");
  console.log(`  forge: "${forgeAddr}",`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
