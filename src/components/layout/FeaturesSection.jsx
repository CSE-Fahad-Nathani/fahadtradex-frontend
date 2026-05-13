import { motion } from "framer-motion";
import { TrendingUp, BarChart3, Wallet, Cpu, Database, Zap, Search, LayoutDashboard } from "lucide-react";
import { Link } from "react-router-dom";

const features = [
  {
    icon: TrendingUp,
    title: "Paper Trading Engine",
    description:
      "Full BUY/SELL execution with margin validation, structured order states, and broker-style order history. Supports both Equity and MCX derivatives.",
  },
  {
    icon: Zap,
    title: "Real-Time WebSocket",
    description:
      "Live market data via 5paisa MarketFeed with centralized Zustand state - portfolio, positions, watchlists, and charts all update in real time.",
  },
  {
    icon: BarChart3,
    title: "Advanced Charts",
    description:
      "TradingView-inspired candle charts with 5 timeframes (1m, 5m, 15m, 1h, 1d) and historical data APIs on every stock preview page.",
  },
  {
    icon: Wallet,
    title: "Portfolio & Positions",
    description:
      "Real-time P&L, contract-value rendering, and margin-based calculations for both Equity and MCX holdings in a unified terminal UI.",
  },
  {
    icon: Cpu,
    title: "AI Stock Analysis",
    description:
      "OpenRouter-powered AI generates structured trading insights - short-term, long-term, confidence scores, and reasoning-based risk analysis.",
  },
  {
    icon: Database,
    title: "PostgreSQL Infrastructure",
    description:
      "50,000+ scrip records migrated from SQLite to indexed PostgreSQL. Supports batch queries, symbol search, and exchange-aware metadata.",
  },
  {
    icon: Search,
    title: "Smart Search Engine",
    description:
      "Symbol and company-name search across 50k+ records with exchange-aware filtering - shared across header, watchlists, and trading modals.",
  },
  {
    icon: LayoutDashboard,
    title: "Stock Preview Pages",
    description:
      "Dedicated stock pages with live LTP, OHLC data, AI insights, candle charts, and embedded BUY/SELL modals per instrument.",
  },
];

function FeaturesSection() {
  return (
    <section className="py-10 sm:py-24 px-3 sm:px-6 bg-primaryBg">
      <div className="max-w-7xl mx-auto">

        <div className="text-center mb-8 sm:mb-16">
          <h2 className="text-lg sm:text-3xl md:text-4xl font-bold mb-2 sm:mb-4">
            Built for <span className="text-accent">Serious Learners</span>
          </h2>
          <p className="text-gray-400 text-[11px] sm:text-base max-w-xl mx-auto leading-relaxed">
            Every feature mirrors how real brokerage platforms work - from margin calculations
            to live order books.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-5">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={index}
                whileHover={{ y: -6 }}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.07 }}
                viewport={{ once: true }}
                className="bg-cardBg border border-borderColor p-3 sm:p-6 rounded-lg sm:rounded-xl"
              >
                <div className="mb-2 sm:mb-4 text-accent">
                  <Icon size={18} className="sm:w-[26px] sm:h-[26px]" />
                </div>
                <h3 className="text-[11px] sm:text-base font-semibold mb-1 sm:mb-2 text-white">
                  {feature.title}
                </h3>
                <p className="text-gray-400 text-[10px] sm:text-sm leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            );
          })}
        </div>

        {/* Docs CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          viewport={{ once: true }}
          className="text-center mt-8 sm:mt-14"
        >
          <Link
            to="/documentation"
            className="inline-flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2 sm:py-3 border border-borderColor hover:border-accent rounded-lg text-[11px] sm:text-sm transition text-gray-300 hover:text-accent"
          >
            View Full Documentation →
          </Link>
        </motion.div>

      </div>
    </section>
  );
}

export default FeaturesSection;