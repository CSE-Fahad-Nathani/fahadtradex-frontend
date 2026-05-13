import { useParams, useSearchParams } from "react-router-dom";
import { useMemo, useState, useEffect, useRef } from "react";
import useMarketFeed from "../hooks/useMarketFeed";
import { useMarketStore } from "../store/marketStore";
import { formatNumber } from "../utils/formatNumber";
import { createChart, CandlestickSeries } from "lightweight-charts";

const StockPreviewPage = () => {
  const { exch, exchType, scripCode, symbol } = useParams();
  const token = String(scripCode);
  const [noCandleData, setNoCandleData] = useState(false);

  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  const today = new Date().toISOString().split("T")[0];

  const [snapshot, setSnapshot] = useState(null);
  const [candles, setCandles] = useState([]);
  const [loading, setLoading] = useState(true);

  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);
  const [timeframe, setTimeframe] = useState("1m");
  const [stockDetails, setStockDetails] = useState(null);

  const scrips = useMemo(
    () => [{ Exch: exch, ExchType: exchType, ScripCode: Number(scripCode) }],
    [exch, exchType, scripCode]
  );

  useMarketFeed({
    accessToken: localStorage.getItem("fivePaisaAccessToken"),
    clientCode: localStorage.getItem("clientCode"),
    scrips,
  });

  const liveData = useMarketStore((state) => state.data[token]);
  const [searchParams] = useSearchParams();

  const avgPrice = Number(searchParams.get("avgPrice")) || 0;
  const qty = Number(searchParams.get("qty")) || 0;
  const investedValue = Number(searchParams.get("invested")) || 0;
  const [aiData, setAiData] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        if (fromDate > toDate) return;
  
        setLoading(true);
  
        const [snapRes, candleRes, detailsRes] = await Promise.all([
          // 🔥 SNAPSHOT
          fetch(`${import.meta.env.VITE_API_BASE_URL}/api/market/snapshot`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("fivePaisaAccessToken")}`,
            },
            body: JSON.stringify({
              Exchange: exch,
              ExchangeType: exchType,
              ScripCode: scripCode,
            }),
          }),
  
          // 📊 CANDLES
          fetch(`${import.meta.env.VITE_API_BASE_URL}/api/historical/data`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("fivePaisaAccessToken")}`,
            },
            body: JSON.stringify({
              Exch: exch,
              ExchType: exchType,
              ScripCode: scripCode,
              TimeFrame: timeframe,
              FromDate: fromDate,
              ToDate: toDate,
            }),
          }),
  
          // 🧠 STOCK DETAILS (NEW)
          fetch(
            `${import.meta.env.VITE_API_BASE_URL}/api/stocks/details?scripCode=${scripCode}&exch=${exch}&exchType=${exchType}`
          ),
        ]);
  
        const snapData = await snapRes.json();
        const candleData = await candleRes.json();
        const detailsData = await detailsRes.json();
  
        // 🔹 SNAPSHOT
        const snap = snapData?.data?.body?.Data?.[0];
        setSnapshot(snap);
  
        // 🔹 STOCK DETAILS
        setStockDetails(detailsData?.data || null);
  
        // 🔹 CANDLES
        const rawCandles = candleData?.data?.data?.candles || [];
  
        if (!rawCandles.length) {
          setNoCandleData(true);
          setCandles([]);
        } else {
          setNoCandleData(false);
  
          const formatted = rawCandles.map((c) => ({
            time: Math.floor(new Date(c[0]).getTime() / 1000),
            open: c[1],
            high: c[2],
            low: c[3],
            close: c[4],
          }));
  
          setCandles(formatted);
        }
  
      } catch (err) {
        console.error("Error:", err);
      } finally {
        setLoading(false);
      }
    };
  
    fetchAll();
  }, [exch, exchType, scripCode, timeframe, fromDate, toDate]);

  useEffect(() => {
    if (!snapshot) return;
    const fetchAI = async () => {
      try {
        setAiLoading(true);
        const payload = {
          name: symbol,
          exchange: exch === "N" ? "NSE" : exch === "B" ? "BSE" : "MCX",
          last_price: Number(snapshot.LastTradedPrice),
          ohlc: { open: Number(snapshot.Open), high: Number(snapshot.High), low: Number(snapshot.Low), close: Number(snapshot.PClose) },
          day_change: Number(snapshot.NetChange),
          day_change_perc: (Number(snapshot.NetChange) / Number(snapshot.PClose)) * 100,
          week_52_high: Number(snapshot.AHigh),
          week_52_low: Number(snapshot.ALow),
        };
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/ai/analyze`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        const data = await res.json();
        setAiData(data?.data || null);
      } catch (err) {
        console.error("AI Error:", err);
      } finally {
        setAiLoading(false);
      }
    };
    fetchAI();
  }, [snapshot]);

  const snap = snapshot || {};
  const normalized = {
    ltp: liveData?.LastRate || Number(snap.LastTradedPrice) || 0,
    prevClose: liveData?.PClose || Number(snap.PClose) || 0,
    open: Number(snap.Open) || 0,
    high: Number(snap.High) || 0,
    low: Number(snap.Low) || 0,
    change: liveData ? liveData.LastRate - liveData.PClose : Number(snap.NetChange) || 0,
    changePercent: liveData?.ChgPcnt || (snap.PClose ? (Number(snap.NetChange) / Number(snap.PClose)) * 100 : 0),
    volume: Number(snap.Volume) || 0,
    avgTradePrice: Number(snap.AverageTradePrice) || 0,
    week52High: Number(snap.AHigh) || 0,
    week52Low: Number(snap.ALow) || 0,
  };

  const currentValue = normalized.ltp * qty;
  const pnl = currentValue - investedValue;
  const isProfit = pnl >= 0;
  const exchLabel = exch === "N" ? "NSE" : exch === "B" ? "BSE" : "MCX";

  useEffect(() => {
    if (!chartRef.current || candles.length === 0) return;
    if (chartInstance.current) {
      try { chartInstance.current.remove(); } catch (e) {}
      chartInstance.current = null;
    }
    const chart = createChart(chartRef.current, {
      layout: { background: { color: "#0b0f1a" }, textColor: "#475569" },
      grid: { vertLines: { color: "#1a2233" }, horzLines: { color: "#1a2233" } },
      crosshair: { vertLine: { color: "#334155" }, horzLine: { color: "#334155" } },
      timeScale: { borderColor: "#1e2a3a", timeVisible: true },
      rightPriceScale: { borderColor: "#1e2a3a" },
      handleScroll: true,
      handleScale: true,
    });
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#22c55e",
      downColor: "#ef4444",
      borderVisible: false,
      wickUpColor: "#22c55e",
      wickDownColor: "#ef4444",
    });
    candleSeries.setData(candles);
    chart.timeScale().fitContent();
    chartInstance.current = chart;
    const handleResize = () => {
      if (!chartInstance.current || !chartRef.current) return;
      chartInstance.current.applyOptions({ width: chartRef.current.clientWidth, height: chartRef.current.clientHeight });
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      if (chartInstance.current) {
        try { chartInstance.current.remove(); } catch (e) {}
        chartInstance.current = null;
      }
    };
  }, [candles]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0b0f1a]">
        <div className="text-center space-y-2">
          <div className="w-6 h-6 border border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-mono">Loading {symbol}...</p>
        </div>
      </div>
    );
  }

 return (
  <div
    className="flex flex-col bg-[#0b0f1a] text-slate-200 overflow-hidden"
    style={{ maxHeight: "calc(100vh - 4rem)", fontFamily: "ui-monospace, monospace" }}
  >

    {/* ── TOP BAR ── */}
    <div className="flex items-center justify-between px-5 py-2 border-b border-[#1e2a3a] bg-[#0f1623] flex-shrink-0">

{/* ── LEFT: NAME + META ── */}
<div className="flex flex-col">

  {/* Full Name */}
  <p className="text-[14px] font-semibold text-slate-100 leading-tight">
    {stockDetails?.name || "—"}
  </p>

  {/* Symbol */}
  <p className="text-[11px] text-slate-400">
    {symbol}
  </p>

  {/* Meta */}
  <p className="text-[10px] text-slate-500 mt-[2px]">
    {exchLabel} · {exchType === "C" ? "Cash" : "Derivatives"}
    {stockDetails?.series && (
      <>
        {" · "}
        {
          {
            EQ: "Equity",
            BE: "Trade-to-Trade",
            SME: "SME",
          }[stockDetails.series] || stockDetails.series
        }
      </>
    )}
  </p>

</div>

{/* ── RIGHT: PRICE + ACTIONS ── */}
<div className="flex items-center gap-4">

  {/* PRICE BLOCK */}
  <div className="text-right">
    <p className="text-[16px] font-semibold text-slate-100">
      ₹ {formatNumber(normalized.ltp)}
    </p>

    <p
      className={`text-[11px] font-medium ${
        normalized.change >= 0 ? "text-green-400" : "text-red-400"
      }`}
    >
      {normalized.change >= 0 ? "+" : ""}
      {formatNumber(normalized.change.toFixed(2))} (
      {normalized.changePercent.toFixed(2)}%)
    </p>
  </div>

  {/* ACTIONS */}
  <div className="flex gap-2">
    <button className="px-4 py-1.5 text-[11px] rounded-md bg-green-500/10 text-green-400 border border-green-500/30 hover:bg-green-500/20 hover:border-green-400 transition-all">
      Buy
    </button>

    <button className="px-4 py-1.5 text-[11px] rounded-md bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 hover:border-red-400 transition-all">
      Sell
    </button>
  </div>

</div>

</div>

    {/* ── TOOLBAR ── */}
    <div className="flex items-center justify-between px-4 py-1.5 border-b border-[#1e2a3a] bg-[#0f1623] flex-shrink-0">
      <div className="flex gap-1">
        {["1m", "5m", "15m"].map((tf) => (
          <button
            key={tf}
            onClick={() => setTimeframe(tf)}
            className={`px-2.5 py-0.5 text-[11px] rounded-md border transition-colors ${
              timeframe === tf
                ? "bg-blue-500/15 text-blue-400 border-blue-500/30"
                : "bg-transparent text-slate-500 border-[#1e2a3a] hover:text-slate-300"
            }`}
          >
            {tf}
          </button>
        ))}
      </div>
      <div className="flex gap-2 items-center">
        {[["from", fromDate, setFromDate], ["to", toDate, setToDate]].map(([, val, setter]) => (
          <input
            key={val}
            type="date"
            value={val}
            onChange={(e) => setter(e.target.value)}
            className="bg-[#0b0f1a] border border-[#1e2a3a] text-slate-400 text-[11px] px-2 py-0.5 rounded-md outline-none focus:border-slate-500"
          />
        ))}
      </div>
    </div>

    {/* ── MAIN CONTENT ── */}
    <div 
    style={{backgroundColor:"rgb(15 22 35 / var(--tw-bg-opacity, 1))"}}
    className="flex flex-1 overflow-hidden bg-[#0f1623]">
{/* rgb(15 22 35 / var(--tw-bg-opacity, 1)) */}
      {/* ── CHART COLUMN ── */}
      <div className="flex-1 flex flex-col border-r border-[#1e2a3a] overflow-hidden">

        {/* Chart */}
        <div className=" relative bg-[#0b0f1a]">
          {noCandleData ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center space-y-1">
              <p className="text-sm text-slate-500">No market data available</p>
              <p className="text-xs text-slate-600">Try a different date or timeframe</p>
            </div>
          ) : (
            <div ref={chartRef} className="w-full h-[320px]     " />
          )}
        </div>

        {/* ── AI STRIP ── */}
        <div className="flex-shrink-0 border-t border-[#1e2a3a] bg-[#0f1623] px-4 py-2">
          <p className="text-[9px] text-slate-600 uppercase tracking-widest mb-1.5">AI Analysis</p>
          <div className="flex gap-3 items-center">
            <div className="flex gap-1.5 flex-shrink-0">
              {[
                { label: "Short term", val: aiData?.short_term, type: "signal" },
                { label: "Long term", val: aiData?.long_term, type: "signal" },
                { label: "Confidence", val: aiData?.confidence, type: "conf" },
              ].map(({ label, val, type }) => (
                <div
                  key={label}
                  className={`px-2.5 py-1.5 rounded-md text-center border ${
                    type === "conf"
                      ? "bg-yellow-500/8 border-yellow-500/20"
                      : val === "BUY"
                      ? "bg-green-500/8 border-green-500/20"
                      : "bg-red-500/8 border-red-500/20"
                  }`}
                >
                  <p className="text-[9px] text-slate-600 mb-0.5">{label}</p>
                  {aiLoading ? (
                    <div className="w-8 h-2.5 bg-slate-700 rounded animate-pulse mx-auto" />
                  ) : (
                    <p className={`text-[11px] font-medium ${type === "conf" ? "text-yellow-400" : val === "BUY" ? "text-green-400" : "text-red-400"}`}>
                      {val || "—"}
                    </p>
                  )}
                </div>
              ))}
            </div>
            <div className="flex-1 text-[11px] text-slate-500 leading-relaxed border-l border-[#1e2a3a] pl-3">
              {aiLoading ? (
                <div className="space-y-1.5">
                  <div className="h-2 bg-slate-700 rounded animate-pulse w-full" />
                  <div className="h-2 bg-slate-700 rounded animate-pulse w-4/5" />
                </div>
              ) : aiData?.reason || <span className="text-slate-600">No analysis available</span>}
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div
        className="flex-shrink-0 flex flex-col overflow-y-auto bg-[#0f1623]"
        style={{ width: 256 }}
      >

        {/* Position */}
        {qty > 0 && (
          <div className="px-3 py-2 border-b border-[#1e2a3a]">
            <p className="text-[9px] text-slate-600 uppercase tracking-widest mb-1.5">Your Position</p>
            <div className="bg-[#0b0f1a] border border-[#1e2a3a] rounded-lg p-2.5">
              <div className="flex justify-between mb-2">
                <div>
                  <p className="text-[9px] text-slate-600 mb-0.5">Qty</p>
                  <p className="text-[13px] font-medium text-slate-200">{formatNumber(qty)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] text-slate-600 mb-0.5">Avg price</p>
                  <p className="text-[13px] font-medium text-slate-200">₹ {formatNumber(avgPrice)}</p>
                </div>
              </div>
              <div className="flex justify-between mb-2">
                <div>
                  <p className="text-[9px] text-slate-600 mb-0.5">Invested</p>
                  <p className="text-[11px] text-slate-300">₹ {formatNumber(investedValue)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] text-slate-600 mb-0.5">Current</p>
                  <p className="text-[11px] text-slate-300">₹ {formatNumber(currentValue)}</p>
                </div>
              </div>
              <div className="border-t border-[#1e2a3a] pt-2 flex justify-between items-center">
                <p className="text-[10px] text-slate-500">P&L</p>
                <p className={`text-[14px] font-medium ${isProfit ? "text-green-400" : "text-red-400"}`}>
                  {isProfit ? "+" : ""}₹ {formatNumber(Math.abs(pnl))}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* OHLC */}
        <div className="px-3 py-2 border-b border-[#1e2a3a]">
          <p className="text-[9px] text-slate-600 uppercase tracking-widest mb-1.5">OHLC</p>
          <div className="grid grid-cols-4 gap-1">
            {[
              { label: "Open", val: normalized.open, cls: "text-slate-300" },
              { label: "High", val: normalized.high, cls: "text-green-400" },
              { label: "Low", val: normalized.low, cls: "text-red-400" },
              { label: "Prev", val: normalized.prevClose, cls: "text-slate-300" },
            ].map(({ label, val, cls }) => (
              <div key={label} className="bg-[#0b0f1a] border border-[#1e2a3a] rounded-md p-1.5 text-center">
                <p className="text-[9px] text-slate-600 mb-0.5">{label}</p>
                <p className={`text-[10px] ${cls}`}>{formatNumber(val)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Market stats */}
        <div className="px-3 py-2">
          <p className="text-[9px] text-slate-600 uppercase tracking-widest mb-1.5">Market Stats</p>
          <div className="grid grid-cols-2 gap-1">
            {[
              { label: "Volume", val: formatNumber(normalized.volume) },
              { label: "Avg trade price", val: `₹ ${formatNumber(normalized.avgTradePrice)}` },
              { label: "52W high", val: `₹ ${formatNumber(normalized.week52High)}` },
              { label: "52W low", val: `₹ ${formatNumber(normalized.week52Low)}` },
            ].map(({ label, val }) => (
              <div key={label} className="bg-[#0b0f1a] border border-[#1e2a3a] rounded-md px-2 py-1.5">
                <p className="text-[9px] text-slate-600 mb-0.5">{label}</p>
                <p className="text-[11px] text-slate-300">{val}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  </div>
);
};

export default StockPreviewPage;