import { useState, useEffect } from "react";
import useMarketFeed from "../../hooks/useMarketFeed";
import { useMarketStore } from "../../store/marketStore";
import { formatNumber } from "../../utils/formatNumber";
import TradeModal from "../../components/trading/TradeModal";
import { useNavigate } from "react-router-dom";
import { fetchUserData } from "../../services/user.service";


function Position() {
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);

  const liveData = useMarketStore((s) => s.data);
  const [selectedStock, setSelectedStock] = useState(null);
  const [tradeAction, setTradeAction] = useState(null); // "BUY" | "SELL"
  const [isModalOpen, setIsModalOpen] = useState(false);

  const navigate = useNavigate();
  // ==============================
  // 🔥 FETCH POSITIONS
  // ==============================
  useEffect(() => {
    const fetchPositions = async () => {
      try {
        const token = localStorage.getItem("token");

        const res = await fetch("http://localhost:3000/api/positions", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const result = await res.json();

        if (result.success) {
          setPositions(result.data);
        }
      } catch (err) {
        console.error("Positions fetch error:", err);
      } finally {
        setLoading(false);
        fetchUserData();
      }
    };

    fetchPositions();
  }, []);



  // ==============================
  // 🔥 PREPARE SCRIPS FOR WS
  // ==============================
  const scrips =
    positions.length > 0
      ? positions.map((item) => ({
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

  const positionTotals = positions.reduce(
    (acc, item) => {
      const token = String(item.ScripCode);
      const live = liveData[token];
  
      const ltp = Number(live?.LastRate || 0);
      const prev = Number(live?.PClose || ltp); // 🔥 NEW (safe fallback)
  
      const avg = Number(item.avgPrice || 0);
      const isMCX = item.Exch === "M";
  
      const qty = Number(
        isMCX ? item.lots || item.totalQty || 0 : item.totalQty || 0
      );
  
      const multiplier = Number(item.multiplier || 1);
  
      // 🔥 VALUES
      const investedForValue = isMCX
        ? 0.15 * avg * multiplier * qty
        : avg * qty;
  
      const pnl = isMCX
        ? (ltp - avg) * multiplier * qty
        : (ltp - avg) * qty;
  
      const currentValue = investedForValue + pnl;
  
      const investedForReturn = isMCX
        ? avg * multiplier * qty
        : avg * qty;
  
      // 🔥 TODAY P&L (IMPORTANT)
      const todayPL = isMCX
        ? (ltp - prev) * multiplier * qty
        : (ltp - prev) * qty;
  
      acc.qty += qty;
      acc.currentValue += currentValue;
      acc.investedForValue += investedForValue;
      acc.pnl += pnl;
      acc.investedForReturn += investedForReturn;
      acc.todayPL += todayPL; // 🔥 NEW
  
      return acc;
    },
    {
      qty: 0,
      currentValue: 0,
      investedForValue: 0,
      pnl: 0,
      investedForReturn: 0,
      todayPL: 0, // 🔥 NEW
    }
  );

  // ==============================
  // 🔥 LOADING
  // ==============================

  // ==============================
  // 🔥 UI
  // ==============================
  return (
    <div className="flex flex-col gap-6 p-4">

      {/* <h1 className="text-xl font-semibold">Positions</h1> */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Positions</h1>

        <span className="text-xs text-gray-400">
          *Commodity & Intraday (Includes Derivatives)
        </span>
      </div>

    {/* 🔥 POSITIONS SUMMARY CARDS */}
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
    {/* MARGIN USED */}
    <div className="bg-cardBg border border-borderColor rounded-2xl p-4 backdrop-blur-md">
      <p className="text-xs text-gray-400 mb-1">Margin Used</p>
      <p className="text-lg font-semibold font-mono">
        ₹ {formatNumber(positionTotals.investedForValue.toFixed(2))}
      </p>
      <p className="text-[11px] text-gray-500 mt-1">
        Blocked Capital (≈15%)
      </p>
    </div>

    {/* CURRENT VALUE */}
    <div className="bg-cardBg border border-borderColor rounded-2xl p-4 backdrop-blur-md">
      <p className="text-xs text-gray-400 mb-1">Current</p>
      <p className="text-lg font-semibold font-mono">
        ₹ {formatNumber(positionTotals.currentValue.toFixed(2))}
      </p>
      <p className="text-[11px] text-gray-500 mt-1">
        Real-time Value
      </p>
    </div>

    {/* TOTAL P&L */}
    <div className="bg-cardBg border border-borderColor rounded-2xl p-4 backdrop-blur-md">
      <p className="text-xs text-gray-400 mb-1">P&amp;L</p>

      <p
        className={`text-lg font-semibold font-mono ${
          positionTotals.pnl >= 0 ? "text-green-500" : "text-red-500"
        }`}
      >
        ₹ {formatNumber(positionTotals.pnl.toFixed(2))}
      </p>

      <p className="text-[11px] text-gray-500 mt-1">
        {positionTotals.investedForReturn > 0
          ? `${((positionTotals.pnl / positionTotals.investedForReturn) * 100).toFixed(2)}%`
          : "—"}
      </p>
    </div>

    {/* TODAY P&L */}
    <div className="bg-cardBg border border-borderColor rounded-2xl p-4 backdrop-blur-md">
      <p className="text-xs text-gray-400 mb-1">Today</p>

      <p
        className={`text-lg font-semibold font-mono ${
          positionTotals.todayPL >= 0 ? "text-green-500" : "text-red-500"
        }`}
      >
        ₹ {formatNumber(positionTotals.todayPL.toFixed(2))}
      </p>

      <p className="text-[11px] text-gray-500 mt-1">
        {positionTotals.investedForReturn > 0
          ? `${((positionTotals.todayPL / positionTotals.investedForReturn) * 100).toFixed(2)}%`
          : "—"}
      </p>
    </div>
  </>
)}

</div>

      <div className="bg-cardBg border border-borderColor rounded-xl overflow-x-auto">
        <div className="min-w-[900px]">

          {/* Header */}
<div className="grid grid-cols-[2fr_1.1fr_1fr_1fr_1.2fr_1.2fr] px-4 py-3 text-xs text-gray-400 border-b border-borderColor text-center">
  <span className="text-left">Name</span>

  <span>
    <div>LTP</div>
    <div className="text-[10px] text-gray-500">Change (%)</div>
  </span>

  <span>
    <div>Qty</div>
    <div className="text-[10px] text-gray-500">Lot Size</div>
  </span>

  <span>
    <div>Avg Price</div>
    <div className="text-[10px] text-gray-500">Entry Price</div>
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
        className="grid grid-cols-[2fr_1.1fr_1fr_1fr_1.2fr_1.2fr] px-4 py-3 border-b border-borderColor"
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

        {/* Qty */}
        <div className="flex flex-col items-center gap-2">
          <div className="h-3 w-10 bg-borderColor rounded"></div>
          <div className="h-2 w-12 bg-borderColor rounded"></div>
        </div>

        {/* Value */}
        <div className="flex flex-col items-center gap-2">
          <div className="h-3 w-16 bg-borderColor rounded"></div>
          <div className="h-2 w-12 bg-borderColor rounded"></div>
        </div>

        {/* Current Value */}
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
  positions.map((item, i) => {
    const token = String(item.ScripCode);
    const live = liveData[token];

    return (
      <div
        key={i}
        className="relative group grid grid-cols-[2fr_1.1fr_1fr_1fr_1.2fr_1.2fr] px-4 py-3 border-b border-borderColor items-center text-center hover:bg-primaryBg transition"
      >
        {/* NAME */}
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
            ₹ {live ? formatNumber(live.LastRate) : "0.00"}
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

        {/* QTY */}
        <div className="flex flex-col items-center">
          {item.Exch === "M" ? (
            <>
              <span className="text-sm">{item.lots}</span>
              <span className="text-xs text-gray-400">
                Lot: {formatNumber(item.multiplier || item.lotSize)}
              </span>
            </>
          ) : (
            <span className="text-sm">
              {formatNumber(item.totalQty)}
            </span>
          )}
        </div>

        {/* AVG PRICE */}
        <div className="flex flex-col items-center font-mono">
          <span className="text-sm">₹ {formatNumber(Number(item.avgPrice || 0).toFixed(2))}</span>
          <span className="text-xs text-gray-400">
            {item.Exch === "M" ? "Per Unit" : "Per Share"}
          </span>
        </div>

        {/* CURRENT + INVESTED */}
      {/* CURRENT + INVESTED */}
<div className="flex flex-col items-center font-mono">
  {(() => {
    const ltp = live?.LastRate || 0;
    const avg = item.avgPrice || 0;

    const isMCX = item.Exch === "M";

    const lots = item.lots || item.totalQty || 0;
    const multiplier = item.multiplier || 1;

    if (isMCX) {
      const invested = 0.15 * avg * multiplier * lots;

      // 🔥 FULL P&L
      const pnl = (ltp - avg) * multiplier * lots;

      // 🔥 REAL CURRENT VALUE (sell value)
      const currentValue = invested + pnl;

      return (
        <>
          <span className="text-sm">
            ₹ {formatNumber(currentValue.toFixed(2))}
          </span>

          <span className="text-xs text-gray-400">
            ₹ {formatNumber(invested.toFixed(2))}
          </span>
        </>
      );
    } else {
      const currentValue = ltp * lots;
      const invested = avg * lots;

      return (
        <>
          <span className="text-sm">
            ₹ {live ? formatNumber(currentValue.toFixed(2)) : "—"}
          </span>

          <span className="text-xs text-gray-400">
            ₹ {formatNumber(invested.toFixed(2))}
          </span>
        </>
      );
    }
  })()}
</div>

        {/* P&L */}
        <div className="flex flex-col items-center font-mono">
          {(() => {
            const ltp = live?.LastRate || 0;
            const avg = item.avgPrice || 0;
            const lots = item.lots || item.totalQty || 0;
            const multiplier = item.multiplier || 1;

            const isMCX = item.Exch === "M";

            const pnl = isMCX
              ? (ltp - avg) * multiplier * lots
              : (ltp - avg) * lots;

            const invested = isMCX
              ? avg * multiplier * lots
              : avg * lots;

            const isProfit = pnl >= 0;

            return (
              <>
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
              </>
            );
          })()}
        </div>

        {/* ACTIONS */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200 backdrop-blur-md px-2 py-1.5 rounded-xl">
          <button
            onClick={() => {
              navigate(
                `/stock/${item.Exch}/${item.ExchType}/${item.ScripCode}/${item.symbol}`
              );
            }}
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
            className="px-3 py-[4px] text-xs rounded-lg border border-green-500/40 text-green-400 hover:bg-green-500/10"
          >
            Buy
          </button>

          <button
            onClick={() => {
              setSelectedStock(item);
              setTradeAction("SELL");
              setIsModalOpen(true);
            }}
            className="px-3 py-[4px] text-xs rounded-lg border border-red-500/40 text-red-400 hover:bg-red-500/10"
          >
            Sell
          </button>
        </div>
      </div>
    );
  })}

{!loading && positions.length > 0 && (
  <div className="grid grid-cols-[2fr_1.1fr_1fr_1fr_1.2fr_1.2fr] px-4 py-3 border-b border-borderColor items-center text-center bg-primaryBg/40">
    <div className="text-left">
      <p className="text-sm font-semibold text-accent">Total</p>
    </div>

    {/* LTP (blank) */}
    <div className="text-sm text-gray-500">—</div>

    {/* Qty Total */}
    <div className="flex flex-col items-center">
      <span className="text-sm font-semibold">{formatNumber(positionTotals.qty)}</span>
    </div>

    {/* Avg Price (blank) */}
    <div className="text-sm text-gray-500">—</div>

    {/* Current / Buy Total */}
    <div className="flex flex-col items-center font-mono">
      <span className="text-sm font-semibold">
        ₹ {formatNumber(positionTotals.currentValue.toFixed(2))}
      </span>
      <span className="text-xs text-gray-400">
        ₹ {formatNumber(positionTotals.investedForValue.toFixed(2))}
      </span>
    </div>

    {/* P&L Total */}
    <div className="flex flex-col items-center font-mono">
      <span
        className={`text-sm font-semibold ${
          positionTotals.pnl >= 0 ? "text-green-500" : "text-red-500"
        }`}
      >
        ₹ {formatNumber(positionTotals.pnl.toFixed(2))}
      </span>
      <span className="text-xs text-gray-400">
        {positionTotals.investedForReturn > 0
          ? `${((positionTotals.pnl / positionTotals.investedForReturn) * 100).toFixed(2)}%`
          : "—"}
      </span>
    </div>
  </div>
)}

{!loading && positions.length === 0 && (
  <div className="p-6 text-center text-gray-400">
    No positions available
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
          avgPrice={selectedStock?.avgPrice}
          
          lotSize={Number(selectedStock?.lotSize)}
          multiplier={Number(selectedStock?.multiplier || selectedStock?.lotSize)}
          totalQty={selectedStock?.totalQty}
          lots={selectedStock?.lots}
        />
      )}



    </div>
  );
}

export default Position;