import { useEffect, useState } from "react";

function SetTargetModal({
  isOpen,
  onClose,
  onSubmit,
  stockName,
  symbol,
  currentLtp,
  initialTargetPrice,
  loading,
}) {
  const [targetPrice, setTargetPrice] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setTargetPrice(
      typeof initialTargetPrice === "number" && initialTargetPrice > 0
        ? String(initialTargetPrice)
        : ""
    );
  }, [isOpen, initialTargetPrice]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(targetPrice);
  };

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4"
      style={{ background: "var(--color-modal-overlay)", backdropFilter: "blur(6px)" }}
    >
      <div className="w-full max-w-md relative overflow-hidden rounded-2xl border border-borderColor bg-cardBg p-7">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#7c6fff]" />

        <div className="relative mb-5">
          <h3 className="text-[18px] font-bold tracking-tight text-textPrimary">
            Set Target
          </h3>
          <p className="text-[12px] mt-1 text-textSubtle">
            {stockName || symbol}{" "}
            <span className="text-[9px] font-semibold tracking-[0.5px] rounded px-1.5 py-0.5 ml-1 bg-[rgba(124,111,255,0.12)] text-[#7c6fff]">
              {symbol}
            </span>
          </p>

          <div className="flex items-center gap-2 mt-3 px-3 py-2 rounded-xl border border-borderColor bg-[var(--color-surface-subtle)]">
            <span className="text-[10px] uppercase tracking-[1px] font-semibold text-textSubtle">
              Current LTP
            </span>
            <div className="flex-1 h-px bg-borderColor" />
            <span
              className="text-[13px] font-semibold text-textPrimary"
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            >
              {currentLtp ? `₹ ${currentLtp}` : "—"}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="relative space-y-5">
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-[1.2px] mb-2 text-textSubtle">
              Target Price
            </label>
            <div className="relative">
              <span
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] font-semibold text-textSubtle"
                style={{ fontFamily: "'IBM Plex Mono', monospace" }}
              >
                ₹
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
                placeholder="0.00"
                required
                className="w-full outline-none transition-all duration-200 rounded-xl py-2.5 pl-7 pr-3 text-sm bg-inputBg border border-borderColor text-textPrimary focus:border-[rgba(124,111,255,0.4)] focus:bg-[rgba(124,111,255,0.04)]"
                style={{ fontFamily: "'IBM Plex Mono', monospace" }}
              />
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-2.5 text-[12px] font-semibold rounded-xl border border-borderColor text-textSubtle hover:bg-[var(--color-row-hover)] hover:text-textPrimary transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 text-[12px] font-semibold rounded-xl border border-[rgba(124,111,255,0.4)] text-white bg-[rgba(124,111,255,0.9)] hover:bg-[#7c6fff] transition-colors disabled:opacity-70"
            >
              {loading ? "Saving..." : "Set Target"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default SetTargetModal;
