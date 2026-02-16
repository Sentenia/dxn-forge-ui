export const EXPLAINERS = {
  burnXen: {
    title: "Burn XEN",
    content: "Burning XEN earns you burner tickets for the current epoch. The more you burn, the bigger your share of GOLD when Buy & Burn fires.\n\nBurning also contributes to the community discount — as more XEN is destroyed, future burns become cheaper for everyone.\n\nEach batch burned = 1/10000th of a ticket."
  },
  stakeDxn: {
    title: "Stake DXN",
    content: "Staking DXN earns you staker tickets passively every epoch. Your ticket earning rate depends on the multiplier, which increases as more DXN is staked.\n\nStaked DXN goes through three stages: Fresh (day 1, locked), Ripe (day 2, locked), Staked (day 3+, withdrawable). All three stages earn tickets.\n\nYour weight determines your share of staker tickets."
  },
  buyAndBurn: {
    title: "Buy & Burn",
    content: "Every fee cycle (5 minutes on testnet), accumulated ETH fees are used to buy DXN on Uniswap and burn it permanently.\n\nThis mints GOLD tokens equal to the amount of DXN burned. The GOLD is distributed to all ticket holders based on their share.\n\nAnyone can trigger Buy & Burn — the caller gets their GOLD allocated immediately."
  },
  goldRewards: {
    title: "GOLD Rewards",
    content: "GOLD is automatically staked when allocated to you. Auto-staked GOLD earns ETH dividends from future fee distributions.\n\nThe more GOLD you have staked relative to the total, the more ETH you earn. Your share is displayed as a percentage."
  },
  claimRewards: {
    title: "Claim Rewards",
    content: "Claim GOLD + ETH withdraws all your auto-staked GOLD to your wallet and collects any pending ETH dividends.\n\nClaim ETH Only leaves your GOLD staked (continuing to earn ETH) and only withdraws your pending ETH dividends."
  },
  tickets: {
    title: "Ticket System",
    content: "Tickets determine your share of GOLD each epoch. There are two types:\n\nBurner tickets — earned by burning XEN. 10,000 batches = 1 ticket.\n\nStaker tickets — earned passively by staking DXN. Rate depends on the multiplier (higher when more DXN is staked).\n\nBoth pools compete for the same GOLD distribution. The WarBar shows the current split between stakers and burners."
  },
  howItWorks: {
    title: "How DXN Forge Works",
    content: "1. Users burn XEN and/or stake DXN to earn tickets\n\n2. XEN burns generate ETH fees (0.06 ETH per burn on testnet)\n\n3. Every fee cycle, Buy & Burn swaps accumulated ETH for DXN on Uniswap\n\n4. The bought DXN is burned permanently, and GOLD tokens are minted\n\n5. GOLD is distributed to ticket holders proportionally\n\n6. GOLD holders earn ETH dividends from future fee cycles\n\nThe result: a flywheel where burning and staking create continuous value for participants."
  },
  tokenomics: {
    title: "Tokenomics",
    content: "DXN — The fuel. Staked to earn tickets, bought and burned by the protocol. Deflationary.\n\nXEN — The fire. Burned by users to earn tickets and contribute to the community discount. Deflationary.\n\nGOLD — The reward. Minted 1:1 with DXN burned by the protocol. Auto-staked to earn ETH dividends. Inflationary but backed by protocol activity.\n\nETH — The yield. Fees from XEN burns split three ways: GOLD staker dividends, Buy & Burn fuel, and LTS reserves."
  },
  faq: {
    title: "Frequently Asked Questions",
    content: "Q: What happens if I don't interact for several epochs?\nA: Your GOLD allocation accumulates. It gets assigned on your next interaction.\n\nQ: Can I lose my staked DXN?\nA: No. After the 3-day lock period, you can withdraw anytime.\n\nQ: How often does Buy & Burn fire?\nA: Whenever the cooldown expires and someone triggers it. Currently every 5 minutes on testnet.\n\nQ: What's the community discount?\nA: As more XEN is burned, future burns cost less. It's a quadratic curve that caps at 45% off when 90% of XEN is burned."
  }
};

export const NAV_SECTIONS = [
  {
    id: "forge",
    label: "FORGE",
    icon: "hammer",
    items: [
      { id: "burnXen", label: "Burn XEN" },
      { id: "stakeDxn", label: "Stake DXN" },
      { id: "buyAndBurn", label: "Buy & Burn" },
    ],
  },
  {
    id: "earn",
    label: "EARN",
    icon: "coins",
    items: [
      { id: "goldRewards", label: "GOLD Rewards" },
      { id: "claimRewards", label: "Claim Rewards" },
      { id: "tickets", label: "Tickets" },
    ],
  },
  {
    id: "learn",
    label: "LEARN",
    icon: "book",
    items: [
      { id: "howItWorks", label: "How It Works" },
      { id: "tokenomics", label: "Tokenomics" },
      { id: "faq", label: "FAQ" },
    ],
  },
];
