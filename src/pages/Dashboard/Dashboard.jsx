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
    if (rawHistory.length === 0) return [];

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

  const hasEnoughHistory = chartPointsWithValue.length >= 2;

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
    <div className="p-4 md:p-6 space-y-6 text-textPrimary">
  

      <section className="relative overflow-hidden rounded-2xl border border-borderColor bg-gradient-to-r from-cardBg via-slate-900 to-black p-6 md:p-8">
        <div className="absolute -top-28 -right-20 h-64 w-64 rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute -bottom-24 -left-20 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />

        <div className="relative flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-gray-400">Welcome Back</p>
            <h1 className="mt-2 text-2xl md:text-3xl font-bold text-white">
              {user?.name ? `${user.name}'s Trading Desk` : "Your Trading Command Center"}
            </h1>
            <p className="mt-2 text-sm text-gray-400 max-w-xl">
              Real-time portfolio intelligence with instant P&L movement, live allocation mix, and top
              holdings performance.
            </p>
          </div>
          <div className="rounded-xl border border-borderColor bg-black/30 backdrop-blur-md px-5 py-4 min-w-[220px]">
            <p className="text-xs text-gray-400">Market Pulse</p>
            <p
              className={`text-lg font-semibold mt-1 ${
                trend === "up"
                  ? "text-green-400"
                  : trend === "down"
                  ? "text-red-400"
                  : "text-gray-300"
              }`}
            >
              {trend === "up" ? "▲ Trending Up" : trend === "down" ? "▼ Trending Down" : "— Stable"}
            </p>
            <p className="text-xs text-gray-500 mt-1">Holdings: {stats.holdings}</p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
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

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 rounded-2xl border border-borderColor bg-cardBg p-4 md:p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs text-gray-400">Performance</p>
              <h2 className="text-lg font-semibold text-white">Live P&L Trend</h2>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={selectedWindowMinutes}
                onChange={(e) => setSelectedWindowMinutes(Number(e.target.value))}
                className="bg-slate-900 border border-borderColor rounded-lg px-2 py-1 text-xs text-gray-200 outline-none"
              >
                <option value={5}>5 min</option>
                <option value={10}>10 min</option>
                <option value={15}>15 min</option>
                <option value={30}>30 min</option>
                <option value={60}>60 min</option>
              </select>
              {/* <p className={`text-sm font-medium ${stats.pnl >= 0 ? "text-green-400" : "text-red-400"}`}> */}
              <p
  className={`text-lg font-semibold tracking-tight ${stats.pnl >= 0 ? "text-green-400" : "text-red-400"}`}
  style={{ fontFamily: "'JetBrains Mono', monospace" }}
