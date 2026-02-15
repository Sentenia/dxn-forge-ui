import { Flame, Lock, Unlock, Sparkles, Coins, ArrowDownCircle, Gift } from "lucide-react";
import "./LiveFeed.css";

const FEED_ICON = {
  burn: <Flame size={14} color="#ff6644" />,
  stake: <Lock size={14} color="#ff9d00" />,
  unstake: <Unlock size={14} color="#ff9d00" />,
  bnb: <Sparkles size={14} color="#00ff88" />,
  goldstake: <Coins size={14} color="#ffd700" />,
  goldunstake: <Coins size={14} color="#888" />,
  rewards: <Gift size={14} color="#ffd700" />,
  ethclaim: <ArrowDownCircle size={14} color="#00ff88" />,
};

function FeedText({ f, chain }) {
  const dxn = chain?.dxnName || "DXN";
  const xen = chain?.xenName || "XEN";
  const gas = chain?.gasName || "ETH";

  switch (f.type) {
    case "burn":
      return <span className="feed-text">burned <strong className="burn-color">{f.batches.toLocaleString()}</strong> batches {xen} &rarr; <strong className="gold-color">{f.tickets}</strong> tickets</span>;
    case "stake":
      return <span className="feed-text">staked <strong className="gold-color">{Number(f.amount).toLocaleString()} {dxn}</strong></span>;
    case "unstake":
      return <span className="feed-text">unstaked <strong>{Number(f.amount).toLocaleString()} {dxn}</strong></span>;
    case "bnb":
      return <span className="feed-text">B&B fired: <strong className="green-color">{f.eth} {gas}</strong> &rarr; <strong className="burn-color">{f.dxn} {dxn}</strong> burned &rarr; <strong className="gold-color">{f.gold} GOLD</strong> minted</span>;
    case "goldstake":
      return <span className="feed-text">staked <strong className="gold-color">{Number(f.amount).toLocaleString()} GOLD</strong></span>;
    case "goldunstake":
      return <span className="feed-text">unstaked <strong>{Number(f.amount).toLocaleString()} GOLD</strong></span>;
    case "rewards":
      return <span className="feed-text">claimed <strong className="gold-color">{f.gold} GOLD</strong> + <strong className="green-color">{f.eth} {gas}</strong></span>;
    case "ethclaim":
      return <span className="feed-text">claimed <strong className="green-color">{f.eth} {gas}</strong></span>;
    default:
      return null;
  }
}

export default function LiveFeed({ feed, chain }) {
  return (
    <div className="feed-wrapper">
      <div className="feed-card">
        <div className="feed-title"><span className="live-dot" /> LIVE ACTIVITY</div>
        <div className="feed-list">
          {feed.length === 0 ? (
            <div className="feed-empty">No activity yet — burn some XEN or stake DXN to see events here</div>
          ) : (
            feed.map((f, i) => (
              <div key={`${f.type}-${f.ts}-${i}`} className={`feed-item ${i === 0 ? "feed-new" : ""}`}>
                <span className="feed-icon">{FEED_ICON[f.type]}</span>
                <div className="feed-content">
                  {f.addr && <span className="feed-addr">{f.addr}</span>}
                  <FeedText f={f} chain={chain} />
                </div>
                <span className="feed-time">{f.time}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}