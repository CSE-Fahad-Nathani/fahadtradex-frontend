import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useMemo, useState, useEffect, useRef } from "react";
import useMarketFeed from "../hooks/useMarketFeed";
import { useMarketStore } from "../store/marketStore";
import { formatNumber } from "../utils/formatNumber";
import { createChart, CandlestickSeries } from "lightweight-charts";
import TradeModal from "../components/trading/TradeModal";

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

  const today = new Date().toISOString().split("T")[0];

  const [snapshot, setSnapshot] = useState(null);
  const [candles, setCandles] = useState([]);
  const [loading, setLoading] = useState(true);

  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);
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
    const chart = createChart(chartRef.current, {
      layout: { background: { color: "#0b0f1a" }, textColor: "#475569" },
      grid: { vertLines: { color: "#1a2233" }, horzLines: { color: "#1a2233" } },
      crosshair: { vertLine: { color: "#334155" }, horzLine: { color: "#334155" } },
      timeScale: { borderColor: "#1e2a3a", timeVisible: true },
      rightPriceScale: { borderColor: "#1e2a3a" },
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
    className="flex flex-col min-h-0 bg-[#0b0f1a] text-slate-200 overflow-hidden"
    style={{ height: "calc(100vh - 8rem)", fontFamily: "ui-monospace, monospace" }}
  >

    {/* ── TOP BAR ── */}
    <div className="flex items-center justify-between px-5 py-1.5 border-b border-[#1e2a3a] bg-[#0f1623] flex-shrink-0">

{/* ── LEFT: NAME + META ── */}
<div className="flex flex-col items-start gap-2.5 mt-3">
  <button
    onClick={handleBack}
    className="inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-semibold rounded-md border border-cyan-400/40 bg-cyan-500/15 text-cyan-200 shadow-[0_0_0_1px_rgba(34,211,238,0.15)] hover:bg-cyan-500/25 hover:text-cyan-100 hover:border-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-300/50 transition-all"
  >
    <span aria-hidden="true">←</span>
    Back 
  </button>
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
    {exchLabel} · {exchType === "C" ? "Cash" : "Derivatives"}· {exchType === "C" ? "Equity" : "Commodity"}
  
  </p>

</div>
</div>

{/* ── RIGHT: PRICE + ACTIONS ── */}
<div className="flex items-center gap-8">

  {/* PRICE BLOCK */}
  <div className="text-right">
    <p className="text-[20px] font-semibold text-slate-100">
      ₹ {formatNumber(normalized.ltp)}
    </p>

    <p
      className={`text-[13px] font-medium ${
        normalized.change >= 0 ? "text-green-400" : "text-red-400"
      }`}
    >
      {normalized.change >= 0 ? "+" : ""}
      {formatNumber(normalized.change.toFixed(2))} (
      {normalized.changePercent.toFixed(2)}%)
    </p>
  </div>

  {/* ACTIONS */}
  <div className="flex gap-3">
    <button className="px-4 py-1.5 text-[14px] rounded-md bg-green-500/10 text-green-400 border border-green-500/30 hover:bg-green-500/20 hover:border-green-400 transition-all"
    onClick={() => {
      // console.log("BUY", item)
      setSelectedStock(stockDetails?.name);
      setTradeAction("BUY");
      setIsModalOpen(true);
   } }
    >
      Buy
    </button>

    <button 
      onClick={() => {
        // console.log("BUY", item)
        setSelectedStock(stockDetails?.name);
        setTradeAction("SELL");
        setIsModalOpen(true);
     } }
     className="px-4 py-1.5 text-[14px] rounded-md bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 hover:border-red-400 transition-all">
      Sell
    </button>
  </div>

</div>

</div>

    {/* ── TOOLBAR ── */}
    <div className="flex items-center justify-between px-4 py-1 border-b border-[#1e2a3a] bg-[#0f1623] flex-shrink-0">
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
        {[["from", fromDate, setFromDate], ["to", toDate, setToDate]].map(([label, val, setter]) => (
          <input
            key={label}
            type="date"
            value={val}
            onChange={(e) => setter(e.target.value)}
            className="bg-[#0b0f1a] border border-[#1e2a3a] text-slate-400 text-[11px] px-2 py-0.5 rounded-md outline-none focus:border-slate-500"
          />
        ))}
      </div>
    </div>

    {/* ── MAIN CONTENT ── */}
    <div className="flex flex-1 min-h-0 overflow-hidden bg-[#0f1623]">
      {/* ── CHART COLUMN ── */}
      <div 
      style={{overflowY:"auto"}}
      className="flex-1 flex flex-col min-h-0 border-r border-[#1e2a3a] overflow-hidden">

        {/* Chart */}
        <div className="relative min-h-[220px] basis-[62%] bg-[#0b0f1a]">
          {noCandleData ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center space-y-1">
              <p className="text-sm text-slate-500">No market data available</p>
              <p className="text-xs text-slate-600">Try a different date or timeframe</p>
            </div>
          ) : (
            <div ref={chartRef} className="w-full h-full" />
          )}
        </div>

        {/* ── AI STRIP ── */}
        <div className="flex-1 min-h-[170px] border-t border-[#1e2a3a] bg-[#0f1623] px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] text-slate-500 uppercase tracking-widest">AI Analysis</p>
            <span className="inline-flex items-center gap-1 rounded-full border border-indigo-400/20 bg-indigo-500/10 px-2 py-0.5 text-[9px] text-indigo-300">
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
                <div
                  key={label}
                  className={`rounded-lg border px-3 py-2.5 ${
                    type === "conf"
                      ? "bg-yellow-500/8 border-yellow-500/25"
                      : val === "BUY"
                      ? "bg-emerald-500/10 border-emerald-500/30"
                      : "bg-rose-500/10 border-rose-500/30"
                  }`}
                >
                  <p className="text-[10px] uppercase tracking-wide text-slate-500">{label}</p>
                  {aiLoading ? (
                    <div className="mt-2 h-3 w-14 bg-slate-700/80 rounded animate-pulse" />
                  ) : (
                    <p className={`mt-1.5 text-[14px] font-semibold ${type === "conf" ? "text-yellow-300" : val === "BUY" ? "text-emerald-300" : "text-rose-300"}`}>
                      {val || "—"}
                    </p>
                  )}
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-[#1f2d44] bg-gradient-to-br from-[#121a2b] via-[#0f1623] to-[#0d1421] p-3 shadow-[0_10px_30px_rgba(0,0,0,0.2)]">
              <div className="h-full min-h-0 grid gap-3">
                <div className="min-h-0 rounded-lg border border-[#22324a] bg-[#0e1625]/80 px-3 py-2.5">
                  <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-2">Model Insight</p>
                  {aiLoading ? (
                    <div className="space-y-1.5">
                      <div className="h-2 bg-slate-700/80 rounded animate-pulse w-full" />
                      <div className="h-2 bg-slate-700/80 rounded animate-pulse w-11/12" />
                      <div className="h-2 bg-slate-700/80 rounded animate-pulse w-5/6" />
                    </div>
                  ) : (
                    <p className="h-[calc(100%-1.15rem)] overflow-y-auto pr-1 text-[12px] leading-relaxed text-slate-200">
                      {aiData?.reason || <span className="text-slate-600">No analysis available</span>}
                    </p>
                  )}
                </div>

                {/* <div className="grid grid-rows-2 gap-2 min-h-0">
                  <div className="rounded-lg border border-[#22324a] bg-[#0d1522]/80 px-3 py-2">
                    <p className="text-[9px] uppercase tracking-widest text-slate-500 mb-1">Bias</p>
                    <p className={`text-[13px] font-semibold ${aiData?.short_term === "BUY" ? "text-emerald-300" : "text-rose-300"}`}>
                      {aiLoading ? "..." : aiData?.short_term || "Neutral"}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-1">Near-term stance</p>
                  </div>
                  <div className="rounded-lg border border-[#22324a] bg-[#0d1522]/80 px-3 py-2">
                    <p className="text-[9px] uppercase tracking-widest text-slate-500 mb-1">Risk Level</p>
                    <p className="text-[13px] font-semibold text-yellow-300">
                      {aiLoading ? "..." : aiData?.confidence || "Moderate"}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-1">Signal reliability</p>
                  </div>
                </div> */}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div
        className="flex-shrink-0 flex flex-col min-h-0 overflow-y-auto bg-[#0f1623]"
        style={{ width: "clamp(240px, 24vw, 420px)" }}
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