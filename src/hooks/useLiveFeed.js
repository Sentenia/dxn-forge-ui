import { useState, useEffect, useCallback, useRef } from "react";
import { Contract, JsonRpcProvider, formatEther } from "ethers";
import { FORGE_ABI } from "../config/abi";

const MAX_ITEMS = 10;
const FALLBACK_POLL_MS = 60000;

function shortAddr(a) {
  return `${a.slice(0, 6)}...${a.slice(-4)}`;
}

function timeAgo(ts) {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 5) return "just now";
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function useLiveFeed(chain) {
  const [feed, setFeed] = useState([]);
  const rpcRef = useRef(null);
  const forgeRef = useRef(null);

  // Initialize contracts when chain changes
  useEffect(() => {
    if (!chain?.forge || !chain?.rpc) {
      rpcRef.current = null;
      forgeRef.current = null;
      return;
    }
    rpcRef.current = new JsonRpcProvider(chain.rpc);
    forgeRef.current = new Contract(chain.forge, FORGE_ABI, rpcRef.current);
  }, [chain]);

  const loadRecent = useCallback(async () => {
    console.log("[LiveFeed] refreshFeed called");
    const rpc = rpcRef.current;
    const forge = forgeRef.current;
    if (!rpc || !forge) return;

    try {
      const block = await rpc.getBlockNumber();
      const from = Math.max(0, block - 10);
      const opts = { fromBlock: from, toBlock: "latest" };

      const [burns, stakes, unstakes, buyburns, goldStakes, goldUnstakes, rewards, ethClaims] = await Promise.all([
        forge.queryFilter("XenBurn", opts.fromBlock, opts.toBlock),
        forge.queryFilter("Staked", opts.fromBlock, opts.toBlock),
        forge.queryFilter("Unstaked", opts.fromBlock, opts.toBlock),
        forge.queryFilter("BuyBurn", opts.fromBlock, opts.toBlock),
        forge.queryFilter("GoldStaked", opts.fromBlock, opts.toBlock),
        forge.queryFilter("GoldUnstaked", opts.fromBlock, opts.toBlock),
        forge.queryFilter("Rewards", opts.fromBlock, opts.toBlock),
        forge.queryFilter("EthClaimed", opts.fromBlock, opts.toBlock),
      ]);

      const newItems = [];
      const now = Date.now();

      burns.forEach((e) => {
        newItems.push({
          id: `${e.transactionHash}-${e.index}`,
          type: "burn",
          addr: shortAddr(e.args[0]),
          batches: Number(e.args[1]),
          tickets: Number(formatEther(e.args[2])).toFixed(4),
          block: e.blockNumber,
          ts: now,
        });
      });

      stakes.forEach((e) => {
        newItems.push({
          id: `${e.transactionHash}-${e.index}`,
          type: "stake",
          addr: shortAddr(e.args[0]),
          amount: Number(formatEther(e.args[1])).toFixed(2),
          block: e.blockNumber,
          ts: now,
        });
      });

      unstakes.forEach((e) => {
        newItems.push({
          id: `${e.transactionHash}-${e.index}`,
          type: "unstake",
          addr: shortAddr(e.args[0]),
          amount: Number(formatEther(e.args[1])).toFixed(2),
          block: e.blockNumber,
          ts: now,
        });
      });

      buyburns.forEach((e) => {
        newItems.push({
          id: `${e.transactionHash}-${e.index}`,
          type: "bnb",
          epoch: Number(e.args[0]),
          eth: Number(formatEther(e.args[1])).toFixed(4),
          dxn: Number(formatEther(e.args[2])).toFixed(2),
          gold: Number(formatEther(e.args[3])).toFixed(2),
          block: e.blockNumber,
          ts: now,
        });
      });

      goldStakes.forEach((e) => {
        newItems.push({
          id: `${e.transactionHash}-${e.index}`,
          type: "goldstake",
          addr: shortAddr(e.args[0]),
          amount: Number(formatEther(e.args[1])).toFixed(2),
          block: e.blockNumber,
          ts: now,
        });
      });

      goldUnstakes.forEach((e) => {
        newItems.push({
          id: `${e.transactionHash}-${e.index}`,
          type: "goldunstake",
          addr: shortAddr(e.args[0]),
          amount: Number(formatEther(e.args[1])).toFixed(2),
          block: e.blockNumber,
          ts: now,
        });
      });

      rewards.forEach((e) => {
        newItems.push({
          id: `${e.transactionHash}-${e.index}`,
          type: "rewards",
          addr: shortAddr(e.args[0]),
          gold: Number(formatEther(e.args[1])).toFixed(2),
          eth: Number(formatEther(e.args[2])).toFixed(4),
          block: e.blockNumber,
          ts: now,
        });
      });

      ethClaims.forEach((e) => {
        newItems.push({
          id: `${e.transactionHash}-${e.index}`,
          type: "ethclaim",
          addr: shortAddr(e.args[0]),
          eth: Number(formatEther(e.args[1])).toFixed(4),
          block: e.blockNumber,
          ts: now,
        });
      });

      // Merge with existing feed, dedupe by id, sort by block desc, cap at MAX_ITEMS
      setFeed((prev) => {
        const existingIds = new Set(prev.map((item) => item.id));
        const uniqueNew = newItems.filter((item) => !existingIds.has(item.id));
        const merged = [...uniqueNew, ...prev];
        merged.sort((a, b) => b.block - a.block);
        return merged.slice(0, MAX_ITEMS);
      });
    } catch (err) {
      console.error("Failed to load past events:", err);
    }
  }, []);

  // Refresh "time ago" labels every 10s (no RPC)
  useEffect(() => {
    const iv = setInterval(() => {
      setFeed((prev) => prev.map((f) => ({ ...f })));
    }, 10000);
    return () => clearInterval(iv);
  }, []);

  // Initial fetch + 60s fallback poll for external changes
  useEffect(() => {
    if (!chain?.forge || !chain?.rpc) return;
    loadRecent();
    const iv = setInterval(loadRecent, FALLBACK_POLL_MS);
    return () => clearInterval(iv);
  }, [chain, loadRecent]);

  // Attach timeAgo to each item for display
  const feedWithTime = feed.map((f) => ({ ...f, time: timeAgo(f.ts) }));

  return { feed: feedWithTime, refreshFeed: loadRecent };
}
