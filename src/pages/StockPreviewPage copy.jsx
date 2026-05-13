import { useParams, useSearchParams } from "react-router-dom";
import { useMemo, useState, useEffect, useRef } from "react";

// hooks & store
import useMarketFeed from "../hooks/useMarketFeed";
import { useMarketStore } from "../store/marketStore";

// utils
import { formatNumber } from "../utils/formatNumber";

// chart
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
  const [timeframe, setTimeframe] = useState("5m");

  // ✅ WS
  const scrips = useMemo(
    () => [
      {
        Exch: exch,
        ExchType: exchType,
        ScripCode: Number(scripCode),
      },
    ],
    [exch, exchType, scripCode]
  );

  useMarketFeed({
    accessToken: localStorage.getItem("fivePaisaAccessToken"),
    clientCode: localStorage.getItem("clientCode"),
    scrips,
  });

  const liveData = useMarketStore((state) => state.data[token]);

  // ✅ params
  const [searchParams] = useSearchParams();

  const avgPrice = Number(searchParams.get("avgPrice")) || 0;
  const qty = Number(searchParams.get("qty")) || 0;
  const investedValue = Number(searchParams.get("invested")) || 0;
  const lotSize = Number(searchParams.get("lotSize")) || 0;
  const [aiData, setAiData] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

