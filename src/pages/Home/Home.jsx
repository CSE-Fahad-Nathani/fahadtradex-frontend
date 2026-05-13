import Navbar from "../../components/layout/Navbar";
import HeroSection from "../../components/layout/HeroSection";
import FeaturesSection from "../../components/layout/FeaturesSection";
import CTASection from "../../components/layout/CTASection";
import Footer from "../../components/layout/Footer";

function Home() {
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