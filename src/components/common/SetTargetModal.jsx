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
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }}
    >
      <div
        className="w-full max-w-md relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #0f1117 0%, #13151d 100%)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 24,
          padding: "28px 28px 24px",
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        {/* Background radial glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(circle at top right, rgba(124,111,255,0.07) 0%, transparent 65%)",
          }}
        />
        {/* Top accent line */}
        <div
          className="absolute top-0 left-0 right-0 h-[1px]"
          style={{ background: "linear-gradient(90deg, transparent, rgba(124,111,255,0.5), transparent)" }}
        />
  
        {/* Header */}
        <div className="relative mb-5">
          <h3
            className="text-[18px] font-bold tracking-tight"
            style={{
              fontFamily: "'Syne', sans-serif",
              background: "linear-gradient(135deg, #fff 40%, #7c6fff)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Set Target
          </h3>
          <p className="text-[12px] mt-1" style={{ color: "#5a5f78" }}>
            {stockName || symbol}{" "}
            <span
              className="text-[9px] font-semibold tracking-[0.5px] rounded px-1.5 py-0.5 ml-1"
              style={{ background: "rgba(124,111,255,0.12)", color: "#7c6fff" }}
            >
              {symbol}
            </span>
          </p>
  
          {/* LTP hint */}
          <div
            className="flex items-center gap-2 mt-3 px-3 py-2 rounded-xl"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}
          >
            <span className="text-[10px] uppercase tracking-[1px] font-semibold" style={{ color: "#5a5f78" }}>
              Current LTP
            </span>
            <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.04)" }} />
            <span
              className="text-[13px] font-semibold"
              style={{ fontFamily: "'IBM Plex Mono', monospace", color: "#f0f2f8" }}
            >
              {currentLtp ? `₹ ${currentLtp}` : "—"}
            </span>
          </div>
        </div>
  
        {/* Form */}
        <form onSubmit={handleSubmit} className="relative space-y-5">
          <div>
            <label
              className="block text-[10px] font-semibold uppercase tracking-[1.2px] mb-2"
              style={{ color: "#5a5f78" }}
            >
              Target Price
            </label>
            <div className="relative">
              <span
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] font-semibold"
                style={{ fontFamily: "'IBM Plex Mono', monospace", color: "#5a5f78" }}
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
                className="w-full outline-none transition-all duration-200"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 12,
                  padding: "10px 12px 10px 28px",
                  fontSize: 14,
                  fontFamily: "'IBM Plex Mono', monospace",
                  color: "#f0f2f8",
                }}
                onFocus={(e) => {
                  e.target.style.border = "1px solid rgba(124,111,255,0.4)";
                  e.target.style.background = "rgba(124,111,255,0.04)";
                }}
                onBlur={(e) => {
                  e.target.style.border = "1px solid rgba(255,255,255,0.07)";
                  e.target.style.background = "rgba(255,255,255,0.03)";
                }}
              />
            </div>
          </div>
  
          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-2.5 text-[12px] font-semibold rounded-xl transition-all duration-150"
              style={{
                background: "transparent",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "#5a5f78",
                fontFamily: "'Syne', sans-serif",
                letterSpacing: "0.3px",
              }}
              onMouseEnter={(e) => { e.target.style.background = "rgba(255,255,255,0.04)"; e.target.style.color = "#f0f2f8"; }}
              onMouseLeave={(e) => { e.target.style.background = "transparent"; e.target.style.color = "#5a5f78"; }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 text-[12px] font-semibold rounded-xl transition-all duration-200"
              style={{
                background: loading ? "rgba(124,111,255,0.3)" : "rgba(124,111,255,0.9)",
                border: "1px solid rgba(124,111,255,0.4)",
                color: "#fff",
                fontFamily: "'Syne', sans-serif",
                letterSpacing: "0.3px",
                opacity: loading ? 0.7 : 1,
              }}
              onMouseEnter={(e) => { if (!loading) e.target.style.background = "#7c6fff"; }}
              onMouseLeave={(e) => { if (!loading) e.target.style.background = "rgba(124,111,255,0.9)"; }}
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
