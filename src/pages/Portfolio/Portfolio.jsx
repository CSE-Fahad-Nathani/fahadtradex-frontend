import { useState, useEffect } from "react";
import useMarketFeed from "../../hooks/useMarketFeed";
import { useMarketStore } from "../../store/marketStore";
import { formatNumber } from "../../utils/formatNumber";
import TradeModal from "../../components/trading/TradeModal";
import { useNavigate } from "react-router-dom";
import { fetchUserData } from "../../services/user.service";
import { Wallet, TrendingUp, TrendingDown, Clock } from "lucide-react";

function Portfolio() {
  const [portfolio, setPortfolio] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStock, setSelectedStock] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tradeAction, setTradeAction] = useState("BUY");

  const liveData = useMarketStore((s) => s.data);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/portfolio`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const result = await res.json();
        if (result.success) setPortfolio(result.data);
      } catch (err) {
        console.error("Portfolio fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPortfolio();
  }, []);

  const scrips =
    portfolio.length > 0
      ? portfolio.map((item) => ({
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

  const portfolioTotals = portfolio.reduce(
    (acc, item) => {
      const token = String(item.ScripCode);
      const live = liveData[token];
      const qty = Number(item.totalQty || 0);
      const avg = Number(item.avgPrice || 0);
      const ltp = Number(live?.LastRate || 0);
      const prev = Number(live?.PClose || 0);
      const invested = Number(item.investedValue || avg * qty);
      const currentValue = ltp * qty;
      const pnl = currentValue - invested;
      const todayPL = (ltp - prev) * qty;
      acc.qty += qty;
      acc.currentValue += currentValue;
      acc.invested += invested;
      acc.pnl += pnl;
      acc.todayPL += todayPL;
      return acc;
    },
    { qty: 0, currentValue: 0, invested: 0, pnl: 0, todayPL: 0 }
  );

  useEffect(() => { fetchUserData(); }, []);

  // ── Card definitions ──
  const pnlPositive = portfolioTotals.pnl >= 0;
  const todayPositive = portfolioTotals.todayPL >= 0;
  const pnlPct = portfolioTotals.invested > 0
    ? ((portfolioTotals.pnl / portfolioTotals.invested) * 100).toFixed(2)
    : null;
  const todayPct = portfolioTotals.invested > 0
    ? ((portfolioTotals.todayPL / portfolioTotals.invested) * 100).toFixed(2)
    : null;

  const cards = [
    {
      label: "Invested",
      sub: "Total Buy Value",
      value: `₹ ${formatNumber(portfolioTotals.invested.toFixed(2))}`,
      badge: null,
      icon: Wallet,
      iconColor: "#7c6fff",
      iconBg: "rgba(124,111,255,0.12)",
      accentColor: "#7c6fff",
      glowColor: "rgba(124,111,255,0.12)",
    },
    {
      label: "Current Value",
      sub: "Live Market Value",
      value: `₹ ${formatNumber(portfolioTotals.currentValue.toFixed(2))}`,
      badge: null,
      icon: TrendingUp,
      iconColor: "#38bdf8",
      iconBg: "rgba(56,189,248,0.12)",
      accentColor: "#38bdf8",
      glowColor: "rgba(56,189,248,0.10)",
    },
    {
      label: "Total P&L",
      sub: "Overall Return",
      value: `₹ ${formatNumber(portfolioTotals.pnl.toFixed(2))}`,
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
      value: `₹ ${formatNumber(portfolioTotals.todayPL.toFixed(2))}`,
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
    <div className="flex flex-col gap-3 sm:gap-7 p-0 sm:p-6 max-w-full overflow-x-hidden" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* ── Header ── */}
      <div className="flex items-end justify-between px-1 sm:px-0">
        <h1
          className="text-base sm:text-[22px]"
          style={{
            fontFamily: "'Syne', sans-serif",
            fontWeight: 800,
            letterSpacing: "-0.5px",
            background: "linear-gradient(135deg, #fff 40%, #7c6fff)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Portfolio
        </h1>
        <span className="text-[8px] sm:text-[11px] tracking-wide" style={{ color: "#5a5f78" }}>
          *Equity Only (Excludes Positions)
        </span>
      </div>

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-1.5 sm:gap-4 px-0.5 sm:px-0">
        {loading
          ? [...Array(4)].map((_, i) => (
              <div key={i} className="rounded-xl sm:rounded-[20px] p-3 sm:p-5 animate-pulse border border-borderColor bg-cardBg">
                <div className="flex items-center justify-between mb-3 sm:mb-5">
                  <div className="h-2.5 sm:h-3 w-14 sm:w-20 bg-borderColor rounded" />
                  <div className="h-6 w-6 sm:h-8 sm:w-8 bg-borderColor rounded-lg sm:rounded-xl" />
                </div>
                <div className="h-5 sm:h-7 w-24 sm:w-36 bg-borderColor rounded mb-2 sm:mb-3" />
                <div className="h-3 sm:h-5 w-12 sm:w-16 bg-borderColor rounded" />
              </div>
            ))
          : cards.map((card, i) => {
              const Icon = card.icon;
              return (
                <div
                  key={i}
                  className="relative overflow-hidden rounded-xl sm:rounded-[20px] border border-borderColor bg-cardBg transition-all duration-200 hover:-translate-y-1 px-2.5 py-2 sm:p-[20px_22px_18px]"
                >
                  <div className="relative flex items-center justify-between mb-1 sm:mb-4">
                    <p className="text-[7px] sm:text-[11px] font-semibold uppercase tracking-[1.4px]" style={{ color: "#5a5f78" }}>{card.label}</p>
                    <div className="flex items-center justify-center w-5 h-5 sm:w-9 sm:h-9 rounded-md sm:rounded-xl shrink-0" style={{ background: card.iconBg, border: `1px solid ${card.iconColor}25` }}>
                      <Icon size={10} className="sm:hidden" style={{ color: card.iconColor }} />
                      <Icon size={16} className="hidden sm:block" style={{ color: card.iconColor }} />
                    </div>
                  </div>

                  <p className="relative text-[11px] sm:text-[22px] font-bold tracking-tight leading-none mb-1 sm:mb-3" style={{ fontFamily: "'IBM Plex Mono', monospace", color: card.valueColor || "#f0f2f8" }}>
                    {card.value}
                  </p>

                  <div className="relative flex items-center justify-between gap-1">
                    <span className="text-[7px] sm:text-[11px] hidden sm:inline" style={{ color: "#5a5f78" }}>{card.sub}</span>
                    {card.badge && (
                      <span className="text-[8px] sm:text-[12px] font-bold px-1 py-px sm:px-2.5 sm:py-1 rounded-sm sm:rounded-lg" style={{ background: card.badgePositive ? "rgba(34,211,138,0.12)" : "rgba(255,77,106,0.12)", color: card.badgePositive ? "#22d38a" : "#ff4d6a", border: `1px solid ${card.badgePositive ? "rgba(34,211,138,0.2)" : "rgba(255,77,106,0.2)"}`, fontFamily: "'IBM Plex Mono', monospace" }}>
                        {card.badge}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
      </div>

      {/* ── Mobile Card Layout ── */}
      <div className="sm:hidden overflow-hidden px-0.5">
        {/* Mobile Totals Banner */}
        {!loading && portfolio.length > 0 && (
          <div className="rounded-xl border border-borderColor/60 bg-cardBg mb-2 p-3" style={{ background: "rgba(124,111,255,0.03)", borderColor: "rgba(124,111,255,0.15)" }}>
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-bold uppercase tracking-[1px]" style={{ fontFamily: "'Syne', sans-serif", color: "#7c6fff" }}>Portfolio Total</span>
              <span className="text-[13px] font-bold tracking-tight" style={{ fontFamily: "'IBM Plex Mono', monospace", color: portfolioTotals.pnl >= 0 ? "#22d38a" : "#ff4d6a" }}>
                {portfolioTotals.pnl >= 0 ? "+" : ""}₹{formatNumber(portfolioTotals.pnl.toFixed(2))}
              </span>
            </div>
            <div className="flex items-center justify-between mt-1.5 text-[8px]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
              <span style={{ color: "#4a4f68" }}>Invested <span style={{ color: "#c8cce0" }}>₹{formatNumber(portfolioTotals.invested.toFixed(0))}</span></span>
              <span style={{ color: "#4a4f68" }}>Current <span style={{ color: "#c8cce0" }}>₹{formatNumber(portfolioTotals.currentValue.toFixed(0))}</span></span>
              <span className="px-1.5 py-px rounded-[4px] font-semibold" style={{ color: portfolioTotals.pnl >= 0 ? "#22d38a" : "#ff4d6a", background: portfolioTotals.pnl >= 0 ? "rgba(34,211,138,0.1)" : "rgba(255,77,106,0.1)" }}>
                {portfolioTotals.invested > 0 ? `${((portfolioTotals.pnl / portfolioTotals.invested) * 100).toFixed(2)}%` : "—"}
              </span>
            </div>
          </div>
        )}

        <div style={{ maxHeight: "65vh", overflow: "auto", }} className="space-y-2">
          {loading && (
            <div className="animate-pulse space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="rounded-xl border border-borderColor/40 bg-cardBg p-3.5" >
                  <div className="flex justify-between"><div className="space-y-2"><div className="h-3 w-28 bg-white/[0.06] rounded-md" /><div className="h-2 w-16 bg-white/[0.04] rounded-md" /></div><div className="space-y-2 text-right"><div className="h-3 w-16 bg-white/[0.06] rounded-md ml-auto" /><div className="h-2 w-20 bg-white/[0.04] rounded-md ml-auto" /></div></div>
                </div>
              ))}
            </div>
          )}

          {!loading && portfolio.map((item, i) => {
            const token = String(item.ScripCode);
            const live = liveData[token];
            const ltp = live?.LastRate || 0;
            const qty = item.totalQty || 0;
            const avg = item.avgPrice || 0;
            const currentValue = ltp * qty;
            const invested = item.investedValue || avg * qty;
            const pnl = currentValue - invested;
            const isProfit = pnl >= 0;
            const ltpUp = live?.LastRate > live?.PClose;
            const exchLabel = item.Exch === "B" ? "BSE" : item.Exch === "N" ? "NSE" : "MCX";
            const pnlPctRow = invested > 0 ? ((pnl / invested) * 100).toFixed(2) : null;

            return (
              <div
                key={i}
                onClick={() => navigate(`/stock/${item.Exch}/${item.ExchType}/${item.ScripCode}/${item.symbol}?avgPrice=${item.avgPrice || 0}&qty=${item.totalQty || 0}&invested=${item.investedValue || 0}&lotSize=${item.lotSize || 0}`)}
                className="rounded-xl border border-borderColor/60 bg-cardBg active:bg-white/[0.02] cursor-pointer overflow-hidden"
                style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.2)", margin:"10px" }}
              >
                <div className="px-3.5 pt-3 pb-2.5">
                  {/* Header: Name + P&L */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-[12px] font-bold tracking-tight truncate" style={{ fontFamily: "'Syne', sans-serif", color: "#f0f2f8" }}>{item.name}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-[7px] font-bold uppercase tracking-[0.8px] rounded-[4px] px-1.5 py-[2px]" style={{ background: "rgba(124,111,255,0.15)", color: "#9d8fff", border: "1px solid rgba(124,111,255,0.15)" }}>{exchLabel}</span>
                        <span className="text-[9px] font-medium tracking-wide" style={{ color: "#6b7094" }}>{item.symbol}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[14px] font-bold tracking-tight" style={{ fontFamily: "'JetBrains Mono', monospace", color: isProfit ? "#22d38a" : "#ff4d6a" }}>
                        {isProfit ? "+" : ""}₹{formatNumber(pnl.toFixed(2))}
                      </p>
                      <div className="flex items-center justify-end gap-1 mt-0.5">
                        {pnlPctRow && (
                          <span className="text-[9px] font-semibold px-1.5 py-[1px] rounded-[4px]" style={{ color: isProfit ? "#22d38a" : "#ff4d6a", background: isProfit ? "rgba(34,211,138,0.1)" : "rgba(255,77,106,0.1)" }}>
                            {isProfit ? "+" : ""}{pnlPctRow}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Stats grid */}
                  <div className="grid grid-cols-4 gap-1 mt-2.5 rounded-lg px-2 py-2" style={{ background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.04)" }}>
                    {[
                      { label: "LTP", value: live ? `₹${formatNumber(ltp.toFixed(2))}` : "—", color: ltpUp ? "#22d38a" : "#ff4d6a" },
                      { label: "AVG", value: `₹${formatNumber(avg.toFixed(2))}` },
                      { label: "QTY", value: String(qty) },
                      { label: "INVESTED", value: `₹${formatNumber(invested.toFixed(0))}` },
                    ].map((s) => (
                      <div key={s.label} className="text-center">
                        <p className="text-[7px] font-semibold uppercase tracking-[0.8px]" style={{ color: "#4a4f68" }}>{s.label}</p>
                        <p className="text-[10px] font-semibold mt-px" style={{ fontFamily: "'JetBrains Mono', monospace", color: s.color || "#c8cce0" }}>{s.value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action bar */}
                <div className="flex items-center gap-0 border-t" style={{ borderColor: "rgba(255,255,255,0.04)", background: "rgba(255,255,255,0.01)" }}>
                  <button
                    onClick={(e) => { e.stopPropagation(); setSelectedStock(item); setTradeAction("BUY"); setIsModalOpen(true); }}
                    className="flex-1 py-2 text-[10px] font-bold tracking-wide transition-colors active:bg-white/[0.03]"
                    style={{ color: "#22d38a", borderRight: "1px solid rgba(255,255,255,0.04)" }}
                  >BUY</button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setSelectedStock(item); setTradeAction("SELL"); setIsModalOpen(true); }}
                    className="flex-1 py-2 text-[10px] font-bold tracking-wide transition-colors active:bg-white/[0.03]"
                    style={{ color: "#ff4d6a" }}
                  >SELL</button>
                </div>
              </div>
            );
          })}

          {!loading && portfolio.length === 0 && (
            <div className="p-10 text-center rounded-xl border border-borderColor bg-cardBg">
              <p className="text-[10px] font-medium" style={{ color: "#5a5f78" }}>No holdings available</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Desktop Table ── */}
      <div className="hidden sm:block rounded-[20px] border border-borderColor overflow-hidden bg-cardBg overflow-x-auto">
        <div className="min-w-[900px]">

          <div className="grid px-5 py-3 border-b border-borderColor text-center bg-[var(--color-surface-subtle)]" style={{ gridTemplateColumns: "2fr 1.2fr 1fr 1fr 1.3fr 1.2fr" }}>
            {[
              { main: "Name", sub: null, left: true },
              { main: "LTP", sub: "Change (%)" },
              { main: "Avg Price", sub: "Buy Price" },
              { main: "Qty", sub: null },
              { main: "Current Value", sub: "Buy Value" },
              { main: "P&L", sub: "Return %" },
            ].map((col, i) => (
              <span key={i} className={`text-[10px] font-semibold uppercase tracking-[1px] ${col.left ? "text-left" : ""}`} style={{ color: "#5a5f78" }}>
                {col.main}
                {col.sub && <div className="text-[9px] font-normal tracking-[0.5px] mt-0.5" style={{ color: "rgba(90,95,120,0.7)", textTransform: "none" }}>{col.sub}</div>}
              </span>
            ))}
          </div>

          <div style={{ maxHeight: "40vh", overflow: "auto" }}>
            {loading && (
              <div className="animate-pulse">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="grid px-5 py-4 border-b border-borderColor" style={{ gridTemplateColumns: "2fr 1.2fr 1fr 1fr 1.3fr 1.2fr" }}>
                    <div className="space-y-2"><div className="h-3 w-32 bg-borderColor rounded" /><div className="h-2 w-20 bg-borderColor rounded" /></div>
                    {[...Array(5)].map((__, j) => (<div key={j} className="flex flex-col items-center gap-2"><div className="h-3 w-16 bg-borderColor rounded" /><div className="h-2 w-12 bg-borderColor rounded" /></div>))}
                  </div>
                ))}
              </div>
            )}

            {!loading && portfolio.map((item, i) => {
              const token = String(item.ScripCode);
              const live = liveData[token];
              const ltp = live?.LastRate || 0;
              const qty = item.totalQty || 0;
              const avg = item.avgPrice || 0;
              const currentValue = ltp * qty;
              const invested = item.investedValue || avg * qty;
              const pnl = currentValue - invested;
              const isProfit = pnl >= 0;
              const ltpUp = live?.LastRate > live?.PClose;
              const exchLabel = item.Exch === "B" ? "BSE" : item.Exch === "N" ? "NSE" : "MCX";

              return (
                <div key={i} onClick={() => navigate(`/stock/${item.Exch}/${item.ExchType}/${item.ScripCode}/${item.symbol}?avgPrice=${item.avgPrice || 0}&qty=${item.totalQty || 0}&invested=${item.investedValue || 0}&lotSize=${item.lotSize || 0}`)} className="relative group grid px-5 py-4 border-b border-borderColor items-center text-center transition-all duration-150 hover:bg-white/[0.025] cursor-pointer" style={{ gridTemplateColumns: "2fr 1.2fr 1fr 1fr 1.3fr 1.2fr" }}>
                  <div className="text-left">
                    <p className="text-[13px] font-semibold tracking-tight" style={{ fontFamily: "'Syne', sans-serif", color: "#f0f2f8" }}>{item.name}</p>
                    <div className="flex items-center gap-1.5 mt-1"><span className="text-[9px] font-semibold tracking-[0.5px] rounded px-1.5 py-0.5" style={{ background: "rgba(124,111,255,0.12)", color: "#7c6fff" }}>{exchLabel}</span><span className="text-[10px]" style={{ color: "#5a5f78" }}>{item.symbol}</span></div>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-[15px] font-semibold tracking-tight" style={{ fontFamily: "'IBM Plex Mono', monospace", color: ltpUp ? "#22d38a" : "#ff4d6a" }}>₹ {live ? formatNumber(live.LastRate) : "—"}</span>
                    <span className="text-[14px] mt-1 font-medium" style={{ fontFamily: "'IBM Plex Mono', monospace", color: ltpUp ? "#22d38a" : "#ff4d6a" }}>{live ? `${live.LastRate - live.PClose >= 0 ? "+" : ""}${(live.LastRate - live.PClose).toFixed(2)} (${live.ChgPcnt.toFixed(2)}%)` : "—"}</span>
                  </div>
                  <div className="flex flex-col items-center"><span className="text-[14px] font-medium" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>₹ {formatNumber(avg.toFixed(2))}</span></div>
                  <div className="flex flex-col items-center"><span className="text-[14px] font-medium" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{qty}</span></div>
                  <div className="flex flex-col items-center">
                    <span className="text-[14px] font-medium" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>₹ {live ? formatNumber(currentValue.toFixed(2)) : "—"}</span>
                    <span className="text-[14px] mt-1 font-medium" style={{ color: "#5a5f78" }}>₹ {formatNumber(invested.toFixed(2))}</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <span className="inline-flex items-center px-3 pt-1.5 rounded-full text-[15px] font-semibold tracking-tight" style={{ fontFamily: "'IBM Plex Mono', monospace", color: isProfit ? "#22d38a" : "#ff4d6a" }}>₹ {isProfit ? "+" : ""}{formatNumber(pnl.toFixed(2))}</span>
                    <span className="text-[13px]" style={{ color: isProfit ? "#22d38a" : "#ff4d6a" }}>({invested > 0 ? `${((pnl / invested) * 100).toFixed(2)}%` : "—"})</span>
                  </div>
                  <div style={{ background: "linear-gradient(to right, rgba(23,29,44,0) 0%, rgba(23,29,44,0.7) 50%, rgba(23,29,44,1) 100%)", height: "100%", paddingLeft: "10vh" }} className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200">
                    <button onClick={(e) => { e.stopPropagation(); setSelectedStock(item); setTradeAction("BUY"); setIsModalOpen(true); }} className="px-3 py-1 text-[11px] font-semibold rounded-lg transition" style={{ border: "1px solid rgba(34,211,138,0.3)", background: "rgba(34,211,138,0.07)", color: "#22d38a" }}>Buy</button>
                    <button onClick={(e) => { e.stopPropagation(); setSelectedStock(item); setTradeAction("SELL"); setIsModalOpen(true); }} className="px-3 py-1 text-[11px] font-semibold rounded-lg transition" style={{ border: "1px solid rgba(255,77,106,0.3)", background: "rgba(255,77,106,0.07)", color: "#ff4d6a" }}>Sell</button>
                  </div>
                </div>
              );
            })}
          </div>

          {!loading && portfolio.length > 0 && (
            <div className="grid px-5 py-4 items-center text-center" style={{ gridTemplateColumns: "2fr 1.2fr 1fr 1fr 1.3fr 1.2fr", background: "rgba(124,111,255,0.04)", borderTop: "1px solid rgba(124,111,255,0.15)" }}>
              <div className="text-left text-[12px] font-bold uppercase tracking-[1px]" style={{ fontFamily: "'Syne', sans-serif", color: "#7c6fff" }}>Total</div>
              <div /><div />
              <div className="flex flex-col items-center"><span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 13 }}>{formatNumber(portfolioTotals.qty)}</span></div>
              <div className="flex flex-col items-center">
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 14 }}>₹ {formatNumber(portfolioTotals.currentValue.toFixed(2))}</span>
                <span className="text-[14px] mt-0.5" style={{ color: "#5a5f78" }}>₹ {formatNumber(portfolioTotals.invested.toFixed(2))}</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <span className="inline-flex items-center px-3 pt-1.5 rounded-full text-[17px] font-semibold tracking-tight" style={{ fontFamily: "'IBM Plex Mono', monospace", color: portfolioTotals.pnl >= 0 ? "#22d38a" : "#ff4d6a" }}>₹ {formatNumber(portfolioTotals.pnl.toFixed(2))}</span>
                <span className="text-[15px] font-medium" style={{ color: portfolioTotals.pnl >= 0 ? "#22d38a" : "#ff4d6a" }}>({portfolioTotals.invested > 0 ? `${((portfolioTotals.pnl / portfolioTotals.invested) * 100).toFixed(2)}%` : "—"})</span>
              </div>
            </div>
          )}

          {!loading && portfolio.length === 0 && (
            <div className="p-12 text-center" style={{ color: "#5a5f78", fontSize: 13 }}>No holdings available</div>
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
          lotSize={Number(selectedStock?.lotSize)}
          multiplier={Number(selectedStock?.multiplier)}
          totalQty={selectedStock?.totalQty}
        />
      )}
    </div>
  );
}

export default Portfolio;