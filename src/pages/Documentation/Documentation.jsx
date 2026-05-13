import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp, BarChart3, Wallet, Search, Cpu, Database,
  Globe, ShieldCheck, Layers, BookOpen, ChevronDown, ArrowLeft,
  Zap, RefreshCw, LayoutDashboard, FileText, AlertCircle
} from "lucide-react";
import logo from "../../assets/images/FahadTradeX.png";

const sections = [
  {
    id: "overview",
    icon: BookOpen,
    title: "Platform Overview",
    color: "text-accent",
    content: (
      <div className="space-y-4 text-gray-300 leading-relaxed">
        <p>
          FahadTradeX is a full-stack real-time paper trading platform built to simulate a
          production-grade brokerage environment. Users receive <span className="text-white font-semibold">₹10,00,000</span> in
          virtual capital and can trade NSE, BSE, and MCX instruments using live market data
          powered by the 5Paisa API.
        </p>
        <p>
          The architecture is modular and scalable — following a{" "}
          <code className="bg-white/10 px-1.5 py-0.5 rounded text-sm">Route → Controller → Service → Transaction</code>{" "}
          pattern throughout the backend, with JWT-secured ownership validation and
          transaction-safe database operations.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          {[
            { label: "Virtual Capital", value: "₹10,00,000" },
            { label: "Scrip Records", value: "50,000+" },
            { label: "Exchanges", value: "NSE / BSE / MCX" },
            { label: "Order States", value: "6 Types" },
          ].map((stat) => (
            <div key={stat.label} className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
              <p className="text-accent text-xl font-bold">{stat.value}</p>
              <p className="text-gray-400 text-sm mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: "trading-engine",
    icon: TrendingUp,
    title: "Advanced Trading Engine",
    color: "text-green-400",
    content: (
      <div className="space-y-6 text-gray-300 leading-relaxed">
        <p>
          The trading engine supports both <strong className="text-white">Equity (NSE/BSE)</strong> and{" "}
          <strong className="text-white">MCX Derivatives</strong> workflows with separate calculation
          logic for each instrument type.
        </p>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-5">
            <h4 className="text-green-400 font-semibold mb-3 flex items-center gap-2">
              <TrendingUp size={16} /> Equity Trading
            </h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>Buy Value = <code className="bg-white/10 px-1 rounded">LTP × Quantity</code></li>
              <li>P&amp;L = <code className="bg-white/10 px-1 rounded">(Sell − Buy) × Quantity</code></li>
              <li>Quantity-based portfolio tracking</li>
              <li>Avg. price auto-merge on top-up</li>
            </ul>
          </div>
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-5">
            <h4 className="text-blue-400 font-semibold mb-3 flex items-center gap-2">
              <BarChart3 size={16} /> MCX Derivatives
            </h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>Contract Value = <code className="bg-white/10 px-1 rounded">LTP × Multiplier × Lots</code></li>
              <li>Margin Blocked = <code className="bg-white/10 px-1 rounded">0.15 × Contract Value</code></li>
              <li>Margin released on SELL</li>
              <li>Realized P&amp;L settled independently</li>
            </ul>
          </div>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-3">Order States</h4>
          <div className="flex flex-wrap gap-2">
            {[
              { label: "SUCCESS", color: "bg-green-500/20 text-green-400 border-green-500/30" },
              { label: "FAILED", color: "bg-red-500/20 text-red-400 border-red-500/30" },
              { label: "INSUFFICIENT_BALANCE", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
              { label: "INSUFFICIENT_QUANTITY", color: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
              { label: "NO_HOLDINGS", color: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
              { label: "MARKET_CLOSED (planned)", color: "bg-gray-500/20 text-gray-400 border-gray-500/30" },
            ].map((s) => (
              <span key={s.label} className={`px-3 py-1 rounded-full text-xs font-mono border ${s.color}`}>
                {s.label}
              </span>
            ))}
          </div>
        </div>

        {/* <div>
          <h4 className="text-white font-semibold mb-3">API Endpoints</h4>
          <div className="space-y-2">
            {[
              { method: "BUY", path: "/api/stocks/buy", desc: "Execute a BUY order (Equity or MCX)" },
              { method: "POST", path: "/api/stocks/sell", desc: "Execute a SELL order with P&L settlement" },
            ].map((ep) => (
              <div key={ep.path} className="flex items-center gap-3 bg-white/5 rounded-lg px-4 py-2.5 text-sm">
                <span className="bg-accent text-black text-xs font-bold px-2 py-0.5 rounded">{ep.method}</span>
                <code className="text-accent font-mono">{ep.path}</code>
                <span className="text-gray-400 ml-auto hidden md:block">{ep.desc}</span>
              </div>
            ))}
          </div>
        </div> */}
      </div>
    ),
  },
  {
    id: "portfolio",
    icon: Wallet,
    title: "Portfolio & OrderBook Architecture",
    color: "text-purple-400",
    content: (
      <div className="space-y-5 text-gray-300 leading-relaxed">
        <p>
          The PortfolioMaster system stores both Equity and MCX holdings using exchange-aware
          document IDs formatted as{" "}
          <code className="bg-white/10 px-1.5 py-0.5 rounded text-sm">userId_ScripCode_Exchange_ExchangeType</code>,
          enabling duplicate-safe merging and optimized user-level queries.
        </p>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white/5 border border-white/10 rounded-xl p-5">
            <h4 className="text-white font-semibold mb-3">Equity Holdings Track</h4>
            <ul className="space-y-1.5 text-sm text-gray-400 font-mono">
              <li>totalQty</li>
              <li>avgPrice</li>
              <li>investedValue</li>
              <li>exchange / exchangeType</li>
            </ul>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-5">
            <h4 className="text-white font-semibold mb-3">MCX Holdings Track</h4>
            <ul className="space-y-1.5 text-sm text-gray-400 font-mono">
              <li>lots</li>
              <li>multiplier</li>
              <li>avgPrice</li>
              <li>margin-based investedValue</li>
            </ul>
          </div>
        </div>

        <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-5">
          <h4 className="text-purple-400 font-semibold mb-3 flex items-center gap-2">
            <FileText size={16} /> Centralized OrderBook
          </h4>
          <p className="text-sm text-gray-300 mb-3">
            Every BUY and SELL attempt — regardless of success or failure — is logged to the
            OrderBook with full context for broker-style order history and future analytics.
          </p>
          <div className="flex flex-wrap gap-2 text-xs font-mono">
            {["type","status","failureCode","reason","pnl","quantity","lots",
              "multiplier","totalValue","timestamps","stock identifiers"].map(f => (
              <span key={f} className="bg-white/10 px-2 py-1 rounded text-gray-300">{f}</span>
            ))}
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "realtime",
    icon: Zap,
    title: "Real-Time WebSocket Architecture",
    color: "text-yellow-400",
    content: (
      <div className="space-y-5 text-gray-300 leading-relaxed">
        <p>
          FahadTradeX uses a centralized WebSocket architecture powered by{" "}
          <strong className="text-white">5paisa MarketFeed</strong> and{" "}
          <strong className="text-white">Zustand global state management</strong>. All live data
          is stored globally using token-based structures like{" "}
          <code className="bg-white/10 px-1.5 py-0.5 rounded text-sm">store.data[token]</code>,
          eliminating prop-drilling across all modules.
        </p>

        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-5">
          <h4 className="text-yellow-400 font-semibold mb-3">Modules Consuming Live Data</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
            {["Portfolio","Positions","Trading Modal","Watchlists",
              "Header Search","Dashboard","Preview Pages"].map(m => (
              <div key={m} className="flex items-center gap-2 text-gray-300">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 flex-shrink-0" />
                {m}
              </div>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4 text-sm text-center">
          {[
            { label: "Multi-stock subscriptions", icon: RefreshCw },
            { label: "Dynamic token registration", icon: Zap },
            { label: "Reusable custom hooks", icon: Layers },
          ].map(({ label, icon: Icon }) => (
            <div key={label} className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col items-center gap-2">
              <Icon size={20} className="text-yellow-400" />
              <span className="text-gray-300">{label}</span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: "trading-modal",
    icon: Layers,
    title: "Reusable Trading Modal System",
    color: "text-blue-400",
    content: (
      <div className="space-y-5 text-gray-300 leading-relaxed">
        <p>
          A centralized premium trading modal powers both BUY and SELL workflows across the
          entire platform. The same modal architecture adapts dynamically based on mode
          (BUY/SELL) and instrument type (Equity/MCX).
        </p>
        <div className="grid md:grid-cols-2 gap-3">
          {[
            "WebSocket-powered live LTP updates",
            "Dynamic Quantity / Lots switching",
            "Margin-required calculations",
            "Contract-value previews",
            "Confirmation workflows",
            "Derivatives risk warnings",
            "Holdings-aware SELL rendering",
            "Premium dark fintech UI styling",
          ].map(f => (
            <div key={f} className="flex items-center gap-3 bg-white/5 rounded-lg px-4 py-2.5 text-sm">
              <span className="text-accent">✦</span>
              <span className="text-gray-300">{f}</span>
            </div>
          ))}
        </div>
        <p className="text-sm text-gray-400">
          Shared across: <span className="text-white">Watchlists · Header Search · Portfolio · Positions · Stock Preview Pages</span>
        </p>
      </div>
    ),
  },
  {
    id: "market-data",
    icon: BarChart3,
    title: "Market Data & Analytics APIs",
    color: "text-teal-400",
    content: (
      <div className="space-y-5 text-gray-300 leading-relaxed">
        <p>
          The backend exposes modular market-data APIs powered by both{" "}
          <strong className="text-white">5paisa</strong> and{" "}
          <strong className="text-white">NSE</strong> integrations.
        </p>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h4 className="text-white font-semibold">5paisa Integrations</h4>
            <ul className="space-y-1.5 text-sm text-gray-400">
              {["Market Snapshot APIs","Historical Candle APIs","WebSocket MarketFeed","Scrip Master data storage"].map(i => (
                <li key={i} className="flex items-center gap-2"><span className="text-teal-400">›</span>{i}</li>
              ))}
            </ul>
          </div>
          <div className="space-y-2">
            <h4 className="text-white font-semibold">NSE Integrations</h4>
            <ul className="space-y-1.5 text-sm text-gray-400">
              {["Top Gainers API","Live NIFTY 50 API","Browser-cookie-based requests","Anti-bot workflow handling"].map(i => (
                <li key={i} className="flex items-center gap-2"><span className="text-teal-400">›</span>{i}</li>
              ))}
            </ul>
          </div>
        </div>
        <div className="bg-teal-500/10 border border-teal-500/20 rounded-xl p-5">
          <h4 className="text-teal-400 font-semibold mb-3">Historical Candle Intervals</h4>
          <div className="flex gap-3 flex-wrap">
            {["1m","5m","15m","1h","1d"].map(tf => (
              <span key={tf} className="px-3 py-1.5 bg-white/10 rounded-lg text-sm font-mono text-white">
                {tf}
              </span>
            ))}
          </div>
          <p className="text-sm text-gray-400 mt-3">
            Powers TradingView-style charts, analytics modules, and stock preview pages.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: "ai-analysis",
    icon: Cpu,
    title: "AI-Powered Stock Analysis",
    color: "text-pink-400",
    content: (
      <div className="space-y-5 text-gray-300 leading-relaxed">
        <p>
          An AI-powered analysis engine is integrated via <strong className="text-white">OpenRouter APIs</strong>.
          The system analyzes live market data and generates structured JSON-based trading insights
          with asynchronous rendering — preview pages load instantly while AI analysis streams
          independently via isolated loading states.
        </p>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-pink-500/10 border border-pink-500/20 rounded-xl p-5">
            <h4 className="text-pink-400 font-semibold mb-3">Current Analysis Inputs</h4>
            <ul className="space-y-1.5 text-sm text-gray-400">
              {["LTP, OHLC values","Daily movement %","52-week high / low","Market positioning","Momentum signals"].map(i => (
                <li key={i} className="flex gap-2 items-center"><span className="text-pink-400">·</span>{i}</li>
              ))}
            </ul>
          </div>
          <div className="bg-pink-500/10 border border-pink-500/20 rounded-xl p-5">
            <h4 className="text-pink-400 font-semibold mb-3">Analysis Outputs</h4>
            <ul className="space-y-1.5 text-sm text-gray-400">
              {["Short-term trade analysis","Long-term analysis","Confidence scoring","Reasoning-based risk analysis","Structured JSON responses"].map(i => (
                <li key={i} className="flex gap-2 items-center"><span className="text-pink-400">·</span>{i}</li>
              ))}
            </ul>
          </div>
        </div>
        <div className="flex items-start gap-3 bg-white/5 rounded-xl p-4 text-sm">
          <AlertCircle size={16} className="text-yellow-400 flex-shrink-0 mt-0.5" />
          <p className="text-gray-400">
            <span className="text-white font-medium">Roadmap: </span>
            Advanced indicators (RSI, MACD, support/resistance), momentum tracking, and an
            AI-enhanced trading assistant are planned for future releases.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: "preview-page",
    icon: LayoutDashboard,
    title: "Stock Preview Page System",
    color: "text-orange-400",
    content: (
      <div className="space-y-5 text-gray-300 leading-relaxed">
        <p>
          A fully redesigned stock-level preview page inspired by professional fintech terminals.
          Each stock has its own dedicated route using a dynamic URL structure
        </p>
        {/* <code className="block bg-white/10 px-4 py-3 rounded-xl text-sm text-accent font-mono">
          /stock/:exchange/:exchangeType/:symbol/:scripCode
        </code> */}
        <div className="grid md:grid-cols-2 gap-3">
          {[
            "Live WebSocket LTP rendering",
            "TradingView-inspired candle charts",
            "Timeframe switching (1m to 1d)",
            "Dynamic date-range selection",
            "AI insight cards (async)",
            "BUY / SELL modal integration",
            "Instrument-aware metadata",
            "No-data edge case handling",
          ].map(f => (
            <div key={f} className="flex items-center gap-3 bg-white/5 rounded-lg px-4 py-2.5 text-sm">
              <span className="text-orange-400">✦</span>
              <span className="text-gray-300">{f}</span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: "database",
    icon: Database,
    title: "PostgreSQL Market Data Infrastructure",
    color: "text-cyan-400",
    content: (
      <div className="space-y-5 text-gray-300 leading-relaxed">
        <p>
          FahadTradeX migrated from a local SQLite store to a centralized{" "}
          <strong className="text-white">PostgreSQL-powered architecture</strong> to support
          production-grade performance at scale.
        </p>
        <div className="grid md:grid-cols-3 gap-4 text-center">
          {[
            { stat: "50,000+", label: "Scrip records migrated" },
            { stat: "Batch", label: "Optimized insertion workflow" },
            { stat: "Indexed", label: "Search query optimization" },
          ].map(s => (
            <div key={s.label} className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-4">
              <p className="text-cyan-400 text-xl font-bold">{s.stat}</p>
              <p className="text-gray-400 text-sm mt-1">{s.label}</p>
            </div>
          ))}
        </div>
        <div className="space-y-2 text-sm text-gray-400">
          <h4 className="text-white font-semibold">What the migration introduced:</h4>
          <ul className="space-y-1.5">
            {[
              "Async PostgreSQL service workflows",
              "Indexed symbol & company-name search",
              "Batch data insertion pipelines",
              "Reusable database service layers",
              "Exchange-aware query handling",
            ].map(i => (
              <li key={i} className="flex gap-2 items-center"><span className="text-cyan-400">›</span>{i}</li>
            ))}
          </ul>
        </div>
      </div>
    ),
  },
  {
    id: "search",
    icon: Search,
    title: "Advanced Search & Metadata Engine",
    color: "text-indigo-400",
    content: (
      <div className="space-y-5 text-gray-300 leading-relaxed">
        <p>
          A scalable stock search system powered by PostgreSQL indexing supports fast,
          exchange-aware lookup across 50,000+ records.
        </p>
        <div className="grid md:grid-cols-2 gap-3">
          {[
            "Symbol-based matching",
            "Company-name matching",
            "Exchange-aware filtering",
            "Derivatives metadata rendering",
            "Metadata aggregation for Portfolio",
            "Metadata aggregation for Positions",
            "Watchlist & Header Search support",
            "Centralized reusable service layer",
          ].map(f => (
            <div key={f} className="flex items-center gap-3 bg-white/5 rounded-lg px-4 py-2.5 text-sm">
              <span className="text-indigo-400">✦</span>
              <span className="text-gray-300">{f}</span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: "ui",
    icon: Globe,
    title: "Responsive Fintech UI/UX System",
    color: "text-rose-400",
    content: (
      <div className="space-y-5 text-gray-300 leading-relaxed">
        <p>
          The frontend follows a premium dark fintech design system optimized for
          dense market-data rendering and high-frequency trading workflows.
        </p>
        <div className="grid md:grid-cols-2 gap-3">
          {[
            "Adaptive responsive layouts",
            "Terminal-style data rendering",
            "Compact analytics panels",
            "Responsive toolbar systems",
            "Mobile-aware behavior",
            "Dynamic chart resizing",
            "Fixed-height market layouts",
            "Zero-overflow viewport optimization",
          ].map(f => (
            <div key={f} className="flex items-center gap-3 bg-white/5 rounded-lg px-4 py-2.5 text-sm">
              <span className="text-rose-400">✦</span>
              <span className="text-gray-300">{f}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-3 bg-accent/10 border border-accent/20 rounded-xl p-4 text-sm">
          <ShieldCheck size={16} className="text-accent flex-shrink-0" />
          <p className="text-gray-300">
            All trading actions are JWT-secured with user-ownership validation at every API layer.
          </p>
        </div>
      </div>
    ),
  },
];

function AccordionItem({ section, isOpen, onToggle }) {
  const Icon = section.icon;
  return (
    <div className="border border-borderColor rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-6 py-5 bg-cardBg hover:bg-white/5 transition text-left"
      >
        <div className="flex items-center gap-3">
          <Icon size={20} className={section.color} />
          <span className="text-white font-semibold text-lg">{section.title}</span>
        </div>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={18} className="text-gray-400" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6 pt-2 bg-primaryBg border-t border-borderColor">
              {section.content}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Documentation() {
  const [openId, setOpenId] = useState("overview");

  const toggle = (id) => setOpenId((prev) => (prev === id ? null : id));

  return (
    <div className="bg-primaryBg text-textPrimary min-h-screen">

      {/* Navbar */}
      <nav className="w-full border-b border-borderColor bg-primaryBg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-3">
            <img src={logo} alt="FahadTradeX" className="h-10 w-auto" />
            <span className="text-xl font-bold text-accent">FahadTradeX</span>
          </Link>
          <Link
            to="/"
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-borderColor hover:border-accent transition text-sm"
          >
            <ArrowLeft size={14} />
            Back to Home
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <div className="max-w-4xl mx-auto px-6 py-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-block text-xs font-semibold tracking-widest uppercase text-accent border border-accent/30 bg-accent/10 px-4 py-1.5 rounded-full mb-6">
            Platform Documentation
          </span>
          <h1 className="text-4xl md:text-5xl font-bold mb-5 leading-tight">
            Everything inside{" "}
            <span className="text-accent">FahadTradeX</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            A complete reference for the trading engine, real-time infrastructure, AI systems,
            database architecture, and UI design powering the platform.
          </p>
        </motion.div>
      </div>

      {/* Quick nav */}
      <div className="max-w-4xl mx-auto px-6 mb-10">
        <div className="flex flex-wrap gap-2">
          {sections.map((s) => {
            const Icon = s.icon;
            return (
              <button
                key={s.id}
                onClick={() => setOpenId(s.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition border ${
                  openId === s.id
                    ? "bg-accent text-black border-accent font-semibold"
                    : "border-borderColor text-gray-400 hover:border-accent hover:text-white"
                }`}
              >
                <Icon size={13} />
                {s.title.split(" ").slice(0, 2).join(" ")}
              </button>
            );
          })}
        </div>
      </div>

      {/* Accordion */}
      <div className="max-w-4xl mx-auto px-6 pb-24 space-y-3">
        {sections.map((section, i) => (
          <motion.div
            key={section.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.4 }}
          >
            <AccordionItem
              section={section}
              isOpen={openId === section.id}
              onToggle={() => toggle(section.id)}
            />
          </motion.div>
        ))}
      </div>

      {/* Footer */}
      <footer className="border-t border-borderColor py-8 px-6 text-center">
        <p className="text-gray-500 text-sm">
          © {new Date().getFullYear()} FahadTradeX · Built by Fahad ·{" "}
          <Link to="/" className="hover:text-accent transition">Back to Home</Link>
        </p>
      </footer>

    </div>
  );
}

export default Documentation;