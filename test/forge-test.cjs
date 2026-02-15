const { ethers } = require("hardhat");

async function main() {
  const [owner, user1, user2] = await ethers.getSigners();
  console.log("Owner:", owner.address);
  console.log("User1:", user1.address);
  console.log("User2:", user2.address);

  // ── Deploy mocks ──
  console.log("\n=== Deploying Mocks ===");

  const DXN = await (await ethers.getContractFactory("MockERC20")).deploy("DXN", "DXN", ethers.parseEther("3200000"));
  console.log("DXN:", await DXN.getAddress());

  const XEN = await (await ethers.getContractFactory("MockXEN")).deploy(ethers.parseEther("60580000000000"));
  console.log("XEN:", await XEN.getAddress());

  const GOLD = await (await ethers.getContractFactory("MockGOLD")).deploy();
  console.log("GOLD:", await GOLD.getAddress());

  const DBXEN = await (await ethers.getContractFactory("MockDBXEN")).deploy();
  console.log("DBXEN:", await DBXEN.getAddress());

  const WETH = await (await ethers.getContractFactory("MockWETH")).deploy();
  console.log("WETH:", await WETH.getAddress());

  const ROUTER = await (await ethers.getContractFactory("MockRouter")).deploy(await DXN.getAddress());
  console.log("ROUTER:", await ROUTER.getAddress());

  // ── Deploy Forge ──
  console.log("\n=== Deploying DXNForge ===");
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
  console.log("Forge:", await forge.getAddress());

  // Set forge as GOLD minter
  await GOLD.setMinter(await forge.getAddress());
  console.log("GOLD minter set to Forge");

  // ── Give users tokens ──
  console.log("\n=== Distributing tokens ===");
  await DXN.transfer(user1.address, ethers.parseEther("100000"));
  await DXN.transfer(user2.address, ethers.parseEther("50000"));
  await XEN.transfer(user1.address, ethers.parseEther("50000000000")); // 50B XEN
  await XEN.transfer(user2.address, ethers.parseEther("25000000000")); // 25B XEN
  console.log("User1: 100K DXN, 50B XEN");
  console.log("User2: 50K DXN, 25B XEN");

  // ── Test 1: Check initial stats ──
  console.log("\n=== Test 1: Initial Protocol Stats ===");
  let stats = await forge.getProtocolStats();
  console.log("Epoch:", stats.epoch_.toString());
  console.log("Multiplier:", stats.mult_.toString(), "(100 = 1.0x)");
  console.log("Global Disc:", stats.globalDisc_.toString(), "bps");
  console.log("DXN Supply:", ethers.formatEther(stats.dxnSupply_));
  console.log("DXN Actual Supply:", ethers.formatEther(stats.dxnActualSupply_));
  console.log("XEN Supply:", ethers.formatEther(stats.xenSupply_));

  // ── Test 2: Stake DXN ──
  console.log("\n=== Test 2: Stake DXN ===");
  await DXN.connect(user1).approve(await forge.getAddress(), ethers.MaxUint256);
  await forge.connect(user1).stakeDXN(ethers.parseEther("50000"));
  console.log("User1 staked 50,000 DXN");

  stats = await forge.getProtocolStats();
  let mult = Number(stats.mult_);
  console.log("Multiplier now:", (mult / 100).toFixed(2) + "x");
  console.log("DXN Fresh:", ethers.formatEther(stats.dxnFresh_));

  // User2 stakes too
  await DXN.connect(user2).approve(await forge.getAddress(), ethers.MaxUint256);
  await forge.connect(user2).stakeDXN(ethers.parseEther("50000"));
  console.log("User2 staked 50,000 DXN");

  stats = await forge.getProtocolStats();
  mult = Number(stats.mult_);
  let pct = (100000 / 3200000 * 100).toFixed(2);
  console.log("Total staked: 100K / 3.2M =", pct + "%");
  console.log("Multiplier now:", (mult / 100).toFixed(2) + "x");

  // ── Test 3: Burn XEN ──
  console.log("\n=== Test 3: Burn XEN ===");
  await XEN.connect(user1).approve(await forge.getAddress(), ethers.MaxUint256);

  let batches = 100;
  let [fee, disc] = await forge.calcXenFee(batches);
  console.log("100 batches: fee =", ethers.formatEther(fee), "ETH, discount =", Number(disc) / 100 + "%");

  await forge.connect(user1).burnXEN(batches, { value: fee });
  console.log("User1 burned 100 batches!");

  stats = await forge.getProtocolStats();
  console.log("XEN burned:", ethers.formatEther(stats.xenBurned_));
  console.log("XEN fees collected:", ethers.formatEther(stats.xenFees_));
  console.log("Global discount:", Number(stats.globalDisc_) / 100 + "%");

  // Bigger burn
  batches = 1000;
  [fee, disc] = await forge.calcXenFee(batches);
  console.log("\n1000 batches: fee =", ethers.formatEther(fee), "ETH, discount =", Number(disc) / 100 + "%");

  await forge.connect(user1).burnXEN(batches, { value: fee });
  console.log("User1 burned 1000 batches!");

  stats = await forge.getProtocolStats();
  console.log("Total XEN burned:", ethers.formatEther(stats.xenBurned_));
  console.log("Global discount:", Number(stats.globalDisc_) / 100 + "%");

  // ── Test 4: Claim fees (triggers ticket distribution) ──
  console.log("\n=== Test 4: Claim Fees ===");
  // Fast forward 5 minutes
  await ethers.provider.send("evm_increaseTime", [301]);
  await ethers.provider.send("evm_mine");

  await forge.claimFees();
  console.log("Fees claimed!");

  stats = await forge.getProtocolStats();
  console.log("Tickets this epoch:", ethers.formatEther(stats.tixEpoch_));
  console.log("Pending burn:", ethers.formatEther(stats.pendingBurn_));

  // ── Test 5: Check user stats ──
  console.log("\n=== Test 5: User Stats ===");
  let u1 = await forge.getUserStats(user1.address);
  let u2 = await forge.getUserStats(user2.address);
  console.log("User1 tickets:", ethers.formatEther(u1.userTix_));
  console.log("User1 pending tix:", ethers.formatEther(u1.pendTix_));
  console.log("User2 pending tix:", ethers.formatEther(u2.pendTix_));

  // ── Test 6: Supply-based multiplier curve ──
  console.log("\n=== Test 6: Multiplier Curve ===");
  let actualSupply = Number(ethers.formatEther(stats.dxnActualSupply_));
  let totalStaked = 100000;
  console.log("Actual supply:", actualSupply.toLocaleString(), "DXN");
  console.log("Total staked:", totalStaked.toLocaleString(), "DXN");
  console.log("Staked %:", (totalStaked / actualSupply * 100).toFixed(2) + "%");
  console.log("Multiplier:", (Number(stats.mult_) / 100).toFixed(2) + "x");

  // ── Test 7: XEN burn discount curve ──
  console.log("\n=== Test 7: Discount Curve ===");
  let origXen = 60.58e12;
  let burned = Number(ethers.formatEther(stats.xenBurned_));
  console.log("XEN burned:", burned.toLocaleString());
  console.log("% of supply:", (burned / origXen * 100).toFixed(6) + "%");
  console.log("Community discount:", (Number(stats.globalDisc_) / 100).toFixed(2) + "%");

  // Test fee calculation at different batch sizes
  console.log("\n--- Fee calculator ---");
  for (let b of [1, 10, 100, 1000, 5000, 10000]) {
    let [f, d] = await forge.calcXenFee(b);
    console.log(`${b} batches: ${ethers.formatEther(f)} ETH (${(Number(d)/100).toFixed(2)}% off)`);
  }

  console.log("\n✅ ALL TESTS PASSED");
}

main().catch((e) => { console.error(e); process.exit(1); });