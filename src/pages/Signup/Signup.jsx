import {
  createUserWithEmailAndPassword,
  sendEmailVerification
} from "firebase/auth";

import { useState } from "react";
import { useNavigate } from "react-router-dom";

import logo from "../../assets/images/FahadTradeX.png";
import stockVideo from "../../assets/videos/stock-bg.webm";

import { useToast } from "../../components/common/Toast/ToastContext";

import api from "../../services/api";
import { auth } from "../../services/firebase";

function Signup() {

  const { showToast } = useToast();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);

  /* ---------------- SIGNUP ---------------- */

  const handleSignup = async () => {

    if (loading) return;

    if (!name.trim()) {
      showToast("error", "Please enter your name");
      return;
    }

    if (!email.trim()) {
      showToast("error", "Please enter your email");
      return;
    }

    const emailRegex = /\S+@\S+\.\S+/;

    if (!emailRegex.test(email)) {
      showToast("error", "Please enter a valid email");
      return;
    }

    if (!password.trim()) {
      showToast("error", "Please enter password");
      return;
    }

    if (password.length < 6) {
      showToast("error", "Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      showToast("error", "Passwords do not match");
      return;
    }

    try {

      setLoading(true);

      // ✅ Check if user already exists
      const checkRes = await api.post("/auth/check-user", { email });

      if (checkRes.data.userExists) {
        showToast("error", "User already exists. Please login.");
        return;
      }

      // ✅ Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      const firebaseUser = userCredential.user;

      // ✅ Send verification email
      await sendEmailVerification(firebaseUser);

      // ✅ Create backend user
      await api.post("/auth/signup", {
        name,
        email,
        firebaseUid: firebaseUser.uid
      });

      showToast(
        "success",
        "Account created successfully. Please verify your email before login."
      );

      // ✅ Clear form & redirect to login
      setName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      navigate("/login");

    } catch (error) {

      console.error(error);

      showToast(
        "error",
        error.response?.data?.message ||
        error.message ||
        "Signup failed"
      );

    } finally {

      setLoading(false);

    }

  };

  return (
    <div className="min-h-screen flex bg-primaryBg text-textPrimary">

      {/* LEFT SIDE */}
      <div className="hidden lg:flex w-1/2 relative items-center justify-center overflow-hidden">

        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute w-full h-full object-cover"
        >
          <source src={stockVideo} type="video/mp4" />
        </video>

        <div className="absolute inset-0 bg-black/70"></div>

        <div className="relative z-10 text-center px-10">

          <img
            src={logo}
            alt="FahadTradeX"
            className="h-14 mx-auto mb-6"
          />

          <h1 className="text-4xl font-bold mb-4">
            Master Trading
          </h1>

          <p className="text-gray-300">
            Practice trading with ₹10,00,000 virtual capital using
            real market data.
          </p>

        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="flex w-full lg:w-1/2 items-center justify-center px-8">

        <div className="w-full max-w-md bg-cardBg border border-borderColor p-10 rounded-xl">

          <h2 className="text-3xl font-bold mb-6 text-center">
            Create Account
          </h2>

          <div className="space-y-5">

            {/* Name */}
            <input
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-3 bg-primaryBg border border-borderColor rounded-lg"
            />

            {/* Email */}
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 bg-primaryBg border border-borderColor rounded-lg"
            />

            {/* Password */}
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 bg-primaryBg border border-borderColor rounded-lg"
            />

            {/* Confirm Password */}
            <input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full p-3 bg-primaryBg border border-borderColor rounded-lg"
            />

            {/* Signup Button */}
            <button
              onClick={handleSignup}
              disabled={loading}
              className={`w-full py-3 font-semibold rounded-lg transition
              ${loading
                ? "bg-gray-600 cursor-not-allowed"
                : "bg-accent text-black hover:opacity-90"}
              `}
            >
              {loading ? "Creating Account..." : "Create Account"}
            </button>

            {/* Info */}
            <p className="text-sm text-center text-gray-400 leading-relaxed">
              After signup, a verification email will be sent to your inbox.
              Please verify your email before logging in.
            </p>

          </div>

        </div>

      </div>

    </div>
  );
}

export default Signup;