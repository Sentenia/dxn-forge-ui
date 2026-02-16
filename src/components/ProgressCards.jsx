import { Lock, Flame, HelpCircle } from "lucide-react";
import { fmtDxn, fmtXen } from "../utils/format";
import "./ProgressCards.css";

function fmtDisc(n) {
  if (n >= 1) return n.toFixed(2);
  if (n >= 0.01) return n.toFixed(3);
  if (n >= 0.0001) return n.toFixed(4);
  if (n > 0) return n.toFixed(6);
  return "0.00";
}

export default function ProgressCards({ data, wallet, setActiveExplainer }) {
  const dxnPct = data?.dxnStakedPct || 0;
  const xenPct = data?.xenBurnedPct || 0;
  const multDisplay = data?.multDisplay || "1.0";
  const discDisplay = fmtDisc(data?.communityDiscPrecise ?? 0);

  return (
    <div className="dual-progress">
      <div className="progress-card staker-card">
        <button className="help-icon" onClick={() => setActiveExplainer?.("stakeDxn")} title="Learn about staking">
          <HelpCircle size={12} />
        </button>
        <div className="progress-header">
          <span className="progress-title"><Lock size={14} style={{display:"inline",verticalAlign:"middle",marginRight:4}} /> {wallet.chain?.dxnName || "DXN"} STAKED</span>
          <span className="progress-badge staker-badge">{multDisplay}x TICKETS</span>
        </div>
        <div className="progress-big-num staker-num">{fmtDxn(data?.totalDXNStaked || 0)}</div>
        <div className="progress-sub">{dxnPct.toFixed(2)}% of actual supply staked</div>
        <div className="progress-supply">{fmtDxn(data?.dxnActualSupply || 0)} circulating · {fmtDxn(data?.dxnSupply || 0)} total</div>
        <div className="tier-track staker-track">
          <div className="tier-fill staker-fill" style={{ width: `${Math.min(dxnPct, 100)}%` }} />
        </div>
        <div className="progress-summary staker-summary">
          <div className="summary-row">
            <span className="summary-label">Staked</span>
            <span className="summary-value staker-num">{dxnPct.toFixed(2)}%</span>
          </div>
          <div className="summary-row">
            <span className="summary-label">Multiplier</span>
            <span className="summary-value staker-num">{multDisplay}x</span>
          </div>
          <div className="summary-note">Linear: 0% staked = 1x → 100% staked = 10x</div>
        </div>
      </div>

      <div className="progress-card burner-card">
        <button className="help-icon" onClick={() => setActiveExplainer?.("burnXen")} title="Learn about burning">
          <HelpCircle size={12} />
        </button>
        <div className="progress-header">
          <span className="progress-title"><Flame size={14} style={{display:"inline",verticalAlign:"middle",marginRight:4}} /> {wallet.chain?.xenName || "XEN"} BURNED</span>
          <span className="progress-badge burner-badge">{discDisplay}% OFF</span>
        </div>
        <div className="progress-big-num burner-num">{fmtXen(data?.totalXENBurned || 0)}</div>
        <div className="progress-sub">{xenPct.toFixed(2)}% of original supply destroyed</div>
        <div className="progress-supply">{fmtXen(data?.xenOriginalSupply || 0)} original supply</div>
        <div className="tier-track burner-track">
          <div className="tier-fill burner-fill" style={{ width: `${Math.min(xenPct, 100)}%` }} />
        </div>
        <div className="progress-summary burner-summary">
          <div className="summary-row">
            <span className="summary-label">Burned</span>
            <span className="summary-value burner-num">{xenPct.toFixed(2)}%</span>
          </div>
          <div className="summary-row">
            <span className="summary-label">Community discount</span>
            <span className="summary-value burner-num">{discDisplay}%</span>
          </div>
          <div className="summary-note">Quadratic: steeper as supply shrinks · caps at 45% (90% burned)</div>
        </div>
      </div>
    </div>
  );
}