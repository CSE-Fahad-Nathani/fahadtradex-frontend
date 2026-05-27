import { useEffect } from "react";
import Navbar from "../../components/layout/Navbar";
import HeroSection from "../../components/layout/HeroSection";
import FeaturesSection from "../../components/layout/FeaturesSection";
import CTASection from "../../components/layout/CTASection";
import Footer from "../../components/layout/Footer";

const MARKET_STATUS_URL =
  "https://fahadtradex-backend.onrender.com/api/market/status";

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

      <CTASection />

      {/* <Footer /> */}

    </div>
  );
}

export default Home;