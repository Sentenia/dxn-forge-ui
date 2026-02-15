import { useState, useEffect, useCallback } from "react";
import { BrowserProvider } from "ethers";
import { useAppKitProvider, useAppKitAccount, useAppKitNetwork } from "@reown/appkit/react";
import { appKit } from "../config/appkit";
import { CHAINS, DEFAULT_CHAIN } from "../config/chains";

export function useWallet() {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [overrideChainId, setOverrideChainId] = useState(DEFAULT_CHAIN);

  const { address, isConnected } = useAppKitAccount();
  const { walletProvider } = useAppKitProvider("eip155");
  const { chainId } = useAppKitNetwork();

  const numChainId = overrideChainId;
  const chain = CHAINS[numChainId] || CHAINS[DEFAULT_CHAIN];

  useEffect(() => {
    async function setup() {
      if (walletProvider && isConnected) {
        const p = new BrowserProvider(walletProvider);
        const s = await p.getSigner();
        setProvider(p);
        setSigner(s);
      } else {
        setProvider(null);
        setSigner(null);
      }
    }
    setup();
  }, [walletProvider, isConnected, chainId, numChainId]);

  const connect = useCallback(() => {
    appKit.open();
  }, []);

  const switchChain = useCallback((id) => {
    setOverrideChainId(id);
  }, []);

  const account = isConnected ? address : null;

  return {
    account,
    chainId: numChainId,
    chain,
    provider,
    signer,
    connect,
    switchChain,
  };
}