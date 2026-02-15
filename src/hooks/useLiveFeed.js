import { useState, useEffect } from "react";
import { Contract, JsonRpcProvider, formatEther } from "ethers";
import { FORGE_ABI } from "../config/abi";

const MAX_ITEMS = 25;

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

  // Refresh "time ago" labels every 10s
  useEffect(() => {
    const iv = setInterval(() => {
      setFeed((prev) => prev.map((f) => ({ ...f })));
    }, 10000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    if (!chain?.forge || !chain?.rpc) return;

    const rpc = new JsonRpcProvider(chain.rpc);
    const forge = new Contract(chain.forge, FORGE_ABI, rpc);

    // Fetch recent past events on load (last 10 blocks - Alchemy free tier limit)
    async function loadRecent() {
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

        const items = [];

        burns.forEach((e) => {
          items.push({
            type: "burn",
            addr: shortAddr(e.args[0]),
            batches: Number(e.args[1]),
            tickets: Number(formatEther(e.args[2])).toFixed(4),
            block: e.blockNumber,
          });
        });

        stakes.forEach((e) => {
          items.push({
            type: "stake",
            addr: shortAddr(e.args[0]),
            amount: Number(formatEther(e.args[1])).toFixed(2),
            block: e.blockNumber,
          });
        });

        unstakes.forEach((e) => {
          items.push({
            type: "unstake",
            addr: shortAddr(e.args[0]),
            amount: Number(formatEther(e.args[1])).toFixed(2),
            block: e.blockNumber,
          });
        });

        buyburns.forEach((e) => {
          items.push({
            type: "bnb",
            epoch: Number(e.args[0]),
            eth: Number(formatEther(e.args[1])).toFixed(4),
            dxn: Number(formatEther(e.args[2])).toFixed(2),
            gold: Number(formatEther(e.args[3])).toFixed(2),
            block: e.blockNumber,
          });
        });

        goldStakes.forEach((e) => {
          items.push({
            type: "goldstake",
            addr: shortAddr(e.args[0]),
            amount: Number(formatEther(e.args[1])).toFixed(2),
            block: e.blockNumber,
          });
        });

        goldUnstakes.forEach((e) => {
          items.push({
            type: "goldunstake",
            addr: shortAddr(e.args[0]),
            amount: Number(formatEther(e.args[1])).toFixed(2),
            block: e.blockNumber,
          });
        });

        rewards.forEach((e) => {
          items.push({
            type: "rewards",
            addr: shortAddr(e.args[0]),
            gold: Number(formatEther(e.args[1])).toFixed(2),
            eth: Number(formatEther(e.args[2])).toFixed(4),
            block: e.blockNumber,
          });
        });

        ethClaims.forEach((e) => {
          items.push({
            type: "ethclaim",
            addr: shortAddr(e.args[0]),
            eth: Number(formatEther(e.args[1])).toFixed(4),
            block: e.blockNumber,
          });
        });

        // Sort by block desc, add timestamps
        items.sort((a, b) => b.block - a.block);
        const now = Date.now();
        const withTs = items.slice(0, MAX_ITEMS).map((item, i) => ({
          ...item,
          ts: now - i * 5000, // approximate spacing
        }));
        setFeed(withTs);
      } catch (err) {
        console.error("Failed to load past events:", err);
      }
    }

    loadRecent();

    // Poll for new events every 12s (avoid .on() which uses unbounded block ranges)
    const pollInterval = setInterval(loadRecent, 12000);

    return () => {
      clearInterval(pollInterval);
    };
  }, [chain]);

  // Attach timeAgo to each item for display
  const feedWithTime = feed.map((f) => ({ ...f, time: timeAgo(f.ts) }));

  return feedWithTime;
}