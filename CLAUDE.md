# DXN Forge — Claude Code Context

## What This Project Is
DXN Forge is a DeFi staking protocol on Ethereum. Users burn XEN to earn tickets, stake DXN to earn GOLD tokens + ETH dividends, and compete in a staker-vs-burner ticket allocation game. The frontend is a React/Vite app connected to Solidity smart contracts.

## Tech Stack
- **Frontend:** React + Vite (no TypeScript)
- **Contracts:** Solidity 0.8.26, compiled with Hardhat
- **Wallet:** Reown AppKit (WalletConnect v2)
- **Chain Reads:** ethers.js v6 JsonRpcProvider
- **Hosting:** Vercel (auto-deploys from GitHub on push)
- **Domain:** www.dxnforge.com

## Project Structure
```
contracts/
  DXNForge.sol        — Main protocol contract (merged architecture, no separate XenBurner)
  Mocks.sol           — MockERC20 (DXN), MockXEN, MockGOLD, MockDBXEN, MockRouter, MockWETH
                        MockERC20 and MockXEN have faucet() functions (24h cooldown, transfer from pool)

src/
  App.jsx             — Root component, three-panel layout, wires wallet/data/actions
  App.css             — CSS grid layout (auto 1fr auto), responsive breakpoints
  components/
    Header.jsx        — Logo, DXN price (live from Uniswap V3 pool), chain selector, wallet, faucet bar, hamburger menu (mobile)
    Header.css
    CountdownBar.jsx  — Next Buy & Burn countdown (local JS timer, no RPC), ETH breakdown, ? icon
    CountdownBar.css
    WarBar.jsx        — Staker vs Burner ticket war bar with projected staker tickets, ? icon
    WarBar.css
    ProgressCards.jsx  — DXN Staked % and XEN Burned % with multiplier/discount badges, ? icons
    ProgressCards.css
    ActionZone.jsx    — Tabbed interface: Burn XEN, Stake DXN, Stake GOLD with all actions, ? icon
    ActionZone.css
    CollapsibleNav.jsx — Left panel nav: FORGE, EARN, LEARN sections with sub-items
    CollapsibleNav.css
    ContextPanel.jsx  — Right panel explainer with live data integration and "Got it" button
    ContextPanel.css
    LiveFeed.jsx      — Real-time contract event feed (accumulates across polls, capped at 10)
    LiveFeed.css
    StatsRow.jsx      — Bottom stats: DXN Supply, GOLD Minted, ETH Distributed, XEN Supply
    StatsRow.css
  config/
    abi.js            — FORGE_ABI, ERC20_ABI, FAUCET_ABI, POOL_ABI, FACTORY_ABI
    appkit.js         — Reown AppKit config (metadata url: www.dxnforge.com, default: sepolia)
    chains.js         — Chain configs (addresses, RPC, token names) + DEFAULT_CHAIN = 11155111
    explainers.js     — All explainer content for left nav / right panel
  hooks/
    useForgeData.js   — Event-driven polling (60s fallback), projected GOLD allocation, live DXN price from V3 pool
    useForgeActions.js — All write functions: burn, stake, unstake, claimAndBurn, faucet (with toast feedback)
    useLiveFeed.js    — Polls last 9 blocks for events, accumulates in state, refreshFeed() for instant updates
    useMockData.js    — Fallback mock data when RPC unavailable
    useWallet.js      — Wallet connection state via Reown AppKit
  utils/
    format.js         — Number formatting helpers

test/
  deploy-local.cjs    — Deploys all mocks to localhost:8545 (uses MockRouter + MockWETH)
  deploy-sepolia.cjs  — Deploys to Sepolia (uses REAL Uniswap V3 router + WETH)
  redeploy-forge-sepolia.cjs — Deploys only new Forge, sets GOLD minter, preserves existing tokens/LP
  debug-gold.cjs      — Debug script: reads epoch, user state, epoch snapshots
  debug-alloc.cjs     — Debug script: simulates _allocGold math step by step
  forge-test.cjs      — Contract interaction tests
```

