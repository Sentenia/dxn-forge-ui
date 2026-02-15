import { Contract, parseEther } from "ethers";
import { FORGE_ABI, ERC20_ABI, FAUCET_ABI } from "../config/abi";

export function useForgeActions(chain, signer, refetch, feedRefresh) {
  const noop = async () => {};

  const refresh = () => {
    refetch();
    if (feedRefresh) feedRefresh();
  };

  if (!chain || !chain.forge || !signer) {
    return {
      burnXEN: noop,
      stakeDXN: noop,
      unstakeDXN: noop,
      stakeGold: noop,
      unstakeGold: noop,
      claimFees: noop,
      buyAndBurn: noop,
      claimRewards: noop,
      claimEth: noop,
      faucetDXN: noop,
      faucetXEN: noop,
    };
  }

  const forge = new Contract(chain.forge, FORGE_ABI, signer);

  async function burnXEN(batches) {
    const [fee] = await forge.calcXenFee(batches);
    const xen = new Contract(chain.xen, ERC20_ABI, signer);
    const xenAmt = parseEther((batches * 2500000).toString());
    const addr = await signer.getAddress();
    const allowance = await xen.allowance(addr, chain.forge);
    if (allowance < xenAmt) {
      const tx = await xen.approve(chain.forge, xenAmt);
      await tx.wait();
    }
    const tx = await forge.burnXEN(batches, { value: fee });
    await tx.wait();
    refresh();
  }

  async function stakeDXN(amount) {
    const dxn = new Contract(chain.dxn, ERC20_ABI, signer);
    const amt = parseEther(amount);
    const addr = await signer.getAddress();
    const allowance = await dxn.allowance(addr, chain.forge);
    if (allowance < amt) {
      const tx = await dxn.approve(chain.forge, amt);
      await tx.wait();
    }
    const tx = await forge.stakeDXN(amt);
    await tx.wait();
    refresh();
  }

  async function unstakeDXN(amount) {
    const tx = await forge.unstakeDXN(parseEther(amount));
    await tx.wait();
    refresh();
  }

  async function stakeGold(amount) {
    const gold = new Contract(chain.gold, ERC20_ABI, signer);
    const amt = parseEther(amount);
    const addr = await signer.getAddress();
    const allowance = await gold.allowance(addr, chain.forge);
    if (allowance < amt) {
      const tx = await gold.approve(chain.forge, amt);
      await tx.wait();
    }
    const tx = await forge.stakeGold(amt);
    await tx.wait();
    refresh();
  }

  async function unstakeGold(amount) {
    const tx = await forge.unstakeGold(parseEther(amount));
    await tx.wait();
    refresh();
  }

  async function claimFees() {
    const tx = await forge.claimFees();
    await tx.wait();
    refresh();
  }

  async function buyAndBurn(minOut, poolFee) {
    minOut = minOut || 0;
    poolFee = poolFee || 10000;
    const tx = await forge.claimAndBurn(minOut, poolFee);
    await tx.wait();
    refresh();
  }

  async function claimRewards() {
    const tx = await forge.claimRewards();
    await tx.wait();
    refresh();
  }

  async function claimEth() {
    const tx = await forge.claimEth();
    await tx.wait();
    refresh();
  }

  async function faucetDXN() {
    try {
      const dxn = new Contract(chain.dxn, FAUCET_ABI, signer);
      const addr = await signer.getAddress();
      const lastClaim = await dxn.lastFaucet(addr);
      const now = Math.floor(Date.now() / 1000);
      const elapsed = now - Number(lastClaim);
      if (elapsed < 86400 && Number(lastClaim) > 0) {
        const remaining = 86400 - elapsed;
        const hours = Math.floor(remaining / 3600);
        const mins = Math.floor((remaining % 3600) / 60);
        return { success: false, error: `Faucet on cooldown. Try again in ${hours}h ${mins}m.` };
      }
      const tx = await dxn.faucet();
      await tx.wait();
      refresh();
      return { success: true };
    } catch (err) {
      const msg = err.message || "";
      if (msg.includes("Wait 24h") || msg.includes("execution reverted")) {
        return { success: false, error: "Faucet on cooldown. Try again in 24 hours." };
      }
      return { success: false, error: "Faucet failed: " + (err.reason || err.message).slice(0, 50) };
    }
  }

  async function faucetXEN() {
    try {
      const xen = new Contract(chain.xen, FAUCET_ABI, signer);
      const addr = await signer.getAddress();
      const lastClaim = await xen.lastFaucet(addr);
      const now = Math.floor(Date.now() / 1000);
      const elapsed = now - Number(lastClaim);
      if (elapsed < 86400 && Number(lastClaim) > 0) {
        const remaining = 86400 - elapsed;
        const hours = Math.floor(remaining / 3600);
        const mins = Math.floor((remaining % 3600) / 60);
        return { success: false, error: `Faucet on cooldown. Try again in ${hours}h ${mins}m.` };
      }
      const tx = await xen.faucet();
      await tx.wait();
      refresh();
      return { success: true };
    } catch (err) {
      const msg = err.message || "";
      if (msg.includes("Wait 24h") || msg.includes("execution reverted")) {
        return { success: false, error: "Faucet on cooldown. Try again in 24 hours." };
      }
      return { success: false, error: "Faucet failed: " + (err.reason || err.message).slice(0, 50) };
    }
  }

  return { burnXEN, stakeDXN, unstakeDXN, stakeGold, unstakeGold, claimFees, buyAndBurn, claimRewards, claimEth, faucetDXN, faucetXEN };
}