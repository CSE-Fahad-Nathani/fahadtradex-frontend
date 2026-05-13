import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Eye,
  Briefcase,
  TrendingUp,
  LogOut,
  ListOrdered,
  History,
  ChevronRight,
  MoreHorizontal,
} from "lucide-react";
import { useUserStore } from "../../store/userStore";
import { useHoldingsStore } from "../../store/holdingsStore";
import { useMarketStore } from "../../store/marketStore";
import { usePnlHistoryStore } from "../../store/pnlHistoryStore";

const navItems = [
  { name: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { name: "Watchlist", icon: Eye, path: "/watchlist" },
  { name: "Portfolio", icon: Briefcase, path: "/portfolio" },
  { name: "Positions", icon: TrendingUp, path: "/position" },
  { name: "Orders", icon: ListOrdered, path: "/orders" },
  { name: "Order History", icon: History, path: "/orderHistory" },
];

const mobileMainTabs = navItems.slice(0, 4);
const mobileMoreTabs = navItems.slice(4);

function Sidebar() {
  const [expanded, setExpanded] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("clientCode");
    localStorage.removeItem("email");
    localStorage.removeItem("fivePaisaAccessToken");
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("userName");

    useUserStore.getState().clearUser();
    useHoldingsStore.getState().clearHoldings();
    useMarketStore.getState().clearMarket();
    usePnlHistoryStore.getState().clearHistory();

    navigate("/login");
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <div
        className={`hidden md:flex h-full border-r border-[#1F2937] bg-[#0B0F19] flex-col transition-all duration-300 ${
          expanded ? "w-56" : "w-16"
        }`}
      >
        <div className="p-3 flex justify-end">
          <button onClick={() => setExpanded(!expanded)}>
            <ChevronRight
              className={`transition-transform ${expanded ? "rotate-180" : ""}`}
            />
          </button>
        </div>

        <div className="flex-1 flex flex-col gap-2 px-2" style={{ alignItems: "baseline" }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.path}
                style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
                className={({ isActive }) =>
                  `flex items-center gap-3 p-2 rounded-md transition ${
                    isActive ? "bg-[#111827] text-[#00FFA3]" : "hover:bg-[#111827]"
                  }`
                }
                title={!expanded ? item.name : ""}
              >
                <Icon size={20} />
                {expanded && <span>{item.name}</span>}
              </NavLink>
            );
          })}
        </div>

        <div className="p-3 border-t border-[#1F2937]">
          <button
            onClick={() => setShowLogoutModal(true)}
            style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
            className="flex items-center gap-3 w-full hover:text-[#FF4D4F]"
          >
            <LogOut size={20} />
            {expanded && <span>Logout</span>}
          </button>
        </div>
      </div>

      {/* Mobile Bottom Tab Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t border-[#1F2937] bg-[#0B0F19]/95 backdrop-blur-xl">
        <div className="flex items-center justify-around px-1 py-1.5">
          {mobileMainTabs.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-colors ${
                    isActive ? "text-[#00FFA3]" : "text-gray-500"
                  }`
                }
              >
                <Icon size={18} />
                <span className="text-[9px] font-medium">{item.name}</span>
              </NavLink>
            );
          })}

          {/* More button */}
          <button
            onClick={() => setShowMoreMenu((v) => !v)}
            className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-colors ${
              showMoreMenu ? "text-[#00FFA3]" : "text-gray-500"
            }`}
          >
            <MoreHorizontal size={18} />
            <span className="text-[9px] font-medium">More</span>
          </button>
        </div>

        {/* More dropdown (slides up) */}
        {showMoreMenu && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowMoreMenu(false)} />
            <div
              className="absolute bottom-full left-0 right-0 z-50 border-t border-[#1F2937] bg-[#0B0F19]/95 backdrop-blur-xl px-3 py-2 flex flex-col gap-0.5"
            >
              {mobileMoreTabs.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.name}
                    to={item.path}
                    onClick={() => setShowMoreMenu(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                        isActive ? "text-[#00FFA3] bg-[#111827]" : "text-gray-400 hover:bg-[#111827]"
                      }`
                    }
                  >
                    <Icon size={16} />
                    {item.name}
                  </NavLink>
                );
              })}
              <button
                onClick={() => { setShowMoreMenu(false); setShowLogoutModal(true); }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium text-red-400 hover:bg-[#111827] transition-colors"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          </>
        )}
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center px-4"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)" }}
          onClick={() => setShowLogoutModal(false)}
        >
          <div
            className="rounded-xl sm:rounded-2xl p-5 sm:p-7 w-full max-w-[340px] flex flex-col items-center gap-4 sm:gap-5"
            style={{
              background: "linear-gradient(135deg, #141926 0%, #0d1117 100%)",
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center"
              style={{ background: "rgba(255,77,106,0.1)", border: "1px solid rgba(255,77,106,0.2)" }}
            >
              <LogOut size={18} className="sm:hidden" style={{ color: "#ff4d6a" }} />
              <LogOut size={22} className="hidden sm:block" style={{ color: "#ff4d6a" }} />
            </div>
            <div className="text-center">
              <p className="text-[13px] sm:text-[15px] font-semibold" style={{ color: "#f0f2f8" }}>
                Are you sure?
              </p>
              <p className="text-[11px] sm:text-[12.5px] mt-1" style={{ color: "#5a5f78" }}>
                You will be logged out of your account.
              </p>
            </div>
            <div className="flex items-center gap-2.5 sm:gap-3 w-full">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 py-2 rounded-lg text-[11px] sm:text-[12.5px] font-semibold transition"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "#9ca3af",
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => { setShowLogoutModal(false); handleLogout(); }}
                className="flex-1 py-2 rounded-lg text-[11px] sm:text-[12.5px] font-semibold transition"
                style={{
                  background: "rgba(255,77,106,0.12)",
                  border: "1px solid rgba(255,77,106,0.3)",
                  color: "#ff4d6a",
                }}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Sidebar;