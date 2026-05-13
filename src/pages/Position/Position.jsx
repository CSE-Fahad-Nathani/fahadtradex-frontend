import { useState, useEffect } from "react";
import useMarketFeed from "../../hooks/useMarketFeed";
import { useMarketStore } from "../../store/marketStore";
import { formatNumber } from "../../utils/formatNumber";
import TradeModal from "../../components/trading/TradeModal";
import { useNavigate } from "react-router-dom";
import { fetchUserData } from "../../services/user.service";
import { TrendingUp, TrendingDown, Layers, Clock } from "lucide-react";

function Position({ triggerPositionUpdate, setTriggerPositionUpdate }) {
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);

  const liveData = useMarketStore((s) => s.data);
  const [selectedStock, setSelectedStock] = useState(null);
  const [tradeAction, setTradeAction] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchPositions = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/positions`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const result = await res.json();
        if (result.success) setPositions(result.data);
      } catch (err) {
        console.error("Positions fetch error:", err);
      } finally {
        setLoading(false);
        fetchUserData();
      }
    };
    fetchPositions();
  }, [triggerPositionUpdate]);

  const scrips =
    positions.length > 0
      ? positions.map((item) => ({
          Exch: item.Exch,
          ExchType: item.ExchType || "C",
          ScripCode: Number(item.ScripCode),
        }))
      : [];

  useMarketFeed({
    accessToken: localStorage.getItem("fivePaisaAccessToken"),
    clientCode: localStorage.getItem("clientCode"),
    scrips,
  });

  const positionTotals = positions.reduce(
    (acc, item) => {
      const token = String(item.ScripCode);
      const live = liveData[token];
      const ltp = Number(live?.LastRate || 0);
      const prev = Number(live?.PClose || ltp);
      const avg = Number(item.avgPrice || 0);
      const isMCX = item.Exch === "M";
      const qty = Number(isMCX ? item.lots || item.totalQty || 0 : item.totalQty || 0);
      const multiplier = Number(item.multiplier || 1);
      const investedForValue = isMCX ? 0.15 * avg * multiplier * qty : avg * qty;
      const pnl = isMCX ? (ltp - avg) * multiplier * qty : (ltp - avg) * qty;
      const currentValue = investedForValue + pnl;
      const investedForReturn = isMCX ? avg * multiplier * qty : avg * qty;
      const todayPL = isMCX ? (ltp - prev) * multiplier * qty : (ltp - prev) * qty;
      acc.qty += qty;
      acc.currentValue += currentValue;
      acc.investedForValue += investedForValue;
      acc.pnl += pnl;
      acc.investedForReturn += investedForReturn;
      acc.todayPL += todayPL;
      return acc;
    },
    { qty: 0, currentValue: 0, investedForValue: 0, pnl: 0, investedForReturn: 0, todayPL: 0 }
  );

  const getExpiryMeta = (expiry) => {
    if (!expiry) return null;
    const today = new Date();
    const exp = new Date(expiry);
    today.setHours(0, 0, 0, 0);
    exp.setHours(0, 0, 0, 0);
    const diffTime = exp - today;
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    let color = "#22c55e";
    let label = `${days} days`;
    if (days < 0) { color = "#6b7280"; label = "Expired"; }
    else if (days <= 2) color = "#ef4444";
    else if (days <= 5) color = "#f59e0b";
    return { days, color, label };
  };

  // ── Card data ──
  const pnlPositive = positionTotals.pnl >= 0;
  const todayPositive = positionTotals.todayPL >= 0;
  const pnlPct = positionTotals.investedForReturn > 0
    ? ((positionTotals.pnl / positionTotals.investedForReturn) * 100).toFixed(2)
    : null;
  const todayPct = positionTotals.investedForReturn > 0
    ? ((positionTotals.todayPL / positionTotals.investedForReturn) * 100).toFixed(2)
    : null;

  const cards = [
    {
      label: "Margin Used",
      sub: "Blocked Capital (≈15%)",
      value: `₹ ${formatNumber(positionTotals.investedForValue.toFixed(2))}`,
      badge: null,
      badgePositive: null,
      icon: Layers,
      iconColor: "#7c6fff",
      iconBg: "rgba(124,111,255,0.12)",
      accentColor: "#7c6fff",
      glowColor: "rgba(124,111,255,0.12)",
    },
    {
      label: "Current Value",
      sub: "Real-time Market Value",
      value: `₹ ${formatNumber(positionTotals.currentValue.toFixed(2))}`,
      badge: null,
      badgePositive: null,
      icon: TrendingUp,
      iconColor: "#38bdf8",
      iconBg: "rgba(56,189,248,0.12)",
      accentColor: "#38bdf8",
      glowColor: "rgba(56,189,248,0.10)",
    },
    {
      label: "Total P&L",
      sub: "Overall Return",
      value: `₹ ${formatNumber(positionTotals.pnl.toFixed(2))}`,
      badge: pnlPct ? `${pnlPositive ? "+" : ""}${pnlPct}%` : "—",
      badgePositive: pnlPositive,
      icon: pnlPositive ? TrendingUp : TrendingDown,
      iconColor: pnlPositive ? "#22d38a" : "#ff4d6a",
      iconBg: pnlPositive ? "rgba(34,211,138,0.12)" : "rgba(255,77,106,0.12)",
      accentColor: pnlPositive ? "#22d38a" : "#ff4d6a",
      glowColor: pnlPositive ? "rgba(34,211,138,0.10)" : "rgba(255,77,106,0.08)",
      valueColor: pnlPositive ? "#22d38a" : "#ff4d6a",
    },
    {
      label: "Today's P&L",
      sub: "Intraday Movement",
      value: `₹ ${formatNumber(positionTotals.todayPL.toFixed(2))}`,
      badge: todayPct ? `${todayPositive ? "+" : ""}${todayPct}%` : "—",
      badgePositive: todayPositive,
      icon: Clock,
      iconColor: todayPositive ? "#22d38a" : "#ff4d6a",
      iconBg: todayPositive ? "rgba(34,211,138,0.12)" : "rgba(255,77,106,0.12)",
      accentColor: todayPositive ? "#22d38a" : "#ff4d6a",
      glowColor: todayPositive ? "rgba(34,211,138,0.10)" : "rgba(255,77,106,0.08)",
      valueColor: todayPositive ? "#22d38a" : "#ff4d6a",
    },
  ];

  return (
    <div className="flex flex-col gap-7 p-6" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* ── Header ── */}
      <div className="flex items-end justify-between">
        <h1
          style={{
            fontFamily: "'Syne', sans-serif",
            fontWeight: 800,
            fontSize: 22,
            letterSpacing: "-0.5px",
            background: "linear-gradient(135deg, #fff 40%, #7c6fff)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Positions
        </h1>
        <span className="text-[11px] tracking-wide" style={{ color: "#5a5f78" }}>
          *Commodity &amp; Intraday (Includes Derivatives)
        </span>
      </div>

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {loading
          ? [...Array(4)].map((_, i) => (
              <div key={i} className="rounded-[20px] p-5 animate-pulse border border-borderColor bg-cardBg">
                <div className="flex items-center justify-between mb-5">
                  <div className="h-3 w-20 bg-borderColor rounded" />
                  <div className="h-8 w-8 bg-borderColor rounded-xl" />
                </div>
                <div className="h-7 w-36 bg-borderColor rounded mb-3" />
                <div className="h-5 w-16 bg-borderColor rounded" />
              </div>
            ))
          : cards.map((card, i) => {
              const Icon = card.icon;
              return (
                <div
                  key={i}
                  className="relative overflow-hidden rounded-[20px] border border-borderColor transition-all duration-200 hover:-translate-y-1"
                  style={{
                    background: "linear-gradient(145deg, #0d0f18 0%, #0a0c13 100%)",
                    borderColor: "rgba(255,255,255,0.07)",
                    padding: "20px 22px 18px",
                  }}
                >
                  {/* Glow */}
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: `radial-gradient(ellipse at top right, ${card.glowColor} 0%, transparent 65%)`,
                    }}
                  />

                  {/* Top accent line */}
                  <div
                    className="absolute top-0 left-6 right-6 h-[1px]"
                    style={{
                      background: `linear-gradient(90deg, transparent, ${card.accentColor}60, transparent)`,
                    }}
                  />

                  {/* Header row: label + icon */}
                  <div className="relative flex items-center justify-between mb-4">
                    <p
                      className="text-[11px] font-semibold uppercase tracking-[1.4px]"
                      style={{ color: "#5a5f78" }}
                    >
                      {card.label}
                    </p>
                    <div
                      className="flex items-center justify-center w-9 h-9 rounded-xl flex-shrink-0"
                      style={{ background: card.iconBg, border: `1px solid ${card.iconColor}25` }}
                    >
                      <Icon size={16} style={{ color: card.iconColor }} />
                    </div>
                  </div>

                  {/* Value */}
                  <p
                    className="relative text-[22px] font-bold tracking-tight leading-none mb-3"
                    style={{
                      fontFamily: "'IBM Plex Mono', monospace",
                      color: card.valueColor || "#f0f2f8",
                    }}
                  >
                    {card.value}
                  </p>

                  {/* Footer: sub label + badge */}
                  <div className="relative flex items-center justify-between">
                    <span className="text-[11px]" style={{ color: "#5a5f78" }}>
                      {card.sub}
                    </span>
                    {card.badge && (
                      <span
                        className="text-[12px] font-bold px-2.5 py-1 rounded-lg"
                        style={{
                          background: card.badgePositive
                            ? "rgba(34,211,138,0.12)"
                            : "rgba(255,77,106,0.12)",
                          color: card.badgePositive ? "#22d38a" : "#ff4d6a",
                          border: `1px solid ${card.badgePositive ? "rgba(34,211,138,0.2)" : "rgba(255,77,106,0.2)"}`,
                          fontFamily: "'IBM Plex Mono', monospace",
                        }}
                      >
                        {card.badge}
                      </span>
                    )}
                  </div>

                  {/* Bottom accent bar */}
                  <div
                    className="absolute bottom-0 left-0 right-0 h-[2px]"
                    style={{
                      background: `linear-gradient(90deg, transparent, ${card.accentColor}50, transparent)`,
                    }}
                  />
                </div>
              );
            })}
      </div>

      {/* ── Table ── */}
      <div className="rounded-[20px] border border-borderColor overflow-hidden bg-cardBg overflow-x-auto">
        <div className="min-w-[900px]">

          {/* Header */}
          <div
            className="grid px-5 py-3 border-b border-borderColor text-center"
            style={{ gridTemplateColumns: "2fr 1.1fr 0.9fr 1fr 1.2fr 1.2fr", background: "rgba(255,255,255,0.02)" }}
          >
            {[
              { main: "Name", sub: null, left: true },
              { main: "LTP", sub: "Change (%)" },
              { main: "Qty", sub: "Lot Size" },
              { main: "Avg Price", sub: "Per Unit" },
              { main: "Current Value", sub: "Buy Value" },
              { main: "P&L", sub: "Return %" },
            ].map((col, i) => (
              <span
                key={i}
                className={`text-[10px] font-semibold uppercase tracking-[1px] ${col.left ? "text-left" : ""}`}
                style={{ color: "#5a5f78" }}
              >
                {col.main}
                {col.sub && (
                  <div className="text-[9px] font-normal tracking-[0.5px] mt-0.5" style={{ color: "rgba(90,95,120,0.7)", textTransform: "none" }}>
                    {col.sub}
                  </div>
                )}
              </span>
            ))}
          </div>

          <div style={{ maxHeight: "45vh", overflow: "auto" }}>
            {/* Loading skeleton */}
            {loading && (
              <div className="animate-pulse">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="grid px-5 py-4 border-b border-borderColor" style={{ gridTemplateColumns: "2fr 1.1fr 0.9fr 1fr 1.2fr 1.2fr" }}>
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

            {/* Rows */}
            {!loading && positions.map((item, i) => {
              const token = String(item.ScripCode);
              const live = liveData[token];
              const ltp = live?.LastRate || 0;
              const avg = item.avgPrice || 0;
              const isMCX = item.Exch === "M";
              const lots = item.lots || item.totalQty || 0;
              const multiplier = item.multiplier || 1;
              const exchLabel = item.Exch === "B" ? "BSE" : item.Exch === "N" ? "NSE" : "MCX";
              const expiryMeta = getExpiryMeta(item.expiry);
              const pnl = isMCX ? (ltp - avg) * multiplier * lots : (ltp - avg) * lots;
              const invested = isMCX ? avg * multiplier * lots : avg * lots;
              const isProfit = pnl >= 0;
              const ltpUp = live?.LastRate > live?.PClose;
              let currentValue, investedDisplay;
              if (isMCX) {
                investedDisplay = 0.15 * avg * multiplier * lots;
                currentValue = investedDisplay + pnl;
              } else {
                currentValue = ltp * lots;
                investedDisplay = avg * lots;
              }

              return (
                <div
                  key={i}
                  onClick={() => navigate(`/stock/${item.Exch}/${item.ExchType}/${item.ScripCode}/${item.symbol}`)}
                  className="relative group grid px-5 py-4 border-b border-borderColor items-center text-center transition-all duration-150 hover:bg-white/[0.025] cursor-pointer"
                  style={{ gridTemplateColumns: "2fr 1.1fr 0.9fr 1fr 1.2fr 1.2fr" }}
                >
                  {/* NAME */}
                  <div className="text-left">
                    <p className="text-[13px] font-semibold tracking-tight" style={{ fontFamily: "'Syne', sans-serif", color: "#f0f2f8" }}>
                      {item.name}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-[9px] font-semibold tracking-[0.5px] rounded px-1.5 py-0.5" style={{ background: "rgba(124,111,255,0.12)", color: "#7c6fff" }}>
                        {exchLabel}
                      </span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px]" style={{ color: "#5a5f78" }}>{item.symbol}</span>
                        {expiryMeta && (
                          <span className="text-[12px] px-2 py-[2px] rounded-md font-medium" style={{ background: `${expiryMeta.color}15`, color: expiryMeta.color, border: `1px solid ${expiryMeta.color}30` }}>
                            {expiryMeta.label}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* LTP */}
                  <div className="flex flex-col items-center">
                    <span className="text-[15px] font-semibold" style={{ fontFamily: "'IBM Plex Mono', monospace", color: ltpUp ? "#22d38a" : "#ff4d6a" }}>
                      ₹ {live ? formatNumber(live.LastRate) : "0.00"}
                    </span>
                    <span className="text-[15px] mt-0.5" style={{ fontFamily: "'IBM Plex Mono', monospace", color: ltpUp ? "#22d38a" : "#ff4d6a" }}>
                      {live ? `${live.LastRate - live.PClose >= 0 ? "+" : ""}${(live.LastRate - live.PClose).toFixed(2)} (${live.ChgPcnt.toFixed(2)}%)` : "—"}
                    </span>
                  </div>

                  {/* QTY */}
                  <div className="flex flex-col items-center">
                    {isMCX ? (
                      <>
                        <span className="text-[15px]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{item.lots}</span>
                        <span className="text-[12px] mt-0.5" style={{ color: "#5a5f78" }}>Lot: {formatNumber(item.multiplier || item.lotSize)}</span>
                      </>
                    ) : (
                      <span className="text-[15px]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{formatNumber(item.totalQty)}</span>
                    )}
                  </div>

                  {/* AVG PRICE */}
                  <div className="flex flex-col items-center">
                    <span className="text-[15px]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                      ₹ {formatNumber(Number(item.avgPrice || 0).toFixed(2))}
                    </span>
                    <span className="text-[12px] mt-0.5" style={{ color: "#5a5f78" }}>{isMCX ? "Per Unit" : "Per Share"}</span>
                  </div>

                  {/* CURRENT VALUE */}
                  <div className="flex flex-col items-center">
                    <span className="text-[15px]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                      ₹ {live ? formatNumber(currentValue.toFixed(2)) : "—"}
                    </span>
                    <span className="text-[15px] mt-0.5" style={{ color: "#5a5f78" }}>
                      ₹ {formatNumber(investedDisplay.toFixed(2))}
                    </span>
                  </div>

                  {/* P&L */}
                  <div className="flex flex-col items-center gap-1">
                    <span className="inline-flex items-center px-2.5 pt-1 rounded-full text-[15px] font-semibold" style={{ fontFamily: "'IBM Plex Mono', monospace", color: isProfit ? "#22d38a" : "#ff4d6a" }}>
                      ₹ {isProfit ? "+" : ""}{formatNumber(pnl.toFixed(2))}
                    </span>
                    <span className="text-[15px]" style={{ color: isProfit ? "#22d38a" : "#ff4d6a" }}>
                      ({invested > 0 ? `${((pnl / invested) * 100).toFixed(2)}%` : "—"})
                    </span>
                  </div>

                  {/* HOVER ACTIONS */}
                  <div
                    style={{ background: "linear-gradient(to right, rgba(23,29,44,0) 0%, rgba(23,29,44,0.7) 50%, rgba(23,29,44,1) 100%)", height: "100%", paddingLeft: "10vh" }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200"
                  >
                    <button onClick={(e) => { e.stopPropagation(); setSelectedStock(item); setTradeAction("BUY"); setIsModalOpen(true); }} className="px-3 py-1 text-[11px] font-semibold rounded-lg transition" style={{ border: "1px solid rgba(34,211,138,0.3)", background: "rgba(34,211,138,0.07)", color: "#22d38a" }}>
                      Buy
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); setSelectedStock(item); setTradeAction("SELL"); setIsModalOpen(true); }} className="px-3 py-1 text-[11px] font-semibold rounded-lg transition" style={{ border: "1px solid rgba(255,77,106,0.3)", background: "rgba(255,77,106,0.07)", color: "#ff4d6a" }}>
                      Sell
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Total Row */}
          {!loading && positions.length > 0 && (
            <div
              className="grid px-5 py-4 items-center text-center"
              style={{ gridTemplateColumns: "2fr 1.1fr 0.9fr 1fr 1.2fr 1.2fr", background: "rgba(124,111,255,0.04)", borderTop: "1px solid rgba(124,111,255,0.15)" }}
            >
              <div className="text-left text-[12px] font-bold uppercase tracking-[1px]" style={{ fontFamily: "'Syne', sans-serif", color: "#7c6fff" }}>Total</div>
              <div style={{ color: "#5a5f78", fontFamily: "'IBM Plex Mono', monospace", fontSize: 13 }} />
              <div className="flex flex-col items-center">
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 15 }}>{formatNumber(positionTotals.qty)}</span>
              </div>
              <div style={{ color: "#5a5f78", fontFamily: "'IBM Plex Mono', monospace", fontSize: 13 }} />
              <div className="flex flex-col items-center">
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 15 }}>₹ {formatNumber(positionTotals.currentValue.toFixed(2))}</span>
                <span className="text-[15px] mt-0.5" style={{ color: "#5a5f78" }}>₹ {formatNumber(positionTotals.investedForValue.toFixed(2))}</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <span className="inline-flex items-center px-2.5 pt-1 rounded-full text-[15px] font-semibold" style={{ fontFamily: "'IBM Plex Mono', monospace", color: positionTotals.pnl >= 0 ? "#22d38a" : "#ff4d6a" }}>
                  ₹ {formatNumber(positionTotals.pnl.toFixed(2))}
                </span>
                <span className="text-[15px]" style={{ color: positionTotals.pnl >= 0 ? "#22d38a" : "#ff4d6a" }}>
                  ({positionTotals.investedForReturn > 0 ? `${((positionTotals.pnl / positionTotals.investedForReturn) * 100).toFixed(2)}%` : "—"})
                </span>
              </div>
            </div>
          )}

          {!loading && positions.length === 0 && (
            <div className="p-12 text-center" style={{ color: "#5a5f78", fontSize: 13 }}>No positions available</div>
          )}
        </div>
      </div>

      {selectedStock && (
        <TradeModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          scripCode={Number(selectedStock.ScripCode)}
          exchange={selectedStock.Exch}
          exchangeType={selectedStock.ExchType}
          symbol={selectedStock.symbol}
          name={selectedStock.name}
          action={tradeAction}
          avgPrice={selectedStock?.avgPrice}
          lotSize={Number(selectedStock?.lotSize)}
          multiplier={Number(selectedStock?.multiplier || selectedStock?.lotSize)}
          totalQty={selectedStock?.totalQty}
          lots={selectedStock?.lots}
          setTriggerPositionUpdate={setTriggerPositionUpdate}
        />
      )}
    </div>
  );
}

export default Position;