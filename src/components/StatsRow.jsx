import { fmtDxn, fmtXen } from "../utils/format";
import "./StatsRow.css";

export default function StatsRow({ data }) {
  return (
    <div className="stats-row">
      <div className="stat-box">
        <div className="stat-label">DXN SUPPLY</div>
        <div className="stat-value">{fmtDxn(data.dxnActualSupply || 0)}</div>
        <div className="stat-sub">circulating (excl. burned)</div>
        <div className="stat-sub2">{fmtDxn(data.dxnSupply || 0)} total</div>
      </div>
      <div className="stat-box">
        <div className="stat-label">GOLD MINTED</div>
        <div className="stat-value gold-color">{fmtDxn(data.totalGoldMinted || 0)}</div>
        <div className="stat-sub">1:1 with DXN burned</div>
      </div>
      <div className="stat-box">
        <div className="stat-label">ETH DISTRIBUTED</div>
        <div className="stat-value green-color">{(data.totalETHDistributed || 0).toFixed(2)} ETH</div>
        <div className="stat-sub">to GOLD holders</div>
      </div>
      <div className="stat-box">
        <div className="stat-label">XEN SUPPLY</div>
        <div className="stat-value burn-color">{fmtXen(data.xenOriginalSupply || 0)}</div>
        <div className="stat-sub">{fmtXen(data.totalXENBurned || 0)} destroyed</div>
        <div className="stat-sub2">{(data.xenBurnedPct || 0).toFixed(2)}% burned</div>
      </div>
    </div>
  );
}