import { useEffect, useState } from "react";
import { useMarketStore } from "../../store/marketStore";
import axios from "axios";
import { useToast } from "../../components/common/Toast/ToastContext";
import { fetchUserData } from "../../services/user.service";
import { formatNumber } from "../../utils/formatNumber";
import { useUserStore } from "../../store/userStore";
import { motion, AnimatePresence } from "framer-motion";
import { X, TrendingUp, TrendingDown, AlertTriangle, ArrowLeft, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const TradeModal = ({
  isOpen,
  onClose,
  scripCode,
  exchange,
  exchangeType,
  symbol,
  name,
  action,
  holdingQty = 0,
  avgPrice = 0,
  lotSize = 1,
  multiplier = 1,
  totalQty,
  lots,
  setTriggerPositionUpdate,
}) => {
  const [quantity, setQuantity] = useState(1);
  const [step, setStep] = useState("FORM");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const token = String(scripCode);
  const live = useMarketStore((s) => s.data[token]);
  const isMCX = exchange === "M";
  const { showToast } = useToast();
  const user = useUserStore((s) => s.user);

  const isBuy = action === "BUY";
  const accentColor = isBuy ? "#22d38a" : "#ff4d6a";
  const accentBg = isBuy ? "rgba(34,211,138,0.12)" : "rgba(255,77,106,0.12)";
  const accentBorder = isBuy ? "rgba(34,211,138,0.3)" : "rgba(255,77,106,0.3)";
  const accentGlow = isBuy ? "rgba(34,211,138,0.15)" : "rgba(255,77,106,0.15)";

  const price = live?.LastRate || 0;
  const prevClose = live?.PClose || 0;
  const change = price - prevClose;
  const changePercent = live?.ChgPcnt || 0;
  const isUp = change >= 0;

  let total = 0;
  let contractValue = 0;
  let pnl = 0;

  if (isMCX) {
    contractValue = price * multiplier * quantity;
    const invested = 0.15 * avgPrice * multiplier * quantity;
    pnl = (price - avgPrice) * multiplier * quantity;
    total = isBuy
      ? Number((contractValue * 0.15).toFixed(2))
      : Number((invested + pnl).toFixed(2));
  } else {
    total = Number((quantity * price).toFixed(2));
  }

  // Only relevant when buying — on SELL the user is receiving money, not spending it
  const insufficientBalance = isBuy && (user?.balance ?? Infinity) < total;

  useEffect(() => {
    if (action === "SELL") {
      setQuantity(isMCX ? lots || 1 : totalQty || 1);
    } else {
      setQuantity(1);
    }
    setStep("FORM");
  }, [action, lots, totalQty, isOpen]);

  const handleConfirm = async () => {
    try {
      setLoading(true);
      const jwt = localStorage.getItem("token");
      if (!jwt) { showToast("error", "Session expired. Please login again"); return; }

      const url = isBuy
        ? `${import.meta.env.VITE_API_BASE_URL}/api/stocks/buy`
        : `${import.meta.env.VITE_API_BASE_URL}/api/stocks/sell`;

      const payload = {
        ScripCode: scripCode,
        Exch: exchange,
        ExchType: exchangeType,
        symbol,
        name,
        LTP: price,
        ...(isMCX ? { lots: quantity, multiplier } : { Quantity: quantity }),
      };

      const res = await axios.post(url, payload, {
        headers: { Authorization: `Bearer ${jwt}` },
      });

      if (res.data?.status === "SUCCESS") {
        showToast("success", `${action} order placed successfully`);
        await fetchUserData();
        const isPositionPage = window.location.pathname.includes("position");
        if (isPositionPage && typeof setTriggerPositionUpdate === "function") {
          setTriggerPositionUpdate((x) => x + 1);
        }
        setTimeout(() => { onClose(); setStep("FORM"); navigate("/orders"); }, 100);
      } else {
        showToast("error", res.data?.message || "Order failed");
      }
    } catch (err) {
      if (err.response?.status === 401) {
        showToast("error", "Session expired. Please login again");
        localStorage.removeItem("token");
        return;
      }
      showToast("error", err.response?.data?.message || "Order failed");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const exchangeLabel = exchange === "M" ? "MCX" : exchange === "N" ? "NSE" : "BSE";

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: "rgba(0,0,0,0.82)", backdropFilter: "blur(12px)" }}>

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-[560px] relative overflow-hidden"
          style={{
            background: "linear-gradient(160deg, #0d0f18 0%, #0a0c14 100%)",
            border: `1px solid ${accentBorder}`,
            borderRadius: 20,
          }}
        >
          {/* Top accent bar */}
          <div className="h-1 w-full" style={{
            background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`
          }} />

          {/* Background glow */}
          <div className="absolute inset-0 pointer-events-none" style={{
            background: `radial-gradient(ellipse at top right, ${accentGlow} 0%, transparent 60%)`
          }} />

          <div className="relative p-7">

            {/* ── HEADER ── */}
            <div className="flex items-start justify-between mb-5">
              <div className="flex-1 min-w-0 pr-4">

                {/* Action badge + exchange */}
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg"
                    style={{ background: accentBg, border: `1px solid ${accentBorder}` }}>
                    {isBuy
                      ? <TrendingUp size={14} style={{ color: accentColor }} />
                      : <TrendingDown size={14} style={{ color: accentColor }} />}
                    <span className="text-sm font-bold" style={{ color: accentColor }}>
                      {isBuy ? "BUY ORDER" : "SELL ORDER"}
                    </span>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-lg"
                    style={{ background: "rgba(255,255,255,0.06)", color: "#888", border: "1px solid rgba(255,255,255,0.08)" }}>
                    {exchangeLabel}
                  </span>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-lg"
                    style={{ background: "rgba(124,111,255,0.12)", color: "#9d8fff", border: "1px solid rgba(124,111,255,0.2)" }}>
                    {symbol}
                  </span>
                </div>

                {/* Company name */}
                <p className="text-sm text-gray-400 truncate">{name}</p>

              </div>

              {/* Close */}
              <button
                onClick={() => { onClose(); setStep("FORM"); }}
                className="flex-shrink-0 p-2 rounded-xl transition-all duration-150 group"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                <X size={16} className="text-gray-500 group-hover:text-white transition-colors" />
              </button>
            </div>

            {/* ── PRICE SECTION ── */}
            <div className="rounded-2xl p-4 mb-5"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>

              <div className="flex items-end justify-between mb-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Live Price</p>
                  <p className="text-4xl font-bold tracking-tight" style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    color: isUp ? "#22d38a" : "#ff4d6a"
                  }}>
                    ₹{formatNumber(price) || "—"}
                  </p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 justify-end px-3 py-1.5 rounded-xl"
                    style={{
                      background: isUp ? "rgba(34,211,138,0.1)" : "rgba(255,77,106,0.1)",
                      border: `1px solid ${isUp ? "rgba(34,211,138,0.2)" : "rgba(255,77,106,0.2)"}`,
                    }}>
                    {isUp ? <TrendingUp size={13} style={{ color: "#22d38a" }} /> : <TrendingDown size={13} style={{ color: "#ff4d6a" }} />}
                    <span className="text-sm font-bold" style={{
                      fontFamily: "'IBM Plex Mono', monospace",
                      color: isUp ? "#22d38a" : "#ff4d6a"
                    }}>
                      {price ? `${isUp ? "+" : ""}${change.toFixed(2)} (${changePercent.toFixed(2)}%)` : "—"}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1.5 text-right">vs prev. close</p>
                </div>
              </div>

              {/* OHLC Stats */}
              {live && (
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: "Open", value: formatNumber(live.OpenRate) },
                    { label: "High", value: formatNumber(live.High) },
                    { label: "Low", value: formatNumber(live.Low) },
                    { label: "Prev", value: formatNumber(live.PClose) },
                  ].map((stat) => (
                    <div key={stat.label} className="text-center py-2.5 px-1 rounded-xl"
                      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                      <p className="text-[10px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: "#5a5f78" }}>
                        {stat.label}
                      </p>
                      <p className="text-sm font-semibold" style={{
                        fontFamily: "'IBM Plex Mono', monospace", color: "#e0e2ea"
                      }}>
                        {stat.value}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── FORM STEP ── */}
            {step === "FORM" && (
              <>
                {/* Quantity input */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-semibold" style={{ color: "#c0c4d6" }}>
                      {isMCX ? "Number of Lots" : "Quantity"}
                    </label>
                    {action === "SELL" && (
                      <span className="text-xs px-2.5 py-1 rounded-lg font-medium"
                        style={{ background: "rgba(255,255,255,0.05)", color: "#888", border: "1px solid rgba(255,255,255,0.08)" }}>
                        Max: <span style={{ color: "#e0e2ea", fontFamily: "'IBM Plex Mono', monospace" }}>
                          {isMCX ? lots : totalQty}
                        </span>
                      </span>
                    )}
                  </div>

                  {/* Input with +/- controls */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setQuantity(q => Math.max(1, q - 1))}
                      className="w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-xl text-xl font-bold transition-all"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#888" }}
                      onMouseEnter={e => e.currentTarget.style.color = "#fff"}
                      onMouseLeave={e => e.currentTarget.style.color = "#888"}
                    >
                      −
                    </button>

                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        const maxQty = isMCX ? lots : totalQty;
                        if (action === "SELL" && maxQty !== undefined && val > maxQty) {
                          showToast("error", "Cannot sell more than available quantity");
                          return;
                        }
                        setQuantity(val);
                      }}
                      className="flex-1 text-center outline-none transition-all duration-200 text-xl font-bold"
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 12,
                        padding: "10px 14px",
                        fontFamily: "'IBM Plex Mono', monospace",
                        color: "#f0f2f8",
                      }}
                      onFocus={(e) => {
                        e.target.style.border = `1px solid ${accentColor}60`;
                        e.target.style.background = `${accentColor}08`;
                      }}
                      onBlur={(e) => {
                        e.target.style.border = "1px solid rgba(255,255,255,0.1)";
                        e.target.style.background = "rgba(255,255,255,0.04)";
                      }}
                    />

                    <button
                      onClick={() => {
                        const maxQty = isMCX ? lots : totalQty;
                        if (action === "SELL" && maxQty !== undefined && quantity >= maxQty) {
                          showToast("error", "Cannot sell more than available quantity");
                          return;
                        }
                        setQuantity(q => q + 1);
                      }}
                      className="w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-xl text-xl font-bold transition-all"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#888" }}
                      onMouseEnter={e => e.currentTarget.style.color = "#fff"}
                      onMouseLeave={e => e.currentTarget.style.color = "#888"}
                    >
                      +
                    </button>
                  </div>

                  {isMCX && (
                    <p className="text-xs mt-2" style={{ color: "#5a5f78" }}>
                      1 lot = <span style={{ color: "#e0e2ea", fontFamily: "'IBM Plex Mono', monospace" }}>{lotSize} units</span>
                    </p>
                  )}
                </div>

                {/* MCX warning */}
                {isMCX && (
                  <div className="flex items-start gap-3 p-3.5 rounded-xl mb-4"
                    style={{ background: "rgba(251,191,36,0.07)", border: "1px solid rgba(251,191,36,0.2)" }}>
                    <AlertTriangle size={15} className="flex-shrink-0 mt-0.5" style={{ color: "#fbbf24" }} />
                    <p className="text-xs leading-relaxed" style={{ color: "#fbbf24" }}>
                      Derivatives contract — only margin (~15%) is blocked, not the full contract value.
                    </p>
                  </div>
                )}

                {/* Order Summary */}
                <div className="rounded-2xl mb-5 overflow-hidden"
                  style={{ border: "1px solid rgba(255,255,255,0.07)" }}>
                  <div className="px-4 py-2.5" style={{ background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#5a5f78" }}>Order Summary</p>
                  </div>
                  <div className="px-5 py-4 space-y-3.5" style={{ background: "rgba(255,255,255,0.015)" }}>
                    {[
                      { label: "Price per unit", value: `₹ ${formatNumber(price)}` },
                      { label: isMCX ? "Lots" : "Quantity", value: formatNumber(quantity) },
                      ...(isMCX ? [{ label: "Contract Value", value: `₹ ${formatNumber(contractValue.toFixed(2))}` }] : []),
                    ].map((row) => (
                      <div key={row.label} className="flex justify-between items-center">
                        <span className="text-sm" style={{ color: "#6b7090" }}>{row.label}</span>
                        <span className="text-sm font-semibold" style={{ fontFamily: "'IBM Plex Mono', monospace", color: "#c8cad8" }}>
                          {row.value}
                        </span>
                      </div>
                    ))}

                    {/* Total row */}
                    <div className="pt-2 mt-1" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
                      <div className="flex justify-between items-center">
                        <span className="text-base font-bold" style={{ color: "#e0e2ea" }}>
                          {isMCX ? (isBuy ? "Margin Required" : "You Receive") : (isBuy ? "Total Amount" : "You Receive")}
                        </span>
                        <span className="text-xl font-bold" style={{
                          fontFamily: "'IBM Plex Mono', monospace",
                          color: insufficientBalance ? "#ff4d6a" : (isBuy ? accentColor : "#22d38a")
                        }}>
                          ₹ {formatNumber(total)}
                        </span>
                      </div>
                      {insufficientBalance && (
                        <p className="text-xs mt-1.5 text-right" style={{ color: "#ff4d6a" }}>
                          ⚠ Insufficient balance (₹{formatNumber(user?.balance?.toFixed(2))})
                        </p>
                      )}
                    </div>

                    {isMCX && action === "SELL" && (
                      <div className="flex justify-between items-center pt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                        <span className="text-sm" style={{ color: "#6b7090" }}>Estimated P&L</span>
                        <span className="text-base font-bold" style={{
                          fontFamily: "'IBM Plex Mono', monospace",
                          color: pnl >= 0 ? "#22d38a" : "#ff4d6a"
                        }}>
                          {pnl >= 0 ? "+" : ""}₹ {formatNumber(pnl.toFixed(2))}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Balance */}
                <div className="flex items-center justify-between mb-5 px-1">
                  <span className="text-sm" style={{ color: "#5a5f78" }}>Available Balance</span>
                  <span className="text-sm font-semibold" style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    color: insufficientBalance ? "#ff4d6a" : "#22d38a"
                  }}>
                    ₹ {formatNumber(user?.balance?.toFixed(2))}
                  </span>
                </div>

                {/* Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={onClose}
                    className="flex-1 py-3.5 text-sm font-semibold rounded-xl transition-all duration-150"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      color: "#6b7090",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "#e0e2ea"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = "#6b7090"; }}
                  >
                    Cancel
                  </button>
                  <button
                    disabled={!price || quantity <= 0 || insufficientBalance}
                    onClick={() => setStep("PREVIEW")}
                    className="flex-1 py-3.5 text-sm font-bold rounded-xl transition-all duration-200"
                    style={{
                      background: (!price || quantity <= 0 || insufficientBalance) ? "rgba(255,255,255,0.05)" : accentColor,
                      border: `1px solid ${(!price || quantity <= 0 || insufficientBalance) ? "rgba(255,255,255,0.08)" : accentColor}`,
                      color: (!price || quantity <= 0 || insufficientBalance) ? "#444" : (isBuy ? "#000" : "#fff"),
                      cursor: (!price || quantity <= 0 || insufficientBalance) ? "not-allowed" : "pointer",
                    }}
                  >
                    Review Order →
                  </button>
                </div>
              </>
            )}

            {/* ── PREVIEW STEP ── */}
            {step === "PREVIEW" && (
              <>
                {/* Confirm banner */}
                <div className="flex items-center gap-3 p-4 rounded-2xl mb-4"
                  style={{ background: accentBg, border: `1px solid ${accentBorder}` }}>
                  <CheckCircle size={18} style={{ color: accentColor, flexShrink: 0 }} />
                  <div>
                    <p className="text-sm font-bold" style={{ color: accentColor }}>
                      Confirm your {isBuy ? "purchase" : "sale"}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "#8888a0" }}>
                      Review the details below before placing the order.
                    </p>
                  </div>
                </div>

                {/* Preview rows */}
                <div className="rounded-2xl mb-5 overflow-hidden"
                  style={{ border: "1px solid rgba(255,255,255,0.07)" }}>
                  <div className="px-4 py-2.5" style={{ background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#5a5f78" }}>Order Details</p>
                  </div>
                  <div className="px-5 py-4 space-y-3.5" style={{ background: "rgba(255,255,255,0.015)" }}>
                    {[
                      {
                        label: "Order Type",
                        value: isBuy ? "BUY" : "SELL",
                        valueColor: accentColor,
                        bold: true,
                      },
                      { label: "Symbol", value: symbol },
                      { label: "Exchange", value: exchangeLabel },
                      { label: isMCX ? "Lots" : "Quantity", value: formatNumber(quantity) },
                      { label: "Execution Price", value: `₹ ${formatNumber(price)}` },
                      ...(isMCX ? [{ label: "Contract Value", value: `₹ ${formatNumber(contractValue.toFixed(2))}` }] : []),
                    ].map((row) => (
                      <div key={row.label} className="flex justify-between items-center">
                        <span className="text-sm" style={{ color: "#6b7090" }}>{row.label}</span>
                        <span
                          className="text-sm"
                          style={{
                            fontFamily: "'IBM Plex Mono', monospace",
                            color: row.valueColor || "#c8cad8",
                            fontWeight: row.bold ? 700 : 500,
                          }}
                        >
                          {row.value}
                        </span>
                      </div>
                    ))}

                    {/* Total */}
                    <div className="pt-3 mt-1" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
                      <div className="flex justify-between items-center">
                        <span className="text-base font-bold" style={{ color: "#e0e2ea" }}>
                          {isMCX ? (isBuy ? "Margin Required" : "You Receive") : (isBuy ? "Total Amount" : "You Receive")}
                        </span>
                        <span className="text-2xl font-bold" style={{
                          fontFamily: "'IBM Plex Mono', monospace",
                          color: insufficientBalance ? "#ff4d6a" : (isBuy ? accentColor : "#22d38a")
                        }}>
                          ₹ {formatNumber(total)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Balance */}
                <div className="flex items-center justify-between mb-5 px-1">
                  <span className="text-sm" style={{ color: "#5a5f78" }}>
                    {isBuy ? "Remaining After Order" : "Balance After Sale"}
                  </span>
                  <span className="text-sm font-semibold" style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    color: "#e0e2ea"
                  }}>
                    ₹ {formatNumber((isBuy
                      ? (user?.balance || 0) - total
                      : (user?.balance || 0) + total
                    ).toFixed(2))}
                  </span>
                </div>

                {/* Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setStep("FORM")}
                    className="flex-1 py-3.5 text-sm font-semibold rounded-xl transition-all duration-150 flex items-center justify-center gap-2"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      color: "#6b7090",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "#e0e2ea"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = "#6b7090"; }}
                  >
                    <ArrowLeft size={14} /> Back
                  </button>
                  <button
                    onClick={handleConfirm}
                    disabled={loading}
                    className="flex-1 py-3.5 text-sm font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
                    style={{
                      background: loading ? "rgba(255,255,255,0.05)" : accentColor,
                      border: `1px solid ${loading ? "rgba(255,255,255,0.08)" : accentColor}`,
                      color: loading ? "#444" : "#000",
                      cursor: loading ? "not-allowed" : "pointer",
                    }}
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                        </svg>
                        Placing Order...
                      </>
                    ) : (
                      `Confirm ${isBuy ? "Buy" : "Sell"}`
                    )}
                  </button>
                </div>
              </>
            )}

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default TradeModal;