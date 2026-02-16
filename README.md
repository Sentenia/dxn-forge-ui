# 🔥 DXN Forge

**Burn. Stake. Mint.**

DXN Forge is a DeFi protocol where users burn XEN to earn tickets, stake DXN to earn GOLD tokens and ETH dividends, and compete in a staker-vs-burner ticket allocation game.

## 🌐 Live App

**[dxnforge.com](https://www.dxnforge.com)** — Currently on Sepolia testnet

## How It Works

### The Forge Cycle

```
Burn XEN ──→ Earn Burner Tickets ──┐
                                    ├──→ GOLD Distribution (per epoch)
Stake DXN ──→ Earn Staker Tickets ─┘
                                         │
                                         ▼
                              GOLD auto-staked
                                         │
                                         ▼
                              Earn ETH Dividends
```

### Burn XEN → Earn Tickets
Burn XEN tokens to earn burner tickets. Each 10,000 batches burned = 1 ticket. A community discount grows quadratically as more XEN is burned (up to 45% off fees).

### Stake DXN → Earn Multiplied Tickets
Stake DXN to earn staker tickets with a multiplier (1x–10x based on % of DXN supply staked). Stakers and burners compete for GOLD allocation each epoch — the WarBar shows the live split.

### GOLD → ETH Dividends
GOLD is automatically staked when earned. Staked GOLD earns ETH dividends from protocol fees. 88% of all XEN burn fees flow to GOLD stakers.

### Buy & Burn
Every fee cycle, protocol ETH is swapped for DXN via Uniswap V3 and burned permanently. Equivalent GOLD is minted and distributed to ticket holders. Anyone can trigger Buy & Burn — one click, one transaction.

## Features

- **Three-panel dashboard** — Left nav with protocol guides, center dashboard, right contextual explainers
- **Live DXN price** — Read directly from Uniswap V3 pool with price change indicator
- **Real-time activity feed** — See burns, stakes, and B&B events as they happen
- **Contextual help** — Click any `?` icon for an explanation with your live stats
- **Multi-chain ready** — Ethereum, Optimism, Base, Polygon, Avalanche, BNB Chain, PulseChain
- **Mobile responsive** — Full functionality on mobile with slide-over panels
- **Single-click B&B** — Atomic claimAndBurn in one transaction

## Testnet (Sepolia)

Connect your wallet on Sepolia and use the faucet buttons to get test tokens:
- **Get DXN** — 10,000 DXN per claim (24h cooldown)
- **Get XEN** — 1 trillion XEN per claim (24h cooldown)
- **Get Sepolia ETH** — Links to Google's Sepolia faucet

### Contract Addresses (Sepolia)
| Contract | Address |
|----------|---------|
| DXNForge | `0x92fcaBF97dF2F916DAa11877e1dbB04809f68C84` |
| DXN      | `0x7276c4Ce66d472d2Bd23C06A3d4c34790111720A` |
| XEN      | `0xC63b6E79f952E086bFF4Fe8018062427616AdCd7` |
| GOLD     | `0x59416D0C2Fee58ce67c33a64B43159f1736b6809` |
| DBXEN    | `0x2E9a6ecC99d9259b7EDc5325799CeA0B385D1162` |

## Development

### Prerequisites
- Node.js 18+
- MetaMask or compatible wallet

### Setup
```bash
npm install
```

### Local Development
```bash
# Terminal 1 — Hardhat node
npx hardhat node --config hardhat.config.cjs

# Terminal 2 — Vite dev server
npm run dev

# Terminal 3 — Deploy mocks
npx hardhat run test/deploy-local.cjs --network localhost --config hardhat.config.cjs
```

### Deploy to Sepolia
```bash
# Set env vars (PowerShell)
$env:DEPLOYER_PK="your_private_key"
$env:SEPOLIA_RPC="https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY"

# Full deploy (all contracts)
npx hardhat run test/deploy-sepolia.cjs --network sepolia --config hardhat.config.cjs

# Forge-only redeploy (preserves tokens and LP)
npx hardhat run test/redeploy-forge-sepolia.cjs --network sepolia --config hardhat.config.cjs
```

### Environment Variables
```
VITE_SEPOLIA_RPC=       # Alchemy Sepolia RPC URL
VITE_REOWN_PROJECT_ID=  # Reown (WalletConnect) project ID
```

## Tech Stack
- **Frontend:** React + Vite
- **Contracts:** Solidity 0.8.26 + Hardhat
- **Wallet:** Reown AppKit (WalletConnect v2)
- **Chain:** ethers.js v6
- **DEX:** Uniswap V3 (SwapRouter02)
- **Hosting:** Vercel

## Multi-Chain Roadmap

DXN Forge is designed for multi-chain deployment with dynamic token naming:

| Chain | DXN | XEN | Gas | Status |
|-------|-----|-----|-----|--------|
| Ethereum | DXN | XEN | ETH | Coming Soon |
| Sepolia | DXN | XEN | ETH | ✅ Live |
| Optimism | opDXN | opXEN | ETH | Coming Soon |
| Base | cbDXN | cbXEN | ETH | Coming Soon |
| Polygon | mDXN | mXEN | POL | Coming Soon |
| Avalanche | aDXN | aXEN | AVAX | Coming Soon |
| BNB Chain | bDXN | bXEN | BNB | Coming Soon |
| PulseChain | pDXN | pXEN | PLS | Coming Soon |

## Protocol Parameters

| Parameter | Value |
|-----------|-------|
| Fee split to GOLD stakers | 88% |
| Fee split to Buy & Burn | 8.88% |
| Fee split to LTS reserve | 3.12% |
| Multiplier range | 1.0x – 10.0x |
| Max community discount | 45% |
| Burn tickets per 10K batches | 1 |
| DXN staking lock period | 3 cycles |

## License
MIT