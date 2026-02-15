import { useState, useEffect, useCallback, useRef } from "react";
import { Contract, JsonRpcProvider, formatEther } from "ethers";
import { FORGE_ABI, ERC20_ABI, POOL_ABI, FACTORY_ABI } from "../config/abi";

const V3_FACTORY = "0x0227628f3F023bb0B980b67D528571c95c6DaC1c";
const FALLBACK_POLL_MS = 60000;

let prevDxnPrice = 0;
let lastPriceChange = 0;
let cachedPoolAddr = null;

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

      // Fetch DXN price from Uniswap V3 pool
      let dxnPrice = 0;
      if (chain.dxn && chain.weth) {
        try {
          // Cache pool address to save RPC calls
          if (!cachedPoolAddr) {
            const factory = new Contract(V3_FACTORY, FACTORY_ABI, rpc);
            cachedPoolAddr = await factory.getPool(chain.dxn, chain.weth, 10000);
          }
          if (cachedPoolAddr && cachedPoolAddr !== "0x0000000000000000000000000000000000000000") {
            const pool = new Contract(cachedPoolAddr, POOL_ABI, rpc);
            const [slot0, token0] = await Promise.all([pool.slot0(), pool.token0()]);
            const sqrtPriceX96 = slot0[0];
            const price = Number(sqrtPriceX96) ** 2 / (2 ** 192);
            const isToken0DXN = token0.toLowerCase() === chain.dxn.toLowerCase();
            dxnPrice = isToken0DXN ? price : 1 / price;
          }
        } catch (err) {
          console.warn("Failed to fetch DXN price:", err.message);
        }
      }

      // Persist last non-zero price change
      if (prevDxnPrice > 0) {
        const change = ((dxnPrice - prevDxnPrice) / prevDxnPrice) * 100;
        if (change !== 0) lastPriceChange = change;
      }
      prevDxnPrice = dxnPrice;

      const result = {
        dxnPrice,
        priceChange24h: lastPriceChange,
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
        const [userTixEpRaw, userTixDebt] = await Promise.all([
          forge.userTixEp(account),
          forge.userTixDebt(account),
        ]);
        const userTixEp = Number(userTixEpRaw);
        const currentEp = Number(ps.epoch_);
        const userWeight = us.userWt_;

        let projectedGold = 0n;
        const epochCount = currentEp - userTixEp;

        if (epochCount > 0 && epochCount <= 10) {
          // Batch all epoch reads in one Promise.all
          const epochs = [];
          for (let ep = userTixEp; ep < currentEp; ep++) epochs.push(ep);

          const epochData = await Promise.all(
            epochs.map(ep => Promise.all([
              forge.epDone(ep),
              forge.epGold(ep),
              forge.epTix(ep),
              forge.epAcc(ep),
              forge.userBurnTix(account, ep),
            ]))
          );

          let debt = userTixDebt;
          for (let i = 0; i < epochData.length; i++) {
            const [done, gold, tix, acc, burnTix] = epochData[i];
            if (!done) continue;

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

  // Initial fetch on mount + slow 60s fallback for external changes
  useEffect(() => {
    fetchData();
    const iv = setInterval(fetchData, FALLBACK_POLL_MS);
    return () => clearInterval(iv);
  }, [fetchData]);

  return { data, loading, refetch: fetchData };
}