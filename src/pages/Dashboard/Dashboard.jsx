import { useEffect, useMemo, useState } from "react";



import {
  Area,
  AreaChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { fetchUserData } from "../../services/user.service";
import { useHoldingsStore } from "../../store/holdingsStore";
import { useMarketStore } from "../../store/marketStore";
import { usePnlHistoryStore } from "../../store/pnlHistoryStore";
import { useUserStore } from "../../store/userStore";
import { formatNumber } from "../../utils/formatNumber";
import { useThemeStore } from "../../store/themeStore";

const ALLOCATION_COLORS = {
  margin: "#38bdf8",
  nse: "#22c55e",
  bse: "#a78bfa",
  mcx: "#f59e0b",
  fallback: "#64748b",
};

function Dashboard() {
  const portfolio = useHoldingsStore((s) => s.portfolio);
  const positions = useHoldingsStore((s) => s.positions);
  const liveData = useMarketStore((s) => s.data);
  const user = useUserStore((s) => s.user);
  const rawHistory = usePnlHistoryStore((s) => s.rawHistory);
  const selectedWindowMinutes = usePnlHistoryStore((s) => s.selectedWindowMinutes);
  const setSelectedWindowMinutes = usePnlHistoryStore((s) => s.setSelectedWindowMinutes);

  const normalizedRows = useMemo(() => {
    return [...portfolio, ...positions].map((item) => {
      const live = liveData[String(item.ScripCode)] || {};

      // console.log(
      //   "LIVE CHECK:",
      //   item.symbol,
      //   item.ScripCode,
      //   item.Exch,
      //   live
      // );
      const hasLivePrice = Number(live.LastRate) > 0;
      const ltp = hasLivePrice ? Number(live.LastRate) : Number(item.avgPrice || 0);
      const prevClose = Number(live.PClose || ltp || 0);
      const isMCX = item.Exch === "M";
      const qty = isMCX ? Number(item.lots ?? item.totalQty ?? 0) : Number(item.totalQty || 0);
      const multiplier = Number(item.multiplier || 1);
      const avg = Number(item.avgPrice || 0);

      const invested = isMCX ? 0.15 * avg * multiplier * qty : avg * qty;
      const pnl = isMCX ? (ltp - avg) * multiplier * qty : (ltp - avg) * qty;
      const current = invested + pnl;
      const todayPL = isMCX
        ? (ltp - prevClose) * multiplier * qty
        : (ltp - prevClose) * qty;

        // console.log("item: ",item);
        

      return {
        name: item.name || `Scrip ${item.ScripCode}`,
        symbol: item.symbol || `Scrip ${item.ScripCode}`,
        code: item.ScripCode,
        exch: item.Exch || "-",
        qty,
        ltp,
        avg,
        current,
        invested,
        pnl,
        todayPL,
        hasLivePrice,
      };
    });
  }, [portfolio, positions, liveData]);

  const stats = useMemo(() => {
    const invested = normalizedRows.reduce((sum, row) => sum + row.invested, 0);
    const current = normalizedRows.reduce((sum, row) => sum + row.current, 0);
    const pnl = normalizedRows.reduce((sum, row) => sum + row.pnl, 0);
    const todayPL = normalizedRows.reduce((sum, row) => sum + row.todayPL, 0);
    const balance = Number(user?.balance || 0);
    const netWorth = invested + pnl + balance;
    const pnlPct = invested > 0 ? (pnl / invested) * 100 : 0;
    const todayPct = invested > 0 ? (todayPL / invested) * 100 : 0;

    return {
      invested,
      current,
      pnl,
      todayPL,
      pnlPct,
      todayPct,
      balance,
      netWorth,
      holdings: normalizedRows.length,
    };
  }, [normalizedRows, user]);

  const hasLiveData = useMemo(
    () => normalizedRows.some((row) => row.hasLivePrice && row.qty > 0),
    [normalizedRows]
  );

  const chartPoints = useMemo(() => {
    const TARGET_POINTS = 12;
    const now = Date.now();
    const windowMs = selectedWindowMinutes * 60 * 1000;
    const startMs = now - windowMs;
    const bucketMs = windowMs / TARGET_POINTS;
    const relevant = rawHistory.filter((point) => point.time >= startMs);

    let idx = 0;
    let lastKnownPnl = null;
    const points = [];

    for (let i = 0; i < TARGET_POINTS; i += 1) {
      const bucketEnd = startMs + (i + 1) * bucketMs;

      while (idx < relevant.length && relevant[idx].time <= bucketEnd) {
        lastKnownPnl = relevant[idx].pnl;
        idx += 1;
      }

      points.push({
        t: new Date(bucketEnd).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
        pnl: lastKnownPnl,
      });
    }

    return points;
  }, [rawHistory, selectedWindowMinutes]);

  const chartPointsWithValue = useMemo(
    () => chartPoints.filter((point) => typeof point.pnl === "number"),
    [chartPoints]
  );

  /** Blends ±10% dummy curve with bucketed live points; synthetic prefix anchors to first real bucket so seam is invisible. */
  const areaChartData = useMemo(() => {
    const TARGET_POINTS = 12;
    const base = stats.pnl;

    const rawSynth = (i) => {
      const phase = (i / Math.max(1, TARGET_POINTS - 1)) * Math.PI * 2;
      if (Math.abs(base) >= 1e-6) {
        return Number((base * (1 + 0.1 * Math.sin(phase))).toFixed(2));
      }
      return Number(Math.sin(phase).toFixed(2));
    };

    const firstRealIdx = chartPoints.findIndex((p) => typeof p.pnl === "number");

    if (firstRealIdx === -1) {
      return chartPoints.map((p, i) => ({
        ...p,
        pnl: rawSynth(i),
      }));
    }

    const R = chartPoints[firstRealIdx].pnl;
    if (firstRealIdx === 0) {
      return chartPoints.map((p) => ({
        ...p,
        pnl: typeof p.pnl === "number" ? p.pnl : R,
      }));
    }

    const synAtAnchor = rawSynth(firstRealIdx - 1);

    return chartPoints.map((p, i) => {
      let pnl = p.pnl;
      if (i < firstRealIdx) {
        pnl = Number((R + rawSynth(i) - synAtAnchor).toFixed(2));
      } else if (typeof pnl !== "number") {
        pnl = typeof R === "number" ? R : rawSynth(i);
      }
      return { ...p, pnl };
    });
  }, [chartPoints, stats.pnl]);

  const trend = useMemo(() => {
    if (chartPointsWithValue.length < 2) return "neutral";
    const last = chartPointsWithValue[chartPointsWithValue.length - 1].pnl;
    const prev = chartPointsWithValue[chartPointsWithValue.length - 2].pnl;
    if (last > prev) return "up";
    if (last < prev) return "down";
    return "neutral";
  }, [chartPointsWithValue]);

  const allocationData = useMemo(() => {
    const seed = {
      NSE: { invested: 0, pnl: 0, current: 0 },
      BSE: { invested: 0, pnl: 0, current: 0 },
      MCX: { invested: 0, pnl: 0, current: 0 },
    };

    normalizedRows.forEach((row) => {
      let key = null;
      if (row.exch === "N") key = "NSE";
      if (row.exch === "B") key = "BSE";
      if (row.exch === "M") key = "MCX";
      if (!key) return;

      seed[key].invested += row.invested;
      seed[key].pnl += row.pnl;
      seed[key].current += row.current;
    });

    const fixedRows = [
      {
        name: "Available Margin",
        invested: Number(stats.balance.toFixed(2)),
        pnl: 0,
        current: Number(stats.balance.toFixed(2)),
        value: Math.max(0, Number(stats.balance.toFixed(2))),
        color: ALLOCATION_COLORS.margin,
      },
      {
        name: "NSE",
        invested: Number(seed.NSE.invested.toFixed(2)),
        pnl: Number(seed.NSE.pnl.toFixed(2)),
        current: Number(seed.NSE.current.toFixed(2)),
        value: Math.max(0, Number(seed.NSE.current.toFixed(2))),
        color: ALLOCATION_COLORS.nse,
      },
      {
        name: "BSE",
        invested: Number(seed.BSE.invested.toFixed(2)),
        pnl: Number(seed.BSE.pnl.toFixed(2)),
        current: Number(seed.BSE.current.toFixed(2)),
        value: Math.max(0, Number(seed.BSE.current.toFixed(2))),
        color: ALLOCATION_COLORS.bse,
      },
      {
        name: "MCX",
        invested: Number(seed.MCX.invested.toFixed(2)),
        pnl: Number(seed.MCX.pnl.toFixed(2)),
        current: Number(seed.MCX.current.toFixed(2)),
        value: Math.max(0, Number(seed.MCX.current.toFixed(2))),
        color: ALLOCATION_COLORS.mcx,
      },
    ];

    const hasAnyPositiveSlice = fixedRows.some((row) => row.value > 0);
    if (hasAnyPositiveSlice) return fixedRows;

    return [
      {
        name: "No allocation data",
        invested: 0,
        pnl: 0,
        current: 0,
        value: 1,
        color: ALLOCATION_COLORS.fallback,
      },
    ];
  }, [normalizedRows, stats.balance]);

  const topHoldings = useMemo(() => {
    return [...normalizedRows]
      .sort((a, b) => Math.abs(b.current) - Math.abs(a.current))
      .slice(0, 5);
  }, [normalizedRows]);

  const kpiCards = [
    { title: "Net Worth", value: stats.netWorth, tone: "text-white" },
    { title: "Current Value", value: stats.current, tone: "text-cyan-300" },
    { title: "Invested", value: stats.invested, tone: "text-violet-300" },
    {
      title: "Total P&L",
      value: stats.pnl,
      tone: stats.pnl >= 0 ? "text-green-400" : "text-red-400",
      sub: `${stats.pnlPct.toFixed(2)}%`,
    },
    {
      title: "Today's P&L",
      value: stats.todayPL,
      tone: stats.todayPL >= 0 ? "text-green-400" : "text-red-400",
      sub: `${stats.todayPct.toFixed(2)}%`,
    },
    { title: "Available Margin", value: stats.balance, tone: "text-amber-300" },
  ];


  useEffect(() => {
    fetchUserData();
  }, []);

  return (
    <div className="p-2.5 sm:p-4 md:p-6 space-y-3 sm:space-y-6 text-textPrimary max-w-full overflow-x-hidden">

      <section className="relative overflow-hidden rounded-xl sm:rounded-2xl border border-borderColor bg-gradient-to-r from-cardBg via-slate-900 to-black p-3.5 sm:p-6 md:p-8">
        <div className="absolute -top-28 -right-20 h-64 w-64 rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute -bottom-24 -left-20 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />

        <div className="relative flex flex-col md:flex-row md:items-end md:justify-between gap-3 sm:gap-6">
          <div>
            <p className="text-[9px] sm:text-xs uppercase tracking-[0.25em] text-gray-400">Welcome Back</p>
            <h1 className="mt-1 sm:mt-2 text-base sm:text-2xl md:text-3xl font-bold text-white">
              {user?.name ? `${user.name}'s Trading Desk` : "Your Trading Command Center"}
            </h1>
            <p className="mt-1 sm:mt-2 text-[10px] sm:text-sm text-gray-400 max-w-xl leading-relaxed">
              Real-time portfolio intelligence with instant P&L movement, live allocation mix, and top
              holdings performance.
            </p>
          </div>
          <div className="rounded-lg sm:rounded-xl border border-borderColor bg-black/30 backdrop-blur-md px-3 py-2.5 sm:px-5 sm:py-4 min-w-0 sm:min-w-[220px]">
            <p className="text-[9px] sm:text-xs text-gray-400">Market Pulse</p>
            <p
              className={`text-sm sm:text-lg font-semibold mt-0.5 sm:mt-1 ${
                trend === "up"
                  ? "text-green-400"
                  : trend === "down"
                  ? "text-red-400"
                  : "text-gray-300"
              }`}
            >
              {trend === "up" ? "▲ Trending Up" : trend === "down" ? "▼ Trending Down" : "— Stable"}
            </p>
            <p className="text-[9px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1">Holdings: {stats.holdings}</p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-3 gap-2 sm:gap-4">
        {kpiCards.map((card) => (
          <KpiCard
            key={card.title}
            title={card.title}
            value={card.value}
            tone={card.tone}
            sub={card.sub}
          />
        ))}
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] gap-2 sm:gap-4 min-w-0">
        <div className="min-w-0 rounded-xl sm:rounded-2xl border border-borderColor bg-cardBg p-3 sm:p-4 md:p-5 flex flex-col min-h-0 h-full">
          <div className="flex items-center justify-between mb-3 sm:mb-4 shrink-0">
            <div>
              <p className="text-[9px] sm:text-xs text-gray-400">Performance</p>
              <h2 className="text-xs sm:text-lg font-semibold text-white">Live P&L Trend</h2>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <select
                value={selectedWindowMinutes}
                onChange={(e) => setSelectedWindowMinutes(Number(e.target.value))}
                className="bg-slate-900 border border-borderColor rounded-md sm:rounded-lg px-1.5 py-0.5 sm:px-2 sm:py-1 text-[10px] sm:text-xs text-gray-200 outline-none"
              >
                <option value={5}>5 min</option>
                <option value={10}>10 min</option>
                <option value={15}>15 min</option>
                <option value={30}>30 min</option>
                <option value={60}>60 min</option>
              </select>
              <p
                className={`text-xs sm:text-lg font-semibold tracking-tight ${stats.pnl >= 0 ? "text-green-400" : "text-red-400"}`}
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                ₹ {formatNumber(stats.pnl.toFixed(2))}
              </p>
            </div>
          </div>

          <div className="flex-1 min-h-[12rem] sm:min-h-[16rem] min-w-0 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={areaChartData}>
                <defs>
                  <linearGradient id="pnlGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={stats.pnl >= 0 ? "#22c55e" : "#ef4444"} stopOpacity={0.35} />
                    <stop offset="95%" stopColor={stats.pnl >= 0 ? "#22c55e" : "#ef4444"} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="t" tick={{ fill: "#94a3b8", fontSize: 9 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                <YAxis
                  tick={{ fill: "#94a3b8", fontSize: 9 }}
                  axisLine={false}
                  tickLine={false}
                  width={52}
                  tickFormatter={(value) => `₹${formatNumber(Number(value).toFixed(0))}`}
                />
                <Tooltip
                  formatter={(value) => [`₹ ${formatNumber(Number(value).toFixed(2))}`, "P&L"]}
                  contentStyle={{
                    background: "#0f172a",
                    border: "1px solid #1f2937",
                    borderRadius: "12px",
                    color: "#fff",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="pnl"
                  stroke={stats.pnl >= 0 ? "#22c55e" : "#ef4444"}
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#pnlGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="min-w-0 overflow-hidden rounded-xl sm:rounded-2xl border border-borderColor bg-cardBg p-3 sm:p-4 md:p-5">
          <p className="text-[9px] sm:text-xs text-gray-400">Exposure Mix</p>
          <h2 className="text-xs sm:text-lg font-semibold text-white mb-2 sm:mb-4">Allocation by Exchange</h2>
          <div className="min-w-0 h-44 sm:h-60">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={allocationData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius="35%"
                  outerRadius="55%"
                  paddingAngle={3}
                >
                  {allocationData.map((entry, index) => (
                    <Cell key={`${entry.name}-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name, ctx) => {
                    const rawCurrent = ctx?.payload?.current;
                    if (typeof rawCurrent === "number") {
                      return [`₹ ${formatNumber(rawCurrent.toFixed(2))}`, name];
                    }
                    return `₹ ${formatNumber(Number(value).toFixed(2))}`;
                  }}
                  contentStyle={{
                    background: "#0f172a",
                    border: "1px solid #1f2937",
                    borderRadius: "12px",
                    color: "#fff",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 sm:mt-3 min-w-0">
            <table className="w-full table-fixed border-collapse text-[9px] sm:text-xs tabular-nums">
              <colgroup>
                <col style={{ width: "26%" }} />
                <col />
                <col className="hidden sm:table-column" style={{ width: "26%" }} />
                <col />
              </colgroup>
              <thead>
                <tr className="text-left text-gray-400 border-b border-borderColor">
                  <th className="py-1.5 sm:py-2 pr-1 font-medium">Segment</th>
                  <th className="py-1.5 sm:py-2 px-0.5 font-medium text-right">Current</th>
                  <th className="py-1.5 sm:py-2 px-0.5 font-medium text-right hidden sm:table-cell">Invested</th>
                  <th className="py-1.5 sm:py-2 pl-0.5 font-medium text-right">P&L</th>
                </tr>
              </thead>
              <tbody>
                {allocationData.map((entry, index) => {
                  const currentStr = `₹${formatNumber(entry.current.toFixed(0))}`;
                  const investedStr = `₹${formatNumber(entry.invested.toFixed(2))}`;
                  const pnlStr = `${entry.pnl >= 0 ? "+" : ""}₹${formatNumber(entry.pnl.toFixed(2))}`;
                  return (
                  <tr key={`${entry.name}-${index}`} className="border-b border-borderColor/60">
                    <td className="py-1.5 sm:py-2 pr-1 text-gray-300 align-middle min-w-0">
                      <span className="inline-flex items-center gap-1 sm:gap-2 min-w-0 max-w-full">
                        <span
                          className="inline-block h-1.5 w-1.5 sm:h-2.5 sm:w-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: entry.color }}
                        />
                        <span className="truncate min-w-0">{entry.name}</span>
                      </span>
                    </td>
                    <td
                      className="py-1.5 sm:py-2 px-0.5 text-right text-gray-200 text-[8px] sm:text-[13px] leading-tight align-middle min-w-0"
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                      title={currentStr}
                    >
                      <span className="block w-full truncate text-right">{currentStr}</span>
                    </td>
                    <td
                      className="py-1.5 sm:py-2 px-0.5 text-right text-gray-200 text-[8px] sm:text-[13px] leading-tight hidden sm:table-cell align-middle min-w-0"
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                      title={investedStr}
                    >
                      <span className="block w-full truncate text-right">{investedStr}</span>
                    </td>
                    <td
                      className={`py-1.5 sm:py-2 pl-0.5 text-right text-[8px] sm:text-[13px] leading-tight align-middle min-w-0 ${
                        entry.pnl > 0
                          ? "text-green-400"
                          : entry.pnl < 0
                          ? "text-red-400"
                          : "text-gray-300"
                      }`}
                      title={pnlStr}
                    >
                      <span className="block w-full truncate text-right">{pnlStr}</span>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="rounded-xl sm:rounded-2xl border border-borderColor bg-cardBg p-3 sm:p-4 md:p-5">
        <div className="flex items-center justify-between mb-2 sm:mb-4">
          <div>
            <p className="text-[9px] sm:text-xs text-gray-400">Top Holdings</p>
            <h2 className="text-xs sm:text-lg font-semibold text-white">Top 5 Live Position Snapshot</h2>
          </div>
        </div>

        {/* Mobile: Card layout */}
        <div className="sm:hidden space-y-2">
          {topHoldings.length === 0 ? (
            <div className="py-6 text-center text-gray-500 text-[10px]">No positions available yet.</div>
          ) : (
            topHoldings.map((row) => (
              <div key={`${row.code}-${row.exch}`} className="rounded-lg border border-borderColor/60 bg-black/20 p-2.5">
                <div className="flex items-center justify-between mb-1.5">
                  <div>
                    <div className="text-[10px] font-semibold text-textPrimary truncate max-w-[140px]" style={{ fontFamily: "'Syne', sans-serif" }}>{row.name}</div>
                    <div className="text-[8px] text-gray-500">{row.symbol} | {row.exch === "N" ? "NSE" : row.exch === "B" ? "BSE" : "MCX"}</div>
                  </div>
                  <div
                    className={`text-[11px] font-semibold tracking-tight ${row.pnl >= 0 ? "text-green-400" : "text-red-400"}`}
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    ₹{formatNumber(row.pnl.toFixed(2))}
                  </div>
                </div>
                <div className="flex items-center justify-between text-[8px] text-gray-400">
                  <span>Qty: <span className="text-gray-200">{row.qty}</span></span>
                  <span>Avg: <span className="text-gray-200">₹{formatNumber(row.avg.toFixed(2))}</span></span>
                  <span>LTP: <span className="text-gray-200">₹{formatNumber(row.ltp.toFixed(2))}</span></span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop: Table layout */}
        <div className="hidden sm:block">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-400 border-b border-borderColor">
                <th className="py-3 font-medium">Name</th>
                <th className="py-3 font-medium text-right">Qty</th>
                <th className="py-3 font-medium text-right">Avg</th>
                <th className="py-3 font-medium text-right">LTP</th>
                <th className="py-3 font-medium text-right">Current</th>
                <th className="py-3 font-medium text-right">P&L</th>
              </tr>
            </thead>
            <tbody>
              {topHoldings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500">
                    No positions available yet.
                  </td>
                </tr>
              ) : (
                topHoldings.map((row) => (
                  <tr key={`${row.code}-${row.exch}`} className="border-b border-borderColor/70">
                    <td className="py-3 text-textPrimary">
                      <div className="text-[14px] font-semibold tracking-tight text-textPrimary" style={{ fontFamily: "'Syne', sans-serif" }}>{row.name}</div>
                      <div className="text-[12px] text-textSubtle">
                        {row.symbol} | {row.exch === "N" ? "NSE" : row.exch === "B" ? "BSE" : "MCX"}</div>
                    </td>
                    <td className="py-3 text-right text-gray-200 text-[14px]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{row.qty}</td>
                    <td className="py-3 text-right text-gray-200">₹ {formatNumber(row.avg.toFixed(2))}</td>
                    <td className="py-3 text-right text-gray-200">₹ {formatNumber(row.ltp.toFixed(2))}</td>
                    <td className="py-3 text-right text-gray-200">₹ {formatNumber(row.current.toFixed(2))}</td>
                    <td
                      className={`py-3 text-right font-semibold text-[14.5px] tracking-tight ${row.pnl >= 0 ? "text-green-400" : "text-red-400"}`}
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      ₹ {formatNumber(row.pnl.toFixed(2))}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

const LIGHT_KPI_TONES = {
  "text-white": "text-slate-900",
  "text-cyan-300": "text-cyan-700",
  "text-violet-300": "text-violet-700",
  "text-amber-300": "text-amber-700",
  "text-green-400": "text-green-700",
  "text-red-400": "text-red-700",
};

const KpiCard = ({ title, value, tone, sub }) => {
  const theme = useThemeStore((s) => s.theme);
  const isLight = theme === "light";
  const valueTone = isLight ? (LIGHT_KPI_TONES[tone] ?? tone) : tone;

  return (
    <div className="rounded-lg sm:rounded-xl border border-borderColor bg-cardBg p-2.5 sm:p-4">
      <p className={`text-[8px] sm:text-xs ${isLight ? "text-slate-600" : "text-gray-400"}`}>{title}</p>
      <p
        className={`mt-1 sm:mt-2 text-sm sm:text-2xl md:text-[26px] font-semibold tracking-tight ${valueTone}`}
        style={{
          fontFamily: "'JetBrains Mono', 'IBM Plex Mono', monospace",
          letterSpacing: "-0.3px",
        }}
      >
        ₹ {formatNumber(Number(value || 0).toFixed(2))}
      </p>
      {sub ? (
        <p className={`text-[8px] sm:text-[11px] mt-0.5 sm:mt-1.5 font-medium ${isLight ? "text-slate-600" : "text-gray-400"}`}>
          {sub}
        </p>
      ) : null}
    </div>
  );
};

export default Dashboard;