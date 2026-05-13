import { Link } from "react-router-dom";
import logo from "../../assets/images/FahadTradeX.png";

function Footer() {
  return (
    <footer className="bg-primaryBg border-t border-borderColor py-10 px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">

        {/* Logo + Name */}
        <div className="flex items-center gap-3">
          <img
            src={logo}
            alt="FahadTradeX"
            className="h-8 w-auto"
          />
          <span className="text-lg font-semibold text-accent">
            FahadTradeX
          </span>
        </div>

        {/* Links */}
        <div className="flex gap-6 text-gray-400">
          <Link to="/" className="hover:text-accent transition">
            Home
          </Link>

          <Link to="/login" className="hover:text-accent transition">
            Login
          </Link>

          <Link to="/signup" className="hover:text-accent transition">
            Signup
          </Link>
        </div>

        {/* Copyright */}
        <div className="text-gray-500 text-sm">
          © {new Date().getFullYear()} FahadTradeX. All rights reserved.
        </div>

      </div>
    </footer>
  );
}

export default Footer;