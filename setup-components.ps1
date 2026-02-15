# Run from project root: C:\Users\broha\dxn-forge-ui
# Usage: powershell -ExecutionPolicy Bypass -File setup-all.ps1

# Create folders
$dirs = @("src\components", "src\hooks", "src\utils")
foreach ($d in $dirs) {
  if (!(Test-Path $d)) { New-Item -ItemType Directory -Path $d -Force }
}

# ═══════════════════════════════════════
# src/index.css
# ═══════════════════════════════════════
@'
:root {
  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
'@ | Set-Content -Path "src\index.css" -Encoding UTF8

# ═══════════════════════════════════════
# src/main.jsx
# ═══════════════════════════════════════
@'
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
'@ | Set-Content -Path "src\main.jsx" -Encoding UTF8

# ═══════════════════════════════════════
# src/App.css
# ═══════════════════════════════════════
@'
@import url("https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Outfit:wght@400;500;600;700;800&display=swap");

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  background: #08080c;
  color: #e0e0e0;
  font-family: "Outfit", sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.app {
  min-height: 100vh;
  padding-bottom: 60px;
}

.flash-green { animation: flashG 0.6s ease; }
.flash-red { animation: flashR 0.6s ease; }

@keyframes flashG {
  0% { color: #00ff88; text-shadow: 0 0 8px rgba(0, 255, 136, 0.5); }
  100% { color: inherit; text-shadow: none; }
}

@keyframes flashR {
  0% { color: #ff4444; text-shadow: 0 0 8px rgba(255, 68, 68, 0.5); }
  100% { color: inherit; text-shadow: none; }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

@keyframes slideIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

.burn-color { color: #ff6644; }
.green-color { color: #00ff88; }
.gold-color { color: #ffb700; }

::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: rgba(255, 255, 255, 0.02); }
::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.2); }
::selection { background: rgba(255, 157, 0, 0.3); color: #fff; }
'@ | Set-Content -Path "src\App.css" -Encoding UTF8

# ═══════════════════════════════════════
# src/App.jsx
# ═══════════════════════════════════════
@'
import { useMockData } from "./hooks/useMockData";
import Header from "./components/Header";
import CountdownBar from "./components/CountdownBar";
import WarBar from "./components/WarBar";
import ProgressCards from "./components/ProgressCards";
import ActionZone from "./components/ActionZone";
import LiveFeed from "./components/LiveFeed";
import StatsRow from "./components/StatsRow";
import "./App.css";

function App() {
  const data = useMockData();

  return (
    <div className="app">
      <Header data={data} />
      <CountdownBar data={data} />
      <WarBar data={data} />
      <ProgressCards data={data} />
      <ActionZone data={data} />
      <LiveFeed />
      <StatsRow data={data} />
    </div>
  );
}

export default App;
'@ | Set-Content -Path "src\App.jsx" -Encoding UTF8

# ═══════════════════════════════════════
# src/utils/format.js
# ═══════════════════════════════════════
@'
export const fmtXen = (n) => {
  if (n >= 1e12) return (n / 1e12).toFixed(2) + "T";
  if (n >= 1e9) return (n / 1e9).toFixed(1) + "B";
  if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
  return n.toLocaleString();
};

export const fmtDxn = (n) => {
  if (n >= 1e6) return (n / 1e6).toFixed(2) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(1) + "K";
  return n.toLocaleString();
};

export const fmtTime = (s) => {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
};

export const fmtEth = (n, dec = 4) => {
  return n.toFixed(dec) + " ETH";
};
'@ | Set-Content -Path "src\utils\format.js" -Encoding UTF8

# ═══════════════════════════════════════
# src/hooks/useMockData.js
# ═══════════════════════════════════════
@'
import { useState, useEffect } from "react";

export const STAKER_TIERS = [
  { threshold: 200000, mult: 2, label: "200K" },
  { threshold: 400000, mult: 3, label: "400K" },
  { threshold: 800000, mult: 4, label: "800K" },
  { threshold: 1600000, mult: 5, label: "1.6M" },
  { threshold: 3200000, mult: 6, label: "3.2M" },
];

export const BURNER_TIERS = [
  { threshold: 100e9, disc: 8, label: "100B" },
  { threshold: 500e9, disc: 16, label: "500B" },
  { threshold: 2e12, disc: 24, label: "2T" },
  { threshold: 8e12, disc: 32, label: "8T" },
  { threshold: 25e12, disc: 40, label: "25T" },
  { threshold: 50e12, disc: 50, label: "50T" },
];

export const TOTAL_XEN_SUPPLY = 60.58e12;

export function useMockData() {
  const [data, setData] = useState({
    dxnPrice: 0.847,
    priceChange24h: 12.4,
    prevPrice: 0.847,
    totalDXNStaked: 842000,
    stakerMultiplier: 4,
    totalXENBurned: 1.8e12,
    globalDiscount: 16,
    epoch: 47,
    pendingBurnETH: 0.0842,
    feeCountdown: 187,
    feeInterval: 300,
    stakerTickets: 2847,
    burnerTickets: 1953,
    tixEpoch: 4800,
    totalGoldMinted: 58420,
    totalETHDistributed: 4.27,
    totalDXNBurned: 58420,
    userDXNStaked: 1250,
    userDXNFresh: 0,
    userDXNRipe: 0,
    userXENBurned: 4.2e9,
    userTickets: 42,
    userGold: 847.2,
    userAutoGold: 347.2,
    userManualGold: 500,
    userETH: 0.127,
    userWeight: 1250,
  });

  useEffect(() => {
    const iv = setInterval(() => {
      setData((d) => {
        const newPrice = d.dxnPrice + (Math.random() - 0.35) * 0.003;
        return {
          ...d,
          prevPrice: d.dxnPrice,
          dxnPrice: Math.max(0.001, newPrice),
          feeCountdown: d.feeCountdown <= 0 ? 300 : d.feeCountdown - 1,
          stakerTickets: d.stakerTickets + (Math.random() > 0.7 ? Math.floor(Math.random() * 3) : 0),
          burnerTickets: d.burnerTickets + (Math.random() > 0.6 ? Math.floor(Math.random() * 5) : 0),
        };
      });
    }, 1000);
    return () => clearInterval(iv);
  }, []);

  return data;
}

export const MOCK_FEED = [
  { addr: "0x8B15...cF4", type: "burn", batches: 500, tickets: 50, time: "12s ago" },
  { addr: "0xf39F...266", type: "stake", amount: "2,400 DXN", time: "34s ago" },
  { addr: "0xA1c2...9eB", type: "burn", batches: 2000, tickets: 200, time: "1m ago" },
  { addr: "0x7e3D...4aF", type: "bnb", eth: "0.084", dxn: "98.2", time: "2m ago" },
  { addr: "0xC9a1...b27", type: "burn", batches: 100, tickets: 10, time: "3m ago" },
  { addr: "0x2bF8...e41", type: "stake", amount: "5,000 DXN", time: "4m ago" },
  { addr: "0xD3f7...8cA", type: "burn", batches: 10000, tickets: 1000, time: "5m ago" },
  { addr: "0x91eC...3dF", type: "bnb", eth: "0.127", dxn: "148.7", time: "7m ago" },
];
'@ | Set-Content -Path "src\hooks\useMockData.js" -Encoding UTF8

# ═══════════════════════════════════════
# COMPONENTS
# ═══════════════════════════════════════

$c = "src\components"

# Header.jsx
@'
import { useEffect, useRef, useState } from "react";
import "./Header.css";

export default function Header({ data }) {
  const [flash, setFlash] = useState("");
  const prevPrice = useRef(data.dxnPrice);

  useEffect(() => {
    if (data.dxnPrice !== prevPrice.current) {
      setFlash(data.dxnPrice > prevPrice.current ? "flash-green" : "flash-red");
      const t = setTimeout(() => setFlash(""), 600);
      prevPrice.current = data.dxnPrice;
      return () => clearTimeout(t);
    }
  }, [data.dxnPrice]);

  return (
    <header className="header">
      <div className="header-left">
        <div className="logo">
          <span className="logo-icon">&#x2692;</span>
          <span className="logo-text">DXN FORGE</span>
        </div>
        <span className="chain-badge">OPTIMISM</span>
      </div>
      <div className="price-box">
        <span className="price-label">opDXN</span>
        <span className={`price-value ${flash}`}>${data.dxnPrice.toFixed(4)}</span>
        <span className="price-change" style={{ color: data.priceChange24h >= 0 ? "#00ff88" : "#ff4444" }}>
          {data.priceChange24h >= 0 ? "\u25B2" : "\u25BC"} {Math.abs(data.priceChange24h).toFixed(1)}%
        </span>
      </div>
      <button className="wallet-btn">Connect Wallet</button>
    </header>
  );
}
'@ | Set-Content -Path "$c\Header.jsx" -Encoding UTF8

# Header.css
@'
.header { display:flex; align-items:center; justify-content:space-between; padding:16px 28px; border-bottom:1px solid rgba(255,255,255,0.06); background:rgba(8,8,12,0.95); backdrop-filter:blur(12px); position:sticky; top:0; z-index:100; }
.header-left { display:flex; align-items:center; gap:14px; }
.logo { display:flex; align-items:center; gap:10px; }
.logo-icon { font-size:28px; }
.logo-text { font-size:22px; font-weight:800; letter-spacing:0.04em; background:linear-gradient(135deg,#ff9d00,#ffb700); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
.chain-badge { font-size:10px; font-weight:700; padding:3px 10px; border-radius:20px; background:rgba(255,0,0,0.12); color:#ff4444; letter-spacing:0.08em; border:1px solid rgba(255,0,0,0.2); }
.price-box { display:flex; align-items:center; gap:12px; }
.price-label { font-size:12px; color:#888; font-weight:600; letter-spacing:0.05em; }
.price-value { font-size:20px; font-weight:700; font-family:"JetBrains Mono",monospace; color:#fff; transition:color 0.3s; }
.price-change { font-size:13px; font-weight:600; font-family:"JetBrains Mono",monospace; }
.wallet-btn { padding:10px 24px; border-radius:10px; border:1px solid rgba(255,157,0,0.3); background:rgba(255,157,0,0.1); color:#ff9d00; font-weight:600; font-size:14px; cursor:pointer; font-family:"Outfit",sans-serif; transition:all 0.2s; }
.wallet-btn:hover { background:rgba(255,157,0,0.2); border-color:rgba(255,157,0,0.5); box-shadow:0 0 20px rgba(255,157,0,0.15); }
'@ | Set-Content -Path "$c\Header.css" -Encoding UTF8

# CountdownBar.jsx
@'
import { fmtTime } from "../utils/format";
import "./CountdownBar.css";

export default function CountdownBar({ data }) {
  const isReady = data.feeCountdown <= 0;
  const progress = ((data.feeInterval - data.feeCountdown) / data.feeInterval) * 100;

  return (
    <div className="countdown-bar">
      <div className="countdown-inner">
        <div className="countdown-left">
          <span className="countdown-label">NEXT BUY & BURN</span>
          <span className="countdown-time" style={{ color: isReady ? "#00ff88" : "#ff9d00" }}>
            {isReady ? "\u26A1 READY" : fmtTime(data.feeCountdown)}
          </span>
        </div>
        <div className="countdown-track">
          <div className="countdown-fill" style={{ width: `${progress}%`, background: isReady ? "linear-gradient(90deg,#00ff88,#00cc66)" : "linear-gradient(90deg,#ff9d00,#ffb700)", boxShadow: isReady ? "0 0 12px rgba(0,255,136,0.4)" : "0 0 8px rgba(255,157,0,0.3)" }} />
        </div>
        <div className="countdown-right">
          <span className="countdown-eth">{data.pendingBurnETH.toFixed(4)} ETH</span>
          <span className="countdown-sub">in burn pool</span>
        </div>
      </div>
    </div>
  );
}
'@ | Set-Content -Path "$c\CountdownBar.jsx" -Encoding UTF8

# CountdownBar.css
@'
.countdown-bar { padding:14px 28px; background:linear-gradient(180deg,rgba(255,157,0,0.04) 0%,transparent 100%); border-bottom:1px solid rgba(255,255,255,0.04); }
.countdown-inner { display:flex; align-items:center; gap:20px; max-width:900px; margin:0 auto; }
.countdown-left { display:flex; flex-direction:column; gap:2px; min-width:160px; }
.countdown-label { font-size:10px; font-weight:700; color:#888; letter-spacing:0.1em; }
.countdown-time { font-size:26px; font-weight:700; font-family:"JetBrains Mono",monospace; }
.countdown-track { flex:1; height:6px; border-radius:3px; background:rgba(255,255,255,0.06); overflow:hidden; }
.countdown-fill { height:100%; border-radius:3px; transition:width 1s linear; }
.countdown-right { display:flex; flex-direction:column; align-items:flex-end; gap:2px; min-width:120px; }
.countdown-eth { font-size:16px; font-weight:700; font-family:"JetBrains Mono",monospace; color:#fff; }
.countdown-sub { font-size:10px; color:#666; letter-spacing:0.05em; }
'@ | Set-Content -Path "$c\CountdownBar.css" -Encoding UTF8

# WarBar.jsx
@'
import "./WarBar.css";

export default function WarBar({ data }) {
  const total = data.stakerTickets + data.burnerTickets;
  const stakerPct = total > 0 ? (data.stakerTickets / total) * 100 : 50;
  const burnerPct = 100 - stakerPct;

  return (
    <div className="war-section">
      <div className="war-header">
        <span className="war-side"><span className="war-icon">&#x1F512;</span> STAKERS <span className="war-pct">{stakerPct.toFixed(1)}%</span></span>
        <span className="war-title">EPOCH {data.epoch} &mdash; TICKET SHARE</span>
        <span className="war-side"><span className="war-pct">{burnerPct.toFixed(1)}%</span> BURNERS <span className="war-icon">&#x1F525;</span></span>
      </div>
      <div className="war-bar-outer">
        <div className="war-bar-left" style={{ width: `${stakerPct}%` }}>
          <span className="war-bar-label">{data.stakerTickets.toLocaleString()} tix</span>
        </div>
        <div className="war-bar-divider" />
        <div className="war-bar-right" style={{ width: `${burnerPct}%` }}>
          <span className="war-bar-label">{data.burnerTickets.toLocaleString()} tix</span>
        </div>
      </div>
    </div>
  );
}
'@ | Set-Content -Path "$c\WarBar.jsx" -Encoding UTF8

# WarBar.css
@'
.war-section { padding:24px 28px 20px; max-width:900px; margin:0 auto; }
.war-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; }
.war-title { font-size:11px; font-weight:700; color:#666; letter-spacing:0.12em; }
.war-side { font-size:12px; font-weight:600; color:#aaa; display:flex; align-items:center; gap:6px; }
.war-pct { font-family:"JetBrains Mono",monospace; font-weight:700; color:#fff; font-size:14px; }
.war-icon { font-size:14px; }
.war-bar-outer { display:flex; height:40px; border-radius:10px; overflow:hidden; border:1px solid rgba(255,255,255,0.08); }
.war-bar-left { background:linear-gradient(90deg,rgba(255,157,0,0.2),rgba(255,183,0,0.35)); display:flex; align-items:center; justify-content:center; transition:width 1s cubic-bezier(0.4,0,0.2,1); min-width:80px; }
.war-bar-divider { width:2px; background:rgba(255,255,255,0.2); z-index:2; box-shadow:0 0 8px rgba(255,255,255,0.1); }
.war-bar-right { background:linear-gradient(90deg,rgba(220,50,50,0.35),rgba(255,102,68,0.2)); display:flex; align-items:center; justify-content:center; transition:width 1s cubic-bezier(0.4,0,0.2,1); min-width:80px; }
.war-bar-label { font-size:12px; font-weight:700; font-family:"JetBrains Mono",monospace; color:rgba(255,255,255,0.7); letter-spacing:0.03em; }
'@ | Set-Content -Path "$c\WarBar.css" -Encoding UTF8

# ProgressCards.jsx
@'
import { STAKER_TIERS, BURNER_TIERS, TOTAL_XEN_SUPPLY } from "../hooks/useMockData";
import { fmtDxn, fmtXen } from "../utils/format";
import "./ProgressCards.css";

export default function ProgressCards({ data }) {
  const si = STAKER_TIERS.findIndex((t) => data.totalDXNStaked < t.threshold);
  const ps = si > 0 ? STAKER_TIERS[si - 1].threshold : 0;
  const ns = si >= 0 ? STAKER_TIERS[si].threshold : STAKER_TIERS[STAKER_TIERS.length - 1].threshold;
  const sp = ((data.totalDXNStaked - ps) / (ns - ps)) * 100;

  const bi = BURNER_TIERS.findIndex((t) => data.totalXENBurned < t.threshold);
  const pb = bi > 0 ? BURNER_TIERS[bi - 1].threshold : 0;
  const nb = bi >= 0 ? BURNER_TIERS[bi].threshold : BURNER_TIERS[BURNER_TIERS.length - 1].threshold;
  const bp = ((data.totalXENBurned - pb) / (nb - pb)) * 100;

  return (
    <div className="dual-progress">
      <div className="progress-card staker-card">
        <div className="progress-header">
          <span className="progress-title">&#x1F512; DXN STAKED</span>
          <span className="progress-badge staker-badge">{data.stakerMultiplier}x TICKETS</span>
        </div>
        <div className="progress-big-num staker-num">{fmtDxn(data.totalDXNStaked)}</div>
        <div className="progress-sub">staked across all users</div>
        <div className="tier-track staker-track"><div className="tier-fill staker-fill" style={{ width: `${Math.min(sp, 100)}%` }} /></div>
        <div className="tier-label">{si >= 0 ? `${fmtDxn(ns - data.totalDXNStaked)} DXN to ${STAKER_TIERS[si].mult}x` : "MAX TIER REACHED"}</div>
        <div className="tier-ladder">
          {STAKER_TIERS.map((t, i) => (
            <div key={i} className={`tier-step ${data.totalDXNStaked >= t.threshold ? "reached" : ""} ${i === si ? "current" : ""}`} data-side="staker">
              <span className="tier-mult">{t.mult}x</span>
              <span className="tier-val">{t.label} DXN</span>
              {data.totalDXNStaked >= t.threshold && <span className="tier-check">&#x2713;</span>}
            </div>
          ))}
        </div>
      </div>

      <div className="progress-card burner-card">
        <div className="progress-header">
          <span className="progress-title">&#x1F525; opXEN BURNED</span>
          <span className="progress-badge burner-badge">{data.globalDiscount}% OFF</span>
        </div>
        <div className="progress-big-num burner-num">{fmtXen(data.totalXENBurned)}</div>
        <div className="progress-sub">of 60.58T supply ({((data.totalXENBurned / TOTAL_XEN_SUPPLY) * 100).toFixed(2)}% destroyed)</div>
        <div className="tier-track burner-track"><div className="tier-fill burner-fill" style={{ width: `${Math.min(bp, 100)}%` }} /></div>
        <div className="tier-label">{bi >= 0 ? `${fmtXen(nb - data.totalXENBurned)} to ${BURNER_TIERS[bi].disc}% discount` : "MAX DISCOUNT REACHED"}</div>
        <div className="tier-ladder">
          {BURNER_TIERS.map((t, i) => (
            <div key={i} className={`tier-step ${data.totalXENBurned >= t.threshold ? "reached" : ""} ${i === bi ? "current" : ""}`} data-side="burner">
              <span className="tier-mult">{t.disc}%</span>
              <span className="tier-val">{t.label} XEN</span>
              {data.totalXENBurned >= t.threshold && <span className="tier-check">&#x2713;</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
'@ | Set-Content -Path "$c\ProgressCards.jsx" -Encoding UTF8

# ProgressCards.css
@'
.dual-progress { display:grid; grid-template-columns:1fr 1fr; gap:20px; padding:0 28px 20px; max-width:900px; margin:0 auto; }
.progress-card { background:rgba(255,255,255,0.02); border-radius:14px; padding:20px 22px; }
.staker-card { border:1px solid rgba(255,157,0,0.15); }
.burner-card { border:1px solid rgba(220,50,50,0.2); }
.progress-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; }
.progress-title { font-size:12px; font-weight:700; color:#aaa; letter-spacing:0.08em; }
.progress-badge { font-size:12px; font-weight:700; padding:3px 12px; border-radius:20px; font-family:"JetBrains Mono",monospace; }
.staker-badge { background:rgba(255,157,0,0.15); color:#ffb700; }
.burner-badge { background:rgba(220,50,50,0.15); color:#ff6644; }
.progress-big-num { font-size:32px; font-weight:800; font-family:"JetBrains Mono",monospace; line-height:1.1; }
.staker-num { color:#ff9d00; }
.burner-num { color:#ff6644; }
.progress-sub { font-size:12px; color:#666; margin-bottom:14px; }
.tier-track { height:5px; border-radius:3px; overflow:hidden; margin-bottom:6px; }
.staker-track { background:rgba(255,157,0,0.1); }
.burner-track { background:rgba(220,50,50,0.1); }
.tier-fill { height:100%; border-radius:3px; transition:width 0.5s ease; }
.staker-fill { background:linear-gradient(90deg,#ff9d00,#ffb700); }
.burner-fill { background:linear-gradient(90deg,#ff4444,#ff6644); }
.tier-label { font-size:11px; color:#888; margin-bottom:14px; }
.tier-ladder { display:flex; flex-direction:column; gap:4px; }
.tier-step { display:flex; align-items:center; padding:7px 12px; border-radius:8px; border:1px solid rgba(255,255,255,0.06); background:rgba(255,255,255,0.02); transition:all 0.3s; }
.tier-step.reached[data-side="staker"] { background:linear-gradient(135deg,rgba(255,157,0,0.3),rgba(255,183,0,0.15)); border-color:#ff9d00; box-shadow:0 0 12px rgba(255,157,0,0.15); }
.tier-step.current[data-side="staker"] { background:rgba(255,157,0,0.08); border-color:rgba(255,157,0,0.3); }
.tier-step.reached[data-side="burner"] { background:linear-gradient(135deg,rgba(220,50,50,0.25),rgba(255,102,68,0.12)); border-color:#ff4444; box-shadow:0 0 12px rgba(255,50,50,0.12); }
.tier-step.current[data-side="burner"] { background:rgba(220,50,50,0.06); border-color:rgba(220,50,50,0.25); }
.tier-mult { font-size:14px; font-weight:700; font-family:"JetBrains Mono",monospace; width:48px; color:#555; }
.tier-step.reached[data-side="staker"] .tier-mult { color:#ffb700; }
.tier-step.current[data-side="staker"] .tier-mult { color:#ff9d00; }
.tier-step.reached[data-side="burner"] .tier-mult { color:#ff6644; }
.tier-step.current[data-side="burner"] .tier-mult { color:#ff4444; }
.tier-val { font-size:12px; font-weight:500; flex:1; color:#555; }
.tier-step.reached .tier-val { color:#ddd; }
.tier-check { font-size:13px; font-weight:700; }
.tier-step[data-side="staker"] .tier-check { color:#ff9d00; }
.tier-step[data-side="burner"] .tier-check { color:#ff4444; }
'@ | Set-Content -Path "$c\ProgressCards.css" -Encoding UTF8

# ActionZone.jsx
@'
import { useState } from "react";
import { fmtXen, fmtDxn } from "../utils/format";
import "./ActionZone.css";

export default function ActionZone({ data }) {
  const [tab, setTab] = useState("burn");
  const [batches, setBatches] = useState(100);
  const [stakeAmt, setStakeAmt] = useState("");
  const batchDisc = Math.min(Math.floor(batches / 2), 50);
  const totalDisc = Math.min(batchDisc + data.globalDiscount, 50);
  const ethFee = 0.000012 * batches * (1 - totalDisc / 100);
  const ticketsEarned = batches / 10000;

  return (
    <div className="action-zone">
      <div className="tabs">
        <button onClick={() => setTab("burn")} className={`tab ${tab === "burn" ? "tab-burn-active" : ""}`}>&#x1F525; BURN XEN</button>
        <button onClick={() => setTab("stake")} className={`tab ${tab === "stake" ? "tab-stake-active" : ""}`}>&#x1F512; STAKE DXN</button>
      </div>
      <div className="action-card">
        {tab === "burn" ? (
          <>
            <div className="action-title">Burn opXEN for Tickets</div>
            <div className="action-desc">Every batch burned = tickets toward GOLD. The more the community burns, the cheaper it gets for everyone.</div>
            <div className="input-group">
              <label className="input-label">BATCHES (2.5M XEN each)</label>
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
            <div className="fee-breakdown">
              <div className="fee-row"><span>XEN to burn</span><span className="fee-val burn-color">{fmtXen(batches * 2.5e6)}</span></div>
              <div className="fee-row"><span>Batch discount</span><span className="fee-val green-color">-{batchDisc}%</span></div>
              <div className="fee-row"><span>Community discount</span><span className="fee-val green-color">-{data.globalDiscount}%</span></div>
              <div className="fee-divider" />
              <div className="fee-row"><span className="fee-total-label">Total discount</span><span className="fee-val green-color fee-total">-{totalDisc}%</span></div>
              <div className="fee-row"><span className="fee-total-label">ETH Fee</span><span className="fee-val white fee-total">{ethFee.toFixed(6)} ETH</span></div>
              <div className="fee-divider" />
              <div className="fee-row"><span>Tickets earned</span><span className="fee-val gold-color fee-total">+{ticketsEarned.toFixed(4)} tickets</span></div>
            </div>
            <button className="action-btn burn-btn">&#x1F525; BURN {fmtXen(batches * 2.5e6)} XEN</button>
          </>
        ) : (
          <>
            <div className="action-title">Stake DXN for Multiplied Tickets</div>
            <div className="action-desc">Every fee claim gives stakers tickets multiplied by the community tier. More DXN staked = higher multiplier for everyone.</div>
            <div className="input-group">
              <label className="input-label">AMOUNT TO STAKE</label>
              <div className="input-row">
                <input type="text" placeholder="0.00 DXN" value={stakeAmt} onChange={(e) => setStakeAmt(e.target.value)} className="text-input" />
                <button className="max-btn">MAX</button>
              </div>
            </div>
            <div className="fee-breakdown">
              <div className="fee-row"><span>Your staked</span><span className="fee-val">{fmtDxn(data.userDXNStaked)} DXN</span></div>
              <div className="fee-row"><span>Current multiplier</span><span className="fee-val gold-color fee-total">{data.stakerMultiplier}x tickets</span></div>
              <div className="fee-divider" />
              <div className="fee-row"><span>Your GOLD (auto)</span><span className="fee-val gold-color">{data.userAutoGold.toFixed(2)}</span></div>
              <div className="fee-row"><span>Your GOLD (manual)</span><span className="fee-val gold-color">{data.userManualGold.toFixed(2)}</span></div>
              <div className="fee-row"><span>Your ETH earned</span><span className="fee-val green-color">{data.userETH.toFixed(4)} ETH</span></div>
            </div>
            <button className="action-btn stake-btn">&#x1F512; STAKE DXN</button>
            <div className="secondary-row">
              <button className="secondary-btn">Claim GOLD + ETH</button>
              <button className="secondary-btn">Unstake</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
'@ | Set-Content -Path "$c\ActionZone.jsx" -Encoding UTF8

# ActionZone.css
@'
.action-zone { padding:0 28px 20px; max-width:900px; margin:0 auto; }
.tabs { display:flex; gap:8px; margin-bottom:16px; }
.tab { flex:1; padding:12px 20px; border-radius:10px; border:1px solid rgba(255,255,255,0.1); background:transparent; color:#888; font-size:14px; font-weight:700; cursor:pointer; font-family:"Outfit",sans-serif; letter-spacing:0.04em; transition:all 0.2s; }
.tab:hover { background:rgba(255,255,255,0.04); }
.tab-burn-active { background:linear-gradient(135deg,#ff4444,#ff6644)!important; color:#fff!important; border-color:#ff4444!important; box-shadow:0 4px 20px rgba(255,68,68,0.2); }
.tab-stake-active { background:linear-gradient(135deg,#ff9d00,#ffb700)!important; color:#000!important; border-color:#ff9d00!important; box-shadow:0 4px 20px rgba(255,157,0,0.2); }
.action-card { background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.08); border-radius:14px; padding:24px; }
.action-title { font-size:18px; font-weight:700; color:#fff; margin-bottom:6px; }
.action-desc { font-size:13px; color:#888; margin-bottom:20px; line-height:1.5; }
.input-group { margin-bottom:18px; }
.input-label { font-size:11px; color:#888; font-weight:600; margin-bottom:10px; display:block; letter-spacing:0.06em; }
.input-row { display:flex; align-items:center; gap:10px; }
.slider { -webkit-appearance:none; appearance:none; height:6px; border-radius:3px; outline:none; flex:1; }
.burn-slider { background:linear-gradient(90deg,#ff4444 0%,#ff6644 100%); }
.slider::-webkit-slider-thumb { -webkit-appearance:none; appearance:none; width:22px; height:22px; border-radius:50%; background:#fff; border:3px solid #ff4444; cursor:pointer; box-shadow:0 0 10px rgba(255,68,68,0.3); transition:transform 0.15s; }
.slider::-webkit-slider-thumb:hover { transform:scale(1.15); }
.num-input { width:90px; padding:10px 12px; background:rgba(0,0,0,0.4); border:1px solid rgba(255,255,255,0.12); border-radius:8px; color:#fff; font-family:"JetBrains Mono",monospace; font-size:14px; font-weight:600; text-align:center; outline:none; }
.num-input:focus { border-color:rgba(255,68,68,0.5); }
.text-input { flex:1; padding:12px 14px; background:rgba(0,0,0,0.4); border:1px solid rgba(255,255,255,0.12); border-radius:8px; color:#fff; font-family:"JetBrains Mono",monospace; font-size:16px; font-weight:500; outline:none; }
.text-input:focus { border-color:rgba(255,157,0,0.5); }
.max-btn { padding:12px 18px; background:rgba(255,157,0,0.1); border:1px solid rgba(255,157,0,0.25); border-radius:8px; color:#ff9d00; font-weight:700; font-size:12px; cursor:pointer; letter-spacing:0.06em; font-family:"Outfit",sans-serif; transition:all 0.2s; }
.max-btn:hover { background:rgba(255,157,0,0.2); border-color:rgba(255,157,0,0.5); }
.batch-presets { display:flex; gap:6px; margin-top:10px; }
.preset-btn { padding:6px 14px; border-radius:6px; border:1px solid rgba(255,255,255,0.08); background:rgba(255,255,255,0.03); color:#888; font-size:12px; font-weight:600; cursor:pointer; font-family:"JetBrains Mono",monospace; transition:all 0.15s; }
.preset-btn:hover { background:rgba(255,68,68,0.1); border-color:rgba(255,68,68,0.3); color:#ff6644; }
.preset-active { background:rgba(255,68,68,0.15)!important; border-color:#ff4444!important; color:#ff6644!important; }
.fee-breakdown { background:rgba(0,0,0,0.3); border-radius:10px; padding:14px 16px; margin-bottom:18px; }
.fee-row { display:flex; justify-content:space-between; padding:5px 0; font-size:13px; color:#aaa; }
.fee-val { font-family:"JetBrains Mono",monospace; }
.fee-total-label { font-weight:700; }
.fee-total { font-weight:700; }
.burn-color { color:#ff6644; }
.green-color { color:#00ff88; }
.gold-color { color:#ffb700; }
.white { color:#fff; }
.fee-divider { height:1px; background:rgba(255,255,255,0.06); margin:6px 0; }
.action-btn { width:100%; padding:16px; border-radius:10px; border:none; font-size:15px; font-weight:700; cursor:pointer; font-family:"Outfit",sans-serif; letter-spacing:0.03em; transition:all 0.2s; }
.burn-btn { background:linear-gradient(135deg,#ff4444,#ff6644); color:#fff; box-shadow:0 4px 20px rgba(255,68,68,0.25); }
.burn-btn:hover { transform:translateY(-2px); box-shadow:0 8px 30px rgba(255,68,68,0.35); }
.stake-btn { background:linear-gradient(135deg,#ff9d00,#ffb700); color:#000; box-shadow:0 4px 20px rgba(255,157,0,0.25); }
.stake-btn:hover { transform:translateY(-2px); box-shadow:0 8px 30px rgba(255,157,0,0.35); }
.secondary-row { display:flex; gap:8px; margin-top:10px; }
.secondary-btn { flex:1; padding:10px; border-radius:8px; border:1px solid rgba(255,255,255,0.12); background:rgba(255,255,255,0.04); color:#aaa; font-size:13px; font-weight:600; cursor:pointer; font-family:"Outfit",sans-serif; transition:all 0.2s; }
.secondary-btn:hover { background:rgba(255,255,255,0.08); border-color:rgba(255,255,255,0.2); color:#fff; }
'@ | Set-Content -Path "$c\ActionZone.css" -Encoding UTF8

# LiveFeed.jsx
@'
import { MOCK_FEED } from "../hooks/useMockData";
import "./LiveFeed.css";

export default function LiveFeed() {
  return (
    <div className="feed-wrapper">
      <div className="feed-card">
        <div className="feed-title"><span className="live-dot" /> LIVE ACTIVITY</div>
        <div className="feed-list">
          {MOCK_FEED.map((f, i) => (
            <div key={i} className="feed-item">
              <span className="feed-icon">{f.type === "burn" ? "\uD83D\uDD25" : f.type === "stake" ? "\uD83D\uDD12" : "\uD83D\uDCA5"}</span>
              <div className="feed-content">
                <span className="feed-addr">{f.addr}</span>
                {f.type === "burn" && <span className="feed-text">burned <strong className="burn-color">{f.batches.toLocaleString()}</strong> batches &rarr; <strong className="gold-color">{f.tickets}</strong> tickets</span>}
                {f.type === "stake" && <span className="feed-text">staked <strong className="gold-color">{f.amount}</strong></span>}
                {f.type === "bnb" && <span className="feed-text">B&B fired: <strong className="green-color">{f.eth} ETH</strong> &rarr; <strong className="burn-color">{f.dxn} DXN</strong> burned</span>}
              </div>
              <span className="feed-time">{f.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
'@ | Set-Content -Path "$c\LiveFeed.jsx" -Encoding UTF8

# LiveFeed.css
@'
.feed-wrapper { padding:0 28px 20px; max-width:900px; margin:0 auto; }
.feed-card { background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.08); border-radius:14px; padding:18px 20px; }
.feed-title { font-size:12px; font-weight:700; color:#888; letter-spacing:0.1em; margin-bottom:14px; display:flex; align-items:center; gap:8px; }
.live-dot { width:7px; height:7px; border-radius:50%; background:#00ff88; animation:pulse 1.5s infinite; box-shadow:0 0 6px rgba(0,255,136,0.5); }
.feed-list { display:flex; flex-direction:column; gap:2px; }
.feed-item { display:flex; align-items:flex-start; gap:10px; padding:9px 8px; border-radius:8px; transition:background 0.2s; }
.feed-item:hover { background:rgba(255,255,255,0.02); }
.feed-icon { font-size:14px; margin-top:2px; }
.feed-content { flex:1; display:flex; flex-direction:column; gap:2px; }
.feed-addr { font-size:11px; color:#666; font-family:"JetBrains Mono",monospace; }
.feed-text { font-size:12px; color:#aaa; line-height:1.4; }
.feed-time { font-size:10px; color:#555; font-family:"JetBrains Mono",monospace; white-space:nowrap; margin-top:2px; }
'@ | Set-Content -Path "$c\LiveFeed.css" -Encoding UTF8

# StatsRow.jsx
@'
import { fmtDxn, fmtXen } from "../utils/format";
import { TOTAL_XEN_SUPPLY } from "../hooks/useMockData";
import "./StatsRow.css";

export default function StatsRow({ data }) {
  return (
    <div className="stats-row">
      <div className="stat-box"><div className="stat-label">TOTAL DXN BURNED</div><div className="stat-value">{fmtDxn(data.totalDXNBurned)}</div><div className="stat-sub">via Buy & Burn</div></div>
      <div className="stat-box"><div className="stat-label">GOLD MINTED</div><div className="stat-value gold-color">{fmtDxn(data.totalGoldMinted)}</div><div className="stat-sub">1:1 with DXN burned</div></div>
      <div className="stat-box"><div className="stat-label">ETH DISTRIBUTED</div><div className="stat-value green-color">{data.totalETHDistributed.toFixed(2)} ETH</div><div className="stat-sub">to GOLD holders</div></div>
      <div className="stat-box"><div className="stat-label">opXEN DESTROYED</div><div className="stat-value burn-color">{fmtXen(data.totalXENBurned)}</div><div className="stat-sub">{((data.totalXENBurned / TOTAL_XEN_SUPPLY) * 100).toFixed(2)}% of supply</div></div>
    </div>
  );
}
'@ | Set-Content -Path "$c\StatsRow.jsx" -Encoding UTF8

# StatsRow.css
@'
.stats-row { display:grid; grid-template-columns:repeat(4,1fr); gap:16px; padding:0 28px; max-width:900px; margin:0 auto; }
.stat-box { background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.06); border-radius:12px; padding:16px; text-align:center; }
.stat-label { font-size:10px; font-weight:700; color:#666; letter-spacing:0.1em; margin-bottom:6px; }
.stat-value { font-size:20px; font-weight:700; font-family:"JetBrains Mono",monospace; color:#fff; }
.stat-sub { font-size:11px; color:#555; margin-top:4px; }
'@ | Set-Content -Path "$c\StatsRow.css" -Encoding UTF8

Write-Host ""
Write-Host "ALL FILES CREATED SUCCESSFULLY" -ForegroundColor Green
Write-Host "Files created:" -ForegroundColor Cyan
Write-Host "  src/main.jsx"
Write-Host "  src/App.jsx"
Write-Host "  src/App.css"
Write-Host "  src/index.css"
Write-Host "  src/utils/format.js"
Write-Host "  src/hooks/useMockData.js"
Write-Host "  src/components/Header.jsx + .css"
Write-Host "  src/components/CountdownBar.jsx + .css"
Write-Host "  src/components/WarBar.jsx + .css"
Write-Host "  src/components/ProgressCards.jsx + .css"
Write-Host "  src/components/ActionZone.jsx + .css"
Write-Host "  src/components/LiveFeed.jsx + .css"
Write-Host "  src/components/StatsRow.jsx + .css"
Write-Host ""
Write-Host "Now run: npm run dev" -ForegroundColor Yellow