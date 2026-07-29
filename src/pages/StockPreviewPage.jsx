import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useMemo, useState, useEffect, useRef } from "react";
import useMarketFeed from "../hooks/useMarketFeed";
import { useMarketStore } from "../store/marketStore";
import { formatNumber } from "../utils/formatNumber";
import { createChart, CandlestickSeries } from "lightweight-charts";
import TradeModal from "../components/trading/TradeModal";
import { useThemeStore } from "../store/themeStore";
import StockPreviewLoader from "../components/stock/StockPreviewLoader";

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
  const candleSeriesRef = useRef(null);
  const candlesFetchIdRef = useRef(0);
  const hasBootstrappedRef = useRef(false);
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
  const [rawCandles, setRawCandles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [candlesLoading, setCandlesLoading] = useState(true);

  const [dateRange, setDateRange] = useState("15d");
  const { fromDate, toDate } = useMemo(() => getDateRange(dateRange), [dateRange]);
  const [timeframe, setTimeframe] = useState("60m");
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

  const exchLabel = exch === "N" ? "NSE" : exch === "B" ? "BSE" : "MCX";

  const bootstrapSteps = useMemo(() => {
    const market = loading ? "active" : snapshot ? "done" : "pending";
    const candlesStep = loading
      ? "pending"
      : candlesLoading
        ? "active"
        : candles.length || noCandleData
          ? "done"
          : "pending";
    const ai = loading || candlesLoading
      ? "pending"
      : aiLoading
        ? "active"
        : !loading && !candlesLoading
          ? "done"
          : "pending";

    return { market, candles: candlesStep, ai };
  }, [loading, snapshot, candlesLoading, candles.length, noCandleData, aiLoading]);

  const bootstrapProgress = useMemo(() => {
    const weights = { market: 35, candles: 35, ai: 30 };
    let progress = 0;

    if (bootstrapSteps.market === "done") progress += weights.market;
    else if (bootstrapSteps.market === "active") progress += weights.market * 0.45;

    if (bootstrapSteps.candles === "done") progress += weights.candles;
    else if (bootstrapSteps.candles === "active") progress += weights.candles * 0.45;

    if (bootstrapSteps.ai === "done") progress += weights.ai;
    else if (bootstrapSteps.ai === "active") progress += weights.ai * 0.45;

    return Math.min(100, Math.round(progress));
  }, [bootstrapSteps]);

  const isBootstrapping = !hasBootstrappedRef.current && (loading || candlesLoading || aiLoading);

  useEffect(() => {
    hasBootstrappedRef.current = false;
  }, [exch, exchType, scripCode]);

  useEffect(() => {
    if (!loading && !candlesLoading && !aiLoading) {
      hasBootstrappedRef.current = true;
    }
  }, [loading, candlesLoading, aiLoading]);


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
      const fetchId = ++candlesFetchIdRef.current;
      try {
        if (fromDate > toDate) return;

        setCandlesLoading(true);
        setNoCandleData(false);
        const timeframeCandidates = [timeframe, "5m", "15m", "30m", "60m", "1m"].filter(
          (value, index, arr) => arr.indexOf(value) === index
        );
        let successfulTimeframe = timeframe;
        let formatted = [];
        let fetchedRawCandles = [];

        for (const candidate of timeframeCandidates) {
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
              TimeFrame: candidate,
              FromDate: fromDate,
              ToDate: toDate,
            }),
          });

          if (fetchId !== candlesFetchIdRef.current) return;

          const candleData = await candleRes.json();
          if (fetchId !== candlesFetchIdRef.current) return;

          const rawCandles = candleData?.data?.data?.candles || candleData?.data?.candles || [];
          if (!rawCandles.length) continue;

          // Deduplicate by timestamp (lightweight-charts fails silently on duplicates)
          const byTime = new Map();
          rawCandles.forEach((c) => {
            const time = Math.floor(new Date(c[0]).getTime() / 1000);
            if (!Number.isFinite(time)) return;
            byTime.set(time, {
              time,
              open: Number(c[1]),
              high: Number(c[2]),
              low: Number(c[3]),
              close: Number(c[4]),
            });
          });

          formatted = Array.from(byTime.values()).sort((a, b) => a.time - b.time);
          if (formatted.length) {
            successfulTimeframe = candidate;
            fetchedRawCandles = rawCandles;
            break;
          }
        }

        if (!formatted.length) {
          setNoCandleData(true);
          setCandles([]);
          setRawCandles([]);
          return;
        }

        if (successfulTimeframe !== timeframe) {
          setTimeframe(successfulTimeframe);
        }

        setNoCandleData(false);
        setCandles(formatted);
        setRawCandles(fetchedRawCandles);
      } catch (err) {
        if (fetchId !== candlesFetchIdRef.current) return;
        console.error("Candle fetch error:", err);
        setNoCandleData(true);
        setCandles([]);
        setRawCandles([]);
      } finally {
        if (fetchId === candlesFetchIdRef.current) {
          setCandlesLoading(false);
        }
      }
    };

    fetchCandles();
  }, [exch, exchType, scripCode, timeframe, fromDate, toDate]);

  useEffect(() => {
    if (!snapshot) return;
    if (candlesLoading) return;

    const fetchAI = async () => {
      try {
        setAiLoading(true);
        const payload = {
          name: symbol,
          exchange: exch === "N" ? "NSE" : exch === "B" ? "BSE" : "MCX",
          snapshot,
          candles: rawCandles,
          timeframe,
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
  }, [snapshot, symbol, exch, rawCandles, timeframe, candlesLoading]);

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

  // Create chart only after the page has left the full-screen loader (chartRef exists in DOM).
  // Race: candles often arrive while `loading === true`, so chartRef is null on first effect run.
  useEffect(() => {
    if (isBootstrapping) return;
    if (noCandleData) return;
    if (!candles.length) return;

    let cancelled = false;
    let rafId = 0;
    let resizeObserver = null;
    let attempts = 0;

    const destroyChart = () => {
      if (resizeObserver) {
        try { resizeObserver.disconnect(); } catch (e) {}
        resizeObserver = null;
      }
      if (chartInstance.current) {
        try { chartInstance.current.remove(); } catch (e) {}
        chartInstance.current = null;
      }
      candleSeriesRef.current = null;
    };

    const initChart = () => {
      if (cancelled) return;

      const el = chartRef.current;
      if (!el) {
        if (attempts < 30) {
          attempts += 1;
          rafId = requestAnimationFrame(initChart);
        }
        return;
      }

      const width = el.clientWidth;
      const height = el.clientHeight;
      if (width < 2 || height < 2) {
        if (attempts < 40) {
          attempts += 1;
          rafId = requestAnimationFrame(initChart);
        }
        return;
      }

      destroyChart();

      const light = theme === "light";
      const chart = createChart(el, {
        width,
        height,
        layout: {
          background: { color: light ? "#f1f5f9" : "#0b0f1a" },
          textColor: light ? "#64748b" : "#475569",
        },
        grid: {
          vertLines: { color: light ? "#e2e8f0" : "#1a2233" },
          horzLines: { color: light ? "#e2e8f0" : "#1a2233" },
        },
        crosshair: {
          vertLine: { color: light ? "#94a3b8" : "#334155" },
          horzLine: { color: light ? "#94a3b8" : "#334155" },
        },
        timeScale: { borderColor: light ? "#e2e8f0" : "#1e2a3a", timeVisible: true },
        rightPriceScale: { borderColor: light ? "#e2e8f0" : "#1e2a3a" },
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

      candleSeriesRef.current = candleSeries;
      chartInstance.current = chart;

      const handleResize = () => {
        if (!chartInstance.current || !chartRef.current) return;
        chartInstance.current.applyOptions({
          width: chartRef.current.clientWidth,
          height: chartRef.current.clientHeight,
        });
      };

      resizeObserver = new ResizeObserver(handleResize);
      resizeObserver.observe(el);
      handleResize();
    };

    rafId = requestAnimationFrame(initChart);

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      destroyChart();
    };
  }, [candles, theme, isBootstrapping, noCandleData]);

  if (isBootstrapping) {
    return (
      <StockPreviewLoader
        symbol={stockDetails?.name || symbol}
        exchangeLabel={`${symbol} · ${exchLabel} · ${exchType === "C" ? "Cash" : "Derivatives"}`}
        steps={bootstrapSteps}
        progress={bootstrapProgress}
        isLight={isLight}
      />
    );
  }

 return (
  <div
    className="flex flex-col h-[calc(100dvh-7.25rem)] sm:h-[calc(100dvh-7rem)] overflow-hidden bg-primaryBg text-textPrimary"
    style={{ fontFamily: "ui-monospace, monospace" }}
  >

    {/* ── TOP BAR ── */}
    <div className="flex items-center justify-between px-2 sm:px-4 py-1 sm:py-1.5 border-b border-borderColor bg-cardBg flex-shrink-0 gap-2">

      {/* ── LEFT: NAME + META ── */}
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <button
          onClick={handleBack}
          className={`inline-flex items-center gap-1 px-2 py-0.5 text-[9px] sm:text-[11px] font-semibold rounded-md border transition-all shrink-0 ${
            isLight
              ? "border-cyan-600/35 bg-cyan-50 text-cyan-800 hover:bg-cyan-100"
              : "border-cyan-400/40 bg-cyan-500/15 text-cyan-200 hover:bg-cyan-500/25"
          }`}
        >
          <span aria-hidden="true">←</span>
          Back
        </button>
        <div className="min-w-0">
          <p className="text-[11px] sm:text-[14px] font-semibold text-textPrimary leading-tight truncate">
            {stockDetails?.name || "—"}
          </p>
          <p className={`text-[8px] sm:text-[10px] truncate ${labelClass}`}>
            {symbol} · {exchLabel} · {exchType === "C" ? "Cash" : "Derivatives"}
          </p>
        </div>
      </div>

      {/* ── RIGHT: PRICE + ACTIONS ── */}
      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        <div className="text-right">
          <p className="text-[14px] sm:text-[18px] font-semibold text-textPrimary leading-none">
            ₹ {formatNumber(normalized.ltp)}
          </p>
          <p className={`text-[9px] sm:text-[12px] font-medium ${profitClass(normalized.change >= 0)}`}>
            {normalized.change >= 0 ? "+" : ""}{formatNumber(normalized.change.toFixed(2))} ({normalized.changePercent.toFixed(2)}%)
          </p>
        </div>

        <div className="flex gap-1 sm:gap-2">
          <button
            className={`px-2 sm:px-3 py-0.5 sm:py-1 text-[9px] sm:text-[13px] rounded-md border transition-all ${
              isLight
                ? "bg-green-50 text-green-700 border-green-500/35 hover:bg-green-100"
                : "bg-green-500/10 text-green-400 border-green-500/30 hover:bg-green-500/20"
            }`}
            onClick={() => { setSelectedStock(stockDetails?.name); setTradeAction("BUY"); setIsModalOpen(true); }}
          >Buy</button>
          <button
            className={`px-2 sm:px-3 py-0.5 sm:py-1 text-[9px] sm:text-[13px] rounded-md border transition-all ${
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
        {["1m", "5m", "15m", "30m", "60m"].map((tf) => (
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
    <div className="flex flex-col sm:flex-row flex-1 min-h-0 overflow-hidden bg-cardBg">

      {/* ── CHART COLUMN ── */}
      <div className="flex flex-col flex-[3] sm:flex-1 min-h-0 sm:border-r border-borderColor overflow-hidden">

        {/* Chart */}
        <div className="relative flex-1 min-h-[120px] sm:min-h-0 bg-primaryBg">
          {noCandleData ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center space-y-1">
              <p className={`text-xs sm:text-sm ${labelClass}`}>No market data available</p>
              <p className={`text-[10px] sm:text-xs ${labelClass}`}>Try a different date or timeframe</p>
            </div>
          ) : candlesLoading && candles.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center space-y-2">
              <div className="w-5 h-5 border border-blue-500 border-t-transparent rounded-full animate-spin" />
              <p className={`text-[10px] sm:text-xs font-mono ${labelClass}`}>Updating chart...</p>
            </div>
          ) : (
            <div ref={chartRef} className="w-full h-full min-h-[120px]" />
          )}
        </div>

        {/* ── AI STRIP (desktop only — below chart) ── */}
        <div className="hidden sm:flex flex-[0_0_38%] min-h-0 border-t border-borderColor bg-cardBg px-3 py-2 overflow-hidden">
          <div className="flex flex-col min-h-0 w-full">
          <div className="flex items-center justify-between mb-1.5 shrink-0">
            <p className={`text-[9px] uppercase tracking-widest ${labelClass}`}>AI Analysis</p>
            <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] ${
              isLight ? "border-indigo-500/25 bg-indigo-50 text-indigo-700" : "border-indigo-400/20 bg-indigo-500/10 text-indigo-300"
            }`}>
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-300 animate-pulse" />
              Live model
            </span>
          </div>
          <div className="flex-1 min-h-0 grid grid-rows-[auto_1fr] gap-2">
            <div className="grid grid-cols-3 gap-1.5 shrink-0">
              {[
                { label: "Short term", val: aiData?.short_term, type: "signal" },
                { label: "Long term", val: aiData?.long_term, type: "signal" },
                { label: "Confidence", val: aiData?.confidence, type: "conf" },
              ].map(({ label, val, type }) => (
                <div key={label} className={`rounded-lg border px-2 py-1.5 ${type === "conf" ? "bg-yellow-500/8 border-yellow-500/25" : val === "BUY" ? "bg-emerald-500/10 border-emerald-500/30" : "bg-rose-500/10 border-rose-500/30"}`}>
                  <p className={`text-[9px] uppercase tracking-wide ${labelClass}`}>{label}</p>
                  {aiLoading ? <div className={`mt-1 h-2.5 w-12 ${skeletonClass}`} /> : (
                    <p className={`mt-1 text-[12px] font-semibold ${signalValueClass(type, val)}`}>{val || "—"}</p>
                  )}
                </div>
              ))}
            </div>
            <div className={`${aiInsightPanelClass} min-h-0 overflow-hidden`}>
              <div className="h-full min-h-0 rounded-lg border border-borderColor bg-[var(--color-surface-elevated)] px-2.5 py-2">
                <p className={`text-[9px] uppercase tracking-widest mb-1 ${labelClass}`}>Model Insight</p>
                {aiLoading ? (
                  <div className="space-y-1"><div className={`h-2 w-full ${skeletonClass}`} /><div className={`h-2 w-11/12 ${skeletonClass}`} /></div>
                ) : (
                  <p className="text-[11px] leading-snug text-textPrimary line-clamp-4">{aiData?.reason || <span className={labelClass}>No analysis available</span>}</p>
                )}
              </div>
            </div>
          </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL (below chart on mobile, sidebar on desktop) ── */}
      <div
        className="flex flex-col flex-[2] sm:flex-none min-h-0 overflow-hidden bg-cardBg w-full sm:w-[clamp(220px,22vw,360px)] border-t sm:border-t-0 border-borderColor"
      >

        {qty > 0 && (
          <div className="px-2 sm:px-2.5 py-1.5 border-b border-borderColor shrink-0">
            <p className={`text-[7px] sm:text-[8px] uppercase tracking-widest mb-1 ${labelClass}`}>Your Position</p>
            <div className="bg-primaryBg border border-borderColor rounded-lg p-1.5 sm:p-2">
              <div className="flex justify-between mb-1">
                <div>
                  <p className={`text-[8px] sm:text-[9px] mb-0.5 ${labelClass}`}>Qty</p>
                  <p className="text-[11px] sm:text-[13px] font-medium text-textPrimary">{formatNumber(qty)}</p>
                </div>
                <div className="text-right">
                  <p className={`text-[8px] sm:text-[9px] mb-0.5 ${labelClass}`}>Avg price</p>
                  <p className="text-[11px] sm:text-[13px] font-medium text-textPrimary">₹ {formatNumber(avgPrice)}</p>
                </div>
              </div>
              <div className="flex justify-between mb-1">
                <div>
                  <p className={`text-[7px] sm:text-[8px] mb-0.5 ${labelClass}`}>Invested</p>
                  <p className="text-[9px] sm:text-[10px] text-textPrimary">₹ {formatNumber(investedValue)}</p>
                </div>
                <div className="text-right">
                  <p className={`text-[7px] sm:text-[8px] mb-0.5 ${labelClass}`}>Current</p>
                  <p className="text-[9px] sm:text-[10px] text-textPrimary">₹ {formatNumber(currentValue)}</p>
                </div>
              </div>
              <div className="border-t border-borderColor pt-1 flex justify-between items-center">
                <p className={`text-[8px] sm:text-[9px] ${labelClass}`}>P&L</p>
                <p className={`text-[10px] sm:text-[12px] font-medium ${profitClass(isProfit)}`}>
                  {isProfit ? "+" : ""}₹ {formatNumber(Math.abs(pnl))}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="px-2 sm:px-2.5 py-1.5 border-b border-borderColor shrink-0">
          <p className={`text-[7px] sm:text-[8px] uppercase tracking-widest mb-1 ${labelClass}`}>OHLC</p>
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

        <div className="px-2 sm:px-2.5 py-1.5 border-b sm:border-b-0 border-borderColor shrink-0">
          <p className={`text-[7px] sm:text-[8px] uppercase tracking-widest mb-1 ${labelClass}`}>Market Stats</p>
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
        <div className="sm:hidden px-2 py-1.5 bg-cardBg min-h-0 overflow-hidden flex-1">
          <div className="flex items-center justify-between mb-1">
            <p className={`text-[7px] uppercase tracking-widest ${labelClass}`}>AI Analysis</p>
            <span className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[7px] ${
              isLight ? "border-indigo-500/25 bg-indigo-50 text-indigo-700" : "border-indigo-400/20 bg-indigo-500/10 text-indigo-300"
            }`}>
              <span className="h-1 w-1 rounded-full bg-indigo-300 animate-pulse" />
              Live model
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1 mb-1.5 shrink-0">
            {[
              { label: "Short term", val: aiData?.short_term, type: "signal" },
              { label: "Long term", val: aiData?.long_term, type: "signal" },
              { label: "Confidence", val: aiData?.confidence, type: "conf" },
            ].map(({ label, val, type }) => (
              <div key={label} className={`rounded-md border px-1.5 py-1 ${type === "conf" ? "bg-yellow-500/8 border-yellow-500/25" : val === "BUY" ? "bg-emerald-500/10 border-emerald-500/30" : "bg-rose-500/10 border-rose-500/30"}`}>
                <p className={`text-[6px] uppercase tracking-wide ${labelClass}`}>{label}</p>
                {aiLoading ? <div className={`mt-0.5 h-2 w-8 ${skeletonClass}`} /> : (
                  <p className={`mt-0.5 text-[10px] font-semibold ${signalValueClass(type, val)}`}>{val || "—"}</p>
                )}
              </div>
            ))}
          </div>
          <div className={`${aiInsightPanelClassMobile} overflow-hidden`}>
            <div className="rounded-md border border-borderColor bg-[var(--color-surface-elevated)] px-2 py-1.5">
              <p className={`text-[7px] uppercase tracking-widest mb-0.5 ${labelClass}`}>Model Insight</p>
              {aiLoading ? (
                <div className="space-y-1"><div className={`h-2 w-full ${skeletonClass}`} /><div className={`h-2 w-10/12 ${skeletonClass}`} /></div>
              ) : (
                <p className="text-[9px] leading-snug text-textPrimary line-clamp-2">{aiData?.reason || <span className={labelClass}>No analysis available</span>}</p>
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