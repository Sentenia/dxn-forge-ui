import { createAppKit } from "@reown/appkit";
import { EthersAdapter } from "@reown/appkit-adapter-ethers";
import { mainnet, optimism, base, polygon, avalanche, bsc } from "@reown/appkit/networks";

const projectId = import.meta.env.VITE_REOWN_PROJECT_ID;

const metadata = {
  name: "DXN Forge",
  description: "Burn XEN. Stake DXN. Earn GOLD.",
  url: "https://dxnforge.com",
  icons: ["https://dxnforge.com/icon.png"],
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

const localhost = {
  id: 31337,
  name: "Localhost",
  nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: ["http://127.0.0.1:8545"] } },
  blockExplorers: { default: { name: "", url: "" } },
};

export const appKit = createAppKit({
  adapters: [new EthersAdapter()],
  networks: [localhost, optimism, base, polygon, avalanche, bsc, pulsechain, sepolia],
  defaultNetwork: localhost,
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