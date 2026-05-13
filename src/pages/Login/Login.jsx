import { useUserStore } from "../../store/userStore";
import { useState } from "react";
import logo from "../../assets/images/FahadTradeX.png";
import stockVideo from "../../assets/videos/stock-bg.webm";
import { useToast } from "../../components/common/Toast/ToastContext";
import api from "../../services/api";
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail
} from "firebase/auth";
import { auth } from "../../services/firebase";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { TrendingUp, Zap, Cpu, ShieldCheck, Eye, EyeOff, ArrowRight, Info, X } from "lucide-react";

const pills = [
  { icon: TrendingUp, label: "Live Trading Engine" },
  { icon: Zap, label: "Real-Time Market Feed" },
  { icon: Cpu, label: "AI Stock Analysis" },
  { icon: ShieldCheck, label: "JWT-Secured" },
];

function Login({ setLoadingLoginLoader, loadingLoginLoader }) {
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showDemoInfo, setShowDemoInfo] = useState(false);
  const navigate = useNavigate();



  const handleLogin = async () => {

    if (loading) return;
  
    if (!email.trim()) {
      showToast("error", "Please enter your email");
      return;
    }
  
    if (!password.trim()) {
      showToast("error", "Please enter your password");
      return;
    }
  
    try {
  
      setLoading(true);
  
      // ✅ Firebase login
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
  
      const firebaseUser = userCredential.user;
  
      // ✅ Check verification
      if (!firebaseUser.emailVerified) {
  
        showToast(
          "error",
          "Please verify your email before logging in."
        );
  
        return;
      }
  
      // ✅ Get Firebase token
      const firebaseToken = await firebaseUser.getIdToken();
  
      // ✅ Backend login
      const response = await api.post("/auth/login", {
        firebaseToken
      });
  
      if (!response.data.success) {
        showToast("error", response.data.message);
        return;
      }
  
      const userName = response?.data?.data?.name;
      const userId = response?.data?.data?.userId;
  
      const clientCode = response?.data?.data?.fivePaisa?.clientCode;
  
      const { accessToken, fivePaisa } = response.data.data;
  
      // ✅ Store JWT
      localStorage.setItem("userName", userName);
      localStorage.setItem("userId", userId);
      localStorage.setItem("clientCode", clientCode);
      localStorage.setItem("token", accessToken);
      localStorage.setItem("email", email);
  
      if (fivePaisa) {
        localStorage.setItem(
          "fivePaisaAccessToken",
          fivePaisa.accessToken
        );
  
        localStorage.setItem(
          "clientCode",
          fivePaisa.clientCode
        );
      }
  
      try {
  
        // const res = await fetch(
        //   "http://localhost:3000/api/user/me",
        const res = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/api/user/me`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`
            },
          }
        );
  
        const result = await res.json();
  
        if (result.success) {
          useUserStore.getState().setUser(result.data);
        }
  
      } catch (err) {
  
        console.error(
          "User fetch after login failed:",
          err
        );
  
      }
  
      showToast("success", "Login successful");
  
      setLoadingLoginLoader(true);
  
      setTimeout(() => navigate("/dashboard"), 800);
  
    } catch (error) {
  
      console.error(error);
  
      showToast(
        "error",
        error.response?.data?.message ||
        error.message ||
        "Login failed"
      );
  
    } finally {
  
      setLoading(false);
  
    }
  
  };




  // const handleKeyDown = (e) => { if (e.key === "Enter") handleLogin(); };

  const handleKeyDown = (e) => {

    if (e.key === "Enter") {
      handleLogin();
    }
  
  };

  
  const handleForgotPassword = async () => {

    if (!email.trim()) {
      showToast("error", "Please enter your email first");
      return;
    }
  
    try {
  
      await sendPasswordResetEmail(auth, email);
  
      showToast(
        "success",
        "Password reset email sent successfully"
      );
  
    } catch (error) {
  
      console.error(error);
  
      showToast(
        "error",
        error.message || "Failed to send reset email"
      );
  
    }
  
  };

  return (
    <div className="min-h-screen flex bg-primaryBg text-textPrimary overflow-hidden">

      {/* ── LEFT PANEL — 70% ── */}
      <div className="hidden lg:flex w-[70%] relative flex-col items-center justify-center overflow-hidden">

        <video autoPlay loop muted playsInline className="absolute w-full h-full object-cover">
          <source src={stockVideo} type="video/webm" />
        </video>
        <div className="absolute inset-0 bg-[#000000b0]" />

        {/* Bottom glow */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[700px] h-[250px] bg-accent/8 rounded-full blur-[90px] pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.9 }}
          className="relative z-10 flex flex-col items-center text-center px-20 max-w-2xl"
        >
          <img src={logo} alt="FahadTradeX" className="h-14 mb-7" />

          <h1 className="text-5xl font-bold leading-tight mb-5">
            Trade Smarter, <br />
            <span className="text-accent">Not Harder</span>
          </h1>

          <p className="text-gray-400 text-base max-w-md">
            Practice on NSE, BSE and MCX with ₹10,00,000 virtual capital and live market data —
            without risking a single rupee.
          </p>

          {/* Pills 2×2 */}
          <div className="mt-12 grid grid-cols-2 gap-3 w-full max-w-md">
            {pills.map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-3 px-4 py-3.5 rounded-xl bg-white/8 border border-white/10 backdrop-blur-sm text-sm text-gray-200"
              >
                <Icon size={16} className="text-accent flex-shrink-0" />
                {label}
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="mt-10 flex gap-12">
            {[
              { value: "50K+", label: "Instruments" },
              { value: "₹10L", label: "Virtual Capital" },
              { value: "Live", label: "Market Data" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-accent text-2xl font-bold">{s.value}</p>
                <p className="text-gray-500 text-xs mt-0.5 uppercase tracking-widest">{s.label}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ── RIGHT PANEL — 30% ── */}
      <div className="w-full lg:w-[30%] relative flex items-center justify-center px-8 py-12 overflow-hidden">

        {/* Deep dark base */}
        <div className="absolute inset-0 bg-[#080810]" />

        {/* Subtle dot grid */}
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.9) 1px, transparent 1px)`,
            backgroundSize: "28px 28px",
          }}
        />

        {/* Top edge accent line */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-accent/50 to-transparent" />

        {/* Right edge accent line */}
        <div className="absolute top-0 bottom-0 left-0 w-[1px] bg-gradient-to-b from-transparent via-white/8 to-transparent" />

        {/* Glow top-right */}
        <div className="absolute -top-16 right-0 w-56 h-56 bg-accent/10 rounded-full blur-[70px] pointer-events-none" />

        {/* Glow bottom-left */}
        <div className="absolute bottom-0 -left-10 w-40 h-40 bg-accent/7 rounded-full blur-[55px] pointer-events-none" />

        {/* Diagonal shine streak */}
        <div
          className="absolute top-0 left-0 w-full h-full opacity-[0.02] pointer-events-none"
          style={{
            background: "linear-gradient(135deg, transparent 40%, rgba(255,255,255,0.6) 50%, transparent 60%)",
          }}
        />

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="relative z-10 w-full max-w-sm"
        >

          {/* Mobile logo */}
          <div className="flex flex-col items-center mb-8 lg:hidden">
            <img src={logo} alt="FahadTradeX" className="h-10 mb-3" />
            <span className="text-lg font-bold text-accent">FahadTradeX</span>
          </div>

          {/* Header */}
          <div className="mb-8">
            <div className="flex justify-center">
            </div>
            <h2 className="text-3xl font-bold text-white text-center leading-snug">
              Sign in to <br />
              <span className="text-accent">your account</span>
            </h2>
            <p className="text-white/70 text-sm mt-2 text-center">
              Enter your credentials below to continue.
            </p>
          </div>

          {/* Form */}
          <div className="space-y-5">

            {/* Email */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-500">
                  Email Address
                </label>
                <div className="relative">
                  <Info size={18} className="text-accent/70 cursor-pointer hover:text-accent transition" onClick={() => setShowDemoInfo((v) => !v)} />
                  {showDemoInfo && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowDemoInfo(false)} />
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 w-56 z-50">
                        <div
                          className="rounded-xl p-4 text-left relative"
                          style={{
                            background: "linear-gradient(135deg, #1a1f2e 0%, #0d1117 100%)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            boxShadow: "0 16px 48px rgba(0,0,0,0.5)",
                          }}
                        >
                          <button
                            onClick={() => setShowDemoInfo(false)}
                            className="absolute top-2.5 right-2.5 text-gray-500 hover:text-white transition"
                          >
                            <X size={14} />
                          </button>
                          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent mb-2.5">Demo Credentials</p>
                          <div className="space-y-1.5">
                            <div>
                              <span className="text-[10px] text-gray-500 uppercase tracking-wider">Email</span>
                              <p className="text-[12px] text-white font-medium">fewatav994@codoteam.com</p>
                            </div>
                            <div>
                              <span className="text-[10px] text-gray-500 uppercase tracking-wider">Password</span>
                              <p className="text-[12px] text-white font-medium">123456</p>
                            </div>
                          </div>
                        </div>
                        <div className="w-2.5 h-2.5 rotate-45 absolute -bottom-1 left-1/2 -translate-x-1/2" style={{ background: "#0d1117", borderRight: "1px solid rgba(255,255,255,0.1)", borderBottom: "1px solid rgba(255,255,255,0.1)" }} />
                      </div>
                    </>
                  )}
                </div>
              </div>
              <div className="relative group">
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full px-4 py-3.5 bg-white/[0.04] border border-white/10 rounded-xl text-sm text-white
                    placeholder-gray-700 focus:outline-none focus:border-accent/60 focus:bg-white/[0.07]
                    transition-all duration-200"
                />
                {/* focus glow */}
                <div className="absolute -inset-px rounded-xl opacity-0 group-focus-within:opacity-100 transition duration-200 pointer-events-none"
                  style={{ boxShadow: "0 0 0 1px rgba(var(--color-accent-rgb), 0.3), 0 0 16px rgba(var(--color-accent-rgb), 0.08)" }}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-500">
                Password
              </label>
              <div className="relative group">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full px-4 py-3.5 pr-12 bg-white/[0.04] border border-white/10 rounded-xl text-sm text-white
                    placeholder-gray-700 focus:outline-none focus:border-accent/60 focus:bg-white/[0.07]
                    transition-all duration-200"
                />
                <div className="absolute -inset-px rounded-xl opacity-0 group-focus-within:opacity-100 transition duration-200 pointer-events-none"
                  style={{ boxShadow: "0 0 0 1px rgba(var(--color-accent-rgb), 0.3), 0 0 16px rgba(var(--color-accent-rgb), 0.08)" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-accent transition z-10"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* CTA Button */}
            <motion.button
              whileHover={!loading ? { scale: 1.02 } : {}}
              whileTap={!loading ? { scale: 0.97 } : {}}
              onClick={handleLogin}
              disabled={loading}
              className={`w-full py-3.5 mt-2 font-semibold rounded-xl transition-all text-sm flex items-center justify-center gap-2
                ${loading
                  ? "bg-white/5 text-white/70 cursor-not-allowed border border-white/8"
                  : "bg-accent text-black hover:brightness-110"
                }`}
              style={!loading ? { boxShadow: "0 0 28px rgba(var(--color-accent-rgb), 0.35)" } : {}}
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight size={15} />
                </>
              )}
            </motion.button>

            <div className="flex justify-end mt-3">
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-xs text-accent hover:underline"
              >
                Forgot Password?
              </button>
            </div>

          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 my-7">
            <div className="flex-1 h-px bg-white/[0.06]" />
            <span className="text-gray-700 text-[10px] tracking-widest uppercase">or</span>
            <div className="flex-1 h-px bg-white/[0.06]" />
          </div>

          {/* Footer */}
          <div className="text-center space-y-4">
            <p className="text-sm text-white/70">
              No account yet?{" "}
              <Link to="/signup" className="text-accent hover:underline font-semibold">
                Sign up free
              </Link>
            </p>
            <Link to="/" className="block text-xs text-white/70  hover:text-accent transition">
              ← Back to Home
            </Link>
          </div>

        </motion.div>
      </div>

    </div>
  );
}

export default Login;