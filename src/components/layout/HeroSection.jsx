import { Link } from "react-router-dom";
import stockVideo from "../../assets/videos/stock-bg.webm";
import { motion } from "framer-motion";
import ReactPlayer from "react-player";
import { TrendingUp, Zap, Cpu, ShieldCheck } from "lucide-react";

/* Animation Variants */

const container = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.25,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 40 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7 },
  },
};

const stats = [
  { value: "₹10,00,000", label: "Virtual Capital" },
  { value: "50,000+", label: "Scrip Records" },
  { value: "NSE · BSE · MCX", label: "Exchanges" },
  { value: "Real-Time", label: "Live Market Data" },
];

const pills = [
  { icon: TrendingUp, label: "Live BUY / SELL Engine" },
  { icon: Zap, label: "WebSocket Market Feed" },
  { icon: Cpu, label: "AI Stock Analysis" },
  { icon: ShieldCheck, label: "JWT-Secured Trading" },
];

function HeroSection() {
  return (
    <section className="relative w-full min-h-[calc(100vh-73px)] flex items-center justify-center overflow-hidden">

      {/* Video Wrapper */}
      <div className="absolute inset-0 w-full h-full overflow-hidden">
        <ReactPlayer
          src={stockVideo}
          playing
          loop
          muted
          playsInline
          width="100%"
          height="100%"
          className="!absolute top-1/2 left-1/2 !w-auto !h-auto min-w-full min-h-full -translate-x-1/2 -translate-y-1/2"
          style={{ pointerEvents: "none" }}
          config={{
            file: {
              attributes: {
                autoPlay: true,
                muted: true,
                loop: true,
                playsInline: true,
              },
            },
          }}
        />
      </div>

      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/75" />

      {/* Content */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="relative z-10 max-w-4xl w-full text-center px-6 py-16 flex flex-col items-center gap-0"
      >

        {/* Badge */}
        <motion.div variants={item}>
          <span className="inline-block text-xs font-semibold tracking-widest uppercase text-accent border border-accent/30 bg-accent/10 px-4 py-1.5 rounded-full mb-8">
            Full-Stack Paper Trading Platform
          </span>
        </motion.div>

        {/* Title */}
        <motion.h1
          variants={item}
          className="text-5xl md:text-6xl font-bold leading-tight"
        >
          Practice Stock Trading <br />
          <span className="text-accent">Without Risk</span>
        </motion.h1>

        {/* Paragraph */}
        <motion.p
          variants={item}
          className="mt-6 text-gray-300 text-lg max-w-xl"
        >
          FahadTradeX gives you ₹10,00,000 in virtual capital to trade NSE, BSE, and MCX
          instruments using live market data powered by 5Paisa.
        </motion.p>

        {/* Buttons */}
        <motion.div
  variants={item}
  className="mt-10 flex justify-center gap-4"
>
  {/* Login Button - Fixed Design */}
  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
    <Link
      to="/login"
      className="px-7 py-3 border-2 border-accent text-accent font-medium rounded-xl 
                 hover:bg-accent hover:text-black transition-all duration-200
                 active:scale-95"
    >
      Login
    </Link>
  </motion.div>

  {/* Primary CTA Button */}
  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
    <Link
      to="/signup"
      className="px-8 py-3 bg-accent text-black font-semibold rounded-xl 
                 hover:bg-accent/90 transition-all duration-200 shadow-lg shadow-accent/30"
    >
      Create Account & Start Trading
    </Link>
  </motion.div>

  {/* Documentation Button */}
  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
    <Link
      to="/documentation"
      className="px-7 py-3 border border-borderColor text-white/80 hover:border-white/60 
                 hover:text-white rounded-xl transition-all duration-200"
    >
      Documentation
    </Link>
  </motion.div>
</motion.div>

        {/* Feature Pills */}
        <motion.div
          variants={item}
          className="mt-12 flex flex-wrap justify-center gap-3"
        >
          {pills.map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/15 backdrop-blur-sm text-sm text-gray-200"
            >
              <Icon size={14} className="text-accent" />
              {label}
            </div>
          ))}
        </motion.div>

        {/* Stats Bar */}
        <motion.div
          variants={item}
          className="mt-14 w-full grid grid-cols-2 md:grid-cols-4 gap-px bg-white/10 rounded-2xl overflow-hidden border border-white/10"
        >
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="bg-black/40 backdrop-blur-sm px-6 py-5 text-center"
            >
              <p className="text-accent text-xl font-bold">{stat.value}</p>
              <p className="text-gray-400 text-xs mt-1 uppercase tracking-wide">
                {stat.label}
              </p>
            </div>
          ))}
        </motion.div>

      </motion.div>

    </section>
  );
}

export default HeroSection;