## Current Deployment (Sepolia Testnet)
```
Forge:  0x92fcaBF97dF2F916DAa11877e1dbB04809f68C84  ← LATEST (5th deploy, Feb 15)
DXN:    0x7276c4Ce66d472d2Bd23C06A3d4c34790111720A
XEN:    0xC63b6E79f952E086bFF4Fe8018062427616AdCd7
GOLD:   0x59416D0C2Fee58ce67c33a64B43159f1736b6809
DBXEN:  0x2E9a6ecC99d9259b7EDc5325799CeA0B385D1162
WETH:   0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14 (real Sepolia WETH)
Router: 0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E (real Sepolia V3 SwapRouter02)
V3 Factory: 0x0227628f3F023bb0B980b67D528571c95c6DaC1c
```

**Note:** GOLD totalSupply includes orphaned tokens from previous Forge deployments (~16K). Only the latest Forge can mint new GOLD. This resets on mainnet with a fresh GOLD deploy.

## Key Architecture Decisions

### SwapRouter02 (No Deadline)
Sepolia (and mainnet) uses SwapRouter02 which has a 7-field ExactInputSingleParams struct — NO deadline field. The original V3 SwapRouter has 8 fields with deadline. Using the wrong interface causes silent ABI mismatch reverts.

### Per-Epoch Burn Tickets
`userBurnTix[address][epoch]` — burn tickets are stored per-epoch, NOT as a single cumulative number. This prevents the _allocGold while loop from dumping all burn tickets into the first epoch and zeroing subsequent epochs.

### claimAndBurn() — Atomic Single Transaction
Combined claimFees + buyAndBurn into one function = one MetaMask popup. Prevents UX confusion of two popups where user might reject the second. Original separate functions kept for flexibility.

### buyAndBurn Sync Fix
buyAndBurn does NOT call _sync(msg.sender) — only _transDXN and _transGold. If _sync ran at the top, it would set userTixDebt = (userWt * accTix) / ACC, then epAcc[epoch] = accTix would snapshot the same value, making owed - debt = 0 and zeroing staker tickets.

### Projected GOLD Allocation (Frontend)
useForgeData.js simulates _allocGold in JavaScript to show users their correct GOLD balance immediately after buyAndBurn without waiting for an on-chain sync. Reads userTixEp, userTixDebt, userBurnTix per epoch, and epoch snapshots. The projection drops to 0 when the real allocation happens on next interaction.

### Three-Bucket Token System
DXN and GOLD tokens progress through: Fresh → Ripe → Staked
- Fresh: just deposited, locked for current cycle
- Ripe: survived one cycle, still locked
- Staked: earning rewards, withdrawable
_transDXN and _transGold handle the progression based on time elapsed.

### Ticket War (WarBar)
Each epoch, GOLD rewards are split between stakers and burners by ticket share:
- Burners get 1 ticket per 10,000 batches burned (stored per-epoch)
- Stakers get `mult/100` tickets per claimFees() call
- Staker tickets are PROJECTED in the UI (they only materialize on claimFees)

### Multiplier
`mult = 100 + (900 * pct) / 10000` where pct = totalWeight * 10000 / dxnSupply
- Range: 1.0x (0% staked) to 10.0x (100% staked)
- Reflexive: whale unstaking hurts everyone's multiplier

### Community Discount
Quadratic curve based on XEN burned: `disc = 4500 * pct^2 / 9000^2`
- Range: 0% to 45% max
- UI shows JS-calculated precision (contract uses integer math)

### claimFees() ETH Split
- 88% → GOLD staker ETH dividends
- 8.88% → pendingBurn (for buyAndBurn)
- 3.12% → LTS reserve

### ETH Rollover When No GOLD Staked
If totEligGold() == 0 during claimFees, the ETH stays in the contract untracked. Next claimFees picks it up via `address(this).balance - pendingBurn - ltsReserve - goldEthReserve`.

