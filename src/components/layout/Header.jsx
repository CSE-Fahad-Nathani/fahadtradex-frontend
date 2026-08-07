import { useUserStore } from "../../store/userStore";
import { Plus, Search, X } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import SearchDropdown from "../search/SearchDropdown";
import { useState, useRef, useEffect } from "react";
import { formatNumber } from "../../utils/formatNumber";
import MarketStatusIndicator from "../common/MarketStatusIndicator";
import ThemeToggle from "../common/ThemeToggle";
import { useThemeStore } from "../../store/themeStore";
import TopUpModal from "../trading/TopUpModal";

function Header({
  triggerWatchlistUpdate,
  setTriggerWatchlistUpdate,
  triggerPositionUpdate,
  setTriggerPositionUpdate,
}) {
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

  const mobileSearchRef = useRef(null);
  const desktopSearchRef = useRef(null);
  const mobileHeaderRef = useRef(null);
  const [backdropTop, setBackdropTop] = useState(0);
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.innerWidth < 640
  );

  const showSearchDropdown = showDropdown && searchText.length >= 3;

  const clearSearch = () => {
    setShowDropdown(false);
    setSearchText("");
  };

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const onChange = () => setIsMobile(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (!isMobile || !showSearchDropdown) return;

    const updateTop = () => {
      if (mobileHeaderRef.current) {
        setBackdropTop(mobileHeaderRef.current.getBoundingClientRect().bottom);
      }
    };

    updateTop();
    window.addEventListener("resize", updateTop);
    window.addEventListener("scroll", updateTop, true);
    return () => {
      window.removeEventListener("resize", updateTop);
      window.removeEventListener("scroll", updateTop, true);
    };
  }, [isMobile, showSearchDropdown]);

  useEffect(() => {
    function handleClickOutside(event) {
      const inMobile = mobileSearchRef.current?.contains(event.target);
      const inDesktop = desktopSearchRef.current?.contains(event.target);
      if (!inMobile && !inDesktop) clearSearch();
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const nameGradient = isLight
    ? "linear-gradient(135deg, #0f172a 0%, #4338ca 60%, #7c3aed 100%)"
    : "linear-gradient(135deg, #f8fafc 0%, #c4b5fd 55%, #7c6fff 100%)";

  const renderAddMoney = (compact = false) => (
    <motion.button
      type="button"
      whileHover={{ scale: 1.035 }}
      whileTap={{ scale: 0.965 }}
      transition={{ type: "spring", stiffness: 420, damping: 22 }}
      onClick={() => setShowTopUp(true)}
      className={`group relative isolate inline-flex items-center gap-1 ${
        compact ? "h-8 pl-1.5 pr-2.5" : "h-9 pl-2 pr-3 gap-1.5"
      } rounded-full overflow-visible focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#7c6fff]`}
      title="Add Virtual Money"
      aria-label="Add Virtual Money"
    >
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

      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-1/2 -z-[1] rounded-t-full bg-gradient-to-b from-white/20 to-transparent"
      />

      <span
        className="relative flex h-5 w-5 items-center justify-center rounded-full text-white ring-1 ring-white/25 transition-transform duration-300 group-hover:rotate-90"
        style={{
          background: "linear-gradient(145deg, #9b8cff 0%, #7c6fff 55%, #5b4fd6 100%)",
        }}
      >
        <Plus size={11} strokeWidth={3} />
      </span>

      <span
        className="relative text-[10px] sm:text-[11px] font-extrabold uppercase tracking-[0.14em]"
        style={{
          fontFamily: "'Syne', sans-serif",
          color: isLight ? "#312e81" : "#e8e6ff",
        }}
      >
        {compact ? "Add" : "Add Money"}
      </span>
    </motion.button>
  );

  const renderSearch = (ref, enableDropdown) => (
    <div ref={ref} className="relative w-full">
      <div className="flex items-center gap-2.5 bg-cardBg border border-borderColor rounded-xl px-3 py-2.5 sm:py-2 sm:px-4">
        <Search size={16} className="text-textMuted shrink-0" />
        <input
          type="text"
          placeholder="Search stocks..."
          value={searchText}
          onChange={(e) => {
            setSearchText(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
          className="w-full bg-transparent outline-none text-sm text-textPrimary placeholder:text-textMuted"
        />
        {searchText ? (
          <button
            type="button"
            onClick={clearSearch}
            className="shrink-0 p-0.5 rounded-md text-textMuted hover:text-textPrimary"
            aria-label="Clear search"
          >
            <X size={14} />
          </button>
        ) : null}
      </div>

      {enableDropdown && showSearchDropdown ? (
        <SearchDropdown
          query={searchText}
          triggerWatchlistUpdate={triggerWatchlistUpdate}
          setTriggerWatchlistUpdate={setTriggerWatchlistUpdate}
          triggerPositionUpdate={triggerPositionUpdate}
          setTriggerPositionUpdate={setTriggerPositionUpdate}
        />
      ) : null}
    </div>
  );

  return (
    <>
      {/* Mobile */}
      <div
        ref={mobileHeaderRef}
        className="sm:hidden relative z-50 border-b border-borderColor bg-primaryBg px-3 pt-2.5 pb-2.5 space-y-2.5"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-textMuted">
              Welcome,
            </p>
            <p
              className="text-base font-extrabold truncate bg-clip-text text-transparent"
              style={{
                fontFamily: "'Syne', sans-serif",
                letterSpacing: "-0.3px",
                backgroundImage: nameGradient,
              }}
            >
              {displayName}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <ThemeToggle />
            <div className="text-right leading-tight">
              <p className="text-[9px] text-textMuted">Margin</p>
              <p className="text-accent font-semibold text-sm tabular-nums">
                ₹{formatNumber(user?.balance)}
              </p>
            </div>
            {renderAddMoney(true)}
          </div>
        </div>

        {renderSearch(mobileSearchRef, isMobile)}
      </div>

      {isMobile && showSearchDropdown ? (
        <div
          className="fixed left-0 right-0 bottom-0 z-40 bg-black/40 backdrop-blur-sm sm:hidden"
          style={{ top: backdropTop }}
          onClick={clearSearch}
          aria-hidden
        />
      ) : null}

      {/* Desktop */}
      <div className="hidden sm:flex h-16 border-b border-borderColor items-center justify-between px-6 bg-primaryBg gap-4">
        <div className="flex items-center gap-2.5 shrink-0 min-w-0 max-w-[220px]">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-full border shrink-0 text-sm font-bold"
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
            <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-textMuted truncate">
              {greeting},
            </p>
            <p
              className="text-base font-extrabold truncate bg-clip-text text-transparent"
              style={{
                fontFamily: "'Syne', sans-serif",
                letterSpacing: "-0.3px",
                backgroundImage: nameGradient,
              }}
            >
              {displayName}
            </p>
          </div>
        </div>

        <motion.div whileFocusWithin={{ scale: 1.02 }} className="flex-1 max-w-xl">
          {renderSearch(desktopSearchRef, !isMobile)}
        </motion.div>

        <div className="flex items-center gap-4 shrink-0">
          <ThemeToggle />
          <MarketStatusIndicator />
          <div className="flex items-center gap-2.5">
            <div className="text-right">
              <p className="text-xs text-textMuted">Available Margin</p>
              <p className="text-accent font-semibold text-lg tabular-nums">
                ₹ {formatNumber(user?.balance)}
              </p>
            </div>
            {renderAddMoney(false)}
          </div>
        </div>
      </div>

      <TopUpModal isOpen={showTopUp} onClose={() => setShowTopUp(false)} />
    </>
  );
}

export default Header;
