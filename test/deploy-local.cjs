const { ethers } = require("hardhat");

async function main() {
  const [owner] = await ethers.getSigners();
  console.log("Deployer:", owner.address);

  // Deploy mocks
  const DXN = await (await ethers.getContractFactory("MockERC20")).deploy("DXN", "DXN", ethers.parseEther("3700000"));
  const XEN = await (await ethers.getContractFactory("MockXEN")).deploy(ethers.parseEther("300000000000000"));

  // Seed faucet pools
  await (await DXN.transfer(await DXN.getAddress(), ethers.parseEther("500000"))).wait();
  console.log("DXN faucet pool: 500K tokens");

  await (await XEN.transfer(await XEN.getAddress(), ethers.parseEther("100000000000000"))).wait();
  console.log("XEN faucet pool: 100T tokens");

  const GOLD = await (await ethers.getContractFactory("MockGOLD")).deploy();
  const DBXEN = await (await ethers.getContractFactory("MockDBXEN")).deploy();
  const WETH = await (await ethers.getContractFactory("MockWETH")).deploy();
  const ROUTER = await (await ethers.getContractFactory("MockRouter")).deploy(await DXN.getAddress());

  const Forge = await ethers.getContractFactory("DXNForge");
  const forge = await Forge.deploy(
    await DXN.getAddress(),
    await GOLD.getAddress(),
    await DBXEN.getAddress(),
    await ROUTER.getAddress(),
    await WETH.getAddress(),
    await XEN.getAddress(),
    owner.address
  );

  await GOLD.setMinter(await forge.getAddress());

  // Give deployer some tokens to play with in the UI
  await DXN.mint(owner.address, ethers.parseEther("500000"));
  await XEN.transfer(owner.address, ethers.parseEther("50000000000"));

  console.log("\n=== LOCAL ADDRESSES ===");
  console.log("forge:", await forge.getAddress());
  console.log("dxn:  ", await DXN.getAddress());
  console.log("xen:  ", await XEN.getAddress());
  console.log("gold: ", await GOLD.getAddress());
  console.log("dbxen:", await DBXEN.getAddress());
  console.log("weth: ", await WETH.getAddress());
  console.log("router:", await ROUTER.getAddress());
  console.log("\nPaste into chains.js localhost entry!");
  console.log("DXN supply: 3.7M, XEN supply: 300T");
  console.log("Users call faucet() on DXN/XEN for test tokens.");
}

main().catch((e) => { console.error(e); process.exit(1); });