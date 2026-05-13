import { Link } from "react-router-dom";
import logo from "../../assets/images/FahadTradeX.png";
import { motion } from "framer-motion";

function Navbar() {
  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-primaryBg/85 backdrop-blur-xl">
      
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 h-20">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <img
            src={logo}
            alt="FahadTradeX"
            className="h-9 w-auto transition-transform duration-300 group-hover:scale-105"
          />

          <div className="flex flex-col leading-none">
            <span className="text-xl font-bold tracking-tight text-white">
              FahadTradeX
            </span>

            <span className="text-[11px] text-gray-500 font-medium tracking-[0.18em] uppercase mt-1">
              Paper Trading Platform
            </span>
          </div>
        </Link>

        {/* Right Side */}
        <div className="flex items-center gap-3">

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-1 mr-2">

            <Link
              to="/documentation"
              className="
                px-4 py-2 rounded-xl
                text-sm font-medium text-gray-400
                hover:text-white hover:bg-white/5
                transition-all duration-200
              "
            >
              Documentation
            </Link>

            {/* <Link
              to="/features"
              className="
                px-4 py-2 rounded-xl
                text-sm font-medium text-gray-400
                hover:text-white hover:bg-white/5
                transition-all duration-200
              "
            >
              Features
            </Link> */}

          </div>

          {/* Login Button */}
          <motion.div
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
          >
            <Link
              to="/login"
              className="
                px-5 py-2.5 rounded-xl
                border border-white/10
                bg-white/[0.03]
                text-white text-sm font-medium
                hover:bg-white/[0.06]
                transition-all duration-200
              "
            >
              Login
            </Link>
          </motion.div>

          {/* CTA Button */}
          <motion.div
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
          >
            <Link
              to="/signup"
              className="
                px-5 py-2.5 rounded-xl
                bg-accent text-black
                text-sm font-semibold
                hover:bg-accent/90
                shadow-lg shadow-accent/20
                transition-all duration-200
              "
            >
              Start Trading
            </Link>
          </motion.div>

        </div>

      </div>

    </nav>
  );
}

export default Navbar;