>
                ₹ {formatNumber(stats.pnl.toFixed(2))}
              </p>
            </div>
          </div>

          <div className="h-72">
            {hasEnoughHistory ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartPoints}>
                  <defs>
                    <linearGradient id="pnlGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={stats.pnl >= 0 ? "#22c55e" : "#ef4444"} stopOpacity={0.35} />
                      <stop offset="95%" stopColor={stats.pnl >= 0 ? "#22c55e" : "#ef4444"} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="t" tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis
                    tick={{ fill: "#94a3b8", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    width={80}
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
            ) : (
              <div className="h-full flex items-center justify-center rounded-xl border border-dashed border-borderColor text-sm text-gray-400">
                Collecting live P&L points for the selected window...
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-borderColor bg-cardBg p-4 md:p-5">
          <p className="text-xs text-gray-400">Exposure Mix</p>
          <h2 className="text-lg font-semibold text-white mb-4">Allocation by Exchange</h2>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={allocationData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
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
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[360px] text-xs">
              <thead>
                <tr className="text-left text-gray-400 border-b border-borderColor">
                  <th className="py-2 font-medium">Segment</th>
                  <th className="py-2 font-medium text-right">Current</th>
                  <th className="py-2 font-medium text-right">Invested</th>
                  <th className="py-2 font-medium text-right">P&L</th>
                </tr>
              </thead>
              <tbody>
                {allocationData.map((entry, index) => (
                  <tr key={`${entry.name}-${index}`} className="border-b border-borderColor/60">
                    <td className="py-2 text-gray-300">
                      <span className="inline-flex items-center gap-2 max-w-[100px]">
                        <span
                          className="inline-block h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: entry.color }}
                        />
                        {entry.name}
                      </span>
                    </td>
                    {/* <td className="py-2 text-right text-gray-200"> */}
                    <td
  className="py-2 text-right text-gray-200 text-[13.5px]"
  style={{ fontFamily: "'JetBrains Mono', monospace" }}
>
                      ₹ {formatNumber(entry.current.toFixed(2))}
                    </td>
                    {/* <td className="py-2 text-right text-gray-300"> */}
                    <td
  className="py-2 text-right text-gray-200 text-[13.5px]"
  style={{ fontFamily: "'JetBrains Mono', monospace" }}
>
                      ₹ {formatNumber(entry.invested.toFixed(2))}
                    </td>
                    <td
                      className={`py-2 text-right ${
                        entry.pnl > 0
                          ? "text-green-400"
                          : entry.pnl < 0
                          ? "text-red-400"
                          : "text-gray-300"
                      }`}
                    >
                      {entry.pnl >= 0 ? "+" : ""}₹ {formatNumber(entry.pnl.toFixed(2))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-borderColor bg-cardBg p-4 md:p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs text-gray-400">Top Holdings</p>
            <h2 className="text-lg font-semibold text-white">Top 5 Live Position Snapshot</h2>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-sm">
            <thead>
              <tr className="text-left text-gray-400 border-b border-borderColor">
                <th className="py-3 font-medium">Name</th>
                {/* <th className="py-3 font-medium">Exchange</th> */}
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
                  <td colSpan={7} className="py-8 text-center text-gray-500">
                    No positions available yet.
                  </td>
                </tr>
              ) : (
                topHoldings.map((row) => 
                  {
                    console.log("row: ",row);
                    
                    return (
                  <tr key={`${row.code}-${row.exch}`} className="border-b border-borderColor/70">
                    <td className="py-3 text-gray-100">
                      <div className="text-[14px] font-semibold tracking-tight" style={{ fontFamily: "'Syne', sans-serif", color: "#f0f2f8" }}>{row.name}</div>
                      <div className="text-[12px]" style={{ color: "#5a5f78" }}>
                        {row.symbol} | {row.exch === "N" ? "NSE" : row.exch === "B" ? "BSE" : "MCX"}</div>

                    </td>
                    {/* <td className="py-3 text-gray-300">{row.exch}</td> */}
                    <td
                      className="py-3 text-right text-gray-200 text-[14px]"
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      {row.qty}
                    </td>
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
                )})
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

const KpiCard = ({ title, value, tone, sub }) => (
  <div className="rounded-xl border border-borderColor bg-cardBg p-4">
    <p className="text-xs text-gray-400">{title}</p>
    {/* <p className={`mt-2 text-xl font-semibold ${tone}`}>₹ {formatNumber(Number(value || 0).toFixed(2))}</p> */}
    <p
  className={`mt-2 text-2xl md:text-[26px] font-semibold tracking-tight ${tone}`}
  style={{
    fontFamily: "'JetBrains Mono', 'IBM Plex Mono', monospace",
    letterSpacing: "-0.3px",
  }}
>
  ₹ {formatNumber(Number(value || 0).toFixed(2))}
</p>
    {/* {sub ? <p className="text-xs mt-1 text-gray-400">{sub}</p> : null} */}
    {sub ? (
  <p className="text-[11px] mt-1.5 text-gray-400 font-medium">
    {sub}
  </p>
) : null}
  </div>
);

export default Dashboard;