import { useUserStore } from "../../store/userStore";
import { Plus, Search } from "lucide-react";
import { motion,useReducedMotion } from "framer-motion";
import SearchDropdown from "../search/SearchDropdown";
import { useState, useRef, useEffect } from "react";
import { formatNumber } from "../../utils/formatNumber";
import MarketStatusIndicator from "../common/MarketStatusIndicator";
import ThemeToggle from "../common/ThemeToggle";
import { useThemeStore } from "../../store/themeStore";
import TopUpModal from "../trading/TopUpModal";

function Header( {triggerWatchlistUpdate, setTriggerWatchlistUpdate, triggerPositionUpdate, setTriggerPositionUpdate}) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [showTopUp, setShowTopUp] = useState(false);
  const [userName] = useState(() => localStorage.getItem("userName") || "Trader");
  const theme = useThemeStore((s) => s.theme);
  const isLight = theme === "light";
  const reduceMotion = useReducedMotion();

  const user = useUserStore((s) => s.user);
  const displayName = userName.trim().split(/\s+/)[0] || "Trader";
  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  })();

  const wrapperRef = useRef(null);

useEffect(() => {
  function handleClickOutside(event) {
    if (!wrapperRef.current) return;

    if (!wrapperRef.current.contains(event.target)) {
      setShowDropdown(false);
      setSearchText(""); // ✅ clear input
    }
  }

  document.addEventListener("mousedown", handleClickOutside);

  return () => {
    document.removeEventListener("mousedown", handleClickOutside);
  };
}, []);





  return (
    <>
    <div className="h-11 sm:h-16 border-b border-borderColor flex items-center justify-between px-2.5 sm:px-6 bg-primaryBg gap-2 sm:gap-4">

      {/* LEFT */}
      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 min-w-0 max-w-[34vw] sm:max-w-[220px]">
        <div
          className="hidden sm:flex h-9 w-9 items-center justify-center rounded-full border shrink-0 text-sm font-bold"
          style={{
            fontFamily: "'Syne', sans-serif",
            color: "#7c6fff",
            background: isLight ? "rgba(124,111,255,0.1)" : "rgba(124,111,255,0.15)",
            borderColor: isLight ? "rgba(124,111,255,0.25)" : "rgba(124,111,255,0.3)",
          }}
        >
          {displayName.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 leading-tight">
          <p className="text-[8px] sm:text-[10px] font-medium uppercase tracking-[0.14em] text-textMuted truncate">
            <span className="hidden sm:inline">{greeting},</span>
            <span className="sm:hidden">Welcome,</span>
          </p>
          <p
            className="text-xs sm:text-base font-extrabold truncate bg-clip-text text-transparent"
            style={{
              fontFamily: "'Syne', sans-serif",
              letterSpacing: "-0.3px",
              backgroundImage: isLight
                ? "linear-gradient(135deg, #0f172a 0%, #4338ca 60%, #7c3aed 100%)"
                : "linear-gradient(135deg, #f8fafc 0%, #c4b5fd 55%, #7c6fff 100%)",
            }}
          >
            {displayName}
          </p>
        </div>
      </div>

      {/* CENTER - Search */}
      <motion.div
        ref={wrapperRef}
        whileFocusWithin={{ scale: 1.02 }}
        className="flex-1 max-w-xl relative"
      >
        <div className="flex items-center gap-2 sm:gap-3 bg-cardBg border border-borderColor rounded-lg sm:rounded-xl px-2.5 sm:px-4 py-1.5 sm:py-2">
          <Search size={14} className="text-textMuted shrink-0 sm:w-[18px] sm:h-[18px]" />
          <input
            type="text"
            placeholder="Search stocks..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onFocus={() => setShowDropdown(true)}
            className="w-full bg-transparent outline-none text-[10px] sm:text-sm text-textPrimary placeholder:text-textMuted"
          />
        </div>

        {showDropdown && searchText.length >= 3 && (
          <SearchDropdown query={searchText} triggerWatchlistUpdate={triggerWatchlistUpdate} setTriggerWatchlistUpdate={setTriggerWatchlistUpdate} triggerPositionUpdate={triggerPositionUpdate} setTriggerPositionUpdate={setTriggerPositionUpdate} />
        )}
      </motion.div>

      {/* RIGHT */}
      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        <ThemeToggle />
        <div className="hidden sm:block">
          <MarketStatusIndicator />
        </div>

        <div className="flex items-center gap-2 sm:gap-2.5">
  <div className="text-right">
    <p className="text-[8px] sm:text-xs text-textMuted hidden sm:block">Available Margin</p>
    <p className="text-accent font-semibold text-[11px] sm:text-lg tabular-nums">
      ₹ {formatNumber(user?.balance)}
    </p>
  </div>

  <motion.button
    type="button"
    whileHover={{ scale: 1.035 }}
    whileTap={{ scale: 0.965 }}
    transition={{ type: "spring", stiffness: 420, damping: 22 }}
    onClick={() => setShowTopUp(true)}
    className="group relative isolate inline-flex items-center gap-1 sm:gap-1.5 h-7 sm:h-9 pl-1.5 pr-2 sm:pl-2 sm:pr-3 rounded-full overflow-visible focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#7c6fff]"
    title="Add Virtual Money"
    aria-label="Add Virtual Money"
  >
    {/* Ambient breathing glow behind the pill */}
    {!reduceMotion && (
      <motion.span
        aria-hidden="true"
        className="pointer-events-none absolute -inset-2 -z-10 rounded-full blur-md"
        style={{
          background: isLight
            ? "radial-gradient(circle, rgba(124,111,255,0.28) 0%, transparent 70%)"
            : "radial-gradient(circle, rgba(124,111,255,0.4) 0%, transparent 70%)",
        }}
        animate={{ opacity: [0.3, 0.65, 0.3], scale: [0.96, 1.04, 0.96] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
      />
    )}

    {/* Layered surface — charcoal / violet glass */}
    <span
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-[1] rounded-full"
      style={{
        background: isLight
          ? "linear-gradient(160deg, #ffffff 0%, #f8fafc 40%, #eef2ff 100%)"
          : "linear-gradient(160deg, #1a1d2e 0%, #12141f 45%, #0e1018 100%)",
        boxShadow: isLight
          ? "inset 0 1px 0 rgba(255,255,255,0.9), 0 0 0 1px rgba(124,111,255,0.28), 0 3px 12px rgba(67,56,202,0.12)"
          : "inset 0 1px 0 rgba(255,255,255,0.08), 0 0 0 1px rgba(124,111,255,0.35), 0 4px 18px rgba(0,0,0,0.45)",
      }}
    />

    {/* Glass-like top rim highlight */}
    <span
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 top-0 h-1/2 -z-[1] rounded-t-full bg-gradient-to-b from-white/20 to-transparent"
    />

    {/* Diagonal sheen sweep on hover */}
    <span
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-[1] rounded-full opacity-0 transition-opacity duration-500 group-hover:opacity-100"
      style={{
        background:
          "linear-gradient(105deg, transparent 35%, rgba(124,111,255,0.22) 50%, transparent 65%)",
      }}
    />

    <span
      className="relative flex h-4 w-4 sm:h-5 sm:w-5 items-center justify-center rounded-full text-white ring-1 ring-white/25 transition-transform duration-300 group-hover:rotate-90"
      style={{
        background: "linear-gradient(145deg, #9b8cff 0%, #7c6fff 55%, #5b4fd6 100%)",
      }}
    >
      <Plus size={11} strokeWidth={3} className="sm:w-3 sm:h-3" />
    </span>

    <span
      className="relative text-[9px] sm:text-[11px] font-extrabold uppercase tracking-[0.14em]"
      style={{
        fontFamily: "'Syne', sans-serif",
        color: isLight ? "#312e81" : "#e8e6ff",
      }}
    >
      <span className="sm:hidden">Add</span>
      <span className="hidden sm:inline">Add Money</span>
    </span>
  </motion.button>
</div>
      </div>
    </div>

    <TopUpModal isOpen={showTopUp} onClose={() => setShowTopUp(false)} />
    </>
  );
}

export default Header;
