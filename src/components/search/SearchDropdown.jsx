import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useToast } from "../../components/common/Toast/ToastContext";
import useMarketFeed from "../../hooks/useMarketFeed";
import { useMarketStore } from "../../store/marketStore";
import TradeModal from "../trading/TradeModal";
import { formatNumber } from "../../utils/formatNumber";

const tabs = ["All", "BSE", "NSE", "MCX"];

function SearchDropdown({ query,  triggerWatchlistUpdate, setTriggerWatchlistUpdate, triggerPositionUpdate, setTriggerPositionUpdate }) {
  const [activeTab, setActiveTab] = useState("All");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();
  const [addingId, setAddingId] = useState(null);
  const [selectedStock, setSelectedStock] = useState(null);
  const [tradeAction, setTradeAction] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const liveData = useMarketStore((s) => s.data);

const scrips =
  data.length > 0
    ? data.map((item) => ({
        Exch: item.exchange,
        ExchType: item.exchangeType,
        ScripCode: Number(item.scripCode),
      }))
    : [];

  // 🔥 ADD: watchlist handler
const handleAddToWatchlist = async (item) => {
  try {
    if (addingId === item.id) return;

    setAddingId(item.id);

    const token = localStorage.getItem("token");

    if (!token) {
      showToast("error", "Session expired. Please login again");
      return;
    }

    const payload = {
      watchlistName: "First Watchlist",
      stock: item,
    };

    const res = await fetch(
      `${import.meta.env.VITE_API_BASE_URL}/api/watchlist/add`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      }
    );

    const result = await res.json();

    if (res.status === 401) {
      showToast("error", "Unauthorized. Please login again");
      return;
    }

    if (result.success) {
      showToast("success", "Added to watchlist");
    
      // 🔥 Trigger refresh ONLY if on watchlist page
      const isWatchlistPage = window.location.pathname.includes("watchlist");
    
      if (isWatchlistPage && typeof setTriggerWatchlistUpdate === "function") {
        setTriggerWatchlistUpdate((x) => x + 1);
      }
    
    } else {
      showToast("error", result.message || "Failed to add");
    }
  } catch (err) {
    console.error("Watchlist error:", err);
    showToast("error", "Something went wrong");
  } finally {
    setAddingId(null);
  }
};

