import { useUserStore } from "../../store/userStore";
import { Search } from "lucide-react";
import { motion } from "framer-motion";
import SearchDropdown from "../search/SearchDropdown";
import { useState, useRef, useEffect } from "react";
import { formatNumber } from "../../utils/formatNumber";
import MarketStatusIndicator from "../common/MarketStatusIndicator";
import ThemeToggle from "../common/ThemeToggle";
import { useThemeStore } from "../../store/themeStore";

function Header( {triggerWatchlistUpdate, setTriggerWatchlistUpdate, triggerPositionUpdate, setTriggerPositionUpdate}) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [userName] = useState(() => localStorage.getItem("userName") || "Trader");
  const theme = useThemeStore((s) => s.theme);
  const isLight = theme === "light";

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

        <div className="text-right">
          <p className="text-[8px] sm:text-xs text-textMuted hidden sm:block">Available Margin</p>
          <p className="text-accent font-semibold text-[11px] sm:text-lg">
            ₹ {formatNumber(user?.balance)}
          </p>
        </div>
      </div>
    </div>
  );
}

export default Header;