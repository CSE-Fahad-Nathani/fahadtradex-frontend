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
    <div className="flex flex-col gap-6 p-4">
  
      <h1 className="text-xl font-semibold">Order History</h1>
  
      {/* 🔥 LOADING SKELETON */}
      {loading && (
        <div className="animate-pulse flex flex-col gap-4">
          {[...Array(3)].map((_, idx) => (
            <div key={idx} className="bg-cardBg border border-borderColor rounded-xl overflow-hidden">
  
              {/* DATE HEADER */}
              <div className="px-4 py-2 border-b border-borderColor bg-primaryBg">
                <div className="h-3 w-32 bg-borderColor rounded"></div>
              </div>
  
              {/* ROWS */}
              {[...Array(4)].map((__, i) => (
                <div
                  key={i}
                  className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] px-4 py-3 border-b border-borderColor"
                >
                  <div className="space-y-2">
                    <div className="h-3 w-32 bg-borderColor rounded"></div>
                    <div className="h-2 w-20 bg-borderColor rounded"></div>
                  </div>
  
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-3 w-12 bg-borderColor rounded"></div>
                    <div className="h-2 w-10 bg-borderColor rounded"></div>
                  </div>
  
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-3 w-16 bg-borderColor rounded"></div>
                    <div className="h-2 w-12 bg-borderColor rounded"></div>
                  </div>
  
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-3 w-20 bg-borderColor rounded"></div>
                    <div className="h-2 w-14 bg-borderColor rounded"></div>
                  </div>
  
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-3 w-16 bg-borderColor rounded"></div>
                    <div className="h-2 w-12 bg-borderColor rounded"></div>
                  </div>
  
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-3 w-24 bg-borderColor rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
  
      {/* 🔥 EMPTY STATE */}
      {!loading && Object.keys(groupedOrders).length === 0 && (
        <div className="text-center text-gray-400">
          No order history available
        </div>
      )}
  
      {/* 🔥 REAL DATA */}
      {!loading &&
        Object.entries(groupedOrders).map(([date, ordersList]) => (
          <div key={date} className="bg-cardBg border border-borderColor rounded-xl overflow-hidden">
  
            {/* DATE HEADER */}
            <div className="px-4 py-2 text-sm font-semibold border-b border-borderColor bg-primaryBg">
              {date}
            </div>
  
            <div className="overflow-x-auto">
              <div className="min-w-[900px]">
  
                {/* HEADER */}
                <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] px-4 py-3 text-xs text-gray-400 border-b border-borderColor text-center">
                  <span className="text-left">Name</span>
  
                  <span>
                    <div>Type</div>
                    <div className="text-[10px] text-gray-500">Status</div>
                  </span>
  
                  <span>
                    <div>Price</div>
                    <div className="text-[10px] text-gray-500">Qty</div>
                  </span>
  
                  <span>
                    <div>Value</div>
                    <div className="text-[10px] text-gray-500">Exchange</div>
                  </span>
  
                  <span>
                    <div>Time</div>
                    <div className="text-[10px] text-gray-500">Scrip</div>
                  </span>
  
                  <span>
                    <div>Reason</div>
                    <div className="text-[10px] text-gray-500">Message</div>
                  </span>
                </div>
  
                {/* BODY */}
                <div>
                  {ordersList.map((item, i) => {
                    const isBuy = item.type === "BUY";
                    const isSuccess = item.status === "SUCCESS";
  
                    return (
                      <div
                        key={i}
                        className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] px-4 py-3 border-b border-borderColor items-center text-center"
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
  
                        {/* TYPE + STATUS */}
                        <div className="flex flex-col items-center">
                          <span
                            className={`text-xs px-2 py-1 rounded-md ${
                              isBuy
                                ? "bg-green-500/10 text-green-400"
                                : "bg-red-500/10 text-red-400"
                            }`}
                          >
                            {item.type}
                          </span>
  
                          <span
                            className={`text-[10px] mt-1 ${
                              isSuccess
                                ? "text-green-400"
                                : "text-red-400"
                            }`}
                          >
                            {item.status}
                          </span>
                        </div>
  
                        {/* PRICE + QTY */}
                        <div className="flex flex-col items-center font-mono">
                          <span>₹ {formatNumber(item.price)}</span>
                          <span className="text-xs text-gray-400">
                            {item.Exch === "M"
                              ? `${item.lots || item.quantity} lots`
                              : item.quantity}
                          </span>
                        </div>
  
                        {/* VALUE + EXTRA */}
                        <div className="flex flex-col items-center font-mono">
                          <span>
                            {(() => {
                              const isMCX = item.Exch === "M";
                              const price = item.price || 0;
                              const qty = item.quantity || 0;
                              const lots = item.lots || qty;
                              const multiplier = item.multiplier || 1;
  
                              const value = isMCX
                                ? 0.15 * price * multiplier * lots
                                : price * qty;
  
                              return `₹ ${formatNumber(value.toFixed(2))}`;
                            })()}
                          </span>
  
                          {item.type === "SELL" && item.pnl !== undefined ? (
                            <span
                              className={`text-xs ${
                                item.pnl >= 0 ? "text-green-400" : "text-red-400"
                              }`}
                            >
                              P&L: ₹ {formatNumber(item.pnl.toFixed(2))}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">
                              {item.ExchType === "C" ? "Cash" : "Deriv"}
                            </span>
                          )}
                        </div>
  
                        {/* TIME + SCRIP */}
                        <div className="flex flex-col items-center">
                          <span>{formatTime(item.addedAt)}</span>
                          <span className="text-[10px] text-gray-500">
                            {item.ScripCode}
                          </span>
                        </div>
  
                        {/* REASON */}
                        <div className="text-xs text-gray-400">
                          {item.reason || "—"}
                        </div>
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