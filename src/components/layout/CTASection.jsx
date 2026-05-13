import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import logo from "../../assets/images/FahadTradeX.png";
import {
  TrendingUp,
  ShieldCheck,
  Cpu,
  Zap,
} from "lucide-react";

const features = [
  {
    icon: TrendingUp,
    text: "Real-Time Market Data",
  },
  {
    icon: ShieldCheck,
    text: "Secure JWT Authentication",
  },
  {
    icon: Cpu,
    text: "AI-Powered Stock Analysis",
  },
  {
    icon: Zap,
    text: "Live BUY / SELL Execution",
  },
];

function CTASection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-primaryBg via-cardBg to-cardBg">

      {/* Glow */}
      {/* <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-accent/10 blur-3xl pointer-events-none" /> */}

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">

        {/* Top CTA */}
        <div className="max-w-3xl mx-auto text-center">

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <span className="inline-block px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-full border border-accent/20 bg-accent/10 text-accent text-[9px] sm:text-xs font-semibold tracking-widest uppercase mb-3 sm:mb-6">
              Start Your Trading Journey
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
            viewport={{ once: true }}
            className="text-lg sm:text-4xl md:text-5xl font-bold leading-tight"
          >
            Practice Trading With
            <span className="text-accent"> Zero Financial Risk</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            viewport={{ once: true }}
            className="mt-3 sm:mt-6 text-gray-400 text-[11px] sm:text-lg leading-relaxed"
          >
            Experience realistic stock trading using ₹10,00,000 virtual capital,
            live NSE/BSE/MCX market feeds, advanced charts, and AI-powered analysis.
          </motion.p>

          {/* Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            viewport={{ once: true }}
            className="mt-6 sm:mt-10 flex flex-col sm:flex-row flex-wrap justify-center items-center gap-2.5 sm:gap-4"
          >
            <Link
              to="/signup"
              className="w-full sm:w-auto text-center px-5 py-2 sm:px-8 sm:py-3 rounded-lg sm:rounded-xl bg-accent text-black text-xs sm:text-sm font-semibold hover:bg-accent/90 transition-all duration-200 shadow-lg shadow-accent/20"
            >
              Create Free Account
            </Link>

            <Link
              to="/documentation"
              className="w-full sm:w-auto text-center px-5 py-2 sm:px-8 sm:py-3 rounded-lg sm:rounded-xl border border-borderColor text-gray-300 text-xs sm:text-sm hover:border-accent hover:text-accent transition-all duration-200"
            >
              View Documentation
            </Link>
          </motion.div>

        </div>

        {/* Feature Pills */}
        <div className="mt-8 sm:mt-16 flex flex-wrap justify-center gap-1.5 sm:gap-3">
          {features.map(({ icon: Icon, text }) => (
            <div
              key={text}
              className="flex items-center gap-1 sm:gap-2 px-2.5 sm:px-4 py-1 sm:py-2 rounded-full bg-white/[0.03] border border-white/10 text-[10px] sm:text-sm text-gray-300"
            >
              <Icon size={12} className="text-accent shrink-0" />
              {text}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-10 sm:mt-16 pt-5 sm:pt-8 border-t border-white/10">

          <div className="flex flex-col lg:flex-row items-center justify-between gap-4 sm:gap-8">

            {/* Brand */}
            <div className="flex items-center gap-2 sm:gap-4">
              <img
                src={logo}
                alt="FahadTradeX"
                className="h-6 sm:h-10 w-auto"
              />
              <div>
                <h3 className="text-white font-semibold text-xs sm:text-lg">
                  FahadTradeX
                </h3>
                <p className="text-gray-500 text-[10px] sm:text-sm">
                  Full-Stack Paper Trading Platform
                </p>
              </div>
            </div>

            {/* Links */}
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-[10px] sm:text-sm text-gray-400">
              <Link to="/" className="hover:text-accent transition-colors">Home</Link>
              <Link to="/documentation" className="hover:text-accent transition-colors">Documentation</Link>
              <Link to="/login" className="hover:text-accent transition-colors">Login</Link>
              <Link to="/signup" className="hover:text-accent transition-colors">Signup</Link>
            </div>

          </div>

          {/* Bottom */}
          <div className="mt-5 sm:mt-8 text-center text-[10px] sm:text-sm text-gray-600">
            © {new Date().getFullYear()} FahadTradeX. All rights reserved.
          </div>

        </div>

      </div>

    </section>
  );
}

export default CTASection;