useEffect(() => {
  if (!query || query.trim().length < 3) {
    setData([]);
    return;
  }

  let isActive = true; // ✅ prevent stale updates

  const timer = setTimeout(async () => {
    try {
      setLoading(true);

      const exch = activeTab.toUpperCase();

      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/stocks/search?name=${query}&exch=${exch}`
      );

      const result = await res.json();

      if (!isActive) return; // ✅ ignore stale response

      if (result.success) {
        setData(result.data);
      } else {
        setData([]);
      }
    } catch (err) {
      console.error("Search error:", err);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, 300);

  return () => {
    isActive = false; // ✅ cancel stale
    clearTimeout(timer);
  };
}, [query, activeTab]);

useMarketFeed({
  accessToken: localStorage.getItem("fivePaisaAccessToken"),
  clientCode: localStorage.getItem("clientCode"),
  scrips,
});



  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="absolute top-9 sm:top-12 left-0 w-full bg-cardBg border border-borderColor rounded-lg sm:rounded-xl overflow-hidden z-50 shadow-xl"
    >
      {/* Tabs */}
      <div className="flex gap-1 sm:gap-2 p-2 sm:p-3 border-b border-borderColor">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs rounded-md transition ${
              activeTab === tab
                ? "bg-accent text-black"
                : "text-textMuted hover:text-textPrimary"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Desktop Header */}
      <div className="hidden sm:grid grid-cols-3 text-xs text-textMuted px-4 py-2 border-b border-borderColor bg-[var(--color-surface-subtle)]">
        <span>Name</span>
        <span style={{ textAlign: "center" }}>Price</span>
        <span style={{ textAlign: "center" }}>Change</span>
      </div>

      {/* Rows */}
      <div className="max-h-64 sm:max-h-80 overflow-y-auto">
        {loading && (
          <div className="p-3 sm:p-4 text-xs sm:text-sm text-gray-400">Searching...</div>
        )}

        {!loading && query?.length >= 3 && data.length === 0 && (
          <div className="p-3 sm:p-4 text-xs sm:text-sm text-gray-400">No results found</div>
        )}

        {data.map((item) => {
          const token = String(item.scripCode);
          const live = liveData[token];
          const isUp = live && live.LastRate > live.PClose;
          const exchLabel = item.exchange === "N" ? "NSE" : item.exchange === "B" ? "BSE" : "MCX";

          return (
            <div key={item.id} className="border-b border-borderColor">
              {/* ── Mobile Row ── */}
              <div className="sm:hidden px-2.5 py-2">
                <div className="flex items-start justify-between mb-1">
                  <div className="min-w-0 flex-1 mr-2">
                    <p className="text-[11px] font-semibold truncate" style={{ color: "#f0f2f8" }}>{item.name}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="text-[7px] font-semibold px-1 py-px rounded" style={{ background: "rgba(124,111,255,0.12)", color: "#7c6fff" }}>{exchLabel}</span>
                      <span className="text-[7px] truncate" style={{ color: "#5a5f78" }}>{item.symbol}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[10px] font-semibold" style={{ fontFamily: "'IBM Plex Mono', monospace", color: isUp ? "#22d38a" : "#ff4d6a" }}>
                      ₹{live ? formatNumber(live.LastRate) : "—"}
                    </p>
                    <p className="text-[8px]" style={{ fontFamily: "'IBM Plex Mono', monospace", color: isUp ? "#22d38a" : "#ff4d6a" }}>
                      {live ? `${isUp ? "+" : ""}${(live.LastRate - live.PClose).toFixed(2)} (${live.ChgPcnt.toFixed(2)}%)` : "—"}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1.5 mt-1">
                  <button
                    onClick={() => { setSelectedStock(item); setTradeAction("BUY"); setIsModalOpen(true); }}
                    className="px-2 py-0.5 text-[8px] font-semibold rounded-md" style={{ border: "1px solid rgba(34,211,138,0.3)", background: "rgba(34,211,138,0.07)", color: "#22d38a" }}
                  >BUY</button>
                  <button
                    onClick={() => { setSelectedStock(item); setTradeAction("SELL"); setIsModalOpen(true); }}
                    className="px-2 py-0.5 text-[8px] font-semibold rounded-md" style={{ border: "1px solid rgba(255,77,106,0.3)", background: "rgba(255,77,106,0.07)", color: "#ff4d6a" }}
                  >SELL</button>
                  <button
                    onClick={() => handleAddToWatchlist(item)}
                    disabled={addingId === item.id}
                    className="px-2 py-0.5 text-[8px] font-semibold rounded-md disabled:opacity-50" style={{ background: "rgba(255,255,255,0.05)", color: "#888", border: "1px solid rgba(255,255,255,0.08)" }}
                  >{addingId === item.id ? "..." : "+ Watch"}</button>
                </div>
              </div>

              {/* ── Desktop Row ── */}
              <div className="hidden sm:grid relative group grid-cols-3 px-4 py-3 hover:bg-[var(--color-row-hover)] transition text-textPrimary">
                <div>
                  <p className="text-sm font-medium">{item.name}</p>
                  <p className="text-xs text-textMuted">{exchLabel} • {item.symbol}</p>
                </div>

                <div className="text-sm text-center font-mono">
                  ₹ {live ? formatNumber(live.LastRate) : "—"}
                </div>

                <div className={`text-sm text-center ${isUp ? "text-green-400" : "text-red-400"}`}>
                  {live ? `${isUp ? "+" : ""}${formatNumber((live.LastRate - live.PClose).toFixed(2))} (${formatNumber(live.ChgPcnt.toFixed(2))}%)` : "—"}
                </div>

                <div className="absolute inset-0 flex items-center justify-end pr-4 gap-2 opacity-0 group-hover:opacity-100 transition">
                  <button onClick={() => { setSelectedStock(item); setTradeAction("BUY"); setIsModalOpen(true); }} className="px-2 py-1 text-xs bg-[#22C55E] text-black rounded">Buy</button>
                  <button onClick={() => { setSelectedStock(item); setTradeAction("SELL"); setIsModalOpen(true); }} className="px-2 py-1 text-xs bg-[#FF4D4F] text-white rounded">Sell</button>
                  <button onClick={() => handleAddToWatchlist(item)} disabled={addingId === item.id} className="px-2 py-1 text-xs bg-cardBg border border-borderColor text-textMuted rounded disabled:opacity-50">
                    {addingId === item.id ? "Adding..." : "+ Add to Watchlist"}
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {selectedStock && (
          <TradeModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            scripCode={Number(selectedStock.scripCode)}
            exchange={selectedStock.exchange}
            exchangeType={selectedStock.exchangeType}
            symbol={selectedStock.symbol}
            name={selectedStock.name}
            action={tradeAction}
            lotSize={Number(selectedStock.lotSize)}
            multiplier={Number(selectedStock.multiplier)}
            setTriggerPositionUpdate={setTriggerPositionUpdate}
          />
        )}
      </div>
    </motion.div>
  );
}

export default SearchDropdown;