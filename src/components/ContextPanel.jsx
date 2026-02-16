import { X } from "lucide-react";
import { EXPLAINERS } from "../config/explainers";
import "./ContextPanel.css";

export default function ContextPanel({ activeExplainer, setActiveExplainer, data, wallet }) {
  const explainer = activeExplainer ? EXPLAINERS[activeExplainer] : null;

  if (!explainer) return null;

  const renderContent = () => {
    const paragraphs = explainer.content.split("\n\n");

    return paragraphs.map((p, i) => (
      <p key={i} className="context-paragraph">
        {p.split("\n").map((line, j) => (
          <span key={j}>
            {line}
            {j < p.split("\n").length - 1 && <br />}
          </span>
        ))}
      </p>
    ));
  };

  const renderLiveData = () => {
    if (!data) return null;

    switch (activeExplainer) {
      case "stakeDxn":
        return (
          <div className="context-live-data">
            <div className="live-data-title">Your Stats</div>
            <div className="live-data-row">
              <span>Total Staked</span>
              <span className="live-data-value">{(data.userDXNFresh + data.userDXNRipe + data.userDXNStaked).toFixed(2)} {wallet?.chain?.dxnName || "DXN"}</span>
            </div>
            <div className="live-data-row">
              <span>Current Multiplier</span>
              <span className="live-data-value gold">{data.multDisplay}x</span>
            </div>
            <div className="live-data-row">
              <span>Your Tickets</span>
              <span className="live-data-value gold">{(data.userTickets || 0).toFixed(4)}</span>
            </div>
            <div className="live-data-note">
              Multiplier is {data.multDisplay}x because {(data.dxnStakedPct || 0).toFixed(1)}% of {wallet?.chain?.dxnName || "DXN"} is staked.
            </div>
          </div>
        );

      case "burnXen":
        return (
          <div className="context-live-data">
            <div className="live-data-title">Community Progress</div>
            <div className="live-data-row">
              <span>{wallet?.chain?.xenName || "XEN"} Burned</span>
              <span className="live-data-value burn">{(data.xenBurnedPct || 0).toFixed(2)}%</span>
            </div>
            <div className="live-data-row">
              <span>Community Discount</span>
              <span className="live-data-value green">{(data.communityDiscPrecise || 0).toFixed(4)}%</span>
            </div>
            <div className="live-data-note">
              Current discount is {(data.communityDiscPrecise || 0).toFixed(4)}% off burn fees. Burns {(90 - (data.xenBurnedPct || 0)).toFixed(1)}% more to reach max 45% discount.
            </div>
          </div>
        );

      case "buyAndBurn":
        return (
          <div className="context-live-data">
            <div className="live-data-title">Next Buy & Burn</div>
            <div className="live-data-row">
              <span>{wallet?.chain?.gasName || "ETH"} Available</span>
              <span className="live-data-value">{((data.xenFeeETH || 0) + (data.dbxenETH || 0)).toFixed(4)}</span>
            </div>
            <div className="live-data-row">
              <span>Cooldown</span>
              <span className="live-data-value gold">{data.feeCountdown > 0 ? `${Math.floor(data.feeCountdown / 60)}m ${data.feeCountdown % 60}s` : "READY"}</span>
            </div>
            <div className="live-data-row">
              <span>Total GOLD Minted</span>
              <span className="live-data-value">{(data.totalGoldMinted || 0).toFixed(2)}</span>
            </div>
          </div>
        );

      case "goldRewards":
        return (
          <div className="context-live-data">
            <div className="live-data-title">Your GOLD Position</div>
            <div className="live-data-row">
              <span>Auto-Staked GOLD</span>
              <span className="live-data-value gold">{(data.userAutoGold || 0).toFixed(2)}</span>
            </div>
            <div className="live-data-row">
              <span>Manual Staked</span>
              <span className="live-data-value">{(data.userGoldManualStaked || 0).toFixed(2)}</span>
            </div>
            <div className="live-data-row">
              <span>Your Share</span>
              <span className="live-data-value gold">
                {data.totalGoldStaked > 0
                  ? (((data.userAutoGold + data.userGoldRipe + data.userGoldManualStaked) / data.totalGoldStaked) * 100).toFixed(4)
                  : "0.00"}%
              </span>
            </div>
          </div>
        );

      case "claimRewards":
        return (
          <div className="context-live-data">
            <div className="live-data-title">Claimable Rewards</div>
            <div className="live-data-row">
              <span>GOLD to Claim</span>
              <span className="live-data-value gold">{(data.userAutoGold || 0).toFixed(2)}</span>
            </div>
            <div className="live-data-row">
              <span>{wallet?.chain?.gasName || "ETH"} Dividends</span>
              <span className="live-data-value green">{(data.userClaimableETH || 0).toFixed(4)}</span>
            </div>
          </div>
        );

      case "tickets":
        return (
          <div className="context-live-data">
            <div className="live-data-title">Current Epoch</div>
            <div className="live-data-row">
              <span>Staker Tickets</span>
              <span className="live-data-value gold">{(data.stakerTickets || 0).toFixed(4)}</span>
            </div>
            <div className="live-data-row">
              <span>Burner Tickets</span>
              <span className="live-data-value burn">{(data.burnerTickets || 0).toFixed(4)}</span>
            </div>
            <div className="live-data-row">
              <span>Your Tickets</span>
              <span className="live-data-value">{(data.userTickets || 0).toFixed(4)}</span>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="context-panel">
      <div className="context-header">
        <h2 className="context-title">{explainer.title}</h2>
        <button className="context-close" onClick={() => setActiveExplainer(null)} title="Close">
          <X size={20} />
        </button>
      </div>

      <div className="context-body">
        {renderContent()}
        {renderLiveData()}
      </div>

      <div className="context-footer">
        <button className="context-gotit" onClick={() => setActiveExplainer(null)}>
          Got it
        </button>
      </div>
    </div>
  );
}
