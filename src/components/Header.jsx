import { useEffect, useRef, useState } from "react";
import { Hammer, ChevronDown, Wallet, Copy, ExternalLink } from "lucide-react";
import { CHAINS } from "../config/chains";
import "./Header.css";

const CHAIN_LIST = Object.entries(CHAINS)
  .filter(([, c]) => c.rpc)
  .map(([id, c]) => ({ id: Number(id), name: c.name, short: c.short, color: c.color || "#888" }));

function fmt(n, decimals = 2) {
  if (n >= 1e12) return (n / 1e12).toFixed(1) + "T";
  if (n >= 1e9) return (n / 1e9).toFixed(1) + "B";
  if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(1) + "K";
  return n.toFixed(decimals);
}

export default function Header({ data, wallet, actions }) {
  const [flash, setFlash] = useState("");
  const [chainOpen, setChainOpen] = useState(false);
  const [walletOpen, setWalletOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const chainRef = useRef(null);
  const walletRef = useRef(null);
  const prevPrice = useRef(data?.dxnPrice);

  const currentChain = CHAIN_LIST.find((c) => c.id === wallet.chainId) || CHAIN_LIST[0];

  const ethBal = data?.userETHWallet ?? 0;
  const dxnBal = data?.userDXNWallet ?? 0;
  const xenBal = data?.userXENWallet ?? 0;
  const goldBal = data?.userGoldWallet ?? 0;

  useEffect(() => {
    if (data?.dxnPrice !== prevPrice.current) {
      setFlash(data?.dxnPrice > prevPrice.current ? "flash-green" : "flash-red");
      const t = setTimeout(() => setFlash(""), 600);
      prevPrice.current = data?.dxnPrice;
      return () => clearTimeout(t);
    }
  }, [data?.dxnPrice]);

  useEffect(() => {
    const handler = (e) => {
      if (chainRef.current && !chainRef.current.contains(e.target)) setChainOpen(false);
      if (walletRef.current && !walletRef.current.contains(e.target)) setWalletOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const copyAddress = () => {
    navigator.clipboard.writeText(wallet.account);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const shortAddr = wallet.account
    ? `${wallet.account.slice(0, 6)}...${wallet.account.slice(-4)}`
    : "";

  return (
    <>
    <header className="header">
      <div className="header-left">
        <div className="logo">
          <Hammer size={26} color="#ff9d00" />
          <span className="logo-text">DXN FORGE</span>
        </div>
      </div>
      <div className="price-box">
        <span className="price-label">{wallet.chain?.dxnName || "DXN"}</span>
        <span className={`price-value ${flash}`}>${(data?.dxnPrice ?? 0).toFixed(4)}</span>
        <span className="price-change" style={{ color: (data?.priceChange24h ?? 0) >= 0 ? "#00ff88" : "#ff4444" }}>
          {(data?.priceChange24h ?? 0) >= 0 ? "\u25B2" : "\u25BC"} {Math.abs(data?.priceChange24h ?? 0).toFixed(1)}%
        </span>
      </div>
      <div className="header-right">
        <div className="chain-selector" ref={chainRef}>
          <button className="chain-btn" onClick={() => setChainOpen(!chainOpen)}>
            <span className="chain-dot" style={{ background: currentChain.color }} />
            <span className="chain-name">{currentChain.short}</span>
            <ChevronDown size={14} style={{ transition: "transform 0.2s", transform: chainOpen ? "rotate(180deg)" : "rotate(0)" }} />
          </button>
          {chainOpen && (
            <div className="chain-dropdown">
              {CHAIN_LIST.map((c) => (
                <button
                  key={c.id}
                  className={`chain-option ${c.id === currentChain.id ? "chain-active" : ""}`}
                  onClick={() => { wallet.switchChain(c.id); setChainOpen(false); }}
                >
                  <span className="chain-dot" style={{ background: c.color }} />
                  <span>{c.name}</span>
                  <span className="chain-short">{c.short}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {wallet.account ? (
          <div className="wallet-area" ref={walletRef}>
            <button className="wallet-btn wallet-connected" onClick={() => setWalletOpen(!walletOpen)}>
              <span className="wallet-eth">{ethBal.toFixed(2)} {wallet.chain?.gasName || "ETH"}</span>
              <span className="wallet-divider" />
              <span className="wallet-addr">{shortAddr}</span>
              <ChevronDown size={14} style={{ transition: "transform 0.2s", transform: walletOpen ? "rotate(180deg)" : "rotate(0)" }} />
            </button>
            {walletOpen && (
              <div className="wallet-dropdown">
                <div className="wallet-dd-header">
                  <span className="wallet-dd-addr">{shortAddr}</span>
                  <div className="wallet-dd-actions">
                    <button className="wallet-dd-icon" onClick={copyAddress} title="Copy address">
                      <Copy size={14} />
                      {copied && <span className="copied-tip">Copied!</span>}
                    </button>
                    {wallet.chain?.explorer && (
                      <a
                        className="wallet-dd-icon"
                        href={`${wallet.chain.explorer}/address/${wallet.account}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="View on explorer"
                      >
                        <ExternalLink size={14} />
                      </a>
                    )}
                  </div>
                </div>
                <div className="wallet-dd-balances">
                  <div className="wallet-dd-row">
                    <span className="wallet-dd-token">
                      <span className="token-dot" style={{ background: "#ff9d00" }} />
                      {wallet.chain?.dxnName || "DXN"}
                    </span>
                    <span className="wallet-dd-val">{fmt(dxnBal)}</span>
                  </div>
                  <div className="wallet-dd-row">
                    <span className="wallet-dd-token">
                      <span className="token-dot" style={{ background: "#ffd700" }} />
                      GOLD
                    </span>
                    <span className="wallet-dd-val">{fmt(goldBal)}</span>
                  </div>
                  <div className="wallet-dd-row">
                    <span className="wallet-dd-token">
                      <span className="token-dot" style={{ background: "#00d4ff" }} />
                      {wallet.chain?.xenName || "XEN"}
                    </span>
                    <span className="wallet-dd-val">{fmt(xenBal)}</span>
                  </div>
                </div>
                <div className="wallet-dd-staked">
                  <div className="wallet-dd-row wallet-dd-sub">
                    <span>{wallet.chain?.dxnName || "DXN"} Staked</span>
                    <span>{fmt(data?.userDXNStaked ?? 0)}</span>
                  </div>
                  <div className="wallet-dd-row wallet-dd-sub">
                    <span>Auto GOLD</span>
                    <span>{fmt(data?.userAutoGold ?? 0)}</span>
                  </div>
                  <div className="wallet-dd-row wallet-dd-sub">
                    <span>Claimable {wallet.chain?.gasName || "ETH"}</span>
                    <span>{(data?.userClaimableETH ?? 0).toFixed(4)}</span>
                  </div>
                  <div className="wallet-dd-row wallet-dd-sub">
                    <span>Tickets</span>
                    <span>{fmt(data?.userTickets ?? 0)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <button className="wallet-btn" onClick={wallet.connect}>
            <Wallet size={16} />
            Connect Wallet
          </button>
        )}
      </div>
    </header>
    {(wallet.chainId === 11155111 || wallet.chainId === 31337) && (
      <div className="testnet-bar">
        <span className="testnet-label">TESTNET</span>
        <button className="faucet-btn" onClick={actions?.faucetDXN}>Get {wallet.chain?.dxnName || "DXN"}</button>
        <button className="faucet-btn" onClick={actions?.faucetXEN}>Get {wallet.chain?.xenName || "XEN"}</button>
        <a className="faucet-btn faucet-link" href="https://cloud.google.com/application/web3/faucet/ethereum/sepolia" target="_blank" rel="noopener noreferrer">Get Sepolia ETH</a>
      </div>
    )}
  </>
  );
}