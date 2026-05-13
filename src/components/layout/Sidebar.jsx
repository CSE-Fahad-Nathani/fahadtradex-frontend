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
} from "lucide-react";
import { useUserStore } from "../../store/userStore";
import { useHoldingsStore } from "../../store/holdingsStore";
import { useMarketStore } from "../../store/marketStore";
import { usePnlHistoryStore } from "../../store/pnlHistoryStore";

function Sidebar() {
  const [expanded, setExpanded] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const navigate = useNavigate();

  const navItems = [
  { name: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { name: "Watchlist", icon: Eye, path: "/watchlist" },
  { name: "Portfolio", icon: Briefcase, path: "/portfolio" },
  { name: "Positions", icon: TrendingUp, path: "/position" },
  { name: "Orders", icon: ListOrdered, path: "/orders" },
  { name: "Order History", icon: History, path: "/orderHistory" },
];


const handleLogout = () => {

  // 🔥 Clear localStorage
  localStorage.removeItem("clientCode");
  localStorage.removeItem("email");
  localStorage.removeItem("fivePaisaAccessToken");
  localStorage.removeItem("token");
  localStorage.removeItem("userId");
  localStorage.removeItem("userName");

  // 🔥 Clear Zustand stores
  useUserStore.getState().clearUser();

  useHoldingsStore.getState().clearHoldings();

  useMarketStore.getState().clearMarket();

  usePnlHistoryStore.getState().clearHistory();

  // 🔥 Redirect
  navigate("/login");

};

  return (
    <div
      className={`h-full border-r border-[#1F2937] bg-[#0B0F19] flex flex-col transition-all duration-300 ${
        expanded ? "w-56" : "w-16"
      }`}
    >
      {/* Top */}
      <div className="p-3 flex justify-end">
        <button onClick={() => setExpanded(!expanded)}>
          <ChevronRight
            className={`transition-transform ${
              expanded ? "rotate-180" : ""
            }`}
          />
        </button>
      </div>

      {/* Nav */}
      <div className="flex-1 flex flex-col gap-2 px-2" style={{alignItems:"baseline"}}>
        {navItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.name}
              to={item.path}
              style={{display:"flex", alignItems:"center", justifyContent:"center"}}
              className={({ isActive }) =>
                `flex items-center gap-3 p-2 rounded-md transition ${
                  isActive
                    ? "bg-[#111827] text-[#00FFA3]"
                    : "hover:bg-[#111827]"
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

      {/* Bottom */}
      <div className="p-3 border-t border-[#1F2937]">
        <button
          onClick={() => setShowLogoutModal(true)}
          style={{display:"flex", alignItems:"center", justifyContent:"center"}}
          className="flex items-center gap-3 w-full hover:text-[#FF4D4F]"
        >
          <LogOut size={20} />
          {expanded && <span>Logout</span>}
        </button>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)" }}
          onClick={() => setShowLogoutModal(false)}
        >
          <div
            className="rounded-2xl p-7 w-[340px] flex flex-col items-center gap-5"
            style={{
              background: "linear-gradient(135deg, #141926 0%, #0d1117 100%)",
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ background: "rgba(255,77,106,0.1)", border: "1px solid rgba(255,77,106,0.2)" }}
            >
              <LogOut size={22} style={{ color: "#ff4d6a" }} />
            </div>
            <div className="text-center">
              <p className="text-[15px] font-semibold" style={{ color: "#f0f2f8" }}>
                Are you sure?
              </p>
              <p className="text-[12.5px] mt-1" style={{ color: "#5a5f78" }}>
                You will be logged out of your account.
              </p>
            </div>
            <div className="flex items-center gap-3 w-full">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 py-2 rounded-lg text-[12.5px] font-semibold transition"
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
                className="flex-1 py-2 rounded-lg text-[12.5px] font-semibold transition"
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
    </div>
  );
}

export default Sidebar;