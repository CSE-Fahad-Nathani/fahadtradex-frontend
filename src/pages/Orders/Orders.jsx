import { useEffect, useState } from "react";
import { formatNumber } from "../../utils/formatNumber";
import { fetchUserData } from "../../services/user.service";
import { useThemeStore } from "../../store/themeStore";

function Orders() {
  const theme = useThemeStore((s) => s.theme);
  const isLight = theme === "light";
  const labelClass = isLight ? "text-slate-600" : "text-textSubtle";
  const profitColor = (positive) =>
    isLight ? (positive ? "#15803d" : "#b91c1c") : positive ? "#22d38a" : "#ff4d6a";
  const buyBadgeClass = isLight
    ? "bg-green-50 text-green-700 border border-green-500/30"
    : "bg-green-500/10 text-green-400";
  const sellBadgeClass = isLight
    ? "bg-red-50 text-red-700 border border-red-500/30"
    : "bg-red-500/10 text-red-400";
  const mobileCardBg = isLight ? undefined : "linear-gradient(145deg, #0d0f18 0%, #0a0c13 100%)";
  const mobileStatBg = isLight ? "var(--color-surface-subtle)" : "rgba(255,255,255,0.03)";
  const mobileBorderSubtle = isLight ? "var(--color-border)" : "rgba(255,255,255,0.06)";

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // ==============================
  // 🔥 FETCH ORDERS
  // ==============================

  useEffect(() => {
    fetchUserData();
  }, []);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const token = localStorage.getItem("token");

        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/orders`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const result = await res.json();

        if (result.success) {
          setOrders(result.data);
        }
      } catch (err) {
        console.error("Orders fetch error:", err);
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

    const date = new Date(timestamp * 1000);

    return date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  // ==============================
  // 🔥 LOADING
  // ==============================

  return (
    <div className="flex flex-col gap-3 sm:gap-6 p-0 sm:p-4 max-w-full overflow-x-hidden" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      <h1
        className="text-base sm:text-xl font-extrabold tracking-tight bg-clip-text text-transparent px-1 sm:px-0"
        style={{
          fontFamily: "'Syne', sans-serif",
          letterSpacing: "-0.5px",
          backgroundImage: isLight
            ? "linear-gradient(135deg, #0f172a 0%, #4338ca 55%, #7c3aed 100%)"
            : "linear-gradient(135deg, #f8fafc 0%, #c4b5fd 55%, #7c6fff 100%)",
        }}
      >
        Orders (Today)
      </h1>

      {/* ── Mobile Card Layout ── */}
      <div className="sm:hidden flex flex-col gap-1.5 px-0.5">
        {loading && (
          <div className="animate-pulse flex flex-col gap-1.5">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="rounded-xl border border-borderColor bg-cardBg p-3">
                <div className="flex justify-between mb-2"><div className="h-3 w-24 bg-borderColor rounded" /><div className="h-3 w-12 bg-borderColor rounded" /></div>
                <div className="grid grid-cols-3 gap-2"><div className="h-8 bg-borderColor rounded" /><div className="h-8 bg-borderColor rounded" /><div className="h-8 bg-borderColor rounded" /></div>
              </div>
            ))}
          </div>
        )}

        {!loading && orders.map((item, i) => {
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
            <div
              key={i}
              className="rounded-xl border border-borderColor overflow-hidden bg-cardBg"
              style={{ background: mobileCardBg, borderColor: mobileBorderSubtle }}
            >
              <div className="h-[1px]" style={{ background: `linear-gradient(90deg, transparent, ${profitColor(isBuy)}40, transparent)` }} />

              <div className="px-3 pt-2 pb-1.5">
                {/* Row 1: Name + Type badge */}
                <div className="flex items-start justify-between mb-1.5">
                  <div className="min-w-0 flex-1 mr-2">
                    <p className="text-[11px] font-semibold tracking-tight truncate text-textPrimary" style={{ fontFamily: "'Syne', sans-serif" }}>{item.name}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="text-[7px] font-semibold tracking-[0.5px] rounded px-1 py-px" style={{ background: "rgba(124,111,255,0.12)", color: "#7c6fff" }}>{exchLabel}</span>
                      <span className={`text-[7px] truncate ${labelClass}`}>{item.symbol}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-md ${isBuy ? buyBadgeClass : sellBadgeClass}`}>{item.type}</span>
                    <span
                      className="text-[7px] font-semibold px-1 py-px rounded"
                      style={{
                        color: profitColor(isSuccess),
                        background: isSuccess ? "rgba(34,211,138,0.1)" : "rgba(255,77,106,0.1)",
                      }}
                    >
                      {item.status}
                    </span>
                  </div>
                </div>

                {/* Row 2: Stats grid */}
                <div className="grid grid-cols-4 gap-1 mb-1.5">
                  <div className="rounded-md px-1.5 py-1 text-center" style={{ background: mobileStatBg }}>
                    <p className={`text-[6px] uppercase tracking-wider ${labelClass}`}>Price</p>
                    <p className="text-[9px] font-semibold mt-px text-textPrimary" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>₹{formatNumber(price)}</p>
                  </div>
                  <div className="rounded-md px-1.5 py-1 text-center" style={{ background: mobileStatBg }}>
                    <p className={`text-[6px] uppercase tracking-wider ${labelClass}`}>Qty</p>
                    <p className="text-[9px] font-semibold mt-px text-textPrimary" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                      {isMCX ? `${lots} lots` : qty}
                    </p>
                  </div>
                  <div className="rounded-md px-1.5 py-1 text-center" style={{ background: mobileStatBg }}>
                    <p className={`text-[6px] uppercase tracking-wider ${labelClass}`}>Value</p>
                    <p className="text-[9px] font-semibold mt-px text-textPrimary" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>₹{formatNumber(value.toFixed(0))}</p>
                  </div>
                  <div className="rounded-md px-1.5 py-1 text-center" style={{ background: mobileStatBg }}>
                    <p className={`text-[6px] uppercase tracking-wider ${labelClass}`}>Time</p>
                    <p className="text-[9px] font-semibold mt-px text-textPrimary" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{formatTime(item.addedAt)}</p>
                  </div>
                </div>

                {/* Row 3: Footer */}
                {item.reason && (
                  <div className="pt-1 border-t border-borderColor">
                    <p className={`text-[7px] truncate ${labelClass}`}>{item.reason}</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {!loading && orders.length === 0 && (
          <div className={`p-8 text-center text-[11px] ${labelClass}`}>No orders today</div>
        )}
      </div>

      {/* ── Desktop Table ── */}
      <div className="hidden sm:block bg-cardBg border border-borderColor rounded-xl overflow-x-auto">
        <div className="min-w-[900px]">

          <div className={`grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] px-4 py-3 text-xs border-b border-borderColor text-center bg-[var(--color-surface-subtle)] ${labelClass}`}>
            <span className="text-left">Name</span>
            <span><div>Type</div><div className={`text-[10px] ${labelClass}`}>Status</div></span>
            <span><div>Price</div><div className={`text-[10px] ${labelClass}`}>Qty</div></span>
            <span><div>Value</div><div className={`text-[10px] ${labelClass}`}>Exchange</div></span>
            <span><div>Time</div><div className={`text-[10px] ${labelClass}`}>Order ID</div></span>
            <span><div>Reason</div><div className={`text-[10px] ${labelClass}`}>Message</div></span>
          </div>

          <div>
            {loading && (
              <div className="animate-pulse">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] px-4 py-3 border-b border-borderColor">
                    <div className="space-y-2"><div className="h-3 w-32 bg-borderColor rounded" /><div className="h-2 w-20 bg-borderColor rounded" /></div>
                    <div className="flex flex-col items-center gap-2"><div className="h-3 w-12 bg-borderColor rounded" /><div className="h-2 w-10 bg-borderColor rounded" /></div>
                    <div className="flex flex-col items-center gap-2"><div className="h-3 w-16 bg-borderColor rounded" /><div className="h-2 w-12 bg-borderColor rounded" /></div>
                    <div className="flex flex-col items-center gap-2"><div className="h-3 w-20 bg-borderColor rounded" /><div className="h-2 w-14 bg-borderColor rounded" /></div>
                    <div className="flex flex-col items-center gap-2"><div className="h-3 w-16 bg-borderColor rounded" /><div className="h-2 w-12 bg-borderColor rounded" /></div>
                    <div className="flex flex-col items-center gap-2"><div className="h-3 w-24 bg-borderColor rounded" /></div>
                  </div>
                ))}
              </div>
            )}

            {!loading && orders.map((item, i) => {
              const isBuy = item.type === "BUY";
              const isSuccess = item.status === "SUCCESS";

              return (
                <div key={i} className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] px-4 py-3 border-b border-borderColor items-center text-center hover:bg-[var(--color-row-hover)] transition-colors">
                  <div className="text-left">
                    <p className="text-sm font-medium text-textPrimary">{item.name}</p>
                    <p className={`text-xs ${labelClass}`}>{item.symbol} • {item.Exch === "B" ? "BSE" : item.Exch === "N" ? "NSE" : "MCX"}</p>
                  </div>

                  <div className="flex flex-col items-center">
                    <span className={`text-xs px-2 py-1 rounded-md ${isBuy ? buyBadgeClass : sellBadgeClass}`}>{item.type}</span>
                    <span className="text-[10px] mt-1" style={{ color: profitColor(isSuccess) }}>{item.status}</span>
                  </div>

                  <div className="flex flex-col items-center font-mono text-textPrimary">
                    <span>₹ {formatNumber(item.price)}</span>
                    <span className={`text-xs ${labelClass}`}>{item.Exch === "M" ? `${item.lots || item.quantity} lots` : item.quantity}</span>
                  </div>

                  <div className="flex flex-col items-center font-mono text-textPrimary">
                    {(() => {
                      const isMCX = item.Exch === "M";
                      const price = item.price || 0;
                      const qty = item.quantity || 0;
                      const lots = item.lots || qty;
                      const multiplier = item.multiplier || 1;
                      const value = isMCX ? 0.15 * price * multiplier * lots : price * qty;
                      return <span>₹ {formatNumber(value.toFixed(2))}</span>;
                    })()}
                    <span className={`text-xs ${labelClass}`}>{item.ExchType === "C" ? "Cash" : "Deriv"}</span>
                  </div>

                  <div className="flex flex-col items-center text-textPrimary">
                    <span className="text-sm">{formatTime(item.addedAt)}</span>
                    <span className={`text-[10px] truncate max-w-[100px] ${labelClass}`}>{item.ScripCode}</span>
                  </div>

                  <div className={`flex flex-col items-center text-xs ${labelClass}`}>
                    <span>{item.reason || "—"}</span>
                  </div>
                </div>
              );
            })}

            {!loading && orders.length === 0 && (
              <div className={`p-6 text-center ${labelClass}`}>No orders today</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Orders;