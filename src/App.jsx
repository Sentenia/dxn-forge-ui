import { useWallet } from "./hooks/useWallet";
import { useForgeData } from "./hooks/useForgeData";
import { useForgeActions } from "./hooks/useForgeActions";
import { useLiveFeed } from "./hooks/useLiveFeed";
import { useMockData } from "./hooks/useMockData";
import Header from "./components/Header";
import CountdownBar from "./components/CountdownBar";
import WarBar from "./components/WarBar";
import ProgressCards from "./components/ProgressCards";
import ActionZone from "./components/ActionZone";
import LiveFeed from "./components/LiveFeed";
import StatsRow from "./components/StatsRow";
import "./App.css";

function App() {
  const wallet = useWallet();
  const { data: liveData, loading, refetch } = useForgeData(wallet.chain, wallet.account, wallet.provider);
  const actions = useForgeActions(wallet.chain, wallet.signer, refetch);
  const feed = useLiveFeed(wallet.chain);
  const mockData = useMockData();

  // Use live data if available, fall back to mock
  const data = liveData || mockData;

  return (
    <div className="app">
      <Header data={data} wallet={wallet} actions={actions} />
      <CountdownBar data={data} actions={actions} wallet={wallet} />
      <WarBar data={data} />
      <ProgressCards data={data} wallet={wallet} />
      <ActionZone data={data} actions={actions} wallet={wallet} />
      <LiveFeed feed={feed} chain={wallet.chain} />
      <StatsRow data={data} />
      {loading && liveData === null && (
        <div className="loading-overlay">Connecting to chain...</div>
      )}
    </div>
  );
}

export default App;