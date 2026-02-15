const { ethers } = require("hardhat");

// Real Sepolia Uniswap V3 infrastructure
const REAL_WETH = "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14";
const REAL_ROUTER = "0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  console.log("\n=== Deploying Mock Tokens ===");
  const DXN = await (await ethers.getContractFactory("MockERC20")).deploy("Test DXN", "tDXN", ethers.parseEther("3700000"));
  await DXN.waitForDeployment();
  console.log("DXN:", await DXN.getAddress());

  const XEN = await (await ethers.getContractFactory("MockXEN")).deploy(ethers.parseEther("300000000000000"));
  await XEN.waitForDeployment();
  console.log("XEN:", await XEN.getAddress());

  const GOLD = await (await ethers.getContractFactory("MockGOLD")).deploy();
  await GOLD.waitForDeployment();
  console.log("GOLD:", await GOLD.getAddress());

  const DBXEN = await (await ethers.getContractFactory("MockDBXEN")).deploy();
  await DBXEN.waitForDeployment();
  console.log("DBXEN:", await DBXEN.getAddress());

  console.log("\n=== Deploying DXNForge ===");
  const Forge = await ethers.getContractFactory("DXNForge");
  const forge = await Forge.deploy(
    await DXN.getAddress(),
    await GOLD.getAddress(),
    await DBXEN.getAddress(),
    REAL_ROUTER,
    REAL_WETH,
    await XEN.getAddress(),
    deployer.address
  );
  await forge.waitForDeployment();
  console.log("Forge:", await forge.getAddress());

  const tx = await GOLD.setMinter(await forge.getAddress());
  await tx.wait();
  console.log("GOLD minter set to Forge");

  console.log("\n=== Seeding Faucet Pools ===");
  await (await DXN.transfer(await DXN.getAddress(), ethers.parseEther("3000000"))).wait();
  console.log("DXN faucet pool: 3M tokens (deployer keeps 700K for liquidity)");

  await (await XEN.transfer(await XEN.getAddress(), ethers.parseEther("200000000000000"))).wait();
  console.log("XEN faucet pool: 200T tokens (deployer keeps 100T)");

  console.log("\n=== SEPOLIA ADDRESSES ===");
  console.log("forge:", await forge.getAddress());
  console.log("dxn:  ", await DXN.getAddress());
  console.log("xen:  ", await XEN.getAddress());
  console.log("gold: ", await GOLD.getAddress());
  console.log("dbxen:", await DBXEN.getAddress());
  console.log("weth: ", REAL_WETH);
  console.log("router:", REAL_ROUTER);
  console.log("\nDXN supply: 3.7M, XEN supply: 300T");
  console.log("Users call faucet() on DXN/XEN for test tokens.");
  console.log("\nNext: Create tDXN/WETH pool on Uniswap V3 Sepolia (1% fee tier)");
}

main().catch((e) => { console.error(e); process.exit(1); });
