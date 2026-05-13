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
      className="absolute top-12 left-0 w-full bg-[#111827] border border-[#1F2937] rounded-xl overflow-hidden z-50"
    >
      {/* Tabs */}
      <div className="flex gap-2 p-3 border-b border-[#1F2937]">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1 text-xs rounded-md transition ${
              activeTab === tab
                ? "bg-[#00FFA3] text-black"
                : "text-gray-400 hover:text-white"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Header */}
      <div className="grid grid-cols-3 text-xs text-gray-400 px-4 py-2 border-b border-[#1F2937]">
        <span>Name</span>
        <span style={{ textAlign: "center" }}>Price</span>
        <span style={{ textAlign: "center" }}>Change</span>
      </div>

      {/* Rows */}
      <div className="max-h-80 overflow-y-auto">
        {loading && (
          <div className="p-4 text-sm text-gray-400">Searching...</div>
        )}

        {!loading && query?.length >= 3 && data.length === 0 && (
          <div className="p-4 text-sm text-gray-400">No results found</div>
        )}

       {data.map((item) => {
        const token = String(item.scripCode);
        const live = liveData[token];

        const isUp = live && live.LastRate > live.PClose;

        return (
          <div
            key={item.id}
            className="relative group grid grid-cols-3 px-4 py-3 border-b border-[#1F2937] hover:bg-[#0B0F19] transition"
          >
            {/* Name */}
            <div>
              <p className="text-sm font-medium">{item.name}</p>
              <p className="text-xs text-gray-400">
                {item.exchange === "N"
                  ? "NSE"
                  : item.exchange === "B"
                  ? "BSE"
                  : "MCX"}{" "}
                • {item.symbol}
              </p>
            </div>

            {/* LTP */}
            <div className="text-sm text-center font-mono">
             ₹ {live ? formatNumber(live.LastRate) : "—"}
            </div>

            {/* Change */}
            <div
              className={`text-sm text-center ${
                isUp ? "text-green-400" : "text-red-400"
              }`}
            >
            {live
              ? `${isUp ? "+" : ""}${formatNumber((live.LastRate - live.PClose).toFixed(2))} (${formatNumber(live.ChgPcnt.toFixed(2))}%)`
              : "—"}
            </div>

           {/* Hover Actions */}
<div className="absolute inset-0 flex items-center justify-end pr-4 gap-2 opacity-0 group-hover:opacity-100 transition">

{/* Buy */}
<button
  onClick={() => {
    console.log("BUY", item);
    setSelectedStock(item);
    setTradeAction("BUY");
    setIsModalOpen(true);
  }}
  className="px-2 py-1 text-xs bg-[#22C55E] text-black rounded"
>
  Buy
</button>

{/* Sell */}
<button
  onClick={() => {
    console.log("SELL", item);
    setSelectedStock(item);
    setTradeAction("SELL");
    setIsModalOpen(true);
  }}
  className="px-2 py-1 text-xs bg-[#FF4D4F] text-white rounded"
>
  Sell
</button>

{/* Add to Watchlist */}
<button
  onClick={() => handleAddToWatchlist(item)}
  disabled={addingId === item.id}
  className="px-2 py-1 text-xs bg-[#1F2937] rounded disabled:opacity-50"
>
  {addingId === item.id ? "Adding..." : "+ Add to Watchlist"}
</button>

{/* Depth */}
{/* <button className="px-2 py-1 text-xs bg-[#1F2937] rounded">
  Depth
</button> */}
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
    // 🔥 NEW
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