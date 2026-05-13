import { useState, useEffect } from "react";
import useMarketFeed from "../../hooks/useMarketFeed";
import { useMarketStore } from "../../store/marketStore";
import { formatNumber } from "../../utils/formatNumber";
import TradeModal from "../../components/trading/TradeModal";
import { useNavigate } from "react-router-dom";
import { fetchUserData } from "../../services/user.service";

function Portfolio() {
  const [portfolio, setPortfolio] = useState([]);
  const [loading, setLoading] = useState(true);
    const [selectedStock, setSelectedStock] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
  const [tradeAction, setTradeAction] = useState("BUY");

  const liveData = useMarketStore((s) => s.data);

  const navigate = useNavigate();

  // ==============================
  // 🔥 FETCH PORTFOLIO
  // ==============================
  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        const token = localStorage.getItem("token");

        const res = await fetch("http://localhost:3000/api/portfolio", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const result = await res.json();

        if (result.success) {
          setPortfolio(result.data);
        }
      } catch (err) {
        console.error("Portfolio fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPortfolio();
  }, []);

  // ==============================
  // 🔥 PREPARE SCRIPS FOR WS
  // ==============================
  const scrips =
    portfolio.length > 0
      ? portfolio.map((item) => ({
          Exch: item.Exch,
          ExchType: item.ExchType || "C",
          ScripCode: Number(item.ScripCode),
        }))
      : [];

  // ==============================
  // 🔌 WEBSOCKET
  // ==============================
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
      const prev = Number(live?.PClose || 0); // 🔥 NEW
  
      const invested = Number(item.investedValue || avg * qty);
      const currentValue = ltp * qty;
      const pnl = currentValue - invested;
  
      // 🔥 TODAY P&L
      const todayPL = (ltp - prev) * qty;
  
      acc.qty += qty;
      acc.currentValue += currentValue;
      acc.invested += invested;
      acc.pnl += pnl;
      acc.todayPL += todayPL; // 🔥 NEW
  
      return acc;
    },
    { qty: 0, currentValue: 0, invested: 0, pnl: 0, todayPL: 0 } // 🔥 NEW
  );


  useEffect(() => {
    fetchUserData();
  }, []);

  // ==============================
  // 🔥 LOADING
  // ==============================


  // ==============================
  // 🔥 UI
  // ==============================
  return (
    <div className="flex flex-col gap-6 p-4">

      {/* <h1 className="text-xl font-semibold">Portfolio</h1> */}
      <div className="flex items-center justify-between ">
        <h1 className="text-xl font-semibold">Portfolio</h1>

        <span className="text-xs text-gray-400">
          *Equity Only (Excludes Positions)
        </span>
      </div>


{/* 🔥 PORTFOLIO SUMMARY CARDS */}
<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">

  {/* 🔥 LOADER */}
  {loading ? (
    [...Array(4)].map((_, i) => (
      <div
        key={i}
        className="bg-cardBg border border-borderColor rounded-2xl p-4 animate-pulse"
      >
        <div className="h-3 w-20 bg-borderColor rounded mb-3"></div>
        <div className="h-5 w-28 bg-borderColor rounded mb-2"></div>
        <div className="h-2 w-24 bg-borderColor rounded"></div>
      </div>
    ))
  ) : (
    <>
      {/* INVESTED */}
      <div className="bg-cardBg border border-borderColor rounded-2xl p-4 backdrop-blur-md">
        <p className="text-xs text-gray-400 mb-1">Invested</p>
        <p className="text-lg font-semibold font-mono">
          ₹ {formatNumber(portfolioTotals.invested.toFixed(2))}
        </p>
        <p className="text-[11px] text-gray-500 mt-1">Total Buy Value</p>
      </div>

      {/* CURRENT */}
      <div className="bg-cardBg border border-borderColor rounded-2xl p-4 backdrop-blur-md">
        <p className="text-xs text-gray-400 mb-1">Current</p>
        <p className="text-lg font-semibold font-mono">
          ₹ {formatNumber(portfolioTotals.currentValue.toFixed(2))}
        </p>
        <p className="text-[11px] text-gray-500 mt-1">Live Value</p>
      </div>

      {/* P&L */}
      <div className="bg-cardBg border border-borderColor rounded-2xl p-4 backdrop-blur-md">
        <p className="text-xs text-gray-400 mb-1">P&amp;L</p>
        <p
          className={`text-lg font-semibold font-mono ${
            portfolioTotals.pnl >= 0 ? "text-green-500" : "text-red-500"
          }`}
        >
          ₹ {formatNumber(portfolioTotals.pnl.toFixed(2))}
        </p>
        <p className="text-[11px] text-gray-500 mt-1">
          {portfolioTotals.invested > 0
            ? `${((portfolioTotals.pnl / portfolioTotals.invested) * 100).toFixed(2)}%`
            : "—"}
        </p>
      </div>

      {/* TODAY */}
      <div className="bg-cardBg border border-borderColor rounded-2xl p-4 backdrop-blur-md">
        <p className="text-xs text-gray-400 mb-1">Today</p>
        <p
          className={`text-lg font-semibold font-mono ${
            portfolioTotals.todayPL >= 0 ? "text-green-500" : "text-red-500"
          }`}
        >
          ₹ {formatNumber(portfolioTotals.todayPL.toFixed(2))}
        </p>
        <p className="text-[11px] text-gray-500 mt-1">
          {portfolioTotals.invested > 0
            ? `${((portfolioTotals.todayPL / portfolioTotals.invested) * 100).toFixed(2)}%`
            : "—"}
        </p>
      </div>
    </>
  )}
</div>

      <div className="bg-cardBg border border-borderColor rounded-xl overflow-x-auto">
        <div className="min-w-[900px]">

          {/* Header */}
         <div className="grid grid-cols-[2fr_1.2fr_1fr_1fr_1.3fr_1.2fr] px-4 py-3 text-xs text-gray-400 border-b border-borderColor text-center">
  <span className="text-left">Name</span>

  <span>
    <div>LTP</div>
    <div className="text-[10px] text-gray-500">Change (%)</div>
  </span>

  <span>
    <div>Avg Price</div>
    <div className="text-[10px] text-gray-500">Buy Price</div>
  </span>

  <span>
    <div>Qty</div>
  </span>

  <span>
    <div>Current Value</div>
    <div className="text-[10px] text-gray-500">Buy Value</div>
  </span>

  <span>
    <div>P&L</div>
    <div className="text-[10px] text-gray-500">Return %</div>
  </span>
</div>

          {/* Body */}
          <div>

{/* 🔥 LOADING SKELETON */}
{loading && (
  <div className="animate-pulse">
    {[...Array(6)].map((_, i) => (
      <div
        key={i}
        className="grid grid-cols-[2fr_1.2fr_1fr_1fr_1.3fr_1.2fr] px-4 py-3 border-b border-borderColor"
      >
        {/* Name */}
        <div className="space-y-2">
          <div className="h-3 w-32 bg-borderColor rounded"></div>
          <div className="h-2 w-20 bg-borderColor rounded"></div>
        </div>

        {/* LTP */}
        <div className="flex flex-col items-center gap-2">
          <div className="h-3 w-16 bg-borderColor rounded"></div>
          <div className="h-2 w-12 bg-borderColor rounded"></div>
        </div>

        {/* Avg */}
        <div className="h-3 w-14 bg-borderColor rounded mx-auto"></div>

        {/* Qty */}
        <div className="flex flex-col items-center gap-2">
          <div className="h-3 w-10 bg-borderColor rounded"></div>
        </div>

        {/* Value */}
        <div className="flex flex-col items-center gap-2">
          <div className="h-3 w-20 bg-borderColor rounded"></div>
          <div className="h-2 w-16 bg-borderColor rounded"></div>
        </div>

        {/* P&L */}
        <div className="flex flex-col items-center gap-2">
          <div className="h-3 w-16 bg-borderColor rounded"></div>
          <div className="h-2 w-10 bg-borderColor rounded"></div>
        </div>
      </div>
    ))}
  </div>
)}

{/* 🔥 REAL DATA */}
{!loading &&
  portfolio.map((item, i) => {
    const token = String(item.ScripCode);
    const live = liveData[token];

    const ltp = live?.LastRate || 0;

    const qty = item.totalQty || 0;
    const avg = item.avgPrice || 0;

    const currentValue = ltp * qty;
    const invested = item.investedValue || avg * qty;

    const pnl = currentValue - invested;
    const isProfit = pnl >= 0;

    return (
      <div
        key={i}
        className="relative group grid grid-cols-[2fr_1.2fr_1fr_1fr_1.3fr_1.2fr] px-4 py-3 border-b border-borderColor items-center text-center hover:bg-primaryBg transition"
      >
        {/* KEEP EVERYTHING SAME BELOW */}
        {/* Name */}
        <div className="text-left">
          <p className="text-sm font-medium">{item.name}</p>
          <p className="text-xs text-gray-400">
            {item.symbol} •{" "}
            {item.Exch === "B"
              ? "BSE"
              : item.Exch === "N"
              ? "NSE"
              : "MCX"}
          </p>
        </div>

        {/* LTP */}
        <div className="flex flex-col items-center font-mono">
          <span
            className={`text-sm font-semibold ${
              live?.LastRate > live?.PClose
                ? "text-green-500"
                : "text-red-500"
            }`}
          >
            ₹ {live ? formatNumber(live.LastRate) : "—"}
          </span>

          <span
            className={`text-xs ${
              live?.LastRate > live?.PClose
                ? "text-green-400"
                : "text-red-400"
            }`}
          >
            {live
              ? `${live.LastRate - live.PClose >= 0 ? "+" : ""}${(
                  live.LastRate - live.PClose
                ).toFixed(2)} (${live.ChgPcnt.toFixed(2)}%)`
              : "—"}
          </span>
        </div>

        {/* Avg */}
        <div className="flex flex-col items-center font-mono">
          <span className="text-sm">
            ₹ {formatNumber(avg.toFixed(2))}
          </span>
        </div>

        {/* Qty */}
        <div className="flex flex-col items-center">
          <span className="text-sm">{qty}</span>
        </div>

        {/* Value */}
        <div className="flex flex-col items-center font-mono">
          <span className="text-sm">
            ₹ {live ? formatNumber(currentValue.toFixed(2)) : "—"}
          </span>
          <span className="text-xs text-gray-400">
            ₹ {formatNumber(invested.toFixed(2))}
          </span>
        </div>

        {/* P&L */}
        <div className="flex flex-col items-center font-mono">
          <span
            className={`text-sm font-semibold ${
              isProfit ? "text-green-500" : "text-red-500"
            }`}
          >
            ₹ {formatNumber(pnl.toFixed(2))}
          </span>

          <span className="text-xs text-gray-400">
            {invested > 0
              ? `${((pnl / invested) * 100).toFixed(2)}%`
              : "—"}
          </span>
        </div>

        {/* ACTION BUTTONS */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200 backdrop-blur-md px-2 py-1.5 rounded-xl">

          <button
            onClick={() =>
              navigate(
                `/stock/${item.Exch}/${item.ExchType}/${item.ScripCode}/${item.symbol}?avgPrice=${item.avgPrice || 0}&qty=${item.totalQty || 0}&invested=${item.investedValue || 0}&lotSize=${item.lotSize || 0}`
              )
            }
            className="p-2 rounded-lg hover:bg-white/5 transition"
          >
            👁️
          </button>

          <button
            onClick={() => {
              setSelectedStock(item);
              setTradeAction("BUY");
              setIsModalOpen(true);
            }}
            className="px-3 py-[4px] text-xs rounded-lg border border-green-500/40 text-green-400 hover:bg-green-500/10 transition"
          >
            Buy
          </button>

          <button
            onClick={() => {
              setSelectedStock(item);
              setTradeAction("SELL");
              setIsModalOpen(true);
            }}
            className="px-3 py-[4px] text-xs rounded-lg border border-red-500/40 text-red-400 hover:bg-red-500/10 transition"
          >
            Sell
          </button>
        </div>
      </div>
    );
  })}

{!loading && portfolio.length > 0 && (
  <div className="grid grid-cols-[2fr_1.2fr_1fr_1fr_1.3fr_1.2fr] px-4 py-3 border-b border-borderColor items-center text-center bg-primaryBg/40">
    <div className="text-left">
      <p className="text-sm font-semibold text-accent">Total</p>
    </div>

    {/* LTP (blank) */}
    <div className="text-sm text-gray-500">—</div>

    {/* Avg Price (blank) */}
    <div className="text-sm text-gray-500">—</div>

    {/* Qty Total */}
    <div className="flex flex-col items-center">
      <span className="text-sm font-semibold">{formatNumber(portfolioTotals.qty)}</span>
    </div>

    {/* Current / Buy Total */}
    <div className="flex flex-col items-center font-mono">
      <span className="text-sm font-semibold">
        ₹ {formatNumber(portfolioTotals.currentValue.toFixed(2))}
      </span>
      <span className="text-xs text-gray-400">
        ₹ {formatNumber(portfolioTotals.invested.toFixed(2))}
      </span>
    </div>

    {/* P&L Total */}
    <div className="flex flex-col items-center font-mono">
      <span
        className={`text-sm font-semibold ${
          portfolioTotals.pnl >= 0 ? "text-green-500" : "text-red-500"
        }`}
      >
        ₹ {formatNumber(portfolioTotals.pnl.toFixed(2))}
      </span>
      <span className="text-xs text-gray-400">
        {portfolioTotals.invested > 0
          ? `${((portfolioTotals.pnl / portfolioTotals.invested) * 100).toFixed(2)}%`
          : "—"}
      </span>
    </div>
  </div>
)}

{/* EMPTY */}
{!loading && portfolio.length === 0 && (
  <div className="p-6 text-center text-gray-400">
    No holdings available
  </div>
)}

</div>
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
    // 🔥 NEW
    lotSize={Number(selectedStock?.lotSize)}
    multiplier={Number(selectedStock?.multiplier)}
    totalQty={selectedStock?.totalQty}
  />
)}



    </div>
  );
}

export default Portfolio;