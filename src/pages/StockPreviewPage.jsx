import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useMemo, useState, useEffect, useRef } from "react";
import useMarketFeed from "../hooks/useMarketFeed";
import { useMarketStore } from "../store/marketStore";
import { formatNumber } from "../utils/formatNumber";
import { createChart, CandlestickSeries } from "lightweight-charts";
import TradeModal from "../components/trading/TradeModal";
import { useThemeStore } from "../store/themeStore";

const StockPreviewPage = () => {
  const navigate = useNavigate();
  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/dashboard");
    }
  };

  const { exch, exchType, scripCode, symbol } = useParams();
  const token = String(scripCode);
  const [noCandleData, setNoCandleData] = useState(false);
  

  const [selectedStock, setSelectedStock] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tradeAction, setTradeAction] = useState("BUY");

  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  const candleSeriesRef = useRef(null); // 🔥 NEW
  const theme = useThemeStore((s) => s.theme);
  const isLight = theme === "light";
  const labelClass = isLight ? "text-slate-600" : "text-textSubtle";
  const profitClass = (positive) =>
    isLight ? (positive ? "text-green-700" : "text-red-700") : positive ? "text-green-400" : "text-red-400";
  const toolbarInactiveClass = isLight
    ? `bg-transparent ${labelClass} border-borderColor hover:text-slate-900`
    : "bg-transparent text-slate-500 border-borderColor hover:text-slate-300";
  const aiInsightPanelClass = isLight
    ? "rounded-xl border border-borderColor bg-cardBg p-3 shadow-sm"
    : "rounded-xl border border-[#1f2d44] bg-gradient-to-br from-[#121a2b] via-[#0f1623] to-[#0d1421] p-3 shadow-[0_10px_30px_rgba(0,0,0,0.2)]";
  const aiInsightPanelClassMobile = isLight
    ? "rounded-lg border border-borderColor bg-cardBg p-2"
    : "rounded-lg border border-[#1f2d44] bg-gradient-to-br from-[#121a2b] via-[#0f1623] to-[#0d1421] p-2";
  const skeletonClass = isLight ? "bg-borderColor animate-pulse rounded" : "bg-slate-700/80 animate-pulse rounded";
  const signalValueClass = (type, val) => {
    if (type === "conf") return isLight ? "text-yellow-700" : "text-yellow-300";
    if (val === "BUY") return isLight ? "text-emerald-700" : "text-emerald-300";
    return isLight ? "text-rose-700" : "text-rose-300";
  };

  const DATE_RANGES = [
    { id: "1d", label: "1 Day" },
    { id: "1w", label: "1 Week" },
    { id: "15d", label: "15 Days" },
    { id: "1m", label: "1 Month" },
    { id: "6m", label: "6 Month" },
  ];

  const getDateRange = (range) => {
    const to = new Date();
    const from = new Date();
    switch (range) {
      case "1w":
        from.setDate(from.getDate() - 7);
        break;
      case "15d":
        from.setDate(from.getDate() - 15);
        break;
      case "1m":
        from.setMonth(from.getMonth() - 1);
        break;
      case "6m":
        from.setMonth(from.getMonth() - 6);
        break;
      default:
        break;
    }
    const format = (d) => d.toISOString().split("T")[0];
    return { fromDate: format(from), toDate: format(to) };
  };

  const [snapshot, setSnapshot] = useState(null);
  const [candles, setCandles] = useState([]);
  const [loading, setLoading] = useState(true);

  const [dateRange, setDateRange] = useState("1d");
  const { fromDate, toDate } = useMemo(() => getDateRange(dateRange), [dateRange]);
  const [timeframe, setTimeframe] = useState("1m");
  const [stockDetails, setStockDetails] = useState(null);

  useEffect(() => {
    console.log("stockDetails: ",stockDetails);
  }, [stockDetails]);

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
  const qty = Number(searchParams.get("qty")) || Number(searchParams.get("lots"))  || Number(searchParams.get("lotSize")) || 0;
  const investedValue = Number(searchParams.get("invested")) || 0;
  const lotSize = Number(searchParams.get("lotSize")) ||  stockDetails?.lotSize || 0;
  const multiplier = Number(searchParams.get("multiplier")) ||  stockDetails?.multiplier || 0;
  const [aiData, setAiData] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);


  useEffect(() => {
    console.log("stockDetails: lotSize: ",selectedStock);
  }, [selectedStock]);

  useEffect(() => {
    const fetchSnapshotAndDetails = async () => {
      try {
        setLoading(true);

        const [snapRes, detailsRes] = await Promise.all([
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
          fetch(
            `${import.meta.env.VITE_API_BASE_URL}/api/stocks/details?scripCode=${scripCode}&exch=${exch}&exchType=${exchType}`
          ),
        ]);

        const snapData = await snapRes.json();
        const detailsData = await detailsRes.json();

        const snap = snapData?.data?.body?.Data?.[0];
        setSnapshot(snap);
        setStockDetails(detailsData?.data || null);
      } catch (err) {
        console.error("Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSnapshotAndDetails();
  }, [exch, exchType, scripCode]);

  useEffect(() => {
    if (!candleSeriesRef.current) return;
    if (!candles.length) return;
    if (!liveData?.LastRate) return;
  
    const lastCandle = candles[candles.length - 1];
  
    const updatedCandle = {
      ...lastCandle,
      close: liveData.LastRate,
      high: Math.max(lastCandle.high, liveData.LastRate),
      low: Math.min(lastCandle.low, liveData.LastRate),
    };
  
    candleSeriesRef.current.update(updatedCandle);
  }, [liveData]);

  useEffect(() => {
    const fetchCandles = async () => {
      try {
        if (fromDate > toDate) return;

        const candleRes = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/historical/data`, {
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
        });

        const candleData = await candleRes.json();
        const rawCandles = candleData?.data?.data?.candles || [];

        if (!rawCandles.length) {
          setNoCandleData(true);
          setCandles([]);
          return;
        }

        setNoCandleData(false);
        const formatted = rawCandles.map((c) => ({
          time: Math.floor(new Date(c[0]).getTime() / 1000),
          open: c[1],
          high: c[2],
          low: c[3],
          close: c[4],
        }));
        setCandles(formatted);
      } catch (err) {
        console.error("Error:", err);
      }
    };

    fetchCandles();
  }, [exch, exchType, scripCode, timeframe, fromDate, toDate]);

  useEffect(() => {
    if (!snapshot) return;
    const fetchAI = async () => {
      try {
        setAiLoading(true);
        const payload = {
          name: symbol,
          exchange: exch === "N" ? "NSE" : exch === "B" ? "BSE" : "MCX",
          snapshot,
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

  const currentValue = exch === "M" ? 0.15 * normalized.ltp * qty * multiplier : normalized.ltp * qty;
  const pnl = exch === "M" ? ( normalized.ltp * qty * multiplier) - ( avgPrice * qty * multiplier) : currentValue - investedValue;
  const isProfit = pnl >= 0;
  const exchLabel = exch === "N" ? "NSE" : exch === "B" ? "BSE" : "MCX";

  useEffect(() => {
    if (!chartRef.current || candles.length === 0) return;
    if (chartInstance.current) {
      try { chartInstance.current.remove(); } catch (e) {}
      chartInstance.current = null;
    }
    const isLight = theme === "light";
    const chart = createChart(chartRef.current, {
      layout: {
        background: { color: isLight ? "#f1f5f9" : "#0b0f1a" },
        textColor: isLight ? "#64748b" : "#475569",
      },
      grid: {
        vertLines: { color: isLight ? "#e2e8f0" : "#1a2233" },
        horzLines: { color: isLight ? "#e2e8f0" : "#1a2233" },
      },
      crosshair: {
        vertLine: { color: isLight ? "#94a3b8" : "#334155" },
        horzLine: { color: isLight ? "#94a3b8" : "#334155" },
      },
      timeScale: { borderColor: isLight ? "#e2e8f0" : "#1e2a3a", timeVisible: true },
      rightPriceScale: { borderColor: isLight ? "#e2e8f0" : "#1e2a3a" },
      handleScroll: true,
      handleScale: true,
    });
    // const candleSeries = chart.addSeries(CandlestickSeries, {
    //   upColor: "#22c55e",
    //   downColor: "#ef4444",
    //   borderVisible: false,
    //   wickUpColor: "#22c55e",
    //   wickDownColor: "#ef4444",
    // });
    // candleSeries.setData(candles);
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#22c55e",
      downColor: "#ef4444",
      borderVisible: false,
      wickUpColor: "#22c55e",
      wickDownColor: "#ef4444",
    });
    
    candleSeries.setData(candles);
    
    candleSeriesRef.current = candleSeries; // 🔥 IMPORTANT
    // chart.timeScale().fitContent();
    chartInstance.current = chart;
    const handleResize = () => {
      if (!chartInstance.current || !chartRef.current) return;
      chartInstance.current.applyOptions({ width: chartRef.current.clientWidth, height: chartRef.current.clientHeight });
    };
    handleResize();

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(chartRef.current);

    return () => {
      resizeObserver.disconnect();
      if (chartInstance.current) {
        try { chartInstance.current.remove(); } catch (e) {}
        chartInstance.current = null;
      }
    };
  }, [candles, theme]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-primaryBg">
        <div className="text-center space-y-1.5 sm:space-y-2">
          <div className="w-5 h-5 sm:w-6 sm:h-6 border border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className={`text-[10px] sm:text-xs font-mono ${labelClass}`}>Loading {symbol}...</p>
        </div>
      </div>
    );
  }

 return (
  <div
    className="flex flex-col bg-primaryBg text-textPrimary overflow-x-hidden overflow-y-auto sm:overflow-hidden sm:min-h-0"
    style={{ minHeight: "calc(100vh - 5.5rem)", fontFamily: "ui-monospace, monospace" }}
  >

    {/* ── TOP BAR ── */}
    <div className="flex flex-col sm:flex-row sm:items-center justify-between px-2.5 sm:px-5 py-1.5 border-b border-borderColor bg-cardBg flex-shrink-0 gap-1.5 sm:gap-0">

      {/* ── LEFT: NAME + META ── */}
      <div className="flex flex-col items-start gap-1.5 sm:gap-2.5 mt-1.5 sm:mt-3">
        <button
          onClick={handleBack}
          className={`inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-0.5 sm:py-1 text-[9px] sm:text-[11px] font-semibold rounded-md border transition-all ${
            isLight
              ? "border-cyan-600/35 bg-cyan-50 text-cyan-800 hover:bg-cyan-100"
              : "border-cyan-400/40 bg-cyan-500/15 text-cyan-200 hover:bg-cyan-500/25"
          }`}
        >
          <span aria-hidden="true">←</span>
          Back
        </button>
        <div className="flex flex-col">
          <p className="text-[12px] sm:text-[14px] font-semibold text-textPrimary leading-tight truncate max-w-[60vw] sm:max-w-none">
            {stockDetails?.name || "—"}
          </p>
          <p className={`text-[9px] sm:text-[11px] ${labelClass}`}>{symbol}</p>
          <p className={`text-[8px] sm:text-[10px] mt-[1px] sm:mt-[2px] ${labelClass}`}>
            {exchLabel} · {exchType === "C" ? "Cash" : "Derivatives"} · {exchType === "C" ? "Equity" : "Commodity"}
          </p>
        </div>
      </div>

      {/* ── RIGHT: PRICE + ACTIONS ── */}
      <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-8">
        <div className="text-left sm:text-right">
          <p className="text-[16px] sm:text-[20px] font-semibold text-textPrimary">
            ₹ {formatNumber(normalized.ltp)}
          </p>
          <p className={`text-[10px] sm:text-[13px] font-medium ${profitClass(normalized.change >= 0)}`}>
            {normalized.change >= 0 ? "+" : ""}{formatNumber(normalized.change.toFixed(2))} ({normalized.changePercent.toFixed(2)}%)
          </p>
        </div>

        <div className="flex gap-1.5 sm:gap-3">
          <button
            className={`px-2.5 sm:px-4 py-1 sm:py-1.5 text-[10px] sm:text-[14px] rounded-md border transition-all ${
              isLight
                ? "bg-green-50 text-green-700 border-green-500/35 hover:bg-green-100"
                : "bg-green-500/10 text-green-400 border-green-500/30 hover:bg-green-500/20"
            }`}
            onClick={() => { setSelectedStock(stockDetails?.name); setTradeAction("BUY"); setIsModalOpen(true); }}
          >Buy</button>
          <button
            className={`px-2.5 sm:px-4 py-1 sm:py-1.5 text-[10px] sm:text-[14px] rounded-md border transition-all ${
              isLight
                ? "bg-red-50 text-red-700 border-red-500/35 hover:bg-red-100"
                : "bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20"
            }`}
            onClick={() => { setSelectedStock(stockDetails?.name); setTradeAction("SELL"); setIsModalOpen(true); }}
          >Sell</button>
        </div>
      </div>

    </div>

    {/* ── TOOLBAR ── */}
    <div className="flex items-center justify-between px-2 sm:px-4 py-1 border-b border-borderColor bg-cardBg flex-shrink-0 gap-1.5">
      <div className="flex gap-0.5 sm:gap-1">
        {["1m", "5m", "15m"].map((tf) => (
          <button
            key={tf}
            onClick={() => setTimeframe(tf)}
            className={`px-1.5 sm:px-2.5 py-0.5 text-[9px] sm:text-[11px] rounded-md border transition-colors ${
              timeframe === tf
                ? (isLight ? "bg-blue-50 text-blue-700 border-blue-500/35" : "bg-blue-500/15 text-blue-400 border-blue-500/30")
                : toolbarInactiveClass
            }`}
          >
            {tf}
          </button>
        ))}
      </div>
      <div className="flex gap-0.5 sm:gap-1 items-center flex-wrap justify-end">
        {DATE_RANGES.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setDateRange(id)}
            className={`px-1.5 sm:px-2.5 py-0.5 text-[9px] sm:text-[11px] rounded-md border transition-colors whitespace-nowrap ${
              dateRange === id
                ? (isLight ? "bg-blue-50 text-blue-700 border-blue-500/35" : "bg-blue-500/15 text-blue-400 border-blue-500/30")
                : toolbarInactiveClass
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>

    {/* ── MAIN CONTENT ── */}
    <div className="flex flex-col sm:flex-row sm:flex-1 sm:min-h-0 overflow-visible sm:overflow-hidden bg-cardBg">

      {/* ── CHART COLUMN ── */}
      <div className="flex flex-col sm:flex-1 sm:min-h-0 sm:border-r border-borderColor sm:overflow-y-auto">

        {/* Chart */}
        <div className="relative h-[250px] sm:h-auto sm:min-h-[220px] sm:basis-[62%] bg-primaryBg shrink-0">
          {noCandleData ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center space-y-1">
              <p className={`text-xs sm:text-sm ${labelClass}`}>No market data available</p>
              <p className={`text-[10px] sm:text-xs ${labelClass}`}>Try a different date or timeframe</p>
            </div>
          ) : (
            <div ref={chartRef} className="w-full h-full" />
          )}
        </div>

        {/* ── AI STRIP (desktop only — below chart) ── */}
        <div className="hidden sm:block flex-1 min-h-[170px] border-t border-borderColor bg-cardBg px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <p className={`text-[10px] uppercase tracking-widest ${labelClass}`}>AI Analysis</p>
            <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] ${
              isLight ? "border-indigo-500/25 bg-indigo-50 text-indigo-700" : "border-indigo-400/20 bg-indigo-500/10 text-indigo-300"
            }`}>
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-300 animate-pulse" />
              Live model
            </span>
          </div>
          <div className="h-full min-h-0 grid grid-rows-[auto_1fr] gap-3">
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Short term", val: aiData?.short_term, type: "signal" },
                { label: "Long term", val: aiData?.long_term, type: "signal" },
                { label: "Confidence", val: aiData?.confidence, type: "conf" },
              ].map(({ label, val, type }) => (
                <div key={label} className={`rounded-lg border px-3 py-2.5 ${type === "conf" ? "bg-yellow-500/8 border-yellow-500/25" : val === "BUY" ? "bg-emerald-500/10 border-emerald-500/30" : "bg-rose-500/10 border-rose-500/30"}`}>
                  <p className={`text-[10px] uppercase tracking-wide ${labelClass}`}>{label}</p>
                  {aiLoading ? <div className={`mt-2 h-3 w-14 ${skeletonClass}`} /> : (
                    <p className={`mt-1.5 text-[14px] font-semibold ${signalValueClass(type, val)}`}>{val || "—"}</p>
                  )}
                </div>
              ))}
            </div>
            <div className={aiInsightPanelClass}>
              <div className="h-full min-h-0 grid gap-3">
                <div className="min-h-0 rounded-lg border border-borderColor bg-[var(--color-surface-elevated)] px-3 py-2.5">
                  <p className={`text-[10px] uppercase tracking-widest mb-2 ${labelClass}`}>Model Insight</p>
                  {aiLoading ? (
                    <div className="space-y-1.5"><div className={`h-2 w-full ${skeletonClass}`} /><div className={`h-2 w-11/12 ${skeletonClass}`} /><div className={`h-2 w-5/6 ${skeletonClass}`} /></div>
                  ) : (
                    <p className="h-[calc(100%-1.15rem)] overflow-y-auto pr-1 text-[12px] leading-relaxed text-textPrimary">{aiData?.reason || <span className={labelClass}>No analysis available</span>}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL (below chart on mobile, sidebar on desktop) ── */}
      <div
        className="flex-shrink-0 flex flex-col min-h-0 overflow-y-auto bg-cardBg w-full sm:w-[clamp(240px,24vw,420px)] border-t sm:border-t-0 border-borderColor"
      >

        {qty > 0 && (
          <div className="px-2.5 sm:px-3 py-2 border-b border-borderColor">
            <p className={`text-[8px] sm:text-[9px] uppercase tracking-widest mb-1 sm:mb-1.5 ${labelClass}`}>Your Position</p>
            <div className="bg-primaryBg border border-borderColor rounded-lg p-2 sm:p-2.5">
              <div className="flex justify-between mb-1.5 sm:mb-2">
                <div>
                  <p className={`text-[8px] sm:text-[9px] mb-0.5 ${labelClass}`}>Qty</p>
                  <p className="text-[11px] sm:text-[13px] font-medium text-textPrimary">{formatNumber(qty)}</p>
                </div>
                <div className="text-right">
                  <p className={`text-[8px] sm:text-[9px] mb-0.5 ${labelClass}`}>Avg price</p>
                  <p className="text-[11px] sm:text-[13px] font-medium text-textPrimary">₹ {formatNumber(avgPrice)}</p>
                </div>
              </div>
              <div className="flex justify-between mb-1.5 sm:mb-2">
                <div>
                  <p className={`text-[8px] sm:text-[9px] mb-0.5 ${labelClass}`}>Invested</p>
                  <p className="text-[10px] sm:text-[11px] text-textPrimary">₹ {formatNumber(investedValue)}</p>
                </div>
                <div className="text-right">
                  <p className={`text-[8px] sm:text-[9px] mb-0.5 ${labelClass}`}>Current</p>
                  <p className="text-[10px] sm:text-[11px] text-textPrimary">₹ {formatNumber(currentValue)}</p>
                </div>
              </div>
              <div className="border-t border-borderColor pt-1.5 sm:pt-2 flex justify-between items-center">
                <p className={`text-[9px] sm:text-[10px] ${labelClass}`}>P&L</p>
                <p className={`text-[12px] sm:text-[14px] font-medium ${profitClass(isProfit)}`}>
                  {isProfit ? "+" : ""}₹ {formatNumber(Math.abs(pnl))}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="px-2.5 sm:px-3 py-2 border-b border-borderColor">
          <p className={`text-[8px] sm:text-[9px] uppercase tracking-widest mb-1 sm:mb-1.5 ${labelClass}`}>OHLC</p>
          <div className="grid grid-cols-4 gap-1">
            {[
              { label: "Open", val: normalized.open, cls: "text-textPrimary" },
              { label: "High", val: normalized.high, cls: profitClass(true) },
              { label: "Low", val: normalized.low, cls: profitClass(false) },
              { label: "Prev", val: normalized.prevClose, cls: "text-textPrimary" },
            ].map(({ label, val, cls }) => (
              <div key={label} className="bg-primaryBg border border-borderColor rounded-md p-1 sm:p-1.5 text-center">
                <p className={`text-[7px] sm:text-[9px] mb-0.5 ${labelClass}`}>{label}</p>
                <p className={`text-[9px] sm:text-[10px] ${cls}`}>{formatNumber(val)}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="px-2.5 sm:px-3 py-2 border-b sm:border-b-0 border-borderColor">
          <p className={`text-[8px] sm:text-[9px] uppercase tracking-widest mb-1 sm:mb-1.5 ${labelClass}`}>Market Stats</p>
          <div className="grid grid-cols-2 gap-1">
            {[
              { label: "Volume", val: formatNumber(normalized.volume) },
              { label: "Avg trade price", val: `₹ ${formatNumber(normalized.avgTradePrice)}` },
              { label: "52W high", val: `₹ ${formatNumber(normalized.week52High)}` },
              { label: "52W low", val: `₹ ${formatNumber(normalized.week52Low)}` },
            ].map(({ label, val }) => (
              <div key={label} className="bg-primaryBg border border-borderColor rounded-md px-1.5 sm:px-2 py-1 sm:py-1.5">
                <p className={`text-[7px] sm:text-[9px] mb-0.5 ${labelClass}`}>{label}</p>
                <p className="text-[9px] sm:text-[11px] text-textPrimary">{val}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── AI STRIP (mobile only — after Market Stats) ── */}
        <div className="sm:hidden px-2.5 py-2 bg-cardBg">
          <div className="flex items-center justify-between mb-1.5">
            <p className={`text-[8px] uppercase tracking-widest ${labelClass}`}>AI Analysis</p>
            <span className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[7px] ${
              isLight ? "border-indigo-500/25 bg-indigo-50 text-indigo-700" : "border-indigo-400/20 bg-indigo-500/10 text-indigo-300"
            }`}>
              <span className="h-1 w-1 rounded-full bg-indigo-300 animate-pulse" />
              Live model
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1 mb-2">
            {[
              { label: "Short term", val: aiData?.short_term, type: "signal" },
              { label: "Long term", val: aiData?.long_term, type: "signal" },
              { label: "Confidence", val: aiData?.confidence, type: "conf" },
            ].map(({ label, val, type }) => (
              <div key={label} className={`rounded-md border px-2 py-1.5 ${type === "conf" ? "bg-yellow-500/8 border-yellow-500/25" : val === "BUY" ? "bg-emerald-500/10 border-emerald-500/30" : "bg-rose-500/10 border-rose-500/30"}`}>
                <p className={`text-[7px] uppercase tracking-wide ${labelClass}`}>{label}</p>
                {aiLoading ? <div className={`mt-1 h-2.5 w-10 ${skeletonClass}`} /> : (
                  <p className={`mt-1 text-[11px] font-semibold ${signalValueClass(type, val)}`}>{val || "—"}</p>
                )}
              </div>
            ))}
          </div>
          <div className={aiInsightPanelClassMobile}>
            <div className="rounded-md border border-borderColor bg-[var(--color-surface-elevated)] px-2 py-2">
              <p className={`text-[8px] uppercase tracking-widest mb-1 ${labelClass}`}>Model Insight</p>
              {aiLoading ? (
                <div className="space-y-1"><div className={`h-2 w-full ${skeletonClass}`} /><div className={`h-2 w-11/12 ${skeletonClass}`} /><div className={`h-2 w-5/6 ${skeletonClass}`} /></div>
              ) : (
                <p className="overflow-y-auto pr-1 text-[10px] leading-relaxed text-textPrimary max-h-24">{aiData?.reason || <span className={labelClass}>No analysis available</span>}</p>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>

    {selectedStock && (
  <TradeModal
    isOpen={isModalOpen}
    onClose={() => setIsModalOpen(false)}
    scripCode={Number(token)}
    exchange={exch}
    exchangeType={exchType}
    symbol={symbol}
    name={stockDetails?.name}
    action={tradeAction}
    // 🔥 NEW
    lotSize={Number(lotSize)}
    multiplier={Number(multiplier)}
    // totalQty={Number(qty)}
  />
)}


{/* console.log("aaaaa Exch:", exchLabel)
      console.log("aaaaa ExchType:", exchType)
      // console.log("LTP",)
      // console.log("Quantity",)
      console.log("aaaaa ScripCode:", token)
      console.log("aaaaa name:", stockDetails?.name)
      console.log("aaaaa symbol:", symbol)

      console.log("aaaaa lotSize:", multiplier)
      console.log("aaaaa multiplier",multiplier)
      console.log("aaaaa totalQty",qty) */}

  </div>
);
};

export default StockPreviewPage;