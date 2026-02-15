import { Lock, Flame } from "lucide-react";
import "./WarBar.css";

export default function WarBar({ data }) {
  const stakerTix = data?.stakerTickets || 0;
  const burnerTix = data?.burnerTickets || 0;
  const total = stakerTix + burnerTix;
  const stakerPct = total > 0 ? (stakerTix / total) * 100 : 50;
  const burnerPct = 100 - stakerPct;

  return (
    <div className="war-section">
      <div className="war-header">
        <span className="war-side"><Lock size={14} color="#ff9d00" /> STAKERS <span className="war-pct">{stakerPct.toFixed(1)}%</span></span>
        <span className="war-title">BURN {data?.burn || data?.epoch || 1} · DAY {data?.forgeCycle || 1} — TICKET SHARE</span>
        <span className="war-side"><span className="war-pct">{burnerPct.toFixed(1)}%</span> BURNERS <Flame size={14} color="#ff4444" /></span>
      </div>
      <div className="war-bar-outer">
        <div className="war-bar-left" style={{ width: `${stakerPct}%` }}>
          <span className="war-bar-label">{stakerTix.toLocaleString()} tix</span>
        </div>
        <div className="war-bar-divider" />
        <div className="war-bar-right" style={{ width: `${burnerPct}%` }}>
          <span className="war-bar-label">{burnerTix.toLocaleString()} tix</span>
        </div>
      </div>
    </div>
  );
}