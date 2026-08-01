import { useState } from "react";
import { motion } from "framer-motion";
import { X, Wallet, Loader2, Check } from "lucide-react";
import api from "../../services/api";
import { useToast } from "../common/Toast/ToastContext";
import { fetchUserData } from "../../services/user.service";
import { formatNumber } from "../../utils/formatNumber";
import { useThemeStore } from "../../store/themeStore";
import { useUserStore } from "../../store/userStore";

const PACKAGES = [
  { id: "pack_10", amountInr: 10, creditAmount: 200000, label: "Starter", tag: "Popular start" },
  { id: "pack_20", amountInr: 20, creditAmount: 450000, label: "Growth", tag: "Best value" },
  { id: "pack_50", amountInr: 50, creditAmount: 1000000, label: "Pro", tag: "Most chosen" },
  { id: "pack_100", amountInr: 100, creditAmount: 2500000, label: "Elite", tag: "Max power" },
];

const TopUpModal = ({ isOpen, onClose }) => {
  const { showToast } = useToast();
  const isLight = useThemeStore((s) => s.theme) === "light";
  const user = useUserStore((s) => s.user);
  const [selectedId, setSelectedId] = useState("pack_20");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const selected = PACKAGES.find((p) => p.id === selectedId) || PACKAGES[1];

  const handlePay = async () => {
    if (loading) return;

    if (!window.Razorpay) {
      showToast("error", "Payment gateway failed to load. Refresh and try again.");
      return;
    }

    try {
      setLoading(true);

      const token = localStorage.getItem("token");
      if (!token) {
        showToast("error", "Session expired. Please login again");
        return;
      }

      const { data: result } = await api.post(
        "/payment/create-order",
        { packageId: selected.id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!result?.success) {
        showToast("error", result?.message || "Could not create payment order");
        return;
      }

      const { keyId, order, package: pack } = result.data;

      const options = {
        key: keyId,
        amount: order.amount,
        currency: order.currency,
        name: "FahadTradeX",
        description: `${pack.label} top-up · ₹${pack.amountInr}`,
        order_id: order.id,
        prefill: {
          name: user?.name || localStorage.getItem("userName") || "",
          email: user?.email || localStorage.getItem("email") || "",
        },
        theme: { color: "#00ffa3" },
        handler: async (response) => {
          try {
            const { data: verifyResult } = await api.post(
              "/payment/verify-payment",
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              },
              { headers: { Authorization: `Bearer ${token}` } }
            );

            if (!verifyResult?.success) {
              showToast("error", verifyResult?.message || "Payment verification failed");
              return;
            }

            await fetchUserData();
            showToast(
              "success",
              `₹${formatNumber(verifyResult.data.creditAmount)} added to your margin`
            );
            onClose();
          } catch (err) {
            console.error(err);
            showToast(
              "error",
              err.response?.data?.message || "Payment verification failed"
            );
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: () => setLoading(false),
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", (resp) => {
        console.error(resp);
        showToast("error", resp?.error?.description || "Payment failed");
        setLoading(false);
      });
      rzp.open();
    } catch (err) {
      console.error(err);
      showToast("error", err.response?.data?.message || "Could not start payment");
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center sm:p-4"
      style={{ background: "var(--color-modal-overlay)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18 }}
        className={`w-full sm:max-w-[420px] rounded-t-xl sm:rounded-xl border border-borderColor overflow-hidden ${
          isLight ? "shadow-xl shadow-slate-900/10" : "shadow-2xl shadow-black/40"
        }`}
        style={{ background: "var(--color-modal-bg)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-1 w-full bg-accent" />

        <div className="px-4 pt-4 pb-4">
          <div className="flex items-start gap-3 mb-4">
            <div className="h-9 w-9 rounded-lg border border-accent/30 bg-accent/10 flex items-center justify-center shrink-0">
              <Wallet size={16} className="text-accent" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-textPrimary">Add Funds</h3>
              <p className="text-[11px] text-textMuted mt-0.5">
                Pay a small fee and get virtual trading margin credited instantly.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-md text-textSubtle hover:bg-[var(--color-row-hover)] hover:text-textPrimary transition-colors"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-2 mb-4">
            {PACKAGES.map((pack) => {
              const active = selectedId === pack.id;
              return (
                <button
                  key={pack.id}
                  type="button"
                  onClick={() => setSelectedId(pack.id)}
                  disabled={loading}
                  className={`w-full text-left rounded-lg border px-3 py-2.5 transition-all ${
                    active
                      ? "border-accent/50 bg-accent/10"
                      : "border-borderColor bg-[var(--color-surface-elevated)] hover:bg-[var(--color-row-hover)]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-5 w-5 rounded-full border flex items-center justify-center shrink-0 ${
                        active ? "border-accent bg-accent text-black" : "border-borderColor"
                      }`}
                    >
                      {active && <Check size={12} strokeWidth={3} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold text-textPrimary">{pack.label}</p>
                        <p className="text-sm font-bold text-accent">₹{pack.amountInr}</p>
                      </div>
                      <div className="flex items-center justify-between gap-2 mt-0.5">
                        <p className="text-[10px] text-textSubtle">{pack.tag}</p>
                        <p className="text-[11px] font-medium text-textPrimary">
                          + ₹{formatNumber(pack.creditAmount)}
                        </p>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="rounded-lg border border-borderColor bg-[var(--color-surface-elevated)] px-3 py-2.5 mb-4">
            <div className="flex items-center justify-between text-xs">
              <span className="text-textSubtle">You pay</span>
              <span className="font-bold text-textPrimary">₹{selected.amountInr}</span>
            </div>
            <div className="flex items-center justify-between text-xs mt-1">
              <span className="text-textSubtle">Virtual credit</span>
              <span className="font-bold text-accent">+ ₹{formatNumber(selected.creditAmount)}</span>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 h-10 text-xs font-semibold rounded-lg border border-borderColor bg-[var(--color-surface-subtle)] text-textSubtle hover:text-textPrimary hover:bg-[var(--color-row-hover)] transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handlePay}
              disabled={loading}
              className="flex-1 h-10 text-xs font-bold rounded-lg bg-accent text-black hover:brightness-110 transition flex items-center justify-center gap-1.5 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Processing…
                </>
              ) : (
                `Pay ₹${selected.amountInr}`
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default TopUpModal;
