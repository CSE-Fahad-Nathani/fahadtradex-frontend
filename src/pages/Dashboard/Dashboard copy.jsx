import { useEffect, useState, useMemo } from "react";
import marketFeedService from "../../services/marketFeedService";
import { useMarketStore } from "../../store/marketStore";
import { useUserStore } from "../../store/userStore";
import { formatNumber } from "../../utils/formatNumber";

function Dashboard() {
  const [portfolio, setPortfolio] = useState([]);
  const [positions, setPositions] = useState([]);
  const [pnlHistory, setPnlHistory] = useState([]);

  // const [pulse, setPulse] = useState(false);
  const [pulse, setPulse] = useState(null); // "up" | "down" | null

  const liveData = useMarketStore((s) => s.data);
  const user = useUserStore((s) => s.user);

  // ==============================
  // 🔥 FETCH DATA
  // ==============================
  useEffect(() => {
    const fetchAll = async () => {
      const token = localStorage.getItem("token");

      const [p1, p2] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_BASE_URL}/api/portfolio`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${import.meta.env.VITE_API_BASE_URL}/api/positions`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const r1 = await p1.json();
      const r2 = await p2.json();

      if (r1.success) setPortfolio(r1.data);
      if (r2.success) setPositions(r2.data);
    };

    fetchAll();
  }, []);

  // ==============================
  // 🔌 SUBSCRIBE WS
  // ==============================
  useEffect(() => {
    const scrips = [...portfolio, ...positions].map((item) => ({
      Exch: item.Exch,
      ExchType: item.ExchType,
      ScripCode: item.ScripCode,
    }));

    if (scrips.length === 0) return;

    const accessToken = localStorage.getItem("fivePaisaAccessToken");
    const clientCode = localStorage.getItem("clientCode");

    marketFeedService.connect({ accessToken, clientCode });

    const unsubscribe = marketFeedService.subscribe({ scrips });

    return unsubscribe;
  }, [portfolio, positions]);

  // ==============================
  // 🧠 CALCULATIONS
  // ==============================
  const stats = useMemo(() => {
    let invested = 0;
    let current = 0;
    let todayPL = 0;
    let pnl = 0;
  
    const all = [...portfolio, ...positions];
  
    all.forEach((item) => {
      const live = liveData[String(item.ScripCode)];
      if (!live) return;
  
      const ltp = live.LastRate;
      const prev = live.PClose;
  
      const isMCX = item.Exch === "M";
  
      // ✅ FIXED QTY (handles both lots & totalQty)
      const qty = isMCX
        ? item.lots ?? item.totalQty ?? 0
        : item.totalQty || 0;
  
      const multiplier = item.multiplier || 1;
      const avg = item.avgPrice || 0;
  
      if (isMCX) {
        // ✅ MARGIN VALUES (15%)
        // const investedValue = 0.15 * avg * multiplier * qty;
        // const currentValue = 0.15 * ltp * multiplier * qty;
  
        // invested += investedValue;
        // current += currentValue;
  
        // // ✅ FULL P&L (NOT 15%)
        // pnl += (ltp - avg) * multiplier * qty;
        const investedValue = 0.15 * avg * multiplier * qty;

        // 🔥 FULL P&L
        const itemPnl = (ltp - avg) * multiplier * qty;

        // 🔥 REAL CURRENT VALUE (what you get after sell)
        const currentValue = investedValue + itemPnl;

        invested += investedValue;
        current += currentValue;

        pnl += itemPnl;
  
        // ✅ TODAY P&L (FULL)
        todayPL += (ltp - prev) * multiplier * qty;
      } else {
        const investedValue = avg * qty;
        const currentValue = ltp * qty;
  
        invested += investedValue;
        current += currentValue;
  
        // ✅ NORMAL P&L
        pnl += (ltp - avg) * qty;
  
        todayPL += (ltp - prev) * qty;
      }
    });
  
    const pnlPct = invested > 0 ? (pnl / invested) * 100 : 0;
    // const netWorth = current + (user?.balance || 0);
    const netWorth = (user?.balance || 0) + pnl + invested;
  
    return {
      invested,
      current,
      pnl,
      pnlPct,
      todayPL,
      netWorth,
      balance: user?.balance || 0,
    };
  }, [portfolio, positions, liveData, user]);

  useEffect(() => {
    if (pnlHistory.length < 2) return;
  
    const last = pnlHistory[pnlHistory.length - 1]?.pnl;
    const prev = pnlHistory[pnlHistory.length - 2]?.pnl;
  
    if (last > prev) setPulse("up");
    else if (last < prev) setPulse("down");
    else return;
  
    const timer = setTimeout(() => {
      setPulse(null);
    }, 600);
  
    return () => clearTimeout(timer);
  }, [pnlHistory]);
  // ==============================
  // 📊 PNL HISTORY (for trend + range)
  // ==============================
  useEffect(() => {
    const now = new Date();

    setPnlHistory((prev) => {
      const newPoint = {
        time: now.getTime(),
        pnl: stats.pnl,
      };

      return [...prev, newPoint].slice(-50);
    });
  }, [stats.pnl]);

  // ==============================
  // 📈 TREND
  // ==============================
  const trend = useMemo(() => {
    if (pnlHistory.length < 2) return "neutral";

    const last = pnlHistory[pnlHistory.length - 1].pnl;
    const prev = pnlHistory[pnlHistory.length - 2].pnl;

    if (last > prev) return "up";
    if (last < prev) return "down";
    return "neutral";
  }, [pnlHistory]);

  // ==============================
  // 📊 RANGE
  // ==============================
  const range = useMemo(() => {
    if (pnlHistory.length === 0) return { min: 0, max: 0 };

    const values = pnlHistory.map((p) => p.pnl);

    return {
      min: Math.min(...values),
      max: Math.max(...values),
    };
  }, [pnlHistory]);

  const rangePercent = useMemo(() => {
    const invested = stats.invested || 1;
  
    return ((stats.pnl + invested) / (2 * invested)) * 100;
  }, [stats.pnl, stats.invested]);
  // ==============================
  // UI
  // ==============================
  return (
    <div className="flex flex-col gap-6 p-4">

      {/* 🔥 TOP CARDS */}
      <div className="grid grid-cols-3 gap-4">
        <Card title="Net Worth" value={stats.netWorth} />
        <Card title="Current Value" value={stats.current} />
        <Card title="Invested" value={stats.invested} />

        <Card
          title="Total P&L"
          value={stats.pnl}
          highlight
          isProfit={stats.pnl >= 0}
          extra={`(${stats.pnlPct.toFixed(2)}%)`}
        />

        <Card
          title="Today's P&L"
          value={stats.todayPL}
          highlight
          isProfit={stats.todayPL >= 0}
        />

        <Card title="Available Margin" value={stats.balance} />
      </div>

      {/* 🔥 LIVE P&L PANEL */}
      <div className="bg-cardBg border border-borderColor rounded-xl p-5 flex flex-col gap-4">

        {/* HEADER */}
        <div className="flex justify-between items-center">
          <div>
            <p className="text-xs text-gray-400">Live P&L</p>
            <p
              className={`text-2xl font-semibold ${
                stats.pnl >= 0 ? "text-green-500" : "text-red-500"
              }`}
            >
              ₹ {formatNumber(stats.pnl.toFixed(2))}
            </p>
          </div>

          {/* TREND */}
          <div
            className={`text-sm font-medium px-3 py-1 rounded-lg ${
              trend === "up"
                ? "bg-green-500/10 text-green-400"
                : trend === "down"
                ? "bg-red-500/10 text-red-400"
                : "bg-gray-500/10 text-gray-400"
            }`}
          >
            {trend === "up" && "▲ Trending Up"}
            {trend === "down" && "▼ Trending Down"}
            {trend === "neutral" && "— Stable"}
          </div>
        </div>

        {/* TODAY */}
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Today</span>
          <span
            className={`font-medium ${
              stats.todayPL >= 0 ? "text-green-400" : "text-red-400"
            }`}
          >
            ₹ {formatNumber(stats.todayPL.toFixed(2))}
          </span>
        </div>

        {/* RANGE BAR */}
        <div className="flex flex-col gap-2">
          <div className="flex justify-between text-xs text-gray-400">
            <span>₹ {formatNumber(range.min.toFixed(0))}</span>
            <span>₹ {formatNumber(range.max.toFixed(0))}</span>
          </div>

          <div className="relative h-2 bg-borderColor rounded-full overflow-hidden">

  {/* 🔥 CENTER GLOW */}
  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
    <div className="w-6 h-6 bg-white/10 rounded-full blur-md" />
    <div className="absolute left-1/2 top-0 -translate-x-1/2 h-2 w-[2px] bg-white/40 rounded-full" />
  </div>

  {/* 🔥 CURRENT POSITION DOT */}
  <div
    className="absolute top-1/2 -translate-y-1/2 transition-all duration-300"
    style={{
      left: `${Math.max(0, Math.min(100, rangePercent))}%`,
    }}
  >
<div className="relative flex items-center justify-center">

{/* 🔥 DIRECTION-BASED PULSE */}
{pulse && (
  <span
    className={`absolute inline-flex h-4 w-4 rounded-full opacity-75 animate-ping ${
      pulse === "up" ? "bg-green-500" : "bg-red-500"
    }`}
  />
)}

{/* 🔥 SOLID DOT (based on current P&L) */}
<span
  className={`relative w-3 h-3 rounded-full shadow-lg ${
    stats.pnl >= 0 ? "bg-green-500" : "bg-red-500"
  }`}
/>
</div>
  </div>

</div>
        </div>
      </div>
    </div>
  );
}

// 🔥 REUSABLE CARD
const Card = ({ title, value, highlight, isProfit, extra }) => (
  <div className="bg-cardBg border border-borderColor rounded-xl p-4">
    <p className="text-xs text-gray-400">{title}</p>

    <p
      className={`text-lg font-semibold ${
        highlight
          ? isProfit
            ? "text-green-500"
            : "text-red-500"
          : ""
      }`}
    >
      ₹ {formatNumber(Number(value || 0).toFixed(2))}{" "}
      {extra && <span className="text-sm">{extra}</span>}
    </p>
  </div>
);

export default Dashboard;