// 🔥 FETCH SNAPSHOT + CANDLES
useEffect(() => {
    const fetchAll = async () => {
      try {
        if (fromDate > toDate) return;
  
        setLoading(true);
  
        const [snapRes, candleRes] = await Promise.all([
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
        ]);
  
        const snapData = await snapRes.json();
        const candleData = await candleRes.json();
  
        const snap = snapData?.data?.body?.Data?.[0];
        const rawCandles = candleData?.data?.data?.candles || [];
  
        setSnapshot(snap); // ✅ always set snapshot
  
        // 🔥 HANDLE CANDLES PROPERLY
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
  
          setCandles(formatted); // ✅ ONLY HERE
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
          ohlc: {
            open: Number(snapshot.Open),
            high: Number(snapshot.High),
            low: Number(snapshot.Low),
            close: Number(snapshot.PClose),
          },
          day_change: Number(snapshot.NetChange),
          day_change_perc:
            (Number(snapshot.NetChange) / Number(snapshot.PClose)) * 100,
          week_52_high: Number(snapshot.AHigh),
          week_52_low: Number(snapshot.ALow),
        };
  
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/ai/analyze`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
  
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

  // 🧠 NORMALIZED
  const snap = snapshot || {};

  const normalized = {
    ltp: liveData?.LastRate || Number(snap.LastTradedPrice) || 0,
    prevClose: liveData?.PClose || Number(snap.PClose) || 0,

    open: Number(snap.Open) || 0,
    high: Number(snap.High) || 0,
    low: Number(snap.Low) || 0,

    change: liveData
      ? liveData.LastRate - liveData.PClose
      : Number(snap.NetChange) || 0,

    changePercent:
      liveData?.ChgPcnt ||
      (snap.PClose
        ? (Number(snap.NetChange) / Number(snap.PClose)) * 100
        : 0),

    volume: Number(snap.Volume) || 0,
    avgPrice: Number(snap.AverageTradePrice) || 0,
  };

  const currentValue = normalized.ltp * qty;
  const pnl = currentValue - investedValue;
  const isProfit = pnl >= 0;

  // 🔥 CHART
  useEffect(() => {
    if (!chartRef.current || candles.length === 0) return;
  
    // ✅ CLEAN OLD CHART
    if (chartInstance.current) {
      try {
        chartInstance.current.remove();
      } catch (e) {
        console.warn("Chart already removed");
      }
      chartInstance.current = null;
    }
  
    // ✅ CREATE NEW CHART
    const chart = createChart(chartRef.current, {
      // width: chartRef.current.clientWidth,
      // height: 320,
      layout: {
        background: { color: "#0f172a" },
        textColor: "#d1d5db",
      },
      grid: {
        vertLines: { color: "#1f2937" },
        horzLines: { color: "#1f2937" },
      },
    });
  
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#22c55e",
      downColor: "#ef4444",
      borderVisible: false,
      wickUpColor: "#22c55e",
      wickDownColor: "#ef4444",
    });
  
    candleSeries.setData(candles);
  
    chartInstance.current = chart;
  
    // ✅ SAFE RESIZE HANDLER
    const handleResize = () => {
      if (!chartInstance.current || !chartRef.current) return;
  
      chartInstance.current.applyOptions({
        width: chartRef.current.clientWidth,
      });
    };
  
    window.addEventListener("resize", handleResize);
  
    // ✅ CLEANUP
    return () => {
      window.removeEventListener("resize", handleResize);
  
      if (chartInstance.current) {
        try {
          chartInstance.current.remove();
        } catch (e) {
          console.warn("Cleanup chart error");
        }
        chartInstance.current = null;
      }
    };
  }, [candles]);

  if (loading) {
    return (
      <div className="p-4 text-white">
        <p className="text-sm text-gray-400">Loading stock data...</p>
      </div>
    );
  }

  return (
    <div 
    style={{maxHeight:"85vh"}}
    className="h-[calc(100vh-4rem)] flex flex-col text-white overflow-hidden">
  
      {/* 🔵 TOP STOCK HEADER */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 bg-secondaryBg">
  
        <div>
          <h1 className="text-lg font-semibold">{symbol}</h1>
          <p className="text-xs text-gray-400">
            {exch === "N" ? "NSE" : exch === "B" ? "BSE" : "MCX"} • {exchType}
          </p>
        </div>
  
        <div className="text-center font-mono">
          <p className="text-lg font-semibold">
            ₹ {formatNumber(normalized.ltp)}
          </p>
          <p
            className={`text-xs ${
              normalized.ltp > normalized.prevClose
                ? "text-green-400"
                : "text-red-400"
            }`}
          >
            {normalized.change >= 0 ? "+" : ""}
            {formatNumber(normalized.change.toFixed(2))} (
            {normalized.changePercent.toFixed(2)}%)
          </p>
        </div>
  
        <div className="flex gap-2">
          <button className="px-3 py-1 text-sm rounded bg-green-500 hover:bg-green-600">
            Buy
          </button>
          <button className="px-3 py-1 text-sm rounded bg-red-500 hover:bg-red-600">
            Sell
          </button>
        </div>
      </div>
  
      {/* 🔥 MAIN AREA */}
      <div className="flex-1 flex flex-col bg-primaryBg">
  
        {/* CONTROLS */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800">
  
          <div className="flex gap-2">
            {["1m", "5m", "15m"].map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-2 py-1 text-xs rounded ${
                  timeframe === tf
                    ? "bg-blue-500 text-white"
                    : "bg-gray-700 text-gray-300"
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
  
          <div className="flex gap-3 text-xs">
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="bg-gray-800 px-2 py-1 rounded"
            />
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="bg-gray-800 px-2 py-1 rounded"
            />
          </div>
        </div>
  
        {/* 🔥 CHART + SIDE PANEL */}
        <div className="flex flex-1 overflow-hidden">
  
          {/* 📈 CHART (65%) */}
          <div className="w-[65%]  relative border-r border-gray-800">
  
            {noCandleData ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 text-sm text-center space-y-2">
                <p>No market data available</p>
                <p className="text-xs text-gray-500">
                  Try changing date or timeframe
                </p>
              </div>
            ) : (
              <>
                <div ref={chartRef} className="w-full " />
              {/* 🧠 AI PANEL */}
<div className="border-t border-gray-800 bg-secondaryBg p-4">

  <div className="max-w-5xl mx-auto">

    <p className="text-sm text-gray-400 mb-3">AI Analysis</p>

    <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-xl p-4 shadow-lg">

      {aiLoading ? (
        <p className="text-sm text-gray-400 animate-pulse">
          Analyzing stock...
        </p>
      ) : aiData ? (
        <div className="space-y-3">

          {/* SIGNALS */}
          <div className="flex gap-4">

            <div className="flex-1 bg-gray-800 p-3 rounded text-center">
              <p className="text-xs text-gray-400">Short Term</p>
              <p className={`font-semibold ${
                aiData.short_term === "BUY"
                  ? "text-green-400"
                  : "text-red-400"
              }`}>
                {aiData.short_term}
              </p>
            </div>

            <div className="flex-1 bg-gray-800 p-3 rounded text-center">
              <p className="text-xs text-gray-400">Long Term</p>
              <p className={`font-semibold ${
                aiData.long_term === "BUY"
                  ? "text-green-400"
                  : "text-red-400"
              }`}>
                {aiData.long_term}
              </p>
            </div>

            <div className="flex-1 bg-gray-800 p-3 rounded text-center">
              <p className="text-xs text-gray-400">Confidence</p>
              <p className="text-yellow-400 font-semibold">
                {aiData.confidence}
              </p>
            </div>

          </div>

          {/* REASON */}
          <div className="text-sm text-gray-300 leading-relaxed border-t border-gray-700 pt-3">
            {aiData.reason}
          </div>

        </div>
      ) : (
        <p className="text-gray-500 text-sm">No AI data</p>
      )}

    </div>

  </div>
</div>
              </>
            )}

            
  
          </div>

          
  
          {/* 📊 RIGHT PANEL */}
<div className="w-[35%] h-full p-4 space-y-4 overflow-y-auto bg-secondaryBg">

{/* 🔥 POSITION (PRIORITY CARD) */}
{qty > 0 && (
  <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-4 rounded-xl border border-gray-700 shadow-lg">

    <p className="text-xs text-gray-400 mb-3">Your Position</p>

    <div className="flex items-center justify-between mb-3">
      <div>
        <p className="text-xs text-gray-400">Qty</p>
        <p className="text-lg font-semibold">{formatNumber(qty)}</p>
      </div>

      <div>
        <p className="text-xs text-gray-400">Avg</p>
        <p className="text-lg font-semibold">
          ₹ {formatNumber(avgPrice)}
        </p>
      </div>
    </div>

    <div className="flex items-center justify-between mb-3">
      <div>
        <p className="text-xs text-gray-400">Invested</p>
        <p>₹ {formatNumber(investedValue)}</p>
      </div>

      <div>
        <p className="text-xs text-gray-400">Current</p>
        <p>₹ {formatNumber(currentValue)}</p>
      </div>
    </div>

    <div className="border-t border-gray-700 pt-3 flex items-center justify-between">
      <p className="text-sm text-gray-400">P&L</p>
      <p className={`text-lg font-bold ${isProfit ? "text-green-400" : "text-red-400"}`}>
        ₹ {formatNumber(pnl)}
      </p>
    </div>

  </div>
)}

{/* 📊 MARKET STATS */}
<div className="grid grid-cols-2 gap-3 text-sm font-mono">

  <div className="bg-gray-800/50 p-2 rounded">
    <p className="text-xs text-gray-400">Open</p>
    <p>₹ {formatNumber(normalized.open)}</p>
  </div>

  <div className="bg-gray-800/50 p-2 rounded">
    <p className="text-xs text-gray-400">Prev Close</p>
    <p>₹ {formatNumber(normalized.prevClose)}</p>
  </div>

  <div className="bg-gray-800/50 p-2 rounded">
    <p className="text-xs text-gray-400">High</p>
    <p>₹ {formatNumber(normalized.high)}</p>
  </div>

  <div className="bg-gray-800/50 p-2 rounded">
    <p className="text-xs text-gray-400">Low</p>
    <p>₹ {formatNumber(normalized.low)}</p>
  </div>

  <div className="bg-gray-800/50 p-2 rounded">
    <p className="text-xs text-gray-400">Volume</p>
    <p>{formatNumber(normalized.volume)}</p>
  </div>

  <div className="bg-gray-800/50 p-2 rounded">
    <p className="text-xs text-gray-400">Avg Price</p>
    <p>₹ {formatNumber(normalized.avgPrice)}</p>
  </div>

</div>

</div>
  
        </div>
        
  
      </div>
    </div>
  );
};

export default StockPreviewPage;