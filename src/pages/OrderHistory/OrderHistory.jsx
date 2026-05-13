import { useEffect, useState } from "react";
import { formatNumber } from "../../utils/formatNumber";

function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // ==============================
  // 🔥 FETCH ORDER HISTORY
  // ==============================
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const token = localStorage.getItem("token");

        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/orders/history`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const result = await res.json();

        if (result.success) {
          setOrders(result.data);
        }
      } catch (err) {
        console.error("Order history fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  // ==============================
  // 🔥 FORMAT TIME
  // ==============================
  const formatTime = (timestamp) => {
    if (!timestamp) return "—";

    return new Date(timestamp * 1000).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  // ==============================
  // 🔥 FORMAT DATE
  // ==============================
  const formatDate = (timestamp) => {
    if (!timestamp) return "—";

    return new Date(timestamp * 1000).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // ==============================
  // 🔥 GROUP BY DATE
  // ==============================
  const groupedOrders = orders.reduce((acc, order) => {
    const date = formatDate(order.addedAt);

    if (!acc[date]) acc[date] = [];
    acc[date].push(order);

    return acc;
  }, {});

  // ==============================
  // 🔥 LOADING
  // ==============================
  return (
    <div className="flex flex-col gap-3 sm:gap-6 p-0 sm:p-4 max-w-full overflow-x-hidden" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      <h1
        className="text-base sm:text-xl font-semibold px-1 sm:px-0"
        style={{
          fontFamily: "'Syne', sans-serif",
          fontWeight: 800,
          letterSpacing: "-0.5px",
          background: "linear-gradient(135deg, #fff 40%, #7c6fff)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        Order History
      </h1>

      {/* Loading */}
      {loading && (
        <div className="animate-pulse flex flex-col gap-2 sm:gap-4 px-0.5 sm:px-0">
          {[...Array(3)].map((_, idx) => (
            <div key={idx} className="bg-cardBg border border-borderColor rounded-xl overflow-hidden">
              <div className="px-3 sm:px-4 py-2 border-b border-borderColor bg-primaryBg">
                <div className="h-3 w-24 sm:w-32 bg-borderColor rounded" />
              </div>
              {[...Array(3)].map((__, i) => (
                <div key={i} className="px-3 py-2.5 sm:px-4 sm:py-3 border-b border-borderColor">
                  <div className="flex justify-between mb-1.5 sm:hidden"><div className="h-3 w-24 bg-borderColor rounded" /><div className="h-3 w-12 bg-borderColor rounded" /></div>
                  <div className="grid grid-cols-3 gap-2 sm:hidden"><div className="h-7 bg-borderColor rounded" /><div className="h-7 bg-borderColor rounded" /><div className="h-7 bg-borderColor rounded" /></div>
                  <div className="hidden sm:grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr]">
                    <div className="space-y-2"><div className="h-3 w-32 bg-borderColor rounded" /><div className="h-2 w-20 bg-borderColor rounded" /></div>
                    <div className="flex flex-col items-center gap-2"><div className="h-3 w-12 bg-borderColor rounded" /><div className="h-2 w-10 bg-borderColor rounded" /></div>
                    <div className="flex flex-col items-center gap-2"><div className="h-3 w-16 bg-borderColor rounded" /><div className="h-2 w-12 bg-borderColor rounded" /></div>
                    <div className="flex flex-col items-center gap-2"><div className="h-3 w-20 bg-borderColor rounded" /><div className="h-2 w-14 bg-borderColor rounded" /></div>
                    <div className="flex flex-col items-center gap-2"><div className="h-3 w-16 bg-borderColor rounded" /><div className="h-2 w-12 bg-borderColor rounded" /></div>
                    <div className="flex flex-col items-center gap-2"><div className="h-3 w-24 bg-borderColor rounded" /></div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && Object.keys(groupedOrders).length === 0 && (
        <div className="text-center py-8" style={{ color: "#5a5f78", fontSize: 11 }}>No order history available</div>
      )}

      {/* Data */}
      {!loading && Object.entries(groupedOrders).map(([date, ordersList]) => (
        <div key={date} className="bg-cardBg border border-borderColor rounded-xl overflow-hidden mx-0.5 sm:mx-0">

          {/* Date header */}
          <div className="px-3 sm:px-4 py-1.5 sm:py-2 text-[10px] sm:text-sm font-semibold border-b border-borderColor bg-primaryBg" style={{ color: "#7c6fff" }}>
            {date}
          </div>

          {/* ── Mobile Cards ── */}
          <div className="sm:hidden flex flex-col">
            {ordersList.map((item, i) => {
              const isBuy = item.type === "BUY";
              const isSuccess = item.status === "SUCCESS";
              const isMCX = item.Exch === "M";
              const price = item.price || 0;
              const qty = item.quantity || 0;
              const lots = item.lots || qty;
              const multiplier = item.multiplier || 1;
              const value = isMCX ? 0.15 * price * multiplier * lots : price * qty;
              const exchLabel = item.Exch === "B" ? "BSE" : item.Exch === "N" ? "NSE" : "MCX";

              return (
                <div key={i} className="border-b px-3 pt-2 pb-1.5" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                  {/* Row 1: Name + badges */}
                  <div className="flex items-start justify-between mb-1.5">
                    <div className="min-w-0 flex-1 mr-2">
                      <p className="text-[11px] font-semibold tracking-tight truncate" style={{ fontFamily: "'Syne', sans-serif", color: "#f0f2f8" }}>{item.name}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="text-[7px] font-semibold tracking-[0.5px] rounded px-1 py-px" style={{ background: "rgba(124,111,255,0.12)", color: "#7c6fff" }}>{exchLabel}</span>
                        <span className="text-[7px] truncate" style={{ color: "#5a5f78" }}>{item.symbol}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-md ${isBuy ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>{item.type}</span>
                      <span className={`text-[7px] font-semibold px-1 py-px rounded ${isSuccess ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>{item.status}</span>
                    </div>
                  </div>

                  {/* Row 2: Stats */}
                  <div className="grid grid-cols-4 gap-1 mb-1">
                    <div className="rounded-md px-1.5 py-1 text-center" style={{ background: "rgba(255,255,255,0.03)" }}>
                      <p className="text-[6px] uppercase tracking-wider" style={{ color: "#5a5f78" }}>Price</p>
                      <p className="text-[9px] font-semibold mt-px" style={{ fontFamily: "'IBM Plex Mono', monospace", color: "#f0f2f8" }}>₹{formatNumber(price)}</p>
                    </div>
                    <div className="rounded-md px-1.5 py-1 text-center" style={{ background: "rgba(255,255,255,0.03)" }}>
                      <p className="text-[6px] uppercase tracking-wider" style={{ color: "#5a5f78" }}>Qty</p>
                      <p className="text-[9px] font-semibold mt-px" style={{ fontFamily: "'IBM Plex Mono', monospace", color: "#f0f2f8" }}>{isMCX ? `${lots} lots` : qty}</p>
                    </div>
                    <div className="rounded-md px-1.5 py-1 text-center" style={{ background: "rgba(255,255,255,0.03)" }}>
                      <p className="text-[6px] uppercase tracking-wider" style={{ color: "#5a5f78" }}>Value</p>
                      <p className="text-[9px] font-semibold mt-px" style={{ fontFamily: "'IBM Plex Mono', monospace", color: "#f0f2f8" }}>₹{formatNumber(value.toFixed(0))}</p>
                    </div>
                    <div className="rounded-md px-1.5 py-1 text-center" style={{ background: "rgba(255,255,255,0.03)" }}>
                      <p className="text-[6px] uppercase tracking-wider" style={{ color: "#5a5f78" }}>Time</p>
                      <p className="text-[9px] font-semibold mt-px" style={{ fontFamily: "'IBM Plex Mono', monospace", color: "#f0f2f8" }}>{formatTime(item.addedAt)}</p>
                    </div>
                  </div>

                  {/* Row 3: P&L or reason footer */}
                  {(item.type === "SELL" && item.pnl !== undefined) || item.reason ? (
                    <div className="flex items-center justify-between pt-1 border-t" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                      {item.type === "SELL" && item.pnl !== undefined ? (
                        <span className="text-[8px] font-bold px-1.5 py-px rounded" style={{ fontFamily: "'IBM Plex Mono', monospace", color: item.pnl >= 0 ? "#22d38a" : "#ff4d6a", background: item.pnl >= 0 ? "rgba(34,211,138,0.1)" : "rgba(255,77,106,0.1)" }}>
                          P&L: ₹{formatNumber(item.pnl.toFixed(2))}
                        </span>
                      ) : <span />}
                      {item.reason && <span className="text-[7px] truncate max-w-[50%]" style={{ color: "#5a5f78" }}>{item.reason}</span>}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>

          {/* ── Desktop Table ── */}
          <div className="hidden sm:block overflow-x-auto">
            <div className="min-w-[900px]">
              <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] px-4 py-3 text-xs text-gray-400 border-b border-borderColor text-center">
                <span className="text-left">Name</span>
                <span><div>Type</div><div className="text-[10px] text-gray-500">Status</div></span>
                <span><div>Price</div><div className="text-[10px] text-gray-500">Qty</div></span>
                <span><div>Value</div><div className="text-[10px] text-gray-500">Exchange</div></span>
                <span><div>Time</div><div className="text-[10px] text-gray-500">Scrip</div></span>
                <span><div>Reason</div><div className="text-[10px] text-gray-500">Message</div></span>
              </div>

              <div>
                {ordersList.map((item, i) => {
                  const isBuy = item.type === "BUY";
                  const isSuccess = item.status === "SUCCESS";

                  return (
                    <div key={i} className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] px-4 py-3 border-b border-borderColor items-center text-center">
                      <div className="text-left">
                        <p className="text-sm font-medium">{item.name}</p>
                        <p className="text-xs text-gray-400">{item.symbol} • {item.Exch === "B" ? "BSE" : item.Exch === "N" ? "NSE" : "MCX"}</p>
                      </div>

                      <div className="flex flex-col items-center">
                        <span className={`text-xs px-2 py-1 rounded-md ${isBuy ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>{item.type}</span>
                        <span className={`text-[10px] mt-1 ${isSuccess ? "text-green-400" : "text-red-400"}`}>{item.status}</span>
                      </div>

                      <div className="flex flex-col items-center font-mono">
                        <span>₹ {formatNumber(item.price)}</span>
                        <span className="text-xs text-gray-400">{item.Exch === "M" ? `${item.lots || item.quantity} lots` : item.quantity}</span>
                      </div>

                      <div className="flex flex-col items-center font-mono">
                        <span>
                          {(() => {
                            const isMCX = item.Exch === "M";
                            const price = item.price || 0;
                            const qty = item.quantity || 0;
                            const lots = item.lots || qty;
                            const multiplier = item.multiplier || 1;
                            const value = isMCX ? 0.15 * price * multiplier * lots : price * qty;
                            return `₹ ${formatNumber(value.toFixed(2))}`;
                          })()}
                        </span>
                        {item.type === "SELL" && item.pnl !== undefined ? (
                          <span className={`text-xs ${item.pnl >= 0 ? "text-green-400" : "text-red-400"}`}>P&L: ₹ {formatNumber(item.pnl.toFixed(2))}</span>
                        ) : (
                          <span className="text-xs text-gray-400">{item.ExchType === "C" ? "Cash" : "Deriv"}</span>
                        )}
                      </div>

                      <div className="flex flex-col items-center">
                        <span>{formatTime(item.addedAt)}</span>
                        <span className="text-[10px] text-gray-500">{item.ScripCode}</span>
                      </div>

                      <div className="text-xs text-gray-400">{item.reason || "—"}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default OrderHistory;