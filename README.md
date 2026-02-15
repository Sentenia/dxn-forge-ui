# 🔥 DXN Forge

**Burn. Stake. Mint.**

DXN Forge is a DeFi protocol where users burn XEN to earn tickets, stake DXN to earn GOLD tokens and ETH dividends, and compete in a staker-vs-burner ticket allocation game.

## 🌐 Live App

**[dxnforge.com](https://www.dxnforge.com)** — Currently on Sepolia testnet

## How It Works

### Burn XEN → Earn Tickets
Burn XEN tokens to earn burner tickets. Each 10,000 batches burned = 1 ticket. A community discount grows quadratically as more XEN is burned (up to 45% off fees).

### Stake DXN → Earn Multiplied Tickets + GOLD
Stake DXN to earn staker tickets with a multiplier (1x–10x based on % of DXN supply staked). Staking auto-mints GOLD tokens proportional to your weight.

### GOLD → ETH Dividends
Stake GOLD to earn ETH dividends from protocol fees. 88% of all XEN burn fees flow to GOLD stakers.

### Buy & Burn
Protocol ETH is swapped for DXN via Uniswap V3, creating buy pressure. Equivalent GOLD is minted.

## Testnet (Sepolia)

Connect MetaMask on Sepolia and use the faucet buttons to get test tokens:
- **Get DXN** — 10,000 DXN per claim (24h cooldown)
- **Get XEN** — 1 trillion XEN per claim (24h cooldown)
- **Get Sepolia ETH** — redirects to Google's Sepolia faucet

### Contract Addresses (Sepolia)
| Contract | Address |
|----------|---------|
| DXNForge | `0xCEb8775E050c0E66B6860854728943e3a415859C` |
| DXN | `0x7276c4Ce66d472d2Bd23C06A3d4c34790111720A` |
| XEN | `0xC63b6E79f952E086bFF4Fe8018062427616AdCd7` |
| GOLD | `0x59416D0C2Fee58ce67c33a64B43159f1736b6809` |

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
export SEPOLIA_RPC="https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY"
export DEPLOYER_PK="your_private_key"
npx hardhat run test/deploy-sepolia.cjs --network sepolia --config hardhat.config.cjs
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
- **Hosting:** Vercel

## Multi-Chain Support
DXN Forge is designed for multi-chain deployment with dynamic token naming:

| Chain | DXN | XEN | Gas |
|-------|-----|-----|-----|
| Ethereum | DXN | XEN | ETH |
| Optimism | opDXN | opXEN | ETH |
| Base | cbDXN | cbXEN | ETH |
| Polygon | mDXN | mXEN | POL |

## License
MIT