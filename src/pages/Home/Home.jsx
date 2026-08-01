import { useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CreditCard, ShieldCheck, RefreshCw, Wallet } from "lucide-react";
import Navbar from "../../components/layout/Navbar";
import HeroSection from "../../components/layout/HeroSection";
import FeaturesSection from "../../components/layout/FeaturesSection";
import CTASection from "../../components/layout/CTASection";

const MARKET_STATUS_URL =
  "https://fahadtradex-backend.onrender.com/api/market/status";

const paymentPoints = [
  {
    icon: CreditCard,
    title: "Razorpay Checkout",
    text: "Live payment gateway with secure order creation and signature verification.",
  },
  {
    icon: Wallet,
    title: "Add Funds Flow",
    text: "Users can top up virtual trading margin anytime from the header after login.",
  },
  {
    icon: ShieldCheck,
    title: "Server-Side Verify",
    text: "HMAC SHA256 payment verification on the backend before crediting balance.",
  },
  {
    icon: RefreshCw,
    title: "Instant Balance Update",
    text: "Successful payment updates Firebase and refreshes Available Margin immediately.",
  },
];

function Home() {
  useEffect(() => {
    fetch(MARKET_STATUS_URL)
      .then((res) => res.json())
      .then((data) => console.log(data))
      .catch((err) => console.log(err));
  }, []);

  return (
    <div className="bg-primaryBg text-textPrimary min-h-screen">
      <Navbar />
      <HeroSection />
      <FeaturesSection />

      {/* Payment Integration Showcase */}
      <section className="relative py-10 sm:py-20 px-3 sm:px-6 overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background:
              "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(0,255,163,0.12), transparent 70%)",
          }}
        />

        <div className="relative max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-6 sm:mb-10"
          >
            <span className="inline-block text-[8px] sm:text-xs font-semibold tracking-widest uppercase text-accent border border-accent/30 bg-accent/10 px-2.5 sm:px-4 py-0.5 sm:py-1.5 rounded-full mb-3 sm:mb-5">
              Payment Gateway Integrated
            </span>
            <h2 className="text-lg sm:text-3xl md:text-4xl font-bold leading-tight">
              Need more funds?{" "}
              <span className="text-accent">Pay & Top Up Instantly</span>
            </h2>
            <p className="mt-2 sm:mt-4 text-gray-400 text-[11px] sm:text-base max-w-2xl mx-auto leading-relaxed">
              This project includes a complete{" "}
              <span className="text-textPrimary font-medium">Razorpay payment integration</span>.
              When a user wants more virtual trading capital, they can pay a small amount
              online and the credited margin is added securely after backend verification.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 mb-6 sm:mb-10">
            {paymentPoints.map(({ icon: Icon, title, text }, index) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.07 }}
                className="rounded-lg sm:rounded-xl border border-borderColor bg-cardBg p-3 sm:p-5"
              >
                <div className="mb-2 sm:mb-3 text-accent">
                  <Icon size={18} className="sm:w-[22px] sm:h-[22px]" />
                </div>
                <h3 className="text-[11px] sm:text-sm font-semibold text-white mb-1">{title}</h3>
                <p className="text-gray-400 text-[10px] sm:text-sm leading-relaxed">{text}</p>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: 0.2 }}
            className="rounded-xl border border-accent/25 bg-accent/5 px-4 py-4 sm:px-6 sm:py-5 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-6"
          >
            <div className="text-center sm:text-left">
              <p className="text-[11px] sm:text-sm font-semibold text-textPrimary">
                Demo packages: ₹10 · ₹20 · ₹50 · ₹100 → virtual margin credit
              </p>
              <p className="text-[10px] sm:text-xs text-gray-400 mt-1">
                Built with secure create-order + verify-payment APIs — ideal for showcasing
                real-world payment gateway skills.
              </p>
            </div>
            <Link
              to="/login"
              className="shrink-0 inline-flex items-center justify-center px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg bg-accent text-black text-[11px] sm:text-sm font-semibold hover:brightness-110 transition"
            >
              Try Add Funds
            </Link>
          </motion.div>
        </div>
      </section>

      <CTASection />
    </div>
  );
}

export default Home;
