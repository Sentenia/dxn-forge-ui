import { useState } from "react";
import { useWallet } from "./hooks/useWallet";
import { useForgeData } from "./hooks/useForgeData";
import { useForgeActions } from "./hooks/useForgeActions";
import { useLiveFeed } from "./hooks/useLiveFeed";
import { useMockData } from "./hooks/useMockData";
import Header from "./components/Header";
import CollapsibleNav from "./components/CollapsibleNav";
import ContextPanel from "./components/ContextPanel";
import CountdownBar from "./components/CountdownBar";
import WarBar from "./components/WarBar";
import ProgressCards from "./components/ProgressCards";
import ActionZone from "./components/ActionZone";
import LiveFeed from "./components/LiveFeed";
import StatsRow from "./components/StatsRow";
import "./App.css";

function App() {
  const [activeExplainer, setActiveExplainer] = useState(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const wallet = useWallet();
  const { data: liveData, loading, refetch } = useForgeData(wallet.chain, wallet.account, wallet.provider);
  const { feed, refreshFeed } = useLiveFeed(wallet.chain);
  const actions = useForgeActions(wallet.chain, wallet.signer, refetch, refreshFeed);
  const mockData = useMockData();

  // Use live data if available, fall back to mock
  const data = liveData || mockData;

  const handleMenuToggle = () => setMobileNavOpen(!mobileNavOpen);
  const closeMobileNav = () => setMobileNavOpen(false);
  const closeContextPanel = () => setActiveExplainer(null);

  const showBackdrop = mobileNavOpen || activeExplainer;

  return (
    <div className="app">
      <Header data={data} wallet={wallet} actions={actions} onMenuToggle={handleMenuToggle} />
      <div className="app-layout">
        <CollapsibleNav
          activeExplainer={activeExplainer}
          setActiveExplainer={setActiveExplainer}
          isOpen={mobileNavOpen}
          onClose={closeMobileNav}
        />
        <div
          className={`panel-backdrop ${showBackdrop ? "active" : ""}`}
          onClick={() => { closeMobileNav(); closeContextPanel(); }}
        />
        <main className="app-main">
          <CountdownBar data={data} actions={actions} wallet={wallet} setActiveExplainer={setActiveExplainer} />
          <WarBar data={data} setActiveExplainer={setActiveExplainer} />
          <ProgressCards data={data} wallet={wallet} setActiveExplainer={setActiveExplainer} />
          <ActionZone data={data} actions={actions} wallet={wallet} setActiveExplainer={setActiveExplainer} />
          <LiveFeed feed={feed} chain={wallet.chain} />
          <StatsRow data={data} />
        </main>
        {activeExplainer && (
          <ContextPanel
            activeExplainer={activeExplainer}
            setActiveExplainer={setActiveExplainer}
            data={data}
            wallet={wallet}
          />
        )}
      </div>
      {loading && liveData === null && (
        <div className="loading-overlay">Connecting to chain...</div>
      )}
    </div>
  );
}

export default App;
