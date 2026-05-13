import { useEffect, useState } from "react";
import { getMarketStatus } from "../../services/marketStatusService";

const MarketStatusIndicator = () => {
  const [status, setStatus] = useState(null);

  const fetchStatus = async () => {
    try {
      const data = await getMarketStatus();
      setStatus(data);
    } catch (err) {
      console.error("Market status fetch failed", err);
    }
  };

  useEffect(() => {
    fetchStatus();

    const interval = setInterval(() => {
      fetchStatus();
    }, 10 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  if (!status) return null;

  const capitalOpen =
    status["Capital Market"]?.marketStatus === "Open";
  const commodityOpen =
    status["Commodity"]?.marketStatus === "Open";

  const brokerType = String(
    localStorage.getItem("broker_type") || "5paisa"
  ).toLowerCase();

  let isOpen = true;
  let label = "";

  if (brokerType === "grow") {
    // ✅ Only Equity matters
    isOpen = capitalOpen;
  } else {
    // ✅ 5paisa logic
    if (capitalOpen && commodityOpen) {
      isOpen = true;
    } else if (!capitalOpen && commodityOpen) {
      isOpen = true;
      label = " (Commodity)";
    } else if (capitalOpen && !commodityOpen) {
      isOpen = true;
      label = " (Equity)";
    } else {
      isOpen = false;
    }
  }

  return (
    <div className={`market-status-badge ${isOpen ? "open" : "closed"}`}>
      <span className="status-dot" />
      <span className="status-text">
        {isOpen ? "Market Open" : "Market Closed"}
        {isOpen && label}
      </span>
    </div>
  );
};

export default MarketStatusIndicator;