import { useState } from "react";
import { Link } from "react-router-dom";
import logo from "../../assets/images/FahadTradeX.png";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";

function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-primaryBg/85 backdrop-blur-xl">

      <div className="max-w-7xl mx-auto flex items-center justify-between px-2.5 sm:px-6 h-11 sm:h-20">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-1.5 sm:gap-3 group">
          <img
            src={logo}
            alt="FahadTradeX"
            className="h-5 sm:h-9 w-auto transition-transform duration-300 group-hover:scale-105"
          />

          <div className="flex flex-col leading-none">
            <span className="text-xs sm:text-xl font-bold tracking-tight text-white">
              FahadTradeX
            </span>
            <span className="text-[7px] sm:text-[11px] text-gray-500 font-medium tracking-[0.15em] uppercase mt-px sm:mt-1">
              Paper Trading Platform
            </span>
          </div>
        </Link>

        {/* Desktop Right Side */}
        <div className="hidden md:flex items-center gap-3">

          <div className="flex items-center gap-1 mr-2">
            <Link
              to="/documentation"
              className="px-4 py-2 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-all duration-200"
            >
              Documentation
            </Link>
          </div>

          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }}>
            <Link
              to="/login"
              className="px-5 py-2.5 rounded-xl border border-white/10 bg-white/[0.03] text-white text-sm font-medium hover:bg-white/[0.06] transition-all duration-200"
            >
              Login
            </Link>
          </motion.div>

          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }}>
            <Link
              to="/signup"
              className="px-5 py-2.5 rounded-xl bg-accent text-black text-sm font-semibold hover:bg-accent/90 shadow-lg shadow-accent/20 transition-all duration-200"
            >
              Create Account
            </Link>
          </motion.div>

        </div>

        {/* Mobile: CTA + Hamburger */}
        <div className="flex md:hidden items-center gap-1">
          <Link
            to="/signup"
            className="px-2.5 py-1 rounded-md bg-accent text-black text-[10px] font-semibold"
          >
            Create Account
          </Link>

          <button
            onClick={() => setMobileOpen((prev) => !prev)}
            className="p-1 rounded-md text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="md:hidden overflow-hidden border-t border-white/10 bg-primaryBg/95 backdrop-blur-xl"
          >
            <div className="flex flex-col gap-0.5 px-2.5 py-2">
              <Link
                to="/documentation"
                onClick={() => setMobileOpen(false)}
                className="px-2.5 py-2 rounded-md text-[11px] font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-all"
              >
                Documentation
              </Link>

              <Link
                to="/login"
                onClick={() => setMobileOpen(false)}
                className="px-2.5 py-2 rounded-md text-[11px] font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-all"
              >
                Login
              </Link>

              <Link
                to="/signup"
                onClick={() => setMobileOpen(false)}
                className="mt-1 px-2.5 py-2 rounded-md bg-accent text-black text-[11px] font-semibold text-center"
              >
                Create Free Account
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </nav>
  );
}

export default Navbar;