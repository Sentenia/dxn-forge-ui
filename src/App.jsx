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

  const wallet = useWallet();
  const { data: liveData, loading, refetch } = useForgeData(wallet.chain, wallet.account, wallet.provider);
  const { feed, refreshFeed } = useLiveFeed(wallet.chain);
  const actions = useForgeActions(wallet.chain, wallet.signer, refetch, refreshFeed);
  const mockData = useMockData();

  // Use live data if available, fall back to mock
  const data = liveData || mockData;

  return (
    <div className="app">
      <Header data={data} wallet={wallet} actions={actions} />
      <div className="app-layout">
        <CollapsibleNav activeExplainer={activeExplainer} setActiveExplainer={setActiveExplainer} />
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
