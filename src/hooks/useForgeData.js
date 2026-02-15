import { useState, useEffect, useCallback, useRef } from "react";
import { Contract, JsonRpcProvider, formatEther } from "ethers";
import { FORGE_ABI, ERC20_ABI } from "../config/abi";

const POLL_MS = 5000;

export function useForgeData(chain, account, provider) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const errorCount = useRef(0);

  const fetchData = useCallback(async () => {
    if (!chain?.forge || !chain?.rpc) return;

    try {
      const rpc = new JsonRpcProvider(chain.rpc);
      const forge = new Contract(chain.forge, FORGE_ABI, rpc);

      const ps = await forge.getProtocolStats();
      const stakerTixRaw = await forge.stakerTixEpoch();
      const goldContract = new Contract(chain.gold, ["function totalSupply() view returns (uint256)"], rpc);
      const goldSupply = await goldContract.totalSupply();
      const stakerTixActual = Number(formatEther(stakerTixRaw));
      const projectedStakerTix = Number(ps.mult_) / 100;

      const dxnSupply = Number(formatEther(ps.dxnSupply_));
      const dxnActualSupply = Number(formatEther(ps.dxnActualSupply_));
      const xenCurrentSupply = Number(formatEther(ps.xenSupply_));
      const totalXENBurned = Number(formatEther(ps.xenBurned_));
      const xenOriginalSupply = xenCurrentSupply + totalXENBurned;
      const totalDXNStaked = Number(formatEther(ps.dxnFresh_ + ps.dxnRipe_ + ps.dxnStaked_ + ps.globalLtsDXN_));
      const xenFeeETH = Number(formatEther(ps.xenFeePool_));
      const pendBurn = Number(formatEther(ps.pendingBurn_));
      const feeInterval = Number(ps.feeInterval_);

      const multRaw = Number(ps.mult_);
      const multDisplay = (multRaw / 100).toFixed(1);

      const globalDiscBps = Number(ps.globalDisc_);
      const globalDiscPct = (globalDiscBps / 100).toFixed(2);

      // JS-side community discount for better precision display
      let communityDiscPrecise = 0;
      if (xenOriginalSupply > 0) {
        const pct = (totalXENBurned / xenOriginalSupply) * 10000;
        if (pct >= 9000) {
          communityDiscPrecise = 45;
        } else {
          communityDiscPrecise = (4500 * pct * pct) / (9000 * 9000) / 100;
        }
      }

      const dxnStakedPct = dxnActualSupply > 0 ? (totalDXNStaked / dxnActualSupply) * 100 : 0;
      const xenBurnedPct = xenOriginalSupply > 0 ? (totalXENBurned / xenOriginalSupply) * 100 : 0;

      const lastFeeTime = Number(await forge.lastFeeTime());
      const now = Math.floor(Date.now() / 1000);
      const nextFee = lastFeeTime + feeInterval;
      const feeCountdown = Math.max(0, nextFee - now);

      let dbxenETH = 0;

      const result = {
        dxnPrice: 0,
        priceChange24h: 0,
        prevPrice: 0,
        totalDXNStaked,
        dxnSupply,
        dxnActualSupply,
        dxnStakedPct,
        multRaw,
        multDisplay,
        stakerMultiplier: multDisplay,
        totalXENBurned,
        xenOriginalSupply,
        xenBurnedPct,
        globalDiscBps,
        globalDiscPct,
        globalDiscount: Number(globalDiscPct),
        communityDiscPrecise,
        burn: Number(ps.epoch_),
        forgeCycle: Number(ps.forgeCycle_),
        xenFeeETH,
        dbxenETH,
        pendingBurnETH: pendBurn,
        feeCountdown,
        feeInterval,
        stakerTickets: stakerTixActual + projectedStakerTix,
        burnerTickets: Number(formatEther(ps.tixEpoch_)) - stakerTixActual,
        tixEpoch: Number(formatEther(ps.tixEpoch_)),
        totalGoldMinted: Number(formatEther(goldSupply)),
        totalGoldAllocated: Number(formatEther(ps.totAutoGold_ + ps.goldFresh_ + ps.goldRipe_ + ps.goldStaked_ + ps.globalLtsGold_)),
        totalETHDistributed: Number(formatEther(ps.goldEthReserve_)),
        totalDXNBurned: Number(formatEther(ps.pendingBurn_)),
        totalGoldStaked: Number(formatEther(ps.totAutoGold_ + ps.goldRipe_ + ps.goldStaked_ + ps.globalLtsGold_)),

        userDXNStaked: 0,
        userDXNFresh: 0,
        userDXNRipe: 0,
        userXENBurned: 0,
        userTickets: 0,
        userAutoGold: 0,
        userManualGold: 0,
        userGoldFresh: 0,
        userGoldRipe: 0,
        userGoldManualStaked: 0,
        userGoldWallet: 0,
        userClaimableETH: 0,
        userETH: 0,
        userWeight: 0,
        userDXNWallet: 0,
        userXENWallet: 0,
        userETHWallet: 0,
      };

      if (account) {
        const us = await forge.getUserStats(account);
        const goldToken = new Contract(chain.gold, ERC20_ABI, rpc);
        const dxnToken = new Contract(chain.dxn, ERC20_ABI, rpc);
        const xenToken = new Contract(chain.xen, ERC20_ABI, rpc);
        const [goldBal, dxnBal, xenBal, ethBal] = await Promise.all([
          goldToken.balanceOf(account),
          dxnToken.balanceOf(account),
          xenToken.balanceOf(account),
          rpc.getBalance(account),
        ]);

        // Calculate projected GOLD (what _allocGold would give on next sync)
        const userTixEp = Number(await forge.userTixEp(account));
        const userTixDebt = await forge.userTixDebt(account);
        const currentEp = Number(ps.epoch_);
        const userWeight = us.userWt_;

        let projectedGold = 0n;
        let debt = userTixDebt;

        for (let ep = userTixEp; ep < currentEp; ep++) {
          const done = await forge.epDone(ep);
          if (!done) continue;
          const [gold, tix, acc, burnTix] = await Promise.all([
            forge.epGold(ep),
            forge.epTix(ep),
            forge.epAcc(ep),
            forge.userBurnTix(account, ep),
          ]);

          let stakerTix = 0n;
          if (userWeight > 0n && acc > 0n) {
            const owed = (userWeight * acc) / BigInt(1e18);
            stakerTix = owed > debt ? owed - debt : 0n;
          }
          const totalTix = burnTix + stakerTix;
          if (totalTix > 0n && tix > 0n) {
            projectedGold += (totalTix * gold) / tix;
          }
          debt = 0n;
        }

        const projectedAutoGold = Number(formatEther(us.autoGold_ + projectedGold));

        result.userDXNStaked = Number(formatEther(us.dxnStaked_));
        result.userDXNFresh = Number(formatEther(us.dxnFresh_));
        result.userDXNRipe = Number(formatEther(us.dxnRipe_));
        result.userAutoGold = projectedAutoGold;
        result.userManualGold = Number(formatEther(us.goldRipe_ + us.goldStaked_));
        result.userGoldFresh = Number(formatEther(us.goldFresh_));
        result.userGoldRipe = Number(formatEther(us.goldRipe_));
        result.userGoldManualStaked = Number(formatEther(us.goldStaked_));
        result.userGoldWallet = Number(formatEther(goldBal));
        result.userClaimableETH = Number(formatEther(us.pendEth_));
        result.userETH = Number(formatEther(us.pendEth_));
        result.userTickets = Number(formatEther(us.userTix_ + us.pendTix_));
        result.userWeight = Number(formatEther(us.userWt_));
        result.userXENBurned = Number(formatEther(us.xenBurned_));
        result.userDXNWallet = Number(formatEther(dxnBal));
        result.userXENWallet = Number(formatEther(xenBal));
        result.userETHWallet = Number(formatEther(ethBal));
      }

      setData(result);
      setLoading(false);
      errorCount.current = 0;
    } catch (err) {
      console.error("Forge read failed:", err);
      errorCount.current++;
    }
  }, [chain, account]);

  useEffect(() => {
    fetchData();
    const delay = errorCount.current > 0
      ? Math.min(POLL_MS * Math.pow(2, errorCount.current), 60000)
      : POLL_MS;
    const iv = setInterval(fetchData, delay);
    return () => clearInterval(iv);
  }, [fetchData]);

  return { data, loading, refetch: fetchData };
}