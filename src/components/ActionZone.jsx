import { useState } from "react";
import { Flame, Lock, Coins, HelpCircle } from "lucide-react";
import { fmtXen, fmtDxn } from "../utils/format";
import "./ActionZone.css";

export default function ActionZone({ data, actions, wallet, setActiveExplainer }) {
  const [tab, setTab] = useState("burn");
  const [batches, setBatches] = useState(100);
  const [stakeAmt, setStakeAmt] = useState("");
  const [goldAmt, setGoldAmt] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");

  const batchDiscPct = Math.min(batches / 200, 50);
  const communityDiscPct = data?.communityDiscPrecise ?? 0;
  const totalDisc = Math.min(batchDiscPct + communityDiscPct, 95);
  const ethFee = 0.000012 * batches * (1 - totalDisc / 100);
  const ticketsEarned = batches / 10000;
  const multDisplay = data?.multDisplay || "1.0";

  const fmtDisc = (n) => {
    if (n >= 1) return n.toFixed(2);
    if (n >= 0.01) return n.toFixed(3);
    if (n >= 0.0001) return n.toFixed(4);
    if (n > 0) return n.toFixed(6);
    return "0.00";
  };

  async function doAction(fn, label) {
    if (busy) return;
    setBusy(true);
    setStatus(`${label}...`);
    try {
      await fn();
      setStatus(`${label} ✓`);
      setTimeout(() => setStatus(""), 2000);
    } catch (err) {
      console.error(`${label} failed:`, err);
      setStatus(`Failed: ${err.reason || err.message || "unknown error"}`);
      setTimeout(() => setStatus(""), 4000);
    }
    setBusy(false);
  }

  return (
    <div className="action-zone">
      <div className="tabs">
        <button onClick={() => setTab("burn")} className={`tab ${tab === "burn" ? "tab-burn-active" : ""}`}><Flame size={16} style={{display:"inline",verticalAlign:"middle"}} /> BURN {wallet.chain?.xenName || "XEN"}</button>
        <button onClick={() => setTab("stake")} className={`tab ${tab === "stake" ? "tab-stake-active" : ""}`}><Lock size={16} style={{display:"inline",verticalAlign:"middle"}} /> STAKE {wallet.chain?.dxnName || "DXN"}</button>
        <button onClick={() => setTab("gold")} className={`tab ${tab === "gold" ? "tab-gold-active" : ""}`}><Coins size={16} style={{display:"inline",verticalAlign:"middle"}} /> STAKE GOLD</button>
      </div>
      <div className="action-card">
        {status && <div className="action-status">{status}</div>}

        {/* ═══ BURN XEN TAB ═══ */}
        {tab === "burn" ? (
          <>
            <div className="action-title">Burn {wallet.chain?.xenName || "XEN"} for Tickets</div>
            <div className="action-desc">Every batch burned = tickets toward GOLD. The more the community burns, the cheaper it gets for everyone.</div>
            <div className="input-group">
              <label className="input-label">BATCHES (2.5M {wallet.chain?.xenName || "XEN"} each)</label>
              <div className="wallet-balance">Wallet: {fmtXen(data?.userXENWallet || 0)} {wallet.chain?.xenName || "XEN"}</div>
              <div className="input-row">
                <input type="range" min={1} max={10000} value={batches} onChange={(e) => setBatches(Number(e.target.value))} className="slider burn-slider" />
                <input type="number" value={batches} onChange={(e) => setBatches(Math.max(1, Number(e.target.value)))} className="num-input" />
              </div>
              <div className="batch-presets">
                {[10, 100, 1000, 5000, 10000].map((n) => (
                  <button key={n} className={`preset-btn ${batches === n ? "preset-active" : ""}`} onClick={() => setBatches(n)}>{n >= 1000 ? `${n / 1000}K` : n}</button>
                ))}
              </div>
            </div>
            <button
              className="action-btn burn-btn"
              disabled={busy || !wallet.account}
              onClick={() => doAction(() => actions.burnXEN(batches), `Burning ${wallet.chain?.xenName || "XEN"}`)}
            >
              <Flame size={18} style={{display:"inline",verticalAlign:"middle"}} /> BURN {fmtXen(batches * 2.5e6)} {wallet.chain?.xenName || "XEN"}
            </button>
            <div className="fee-breakdown">
              <div className="fee-row"><span>{wallet.chain?.xenName || "XEN"} to burn</span><span className="fee-val burn-color">{fmtXen(batches * 2.5e6)}</span></div>
              <div className="fee-row"><span>Batch discount ({batches} batches)</span><span className="fee-val green-color">-{batchDiscPct.toFixed(2)}%</span></div>
              <div className="fee-row"><span>Community discount ({(data?.xenBurnedPct || 0).toFixed(2)}% {wallet.chain?.xenName || "XEN"} burned)</span><span className="fee-val green-color">-{fmtDisc(communityDiscPct)}%</span></div>
              <div className="fee-divider" />
              <div className="fee-row"><span className="fee-total-label">Total discount</span><span className="fee-val green-color fee-total">-{totalDisc.toFixed(4)}%</span></div>
              <div className="fee-row"><span className="fee-total-label">{wallet.chain?.gasName || "ETH"} Fee</span><span className="fee-val white fee-total">{ethFee.toFixed(6)} {wallet.chain?.gasName || "ETH"}</span></div>
              <div className="fee-divider" />
              <div className="fee-row"><span>Tickets earned</span><span className="fee-val gold-color fee-total">+{ticketsEarned.toFixed(4)} tickets</span></div>
            </div>
          </>

        /* ═══ STAKE DXN TAB ═══ */
        ) : tab === "stake" ? (
          <>
            <div className="action-title">Stake {wallet.chain?.dxnName || "DXN"} for Multiplied Tickets</div>
            <div className="action-desc">Staking {wallet.chain?.dxnName || "DXN"} increases the ticket multiplier for ALL stakers. {(data?.dxnStakedPct || 0).toFixed(1)}% of supply staked = {multDisplay}x multiplier.</div>
            <div className="input-group">
              <label className="input-label">AMOUNT TO STAKE</label>
              <div className="wallet-balance">Wallet: {fmtDxn(data?.userDXNWallet || 0)} {wallet.chain?.dxnName || "DXN"}</div>
              <div className="input-row">
                <input type="text" placeholder={`0.00 ${wallet.chain?.dxnName || "DXN"}`} value={stakeAmt} onChange={(e) => setStakeAmt(e.target.value)} className="text-input" />
                <button className="max-btn" onClick={() => setStakeAmt(String(data?.userDXNWallet ?? 0))}>MAX</button>
              </div>
            </div>
            <button
              className="action-btn stake-btn"
              disabled={busy || !wallet.account || !stakeAmt || parseFloat(stakeAmt) <= 0}
              onClick={() => doAction(() => actions.stakeDXN(stakeAmt), `Staking ${wallet.chain?.dxnName || "DXN"}`)}
            >
              <Lock size={18} style={{display:"inline",verticalAlign:"middle"}} /> STAKE {wallet.chain?.dxnName || "DXN"}
            </button>
            <div className="secondary-row">
              <button
                className="secondary-btn"
                disabled={busy || !wallet.account || !stakeAmt || parseFloat(stakeAmt) <= 0 || (data?.userDXNStaked || 0) <= 0}
                onClick={() => doAction(() => actions.unstakeDXN(stakeAmt), `Unstaking ${wallet.chain?.dxnName || "DXN"}`)}
              >Unstake {wallet.chain?.dxnName || "DXN"}</button>
            </div>
            <div className="fee-breakdown">
              <div className="fee-row"><span>Fresh (locked, earning tix)</span><span className="fee-val gold-color">{fmtDxn(data?.userDXNFresh || 0)} {wallet.chain?.dxnName || "DXN"}</span></div>
              <div className="fee-row"><span>Ripe (locked, earning tix)</span><span className="fee-val gold-color">{fmtDxn(data?.userDXNRipe || 0)} {wallet.chain?.dxnName || "DXN"}</span></div>
              <div className="fee-row"><span>Staked (withdrawable)</span><span className="fee-val gold-color">{fmtDxn(data?.userDXNStaked || 0)} {wallet.chain?.dxnName || "DXN"}</span></div>
              <div className="fee-divider" />
              <div className="fee-row"><span className="fee-total-label">Your total {wallet.chain?.dxnName || "DXN"}</span><span className="fee-val gold-color fee-total">{fmtDxn((data?.userDXNFresh || 0) + (data?.userDXNRipe || 0) + (data?.userDXNStaked || 0))} {wallet.chain?.dxnName || "DXN"}</span></div>
              <div className="fee-divider" />
              <div className="fee-row"><span>Total protocol staked</span><span className="fee-val">{fmtDxn(data?.totalDXNStaked || 0)}</span></div>
              <div className="fee-row"><span>Actual supply</span><span className="fee-val">{fmtDxn(data?.dxnActualSupply || 0)}</span></div>
              <div className="fee-row"><span className="fee-total-label">% of supply staked</span><span className="fee-val gold-color fee-total">{(data?.dxnStakedPct || 0).toFixed(2)}%</span></div>
              <div className="fee-row"><span className="fee-total-label">Current multiplier</span><span className="fee-val gold-color fee-total">{multDisplay}x tickets</span></div>
              <div className="fee-divider" />
              <div className="fee-row"><span>Burn (epoch)</span><span className="fee-val">{data?.burn || 1}</span></div>
              <div className="fee-row"><span>Your tickets</span><span className="fee-val gold-color">{(data?.userTickets || 0).toFixed(4)}</span></div>
            </div>
          </>

        /* ═══ STAKE GOLD TAB ═══ */
        ) : (
          <>
            <div className="action-title">Stake GOLD for {wallet.chain?.gasName || "ETH"} Dividends</div>
            <div className="action-desc">Staked GOLD earns 88% of all protocol {wallet.chain?.gasName || "ETH"}. Auto GOLD from tickets is already staked. Manually stake wallet GOLD below.</div>
            <div className="input-group">
              <label className="input-label">MANUAL STAKE AMOUNT</label>
              <div className="wallet-balance">Wallet: {(data?.userGoldWallet || 0).toFixed(2)} GOLD</div>
              <div className="input-row">
                <input type="text" placeholder="0.00 GOLD" value={goldAmt} onChange={(e) => setGoldAmt(e.target.value)} className="text-input gold-input" />
                <button className="max-btn gold-max" onClick={() => setGoldAmt(String(data?.userGoldWallet ?? 0))}>MAX</button>
              </div>
            </div>
            <button
              className="action-btn gold-btn"
              disabled={busy || !wallet.account || !goldAmt || parseFloat(goldAmt) <= 0}
              onClick={() => doAction(() => actions.stakeGold(goldAmt), "Staking GOLD")}
            >
              <Coins size={18} style={{display:"inline",verticalAlign:"middle"}} /> STAKE GOLD
            </button>
            <div className="secondary-row">
              <button
                className="secondary-btn"
                disabled={busy || !wallet.account || !goldAmt || parseFloat(goldAmt) <= 0 || (data?.userGoldManualStaked || 0) <= 0}
                onClick={() => doAction(() => actions.unstakeGold(goldAmt), "Unstaking GOLD")}
              >Unstake GOLD</button>
            </div>
            <div className="fee-divider" style={{margin:"16px 0"}} />
            <div className="action-subtitle">
              Claim Rewards
              <button className="help-icon-inline" onClick={() => setActiveExplainer?.("claimRewards")} title="Learn about claiming">
                <HelpCircle size={12} />
              </button>
            </div>
            <div className="action-desc">Claim GOLD + {wallet.chain?.gasName || "ETH"} withdraws ALL auto-staked GOLD to your wallet and claims {wallet.chain?.gasName || "ETH"} dividends. Claim {wallet.chain?.gasName || "ETH"} Only leaves GOLD staked.</div>
            <div className="secondary-row">
              <button
                className="secondary-btn claim-highlight"
                disabled={busy || !wallet.account || ((data?.userAutoGold || 0) <= 0 && (data?.userClaimableETH || 0) <= 0)}
                onClick={() => doAction(() => actions.claimRewards(), `Claiming GOLD + ${wallet.chain?.gasName || "ETH"}`)}
              >Claim GOLD + {wallet.chain?.gasName || "ETH"}</button>
              <button
                className="secondary-btn"
                disabled={busy || !wallet.account || (data?.userClaimableETH || 0) <= 0}
                onClick={() => doAction(() => actions.claimEth(), `Claiming ${wallet.chain?.gasName || "ETH"}`)}
              >Claim {wallet.chain?.gasName || "ETH"} Only</button>
            </div>
            <div className="fee-breakdown">
              <div className="fee-row"><span>Auto GOLD (auto-staked, earning {wallet.chain?.gasName || "ETH"})</span><span className="fee-val gold-color">{(data?.userAutoGold || 0).toFixed(2)}</span></div>
              <div className="fee-divider" />
              <div className="fee-row"><span>Fresh (not earning {wallet.chain?.gasName || "ETH"} yet)</span><span className="fee-val gold-color">{(data?.userGoldFresh || 0).toFixed(2)}</span></div>
              <div className="fee-row"><span>Ripe (earning {wallet.chain?.gasName || "ETH"}, locked)</span><span className="fee-val gold-color">{(data?.userGoldRipe || 0).toFixed(2)}</span></div>
              <div className="fee-row"><span>Staked (earning {wallet.chain?.gasName || "ETH"}, withdrawable)</span><span className="fee-val gold-color">{(data?.userGoldManualStaked || 0).toFixed(2)}</span></div>
              <div className="fee-divider" />
              <div className="fee-row"><span className="fee-total-label">Total GOLD earning {wallet.chain?.gasName || "ETH"}</span><span className="fee-val gold-color fee-total">{((data?.userAutoGold || 0) + (data?.userGoldRipe || 0) + (data?.userGoldManualStaked || 0)).toFixed(2)}</span></div>
              <div className="fee-divider" />
              <div className="fee-row"><span>GOLD in wallet</span><span className="fee-val">{(data?.userGoldWallet || 0).toFixed(2)}</span></div>
              <div className="fee-divider" />
              <div className="fee-row"><span>Total GOLD supply staked</span><span className="fee-val">{fmtDxn(data?.totalGoldStaked || 0)}</span></div>
              <div className="fee-row"><span>Your share</span><span className="fee-val gold-color fee-total">{(data?.totalGoldStaked || 0) > 0 ? ((((data?.userAutoGold || 0) + (data?.userGoldRipe || 0) + (data?.userGoldManualStaked || 0)) / data.totalGoldStaked) * 100).toFixed(2) : "0.00"}%</span></div>
              <div className="fee-divider" />
              <div className="fee-row"><span>Claimable {wallet.chain?.gasName || "ETH"}</span><span className="fee-val green-color fee-total">{(data?.userClaimableETH || 0).toFixed(4)} {wallet.chain?.gasName || "ETH"}</span></div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}