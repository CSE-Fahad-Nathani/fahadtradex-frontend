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
    <div className="h-16 border-b border-[#1F2937] flex items-center justify-between px-6 bg-[#0B0F19]">
      
      {/* LEFT */}
      <h1 className="text-lg font-semibold tracking-wide">
        {getTitle()}
      </h1>

      {/* CENTER */}
     <motion.div
  ref={wrapperRef}
  whileFocusWithin={{ scale: 1.02 }}
  className="w-full max-w-xl relative"
>
  {/* Search Box */}
  <div className="flex items-center gap-3 bg-[#111827] border border-[#1F2937] rounded-xl px-4 py-2">
    <Search size={18} className="text-gray-400" />

   <input
    type="text"
    placeholder="Search stocks..."
    value={searchText}
    onChange={(e) => setSearchText(e.target.value)}
    onFocus={() => setShowDropdown(true)}
    className="w-full bg-transparent outline-none text-sm"
  />
  </div>

  {/* Dropdown */}
  {showDropdown && searchText.length >= 3 && (
    <SearchDropdown query={searchText}  triggerWatchlistUpdate={triggerWatchlistUpdate} setTriggerWatchlistUpdate={setTriggerWatchlistUpdate} triggerPositionUpdate={triggerPositionUpdate} setTriggerPositionUpdate={setTriggerPositionUpdate} />
  )}


</motion.div>

      {/* RIGHT */}
      <div className="flex items-center gap-4">
      <MarketStatusIndicator />

      <div className="text-right">
        <p className="text-xs text-gray-400">Available Margin</p>
        <p className="text-[#00FFA3] font-semibold text-lg">
          ₹ {formatNumber(user?.balance)}
        </p>
      </div>
      </div>
    </div>
  );
}

export default Header;