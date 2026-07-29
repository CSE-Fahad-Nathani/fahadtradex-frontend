const STEP_META = [
  { id: "market", label: "Fetching market data", detail: "Live price, OHLC & stock details" },
  { id: "candles", label: "Loading chart candles", detail: "Historical price candles" },
  { id: "ai", label: "Running AI analysis", detail: "Short & long term insights" },
];

const StepIcon = ({ status, isLight }) => {
  if (status === "done") {
    return (
      <span
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${
          isLight ? "border-emerald-500/40 bg-emerald-50 text-emerald-600" : "border-emerald-500/35 bg-emerald-500/15 text-emerald-300"
        }`}
      >
        ✓
      </span>
    );
  }

  if (status === "active") {
    return (
      <span className="relative flex h-7 w-7 shrink-0 items-center justify-center">
        <span className="absolute inset-0 rounded-full border border-blue-500/30 animate-ping" />
        <span className="relative flex h-7 w-7 items-center justify-center rounded-full border border-blue-500/50 bg-blue-500/10">
          <span className="h-3.5 w-3.5 rounded-full border-2 border-blue-400 border-t-transparent animate-spin" />
        </span>
      </span>
    );
  }

  return (
    <span
      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${
        isLight ? "border-slate-200 bg-slate-50 text-slate-400" : "border-slate-700/80 bg-slate-800/40 text-slate-500"
      }`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-60" />
    </span>
  );
};

const StockPreviewLoader = ({ symbol, exchangeLabel, steps, progress, isLight }) => {
  const panelClass = isLight
    ? "border border-borderColor bg-cardBg shadow-lg"
    : "border border-[#1f2d44] bg-gradient-to-br from-[#121a2b] via-[#0f1623] to-[#0d1421] shadow-[0_20px_60px_rgba(0,0,0,0.45)]";
  const labelClass = isLight ? "text-slate-600" : "text-textSubtle";

  return (
    <div className="flex items-center justify-center h-[calc(100dvh-7.25rem)] sm:h-[calc(100dvh-7rem)] bg-primaryBg px-4">
      <div className={`w-full max-w-md rounded-2xl p-5 sm:p-6 ${panelClass}`} style={{ fontFamily: "ui-monospace, monospace" }}>
        <div className="mb-5 sm:mb-6 text-center">
          <p className={`text-[10px] uppercase tracking-[0.2em] mb-2 ${labelClass}`}>Preparing preview</p>
          <h2 className="text-lg sm:text-xl font-semibold text-textPrimary truncate">{symbol || "—"}</h2>
          {exchangeLabel && (
            <p className={`mt-1 text-[10px] sm:text-xs ${labelClass}`}>{exchangeLabel}</p>
          )}
        </div>

        <div className="space-y-0">
          {STEP_META.map((step, index) => {
            const status = steps[step.id] || "pending";
            const isLast = index === STEP_META.length - 1;
            const lineDone = status === "done";

            return (
              <div key={step.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <StepIcon status={status} isLight={isLight} />
                  {!isLast && (
                    <div
                      className={`my-1 w-px flex-1 min-h-[28px] transition-colors duration-500 ${
                        lineDone
                          ? isLight ? "bg-emerald-400/70" : "bg-emerald-500/50"
                          : isLight ? "bg-borderColor" : "bg-slate-700/60"
                      }`}
                    />
                  )}
                </div>

                <div className={`pb-5 min-w-0 flex-1 ${isLast ? "pb-0" : ""}`}>
                  <p
                    className={`text-[12px] sm:text-[13px] font-medium leading-tight ${
                      status === "active"
                        ? "text-textPrimary"
                        : status === "done"
                          ? isLight ? "text-emerald-700" : "text-emerald-300"
                          : labelClass
                    }`}
                  >
                    {step.label}
                    {status === "active" && (
                      <span className="inline-block ml-1 animate-pulse">...</span>
                    )}
                  </p>
                  <p className={`mt-0.5 text-[10px] sm:text-[11px] ${labelClass}`}>{step.detail}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-5 sm:mt-6">
          <div className="mb-1.5 flex items-center justify-between">
            <span className={`text-[9px] uppercase tracking-widest ${labelClass}`}>Progress</span>
            <span className={`text-[10px] font-medium tabular-nums ${isLight ? "text-blue-700" : "text-blue-300"}`}>
              {progress}%
            </span>
          </div>
          <div className={`h-1.5 w-full overflow-hidden rounded-full ${isLight ? "bg-slate-200" : "bg-slate-800"}`}>
            <div
              className={`h-full rounded-full transition-all duration-500 ease-out ${
                isLight ? "bg-gradient-to-r from-blue-500 to-cyan-500" : "bg-gradient-to-r from-blue-500 to-indigo-400"
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockPreviewLoader;