## Polling & RPC Strategy
- **useForgeData:** 60s background poll + instant refetch() after any user action
- **useLiveFeed:** 60s poll + refreshFeed() on user actions, accumulates events (capped at 10)
- **Countdown timer:** Pure local JavaScript, ticks every 1s, zero RPC calls
- **DXN Price:** Read from Uniswap V3 pool slot0, pool address cached after first read
- **eth_getLogs:** Uses block - 9 to block (specific numbers, NOT "latest") to stay within Alchemy free tier 10-block limit
- **Price change arrow:** Tracks prevDxnPrice in module-level variable, persists last non-zero change

## Three-Panel Layout
- **Left:** CollapsibleNav (240px expanded, 48px collapsed, hidden on mobile < 768px, slide-over with backdrop)
- **Center:** Main dashboard (fluid width)
- **Right:** ContextPanel (320px, slides in when nav item or ? icon clicked)
- **Mobile:** Both panels are full-width slide-over overlays with backdrop. Hamburger menu in header toggles left nav.
- **Desktop:** No backdrop dimming. Right panel pushes into grid.

## UI Features
- **Faucet toasts:** Success/error feedback with cooldown time remaining
- **Chain selector:** Shows all chains, greyed out "Soon" badge on chains without forge address
- **? icons:** On each card, opens relevant explainer in right panel with live data
- **Live feed:** Accumulates events across polls, deduplicates by txHash-logIndex

## Token Names
Dynamic per chain — use `chain.dxnName`, `chain.xenName`, `chain.gasName`:
- Ethereum/Sepolia: DXN, XEN, ETH
- Optimism: opDXN, opXEN, ETH
- Base: cbDXN, cbXEN, ETH

## Faucet System (Testnet Only)
- MockERC20.faucet(): transfers 10K DXN from contract pool, 24h cooldown
- MockXEN.faucet(): transfers 1T XEN from contract pool, 24h cooldown
- Faucet uses _transfer (not _mint) to preserve fixed total supply
- Faucet bar shows in Header when chainId is 11155111
- Toast feedback with cooldown time remaining on early claims

## Environment Variables
```
VITE_SEPOLIA_RPC=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
VITE_REOWN_PROJECT_ID=aa0b9fb53b2b8c54a3dd03332aee3f68
```
Never commit .env. Vercel env vars handle production.

## Local Development
Terminal 1: `npx hardhat node --config hardhat.config.cjs`
Terminal 2: `npm run dev`
Terminal 3: `npx hardhat run test/deploy-local.cjs --network localhost --config hardhat.config.cjs`

## Deploying New Forge Only (Preserves Tokens/LP)
```bash
$env:DEPLOYER_PK="key"; $env:SEPOLIA_RPC="rpc_url"
npx hardhat run test/redeploy-forge-sepolia.cjs --network sepolia --config hardhat.config.cjs
```
Then update src/config/chains.js with new forge address and push.

## Common Gotchas
- Hardhat config is .cjs (CommonJS) — always use `--config hardhat.config.cjs`
- Contract bytecode limit: DXNForge is optimized with runs:1 to stay under 24KB
- Alchemy free tier: eth_getLogs limited to 10 block range — use specific block numbers, never "latest" as toBlock
- SwapRouter02 has 7-field struct (no deadline) — don't use original V3 SwapRouter interface
- MockRouter on localhost returns 1 ETH = 1000 DXN (no real price)
- Sepolia uses real Uniswap V3 — tDXN/WETH pool exists at 1% fee tier
- _sync must NOT run at top of buyAndBurn — causes staker ticket debt to equal epAcc, zeroing staker tickets
- GOLD totalSupply on Sepolia includes orphaned tokens from previous Forge deploys
- Reown metadata URL must match actual page URL (www.dxnforge.com) or WalletConnect fails on mobile
- PowerShell uses semicolons differently than bash — `$env:VAR="val"; command` for env vars

## Known Issues / TODO
- onTokenBurned can be restricted to view (compiler warning, harmless)
- LTS UI not built yet (contract supports it)
- xenBurned counter resets with each Forge deploy (only counts current Forge's burns)
- Projected ETH earnings from GOLD staking not yet implemented in frontend
- No error backoff on RPC failures
- See MAINNET_CHECKLIST.md for full mainnet launch requirements