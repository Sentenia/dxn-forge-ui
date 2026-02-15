import { useState, useEffect, useRef } from "react";
import { Zap, Flame, Loader } from "lucide-react";
import { fmtTime } from "../utils/format";
import "./CountdownBar.css";

export default function CountdownBar({ data, actions, wallet }) {
  const [firing, setFiring] = useState(false);
  const [localCountdown, setLocalCountdown] = useState(data?.feeCountdown ?? 0);
  const lastSyncRef = useRef(data?.feeCountdown ?? 0);

  // Sync from chain data when it changes significantly
  useEffect(() => {
    const chainVal = data?.feeCountdown ?? 0;
    if (Math.abs(chainVal - lastSyncRef.current) > 2) {
      setLocalCountdown(chainVal);
    }
    lastSyncRef.current = chainVal;
  }, [data?.feeCountdown]);

  // Smooth local tick every second
  useEffect(() => {
    const iv = setInterval(() => {
      setLocalCountdown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(iv);
  }, []);

  const feeInterval = data?.feeInterval ?? 300;
  const isReady = localCountdown <= 0;
  const totalBurnETH = (data?.xenFeeETH || 0) + (data?.dbxenETH || 0);
  const hasFunds = totalBurnETH > 0;
  const canFire = isReady && hasFunds && wallet.account;
  const progress = ((feeInterval - localCountdown) / feeInterval) * 100;

  const handleBuyBurn = async () => {
    if (!canFire || firing) return;
    setFiring(true);
    try {
      await actions.claimFees();
      await actions.buyAndBurn();
    } catch (err) {
      console.error("B&B failed:", err);
    }
    setFiring(false);
  };

  return (
    <div className="countdown-bar">
      <div className="countdown-inner">
        <div className="countdown-left">
          <span className="countdown-label">NEXT BUY & BURN</span>
          <span className="countdown-time" style={{ color: isReady ? (hasFunds ? "#00ff88" : "#ff4444") : "#ff9d00" }}>
            {isReady ? (hasFunds ? <><Zap size={22} style={{display:"inline",verticalAlign:"middle"}} /> READY</> : `WAITING FOR ${wallet.chain?.gasName || "ETH"}`) : fmtTime(localCountdown)}
          </span>
        </div>
        <div className="countdown-center">
          <div className="countdown-track">
            <div className="countdown-fill" style={{ width: `${progress}%`, background: isReady ? (hasFunds ? "linear-gradient(90deg,#00ff88,#00cc66)" : "linear-gradient(90deg,#ff4444,#ff6644)") : "linear-gradient(90deg,#ff9d00,#ffb700)", boxShadow: isReady ? (hasFunds ? "0 0 12px rgba(0,255,136,0.4)" : "0 0 12px rgba(255,68,68,0.3)") : "0 0 8px rgba(255,157,0,0.3)" }} />
          </div>
          <button className={`bnb-btn ${canFire ? "bnb-ready" : "bnb-waiting"}`} disabled={!canFire || firing} onClick={handleBuyBurn}>
            {firing ? <><Loader size={16} className="spin" /> FIRING...</> : <><Flame size={16} style={{display:"inline",verticalAlign:"middle"}} /> BUY & BURN</>}
          </button>
          <div className="bnb-pool">
            <div className="pool-row">
              <span className="pool-label">{wallet.chain?.xenName || "XEN"} burn fees</span>
              <span className="pool-val">{(data?.xenFeeETH || 0).toFixed(4)} {wallet.chain?.gasName || "ETH"}</span>
            </div>
            <div className="pool-row">
              <span className="pool-label">DBXen rewards</span>
              <span className={`pool-val ${(data?.dbxenETH || 0) > 0 ? "green-color" : ""}`}>{(data?.dbxenETH || 0) > 0 ? data.dbxenETH.toFixed(4) : "0"} {wallet.chain?.gasName || "ETH"}</span>
            </div>
            <div className="pool-divider" />
            <div className="pool-row pool-total">
              <span className="pool-label">Available to B&B (8.88%)</span>
              <span className="pool-val">{(totalBurnETH * 0.0888).toFixed(4)} {wallet.chain?.gasName || "ETH"}</span>
            </div>
          </div>
        </div>
        <div className="countdown-right">
          <span className="countdown-eth">{totalBurnETH.toFixed(4)} {wallet.chain?.gasName || "ETH"}</span>
          <span className="countdown-sub">total claimable</span>
        </div>
      </div>
    </div>
  );
}