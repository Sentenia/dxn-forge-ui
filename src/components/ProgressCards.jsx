import { Lock, Flame, HelpCircle } from "lucide-react";
import { fmtDxn, fmtXen } from "../utils/format";
import "./ProgressCards.css";

export default function ProgressCards({ data, wallet, setActiveExplainer }) {
  const dxnPct = data?.dxnStakedPct || 0;
  const multDisplay = data?.multDisplay || "1.000000";
  const discDisplay = (data?.communityDiscPrecise ?? 0).toFixed(6);

  // DXN Card data
  const forgeStaked = data?.totalDXNStaked || 0;
  const dxnBurned = data?.dxnBurned || 0;
  const nxdLocked = data?.ecosystem?.nxdLockedDxn || 0;
  const totalDxnPermanentlyRemoved = dxnBurned + nxdLocked;
  const dxnCirculating = data?.dxnCirculating || data?.dxnActualSupply || 0;
  const dxnStakedPctOfCirculating = dxnCirculating > 0 ? (forgeStaked / dxnCirculating) * 100 : 0;

  // XEN Card data
  const otherProtocolsBurned = wallet.chain?.ecosystem?.otherProtocolsBurned;
  const hasOtherBurns = otherProtocolsBurned !== null && otherProtocolsBurned !== undefined;
  const lastUpdated = wallet.chain?.ecosystem?.lastUpdated;

  const forgeBurnedXen = data?.totalXENBurned || 0;
  const otherBurnsNum = hasOtherBurns ? Number(otherProtocolsBurned) : 0;
  const totalXenDestroyed = forgeBurnedXen + otherBurnsNum;
  const xenCurrentSupply = data?.xenOriginalSupply ? data.xenOriginalSupply - forgeBurnedXen : 0;

  const xenTotalEverMinted = totalXenDestroyed + xenCurrentSupply;
  const xenBurnPct = xenTotalEverMinted > 0 ? (totalXenDestroyed / xenTotalEverMinted) * 100 : 0;

  // User impact data
  const userTotalDxn = (data?.userDXNFresh || 0) + (data?.userDXNRipe || 0) + (data?.userDXNStaked || 0);
  const userXenBurned = data?.userXENBurned || 0;
  const userXenPct = xenTotalEverMinted > 0 ? (userXenBurned / xenTotalEverMinted) * 100 : 0;
  const userDxnPct = dxnCirculating > 0 ? (userTotalDxn / dxnCirculating) * 100 : 0;
  const userMultContrib = userDxnPct * 0.09;

  return (
    <>
      <div className="dual-progress">
        {/* DXN LOCKED & STAKED CARD */}
        <div className="progress-card staker-card">
          <button className="help-icon" onClick={() => setActiveExplainer?.("stakeDxn")} title="Learn about staking">
            <HelpCircle size={12} />
          </button>
          <div className="progress-header">
            <span className="progress-title"><Lock size={14} style={{display:"inline",verticalAlign:"middle",marginRight:4}} /> {wallet.chain?.dxnName || "DXN"} LOCKED & STAKED</span>
            <span className="progress-badge staker-badge">{multDisplay}x</span>
          </div>

          <div className="eco-breakdown">
            <div className="eco-row">
              <span className="eco-label">{wallet.chain?.dxnName || "DXN"} Staked (in Forge)</span>
              <span className="eco-value staker-num">{fmtDxn(forgeStaked)}</span>
            </div>
            <div className="eco-divider" />
            <div className="eco-row">
              <span className="eco-label">{wallet.chain?.dxnName || "DXN"} Burned (by Forge)</span>
              <span className="eco-value">{fmtDxn(dxnBurned)}</span>
            </div>
            <div className="eco-row">
              <span className="eco-label">{wallet.chain?.dxnName || "DXN"} Locked (NXD)</span>
              <span className="eco-value eco-dim">{fmtDxn(nxdLocked)}</span>
            </div>
            <div className="eco-row eco-total">
              <span className="eco-label">Total Removed Permanently</span>
              <span className="eco-value">{fmtDxn(totalDxnPermanentlyRemoved)}</span>
            </div>
          </div>

          <div className="progress-summary staker-summary">
            <div className="summary-row">
              <span className="summary-label">Community Multiplier</span>
              <span className="summary-value staker-num">{multDisplay}x</span>
            </div>
            <div className="summary-row">
              <span className="summary-label">Supply Staked</span>
              <span className="summary-value staker-num">{dxnPct.toFixed(6)}%</span>
            </div>
          </div>

          <div className="progress-bar-container">
            <div className="progress-bar-track staker-track">
              <div className="progress-bar-fill staker-fill" style={{ width: `${Math.min(dxnStakedPctOfCirculating, 100)}%` }} />
            </div>
            <div className="progress-bar-labels">
              <span className="progress-bar-left">{fmtDxn(forgeStaked)} staked</span>
              <span className="progress-bar-right">{fmtDxn(dxnCirculating)} circulating</span>
            </div>
          </div>

          <div className="summary-note">Linear: 0% staked = 1x &rarr; 100% staked = 10x</div>
        </div>

        {/* XEN DESTROYED CARD */}
        <div className="progress-card burner-card">
          <button className="help-icon" onClick={() => setActiveExplainer?.("burnXen")} title="Learn about burning">
            <HelpCircle size={12} />
          </button>
          <div className="progress-header">
            <span className="progress-title"><Flame size={14} style={{display:"inline",verticalAlign:"middle",marginRight:4}} /> {wallet.chain?.xenName || "XEN"} DESTROYED</span>
            <span className="progress-badge burner-badge">{discDisplay}% OFF</span>
          </div>

          <div className="eco-breakdown">
            <div className="eco-row">
              <span className="eco-label"><Flame size={12} className="eco-icon burn-icon" /> DXN Forge</span>
              <span className="eco-value">{fmtXen(forgeBurnedXen)}</span>
            </div>
            {hasOtherBurns && (
              <div className="eco-row">
                <span className="eco-label"><Flame size={12} className="eco-icon burn-icon" /> Other Protocols</span>
                <span className="eco-value">{fmtXen(otherBurnsNum)}</span>
              </div>
            )}
            <div className="eco-divider" />
            <div className="eco-row eco-total">
              <span className="eco-label">Total Destroyed</span>
              <span className="eco-value burner-num">{fmtXen(totalXenDestroyed)}</span>
            </div>
            <div className="eco-row">
              <span className="eco-label">Current Supply</span>
              <span className="eco-value">{fmtXen(xenCurrentSupply)}</span>
            </div>
            {hasOtherBurns && lastUpdated && (
              <div className="eco-footnote">Data sourced from XENTurbo.io · Updated {lastUpdated}</div>
            )}
          </div>

          <div className="progress-summary burner-summary">
            <div className="summary-row">
              <span className="summary-label">Community Discount</span>
              <span className="summary-value burner-num">{discDisplay}%</span>
            </div>
          </div>

          <div className="progress-bar-container">
            <div className="progress-bar-track burner-track">
              <div className="progress-bar-fill burner-fill" style={{ width: `${Math.min(xenBurnPct, 100)}%` }} />
            </div>
            <div className="progress-bar-labels">
              <span className="progress-bar-left">{fmtXen(totalXenDestroyed)} burned</span>
              <span className="progress-bar-right">{fmtXen(xenTotalEverMinted)} total minted</span>
            </div>
          </div>

          <div className="summary-note">Quadratic: steeper as supply shrinks &middot; caps at 45% (90% burned)</div>
        </div>
      </div>

      {/* YOUR IMPACT SECTION */}
      {(userTotalDxn > 0 || userXenBurned > 0 || (data?.userAutoGold || 0) > 0) && (
        <div className="your-impact">
          <div className="impact-header">YOUR IMPACT</div>
          <div className="impact-grid">
            <div className="impact-item">
              <span className="impact-label">{wallet.chain?.xenName || "XEN"} Burned by You</span>
              <span className="impact-value burn-color">{fmtXen(userXenBurned)}</span>
              <span className="impact-sub">({userXenPct.toFixed(6)}% of supply)</span>
            </div>
            <div className="impact-item">
              <span className="impact-label">{wallet.chain?.dxnName || "DXN"} Staked by You</span>
              <span className="impact-value staker-num">{fmtDxn(userTotalDxn)}</span>
              <span className="impact-sub">(adds {userMultContrib.toFixed(6)}x to multiplier)</span>
            </div>
            <div className="impact-item">
              <span className="impact-label">GOLD Earned</span>
              <span className="impact-value gold-color">{(data?.userAutoGold || 0).toFixed(2)}</span>
            </div>
            <div className="impact-item">
              <span className="impact-label">{wallet.chain?.gasName || "ETH"} Earned</span>
              <span className="impact-value green-color">{(data?.userClaimableETH || 0).toFixed(4)} {wallet.chain?.gasName || "ETH"}</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
