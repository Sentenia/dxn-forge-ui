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
    xenFeeETH: 0.0612,
    dbxenETH: 0.0230,
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
    userGoldWallet: 120.5,
    userClaimableETH: 0.0347,
    totalGoldStaked: 42000,
    dxnStakedPct: 26.3,
    xenBurnedPct: 2.97,
    multDisplay: "3.4",
    globalDiscPct: "0.04",
    dxnSupply: 3200000,
    xenOriginalSupply: 60.58e12,
    dxnActualSupply: 2800000,
    dxnSupply: 3200000,
    xenOriginalSupply: 60.58e12,
    xenBurnedPct: 2.97,
    dxnStakedPct: 26.3,
    multDisplay: "3.4",
    globalDiscPct: "0.04",
    totalGoldMinted: 0,
    totalETHDistributed: 0,
    totalXENBurned: 1.8e12,
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
