import { useEffect, useState } from "react";
import { useMarketStore } from "../../store/marketStore";
import axios from "axios";
import { useToast } from "../../components/common/Toast/ToastContext";
import { fetchUserData } from "../../services/user.service";
import { formatNumber } from "../../utils/formatNumber";
import { useUserStore } from "../../store/userStore";
import { motion } from "framer-motion";
import { X, Minus, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useThemeStore } from "../../store/themeStore";

const mono = { fontFamily: "'IBM Plex Mono', monospace" };

const TradeModal = ({
  isOpen,
  onClose,
  scripCode,
  exchange,
  exchangeType,
  symbol,
  name,
  action,
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
  const isLight = useThemeStore((s) => s.theme) === "light";

  const profitClass = (positive) =>
    isLight ? (positive ? "text-green-700" : "text-red-700") : positive ? "text-green-400" : "text-red-400";

  const isBuy = action === "BUY";
  const actionBadgeClass = isBuy
    ? isLight
      ? "bg-green-50 text-green-700 border-green-500/35"
      : "bg-green-500/10 text-green-400 border-green-500/30"
    : isLight
      ? "bg-red-50 text-red-700 border-red-500/35"
      : "bg-red-500/10 text-red-400 border-red-500/30";

  const actionStripClass = isBuy
    ? isLight ? "bg-green-600" : "bg-green-500"
    : isLight ? "bg-red-600" : "bg-red-500";

  const actionBtnClass = isBuy
    ? isLight
      ? "bg-green-600 hover:bg-green-700 text-white border-green-600"
      : "bg-green-500 hover:bg-green-400 text-black border-green-500"
    : isLight
      ? "bg-red-600 hover:bg-red-700 text-white border-red-600"
      : "bg-red-500 hover:bg-red-400 text-white border-red-500";

  const confirmPanelClass = isBuy
    ? isLight ? "bg-green-50 border-green-500/30" : "bg-green-500/10 border-green-500/25"
    : isLight ? "bg-red-50 border-red-500/30" : "bg-red-500/10 border-red-500/25";

  const confirmTextClass = isBuy
    ? isLight ? "text-green-700" : "text-green-400"
    : isLight ? "text-red-700" : "text-red-400";

  const panelClass =
    "rounded-lg border border-borderColor bg-[var(--color-surface-elevated)]";
  const ghostBtnClass =
    "border border-borderColor bg-[var(--color-surface-subtle)] text-textSubtle hover:bg-[var(--color-row-hover)] hover:text-textPrimary transition-colors";

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

  const insufficientBalance = isBuy && (user?.balance ?? Infinity) < total;
  const maxQty = isMCX ? lots : totalQty;
  const canSubmit = price > 0 && quantity > 0 && !insufficientBalance;

  useEffect(() => {
    if (action === "SELL") {
      setQuantity(isMCX ? lots || 1 : totalQty || 1);
    } else {
      setQuantity(1);
    }
    setStep("FORM");
  }, [action, lots, totalQty, isOpen, isMCX]);

  const handleClose = () => {
    onClose();
    setStep("FORM");
  };

  const adjustQty = (delta) => {
    const next = quantity + delta;
    if (next < 1) return;
    if (action === "SELL" && maxQty !== undefined && next > maxQty) {
      showToast("error", "Cannot sell more than available quantity");
      return;
    }
    setQuantity(next);
  };

  const handleQtyChange = (val) => {
    if (action === "SELL" && maxQty !== undefined && val > maxQty) {
      showToast("error", "Cannot sell more than available quantity");
      return;
    }
    setQuantity(val);
  };

  const handleConfirm = async () => {
    try {
      setLoading(true);
      const jwt = localStorage.getItem("token");
      if (!jwt) {
        showToast("error", "Session expired. Please login again");
        return;
      }

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
        setTimeout(() => {
          handleClose();
          navigate("/orders");
        }, 100);
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
  const totalLabel = isMCX ? (isBuy ? "Margin" : "Receive") : isBuy ? "Total" : "Receive";
  const qtyLabel = isMCX ? "Lots" : "Qty";

  const totalValueClass = insufficientBalance
    ? profitClass(false)
    : isBuy
      ? confirmTextClass
      : profitClass(true);

  const SummaryRow = ({ label, value, valueClassName = "text-textPrimary", bold }) => (
    <div className="flex items-center justify-between gap-3 py-1">
      <span className="text-xs text-textSubtle">{label}</span>
      <span className={`text-xs ${bold ? "font-bold" : "font-medium"} ${valueClassName}`} style={mono}>
        {value}
      </span>
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4"
      style={{ background: "var(--color-modal-overlay)", backdropFilter: "blur(6px)" }}
      onClick={handleClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 24 }}
        transition={{ duration: 0.18 }}
        className={`w-full sm:max-w-[380px] rounded-t-xl sm:rounded-xl border border-borderColor overflow-hidden ${
          isLight ? "shadow-xl shadow-slate-900/10" : "shadow-2xl shadow-black/40"
        }`}
        style={{ background: "var(--color-modal-bg)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`h-1 w-full ${actionStripClass}`} />
        <div className="flex justify-center pt-2 pb-0 sm:hidden">
          <div className="w-8 h-1 rounded-full bg-borderColor" />
        </div>

        <div className="px-4 pt-3 pb-4 sm:pt-4 sm:pb-4">
          {/* Header */}
          <div className="flex items-center gap-2 mb-3">
            <span className={`text-[11px] font-bold uppercase px-2 py-0.5 rounded border ${actionBadgeClass}`}>
              {isBuy ? "Buy" : "Sell"}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold text-textPrimary truncate">{symbol}</span>
                <span className="text-[10px] text-textSubtle">{exchangeLabel}</span>
              </div>
              <p className="text-[11px] truncate text-textMuted">{name}</p>
            </div>
            <button
              onClick={handleClose}
              className="p-1.5 rounded-md text-textSubtle hover:bg-[var(--color-row-hover)] hover:text-textPrimary transition-colors"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>

          {/* Live price */}
          <div className={`${panelClass} flex items-center justify-between px-3 py-2 mb-3`}>
            <div>
              <p className="text-[10px] uppercase tracking-wide text-textSubtle">LTP</p>
              <p className={`text-lg font-bold leading-tight ${profitClass(isUp)}`} style={mono}>
                ₹{formatNumber(price) || "—"}
              </p>
            </div>
            <p className={`text-xs font-semibold text-right ${profitClass(isUp)}`} style={mono}>
              {price ? `${isUp ? "+" : ""}${change.toFixed(2)} (${changePercent.toFixed(2)}%)` : "—"}
            </p>
          </div>

          {step === "FORM" && (
            <>
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-medium text-textPrimary">{qtyLabel}</span>
                  {action === "SELL" && maxQty != null && (
                    <span className="text-[10px] text-textSubtle">
                      Max <span className="text-textPrimary font-medium" style={mono}>{maxQty}</span>
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => adjustQty(-1)}
                    className={`w-9 h-9 flex items-center justify-center rounded-lg ${ghostBtnClass}`}
                  >
                    <Minus size={14} />
                  </button>
                  <input
                    type="number"
                    value={quantity}
                    min={1}
                    onChange={(e) => handleQtyChange(Number(e.target.value))}
                    className="flex-1 h-9 text-center text-sm font-bold rounded-lg outline-none bg-inputBg border border-borderColor text-textPrimary focus:border-accent/40 focus:ring-1 focus:ring-accent/20"
                    style={mono}
                  />
                  <button
                    type="button"
                    onClick={() => adjustQty(1)}
                    className={`w-9 h-9 flex items-center justify-center rounded-lg ${ghostBtnClass}`}
                  >
                    <Plus size={14} />
                  </button>
                </div>
                {isMCX && (
                  <p className="text-[10px] mt-1 text-textSubtle">
                    1 lot = {lotSize} units · ~15% margin
                  </p>
                )}
              </div>

              <div className={`${panelClass} px-3 py-2 mb-3 space-y-0.5`}>
                <SummaryRow label="Price" value={`₹ ${formatNumber(price)}`} />
                <SummaryRow label={qtyLabel} value={formatNumber(quantity)} />
                {isMCX && (
                  <SummaryRow label="Contract" value={`₹ ${formatNumber(contractValue.toFixed(2))}`} />
                )}
                <div className="border-t border-borderColor my-1" />
                <div className="flex items-center justify-between py-1">
                  <span className="text-xs font-semibold text-textPrimary">{totalLabel}</span>
                  <span className={`text-sm font-bold ${totalValueClass}`} style={mono}>
                    ₹ {formatNumber(total)}
                  </span>
                </div>
                {isMCX && action === "SELL" && (
                  <SummaryRow
                    label="Est. P&L"
                    value={`${pnl >= 0 ? "+" : ""}₹ ${formatNumber(pnl.toFixed(2))}`}
                    valueClassName={profitClass(pnl >= 0)}
                    bold
                  />
                )}
                <SummaryRow
                  label="Balance"
                  value={`₹ ${formatNumber(user?.balance?.toFixed(2))}`}
                  valueClassName={insufficientBalance ? profitClass(false) : profitClass(true)}
                />
                {insufficientBalance && (
                  <p className={`text-[10px] text-right pt-0.5 ${profitClass(false)}`}>
                    Insufficient balance
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <button type="button" onClick={handleClose} className={`flex-1 h-10 text-xs font-semibold rounded-lg ${ghostBtnClass}`}>
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!canSubmit}
                  onClick={() => setStep("PREVIEW")}
                  className={`flex-1 h-10 text-xs font-bold rounded-lg border transition-colors ${
                    canSubmit ? actionBtnClass : `${ghostBtnClass} opacity-60 cursor-not-allowed`
                  }`}
                >
                  Review
                </button>
              </div>
            </>
          )}

          {step === "PREVIEW" && (
            <>
              <div className={`rounded-lg border px-3 py-2.5 mb-3 text-center ${confirmPanelClass}`}>
                <p className={`text-xs font-semibold ${confirmTextClass}`}>
                  Confirm {isBuy ? "Buy" : "Sell"} · {formatNumber(quantity)} {isMCX ? "lots" : "qty"} @ ₹{formatNumber(price)}
                </p>
                <p className={`text-lg font-bold mt-1 ${confirmTextClass}`} style={mono}>
                  ₹ {formatNumber(total)}
                </p>
                <p className="text-[10px] mt-1 text-textSubtle">
                  Balance after: ₹{" "}
                  {formatNumber(
                    (isBuy ? (user?.balance || 0) - total : (user?.balance || 0) + total).toFixed(2)
                  )}
                </p>
              </div>

              <div className={`${panelClass} px-3 py-2 mb-3`}>
                <SummaryRow label="Symbol" value={symbol} />
                <SummaryRow label="Exchange" value={exchangeLabel} />
                {isMCX && (
                  <SummaryRow label="Contract" value={`₹ ${formatNumber(contractValue.toFixed(2))}`} />
                )}
              </div>

              <div className="flex gap-2">
                <button type="button" onClick={() => setStep("FORM")} className={`flex-1 h-10 text-xs font-semibold rounded-lg ${ghostBtnClass}`}>
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={loading}
                  className={`flex-1 h-10 text-xs font-bold rounded-lg border flex items-center justify-center gap-1.5 transition-colors ${
                    loading ? `${ghostBtnClass} cursor-not-allowed opacity-60` : actionBtnClass
                  }`}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      Placing…
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
  );
};

export default TradeModal;
