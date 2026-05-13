import { useLocation } from "react-router-dom";
import { useUserStore } from "../../store/userStore";
import { Search } from "lucide-react";
import { motion } from "framer-motion";
import SearchDropdown from "../search/SearchDropdown";
import { useState, useRef, useEffect } from "react";
import { formatNumber } from "../../utils/formatNumber";
import MarketStatusIndicator from "../common/MarketStatusIndicator";

function Header( {triggerWatchlistUpdate, setTriggerWatchlistUpdate, triggerPositionUpdate, setTriggerPositionUpdate}) {
  const location = useLocation();
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchText, setSearchText] = useState("");

  const user = useUserStore((s) => s.user);

  const getTitle = () => {
    if (location.pathname.includes("watchlist")) return "Watchlist";
    if (location.pathname.includes("position")) return "Positions";
    return "Dashboard";
  };


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
    <div className="h-11 sm:h-16 border-b border-[#1F2937] flex items-center justify-between px-2.5 sm:px-6 bg-[#0B0F19] gap-2 sm:gap-4">

      {/* LEFT */}
      <h1 className="text-xs sm:text-lg font-semibold tracking-wide shrink-0">
        {getTitle()}
      </h1>

      {/* CENTER - Search */}
      <motion.div
        ref={wrapperRef}
        whileFocusWithin={{ scale: 1.02 }}
        className="flex-1 max-w-xl relative"
      >
        <div className="flex items-center gap-2 sm:gap-3 bg-[#111827] border border-[#1F2937] rounded-lg sm:rounded-xl px-2.5 sm:px-4 py-1.5 sm:py-2">
          <Search size={14} className="text-gray-400 shrink-0 sm:w-[18px] sm:h-[18px]" />
          <input
            type="text"
            placeholder="Search stocks..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onFocus={() => setShowDropdown(true)}
            className="w-full bg-transparent outline-none text-[10px] sm:text-sm"
          />
        </div>

        {showDropdown && searchText.length >= 3 && (
          <SearchDropdown query={searchText} triggerWatchlistUpdate={triggerWatchlistUpdate} setTriggerWatchlistUpdate={setTriggerWatchlistUpdate} triggerPositionUpdate={triggerPositionUpdate} setTriggerPositionUpdate={setTriggerPositionUpdate} />
        )}
      </motion.div>

      {/* RIGHT */}
      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        <div className="hidden sm:block">
          <MarketStatusIndicator />
        </div>

        <div className="text-right">
          <p className="text-[8px] sm:text-xs text-gray-400 hidden sm:block">Available Margin</p>
          <p className="text-[#00FFA3] font-semibold text-[11px] sm:text-lg">
            ₹ {formatNumber(user?.balance)}
          </p>
        </div>
      </div>
    </div>
  );
}

export default Header;