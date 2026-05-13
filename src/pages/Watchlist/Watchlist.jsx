import { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";
import { useToast } from "../../components/common/Toast/ToastContext";
import useMarketFeed from "../../hooks/useMarketFeed";
import { FiEye, FiTrash2 } from "react-icons/fi";
import { useMarketStore } from "../../store/marketStore";
import TradeModal from "../../components/trading/TradeModal";
import { formatNumber } from "../../utils/formatNumber";
import { useUserStore } from "../../store/userStore";
import { useNavigate } from "react-router-dom";
import SetTargetModal from "../../components/common/SetTargetModal";
import { fetchUserData } from "../../services/user.service";



function Watchlist({ triggerWatchlistUpdate, setTriggerWatchlistUpdate }) {
  const [watchlists, setWatchlists] = useState({});
  const [activeTab, setActiveTab] = useState("");
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState(null);
  const [tradeAction, setTradeAction] = useState("BUY");
  const [isTargetModalOpen, setIsTargetModalOpen] = useState(false);
  const [targetStock, setTargetStock] = useState(null);
  const [savingTarget, setSavingTarget] = useState(false);
  const user = useUserStore((s) => s.user);


  const navigate = useNavigate();

  // ✅ NEW: live data state
  // const [liveData, setLiveData] = useState({});

  const { showToast } = useToast();

  const staticTabs = ["Top Growth", "Nifty50"];
  const liveData = useMarketStore((s) => s.data);

  useEffect(()=>{
    console.log("selectedStock",selectedStock)
    
  },[selectedStock])


  // 🔥 Fetch watchlist
  useEffect(() => {
    const fetchWatchlist = async () => {
      try {
        const token = localStorage.getItem("token");

        const res = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/api/watchlist/get`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const result = await res.json();

        if (result.success) {
          // setWatchlists(result.data);
          const sortedData = {};

          Object.keys(result.data).forEach((key) => {
            sortedData[key] = [...result.data[key]].sort(
              (a, b) => (b.addedAt || 0) - (a.addedAt || 0)
            );
          });

          setWatchlists(sortedData);

          const firstKey = Object.keys(result.data)[0];
          setActiveTab(firstKey || "Top Growth");
        }
      } catch (err) {
        console.error("Fetch watchlist error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchWatchlist();
  }, [triggerWatchlistUpdate]);

  useEffect(() => {
    fetchUserData();
  }, []);

  // 🔥 Combine tabs
  const dynamicTabs = Object.keys(watchlists);
  const tabs = [...dynamicTabs, ...staticTabs];

  // 🔥 Current data
  const currentData = watchlists[activeTab] || [];
  // console.log("🟡 Active Tab:", activeTab);
  // console.log("🟡 Current Data:", currentData);

  // ✅ Prepare scrips for WS
  const scrips =
    !staticTabs.includes(activeTab) && currentData.length > 0
      ? currentData.map((item) => ({
          Exch: item.exchange,
          ExchType: item.exchangeType || "C",
          ScripCode: Number(item.scripCode),
        }))
      : [];

      // console.log("🟡 Scrips Prepared:", scrips);
      // console.log("🟡 Token:", localStorage.getItem("fivePaisaAccessToken"));
      // console.log("🟡 ClientCode:", localStorage.getItem("clientCode"));

  // ✅ WebSocket Hook
 useMarketFeed({
  accessToken: localStorage.getItem("fivePaisaAccessToken"),
  clientCode: localStorage.getItem("clientCode"),
  scrips,
});

  // 🔥 Remove from watchlist
  const handleRemove = async (item) => {
    try {
      const token = localStorage.getItem("token");

      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/watchlist/remove`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            stockId: item.stockId,
            watchlistName: activeTab,
          }),
        }
      );

      const result = await res.json();

      if (result.success) {
        showToast("success", "Removed from watchlist");

        setWatchlists((prev) => {
          const updated = { ...prev };

          updated[activeTab] = (updated[activeTab] || []).filter(
            (stock) => stock.stockId !== item.stockId
          );

          return updated;
        });
      } else {
        showToast("warning", result.message);
      }
    } catch (err) {
      console.error(err);
      showToast("info", "Something went wrong");
    }
  };

  const handleSetTarget = async (targetPriceValue) => {
    if (!targetStock) return;

    const live = liveData[String(targetStock.scripCode)];
    const initialPrice = Number(live?.LastRate);
    const targetPrice = Number(targetPriceValue);

    if (!Number.isFinite(initialPrice) || initialPrice <= 0) {
      showToast("warning", "Live price unavailable. Please try again in a moment.");
      return;
    }

    if (!Number.isFinite(targetPrice) || targetPrice <= 0) {
      showToast("warning", "Please enter a valid target price.");
      return;
    }

    setSavingTarget(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/targets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          symbol: targetStock.symbol,
          name: targetStock.name,
          exchange: targetStock.exchange,
          exchangeType: targetStock.exchangeType,
          scripCode: targetStock.scripCode,
          targetPrice,
          initialPrice,
          module: "watchlist",
        }),
      });

      const result = await res.json();
      if (result.success) {
        showToast("success", result.message || "Target updated successfully");
        setIsTargetModalOpen(false);
        setTargetStock(null);
        setTriggerWatchlistUpdate((prev) => prev + 1);
      } else {
        showToast("warning", result.message || "Failed to set target");
      }
    } catch (error) {
      console.error("Set target error:", error);
      showToast("info", "Something went wrong");
    } finally {
      setSavingTarget(false);
    }
  };

  // 🔥 Loading
  // if (loading) {
  //   return <div className="p-6 text-gray-400">Loading watchlist...</div>;
  // }



  
  return (
    <div className="flex flex-col gap-3 sm:gap-7 max-w-full overflow-x-hidden" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* ── Tabs ── */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="px-2.5 py-1.5 sm:px-4 sm:py-2 text-[10px] sm:text-[12px] font-semibold rounded-md sm:rounded-lg transition-all duration-200 whitespace-nowrap shrink-0"
              style={
                activeTab === tab
                  ? {
                      background: "rgba(124,111,255,0.15)",
                      color: "#7c6fff",
                      border: "1px solid rgba(124,111,255,0.3)",
                      fontFamily: "'Syne', sans-serif",
                      letterSpacing: "0.3px",
                    }
                  : {
                      background: "transparent",
                      color: "#5a5f78",
                      border: "1px solid transparent",
                      fontFamily: "'Syne', sans-serif",
                      letterSpacing: "0.3px",
                    }
              }
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* ── Section Label ── */}
      <div className="flex items-center gap-2 sm:gap-3">
        <h2
          className="text-[9px] sm:text-[11px] font-semibold uppercase tracking-[1.5px] shrink-0"
          style={{ color: "#5a5f78" }}
        >
          {activeTab} — Value Over Time
        </h2>
        <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.04)" }} />
      </div>
  
      {/* ── Mobile Card Layout ── */}
           <div className="sm:hidden overflow-hidden">
        <div style={{ maxHeight: "75vh", overflow: "auto" }} className="space-y-2 px-0.5">
          {staticTabs.includes(activeTab) && (
            <div className="p-10 text-center text-[10px] rounded-xl border border-borderColor bg-cardBg" style={{ color: "#5a5f78" }}>{activeTab} data coming soon...</div>
          )}

          {!staticTabs.includes(activeTab) && loading && (
            <div className="animate-pulse space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="rounded-xl border border-borderColor/40 bg-cardBg p-3.5">
                  <div className="flex justify-between">
                    <div className="space-y-2"><div className="h-3 w-28 bg-white/[0.06] rounded-md" /><div className="h-2 w-16 bg-white/[0.04] rounded-md" /></div>
                    <div className="space-y-2 text-right"><div className="h-3 w-16 bg-white/[0.06] rounded-md ml-auto" /><div className="h-2 w-20 bg-white/[0.04] rounded-md ml-auto" /></div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!staticTabs.includes(activeTab) && !loading && currentData.map((item, i) => {
            const token = String(item.scripCode);
            const live = liveData[token];
            const initialPrice = Number(item.initialPrice);
            const targetPrice = Number(item.targetPrice);
            const hasInitial = Number.isFinite(initialPrice) && initialPrice > 0;
            const hasTarget = Number.isFinite(targetPrice) && targetPrice > 0;
            const hasLtp = Number.isFinite(Number(live?.LastRate)) && Number(live?.LastRate) > 0;
            const isUp = live && live.LastRate > live.PClose;
            const exchLabel = item.exchange === "B" ? "BSE" : item.exchange === "N" ? "NSE" : "MCX";
            let targetProgressPct = null;
            if (hasInitial && hasTarget && hasLtp && targetPrice !== initialPrice) {
              targetProgressPct = ((Number(live.LastRate) - initialPrice) / (targetPrice - initialPrice)) * 100;
            }
            const targetColor = targetProgressPct == null ? "#5a5f78" : targetProgressPct >= 100 ? "#22d38a" : targetProgressPct >= 0 ? "#7c6fff" : "#ff4d6a";
            const changePct = live?.ChgPcnt;
            const changeAbs = live ? (live.LastRate - live.PClose) : null;

            return (
              <div
                key={item.stockId || i}
                onClick={() => navigate(`/stock/${item.exchange}/${item.exchangeType}/${item.scripCode}/${item.symbol}`)}
                className="rounded-xl border border-borderColor/60 bg-cardBg active:bg-white/[0.02] cursor-pointer overflow-hidden"
                style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.2)", margin:"10px" }}
              >
                {/* Main content */}
                <div className="px-3.5 pt-3 pb-2.5">
                  {/* Header: Name + LTP */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-[12px] font-bold tracking-tight truncate" style={{ fontFamily: "'Syne', sans-serif", color: "#f0f2f8" }}>{item.name}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span
                          className="text-[7px] font-bold uppercase tracking-[0.8px] rounded-[4px] px-1.5 py-[2px]"
                          style={{ background: "rgba(124,111,255,0.15)", color: "#9d8fff", border: "1px solid rgba(124,111,255,0.15)" }}
                        >{exchLabel}</span>
                        <span className="text-[9px] font-medium tracking-wide" style={{ color: "#6b7094" }}>{item.symbol}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[14px] font-bold tracking-tight" style={{ fontFamily: "'JetBrains Mono', monospace", color: isUp ? "#22d38a" : "#ff4d6a" }}>
                        ₹{live ? formatNumber(live.LastRate) : "—"}
                      </p>
                      <div className="flex items-center justify-end gap-1 mt-0.5">
                        {changePct != null && (
                          <span
                            className="text-[9px] font-semibold px-1.5 py-[1px] rounded-[4px]"
                            style={{
                              color: isUp ? "#22d38a" : "#ff4d6a",
                              background: isUp ? "rgba(34,211,138,0.1)" : "rgba(255,77,106,0.1)",
                            }}
                          >
                            {isUp ? "+" : ""}{changePct.toFixed(2)}%
                          </span>
                        )}
                        <span className="text-[9px] font-medium" style={{ fontFamily: "'JetBrains Mono', monospace", color: isUp ? "#22d38a80" : "#ff4d6a80" }}>
                          {changeAbs != null ? `${isUp ? "+" : ""}${changeAbs.toFixed(2)}` : ""}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Stats grid */}
                  <div
                    className="grid grid-cols-4 gap-1 mt-2.5 rounded-lg px-2 py-2"
                    style={{ background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.04)" }}
                  >
                    {[
                      { label: "HIGH", value: live ? formatNumber(live.High) : "—" },
                      { label: "LOW", value: live ? formatNumber(live.Low) : "—" },
                      { label: "OPEN", value: live ? formatNumber(live.OpenRate) : "—" },
                      { label: "CLOSE", value: live ? formatNumber(live.PClose) : "—" },
                    ].map((s) => (
                      <div key={s.label} className="text-center">
                        <p className="text-[7px] font-semibold uppercase tracking-[0.8px]" style={{ color: "#4a4f68" }}>{s.label}</p>
                        <p className="text-[10px] font-semibold mt-px" style={{ fontFamily: "'JetBrains Mono', monospace", color: "#c8cce0" }}>{s.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Target progress bar */}
                  {targetProgressPct != null && (
                    <div className="mt-2.5">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[7px] font-semibold uppercase tracking-[0.8px]" style={{ color: "#4a4f68" }}>Target Progress</span>
                        <span className="text-[9px] font-bold" style={{ fontFamily: "'JetBrains Mono', monospace", color: targetColor }}>
                          {targetProgressPct.toFixed(1)}%
                        </span>
                      </div>
                      <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(Math.max(targetProgressPct, 0), 100)}%`,
                            background: targetColor,
                            boxShadow: `0 0 8px ${targetColor}40`,
                          }}
                        />
                      </div>
                      <div className="flex justify-between mt-1 text-[7px]" style={{ fontFamily: "'JetBrains Mono', monospace", color: "#4a4f68" }}>
                        <span>{hasInitial ? `₹${formatNumber(initialPrice.toFixed(0))}` : "—"}</span>
                        <span style={{ color: "#7c6fff" }}>{hasTarget ? `₹${formatNumber(targetPrice.toFixed(0))}` : "—"}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action bar */}
                <div
                  className="flex items-center gap-0 border-t"
                  style={{ borderColor: "rgba(255,255,255,0.04)", background: "rgba(255,255,255,0.01)" }}
                >
                  <button
                    onClick={(e) => { e.stopPropagation(); setSelectedStock(item); setTradeAction("BUY"); setIsModalOpen(true); }}
                    className="flex-1 py-2 text-[10px] font-bold tracking-wide transition-colors active:bg-white/[0.03]"
                    style={{ color: "#22d38a", borderRight: "1px solid rgba(255,255,255,0.04)" }}
                  >BUY</button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setSelectedStock(item); setTradeAction("SELL"); setIsModalOpen(true); }}
                    className="flex-1 py-2 text-[10px] font-bold tracking-wide transition-colors active:bg-white/[0.03]"
                    style={{ color: "#ff4d6a", borderRight: "1px solid rgba(255,255,255,0.04)" }}
                  >SELL</button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setTargetStock(item); setIsTargetModalOpen(true); }}
                    className="flex-1 py-2 text-[10px] font-bold tracking-wide transition-colors active:bg-white/[0.03]"
                    style={{ color: "#7c6fff", borderRight: "1px solid rgba(255,255,255,0.04)" }}
                  >TARGET</button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleRemove(item); }}
                    className="px-4 py-2 transition-colors active:bg-white/[0.03]"
                  >
                    <FiTrash2 size={12} style={{ color: "#ff4d6a" }} />
                  </button>
                </div>
              </div>
            );
          })}

          {!staticTabs.includes(activeTab) && !loading && currentData.length === 0 && (
            <div className="p-10 text-center rounded-xl border border-borderColor bg-cardBg">
              <p className="text-[10px] font-medium" style={{ color: "#5a5f78" }}>No stocks in this watchlist</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Desktop Table ── */}
      <div
        className="hidden sm:block rounded-[20px] border border-borderColor overflow-hidden bg-cardBg overflow-x-auto"
        style={{ maxWidth: "99vw" }}
      >
        <div className="min-w-[900px]">

          {/* Header */}
          <div
            className="grid px-5 py-3 border-b border-borderColor"
            style={{ gridTemplateColumns: "2fr 1.2fr 1fr 1fr 1fr 1fr", background: "rgba(255,255,255,0.02)" }}
          >
            {[
              { main: "Name", left: true },
              { main: "LTP", sub: "Change (%)" },
              { main: "High / Low", sub: "Range" },
              { main: "Open", sub: "Prev Close" },
              { main: "Initial / Target", sub: "Price" },
              { main: "Target %", sub: "Progress" },
            ].map((col, i) => (
              <span
                key={i}
                className={`text-[10px] font-semibold uppercase tracking-[1px] ${col.left ? "text-left" : "text-center"}`}
                style={{ color: "#5a5f78" }}
              >
                {col.main}
                {col.sub && (
                  <div className="text-[9px] font-normal tracking-[0.5px] mt-0.5" style={{ color: "rgba(90,95,120,0.7)", textTransform: "none" }}>{col.sub}</div>
                )}
              </span>
            ))}
          </div>

          {/* Body */}
          <div style={{ maxHeight: "65vh", overflow: "auto" }}>
            {staticTabs.includes(activeTab) && (
              <div className="p-12 text-center text-[13px]" style={{ color: "#5a5f78" }}>{activeTab} data coming soon...</div>
            )}

            {!staticTabs.includes(activeTab) && loading && (
              <div className="animate-pulse">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="grid px-5 py-4 border-b border-borderColor" style={{ gridTemplateColumns: "2fr 1.2fr 1fr 1fr 1fr 1fr" }}>
                    <div className="space-y-2">
                      <div className="h-3 w-32 bg-borderColor rounded" />
                      <div className="h-2 w-20 bg-borderColor rounded" />
                    </div>
                    {[...Array(5)].map((__, j) => (
                      <div key={j} className="flex flex-col items-center gap-2">
                        <div className="h-3 w-16 bg-borderColor rounded" />
                        <div className="h-2 w-12 bg-borderColor rounded" />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}

            {!staticTabs.includes(activeTab) && !loading &&
              currentData.map((item, i) => {
                const token = String(item.scripCode);
                const live = liveData[token];
                const initialPrice = Number(item.initialPrice);
                const targetPrice = Number(item.targetPrice);
                const hasInitial = Number.isFinite(initialPrice) && initialPrice > 0;
                const hasTarget = Number.isFinite(targetPrice) && targetPrice > 0;
                const hasLtp = Number.isFinite(Number(live?.LastRate)) && Number(live?.LastRate) > 0;
                const isUp = live && live.LastRate > live.PClose;
                const exchLabel = item.exchange === "B" ? "BSE" : item.exchange === "N" ? "NSE" : "MCX";
                let targetProgressPct = null;
                if (hasInitial && hasTarget && hasLtp && targetPrice !== initialPrice) {
                  targetProgressPct = ((Number(live.LastRate) - initialPrice) / (targetPrice - initialPrice)) * 100;
                }
                const targetColor = targetProgressPct == null ? "#5a5f78" : targetProgressPct >= 100 ? "#22d38a" : targetProgressPct >= 0 ? "#7c6fff" : "#ff4d6a";

                return (
                  <div
                    key={item.stockId || i}
                    onClick={() => navigate(`/stock/${item.exchange}/${item.exchangeType}/${item.scripCode}/${item.symbol}`)}
                    className="relative group grid px-5 py-4 border-b border-borderColor items-center text-center transition-all duration-150 hover:bg-white/[0.025] cursor-pointer"
                    style={{ gridTemplateColumns: "2fr 1.2fr 1fr 1fr 1fr 1fr" }}
                  >
                    <div className="text-left flex flex-col justify-center">
                      <p className="text-[13px] font-semibold tracking-tight" style={{ fontFamily: "'Syne', sans-serif", color: "#f0f2f8" }}>{item.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[9px] font-semibold tracking-[0.5px] rounded px-1.5 py-0.5" style={{ background: "rgba(124,111,255,0.12)", color: "#7c6fff" }}>{exchLabel}</span>
                        <span className="text-[11px] font-medium" style={{ color: "#5a5f78" }}>{item.symbol}</span>
                        <button onClick={(e) => { e.stopPropagation(); setTargetStock(item); setIsTargetModalOpen(true); }} className="text-[9px] font-semibold px-2 py-0.5 rounded-full transition-all duration-150" style={{ border: "1px solid rgba(34,211,138,0.3)", color: "#22d38a", background: "rgba(34,211,138,0.06)", letterSpacing: "0.3px" }}>Set Target</button>
                      </div>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-[15px] font-semibold tracking-tight" style={{ fontFamily: "'JetBrains Mono', 'IBM Plex Mono', monospace", color: isUp ? "#22d38a" : "#ff4d6a" }}>₹ {live ? formatNumber(live.LastRate) : "—"}</span>
                      <span className="text-[15px] font-medium" style={{ fontFamily: "'JetBrains Mono', 'IBM Plex Mono', monospace", color: isUp ? "#22d38a" : "#ff4d6a" }}>{live ? `${isUp ? "+" : ""}${(live.LastRate - live.PClose).toFixed(2)} (${live.ChgPcnt.toFixed(2)}%)` : "—"}</span>
                    </div>
                    <div className="text-[12.5px] mx-auto w-[120px] font-medium" style={{ fontFamily: "'JetBrains Mono', 'IBM Plex Mono', monospace" }}>
                      <div className="flex justify-between pb-1 mb-1" style={{ borderBottom: "1px solid rgba(186,186,186,0.08)" }}><span style={{ color: "#5a5f78" }}>H</span><span style={{ color: "#f0f2f8" }}>{live ? formatNumber(live.High) : "—"}</span></div>
                      <div className="flex justify-between"><span style={{ color: "#5a5f78" }}>L</span><span style={{ color: "#f0f2f8" }}>{live ? formatNumber(live.Low) : "—"}</span></div>
                    </div>
                    <div className="text-[12.5px] mx-auto w-[120px] font-medium" style={{ fontFamily: "'JetBrains Mono', 'IBM Plex Mono', monospace" }}>
                      <div className="flex justify-between pb-1 mb-1" style={{ borderBottom: "1px solid rgba(186,186,186,0.08)" }}><span style={{ color: "#5a5f78" }}>O</span><span style={{ color: "#f0f2f8" }}>{live ? formatNumber(live.OpenRate) : "—"}</span></div>
                      <div className="flex justify-between"><span style={{ color: "#5a5f78" }}>PC</span><span style={{ color: "#f0f2f8" }}>{live ? formatNumber(live.PClose) : "—"}</span></div>
                    </div>
                    <div className="text-[12.5px] mx-auto w-[130px] font-medium" style={{ fontFamily: "'JetBrains Mono', 'IBM Plex Mono', monospace" }}>
                      <div className="flex justify-between pb-1 mb-1" style={{ borderBottom: "1px solid rgba(186,186,186,0.08)" }}><span style={{ color: "#5a5f78" }}>I</span><span style={{ color: "#f0f2f8" }}>{hasInitial ? `₹ ${formatNumber(initialPrice.toFixed(2))}` : "—"}</span></div>
                      <div className="flex justify-between"><span style={{ color: "#7c6fff" }}>T</span><span style={{ color: "#7c6fff" }}>{hasTarget ? `₹ ${formatNumber(targetPrice.toFixed(2))}` : "—"}</span></div>
                    </div>
                    <div className="flex justify-center items-center">
                      <span className="inline-flex items-center px-3 py-1.5 rounded-full text-[12.5px] font-semibold tracking-tight" style={{ fontFamily: "'JetBrains Mono', 'IBM Plex Mono', monospace", color: targetColor, background: targetProgressPct == null ? "transparent" : targetProgressPct >= 100 ? "rgba(34,211,138,0.08)" : targetProgressPct >= 0 ? "rgba(124,111,255,0.08)" : "rgba(255,77,106,0.08)", border: targetProgressPct == null ? "none" : `1px solid ${targetProgressPct >= 100 ? "rgba(34,211,138,0.2)" : targetProgressPct >= 0 ? "rgba(124,111,255,0.2)" : "rgba(255,77,106,0.2)"}` }}>
                        {targetProgressPct == null ? "—" : `${targetProgressPct.toFixed(2)}%`}
                      </span>
                    </div>
                    <div style={{ background: "linear-gradient(to right, rgba(23,29,44,0) 0%, rgba(23,29,44,0.7) 50%, rgba(23,29,44,1) 100%)", height: "100%", paddingLeft: "10vh" }} className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200">
                      <button onClick={(e) => { e.stopPropagation(); setSelectedStock(item); setTradeAction("BUY"); setIsModalOpen(true); }} className="px-3 py-1 text-[11px] font-semibold rounded-lg transition" style={{ border: "1px solid rgba(34,211,138,0.3)", background: "rgba(34,211,138,0.07)", color: "#22d38a" }}>Buy</button>
                      <button onClick={(e) => { e.stopPropagation(); setSelectedStock(item); setTradeAction("SELL"); setIsModalOpen(true); }} className="px-3 py-1 text-[11px] font-semibold rounded-lg transition" style={{ border: "1px solid rgba(255,77,106,0.3)", background: "rgba(255,77,106,0.07)", color: "#ff4d6a" }}>Sell</button>
                      <button onClick={(e) => { e.stopPropagation(); handleRemove(item); }} className="p-1.5 rounded-lg transition" style={{ background: "rgba(255,77,106,0.07)", border: "1px solid rgba(255,77,106,0.2)" }}><FiTrash2 size={13} style={{ color: "#ff4d6a" }} /></button>
                    </div>
                  </div>
                );
              })}

            {!staticTabs.includes(activeTab) && !loading && currentData.length === 0 && (
              <div className="p-12 text-center text-[13px]" style={{ color: "#5a5f78" }}>No stocks in this watchlist</div>
            )}
          </div>
        </div>
      </div>
  
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
        />
      )}
  
      {targetStock && (
        <SetTargetModal
          isOpen={isTargetModalOpen}
          onClose={() => { if (savingTarget) return; setIsTargetModalOpen(false); setTargetStock(null); }}
          onSubmit={handleSetTarget}
          stockName={targetStock.name}
          symbol={targetStock.symbol}
          currentLtp={
            liveData[String(targetStock.scripCode)]?.LastRate
              ? formatNumber(liveData[String(targetStock.scripCode)]?.LastRate)
              : null
          }
          initialTargetPrice={
            Number.isFinite(Number(targetStock.targetPrice))
              ? Number(targetStock.targetPrice)
              : undefined
          }
          loading={savingTarget}
        />
      )}
  
    </div>
  );
}

export default Watchlist;