import { createAppKit } from "@reown/appkit";
import { EthersAdapter } from "@reown/appkit-adapter-ethers";
import { mainnet, optimism, base, polygon, avalanche, bsc } from "@reown/appkit/networks";

const projectId = import.meta.env.VITE_REOWN_PROJECT_ID;

const metadata = {
  name: "DXN Forge",
  description: "Burn XEN. Stake DXN. Earn GOLD.",
  url: "https://www.dxnforge.com",
  icons: ["https://www.dxnforge.com/icon.png"],
};

const pulsechain = {
  id: 369,
  name: "PulseChain",
  nativeCurrency: { name: "PLS", symbol: "PLS", decimals: 18 },
  rpcUrls: { default: { http: ["https://rpc.pulsechain.com"] } },
  blockExplorers: { default: { name: "PulseScan", url: "https://scan.pulsechain.com" } },
};

const sepolia = {
  id: 11155111,
  name: "Sepolia",
  nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: ["https://rpc.sepolia.org"] } },
  blockExplorers: { default: { name: "Etherscan", url: "https://sepolia.etherscan.io" } },
};

export const appKit = createAppKit({
  adapters: [new EthersAdapter()],
  networks: [sepolia, mainnet, optimism, base, polygon, avalanche, bsc, pulsechain],
  defaultNetwork: sepolia,
  projectId,
  metadata,
  themeMode: "dark",
  themeVariables: {
    "--w3m-accent": "#ff9d00",
    "--w3m-border-radius-master": "2px",
  },
  features: {
    analytics: false,
  },
});