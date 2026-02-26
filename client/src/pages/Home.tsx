/*
  VADEN ORIGINAL - Home Page
  Design: Industrial Precision - Full homepage with all sections
*/

import Navbar from "@/components/Navbar";
import HeroSlider from "@/components/HeroSlider";
import NewsTicker from "@/components/NewsTicker";
import OEMSearch from "@/components/OEMSearch";
import ProductsSection from "@/components/ProductsSection";
import AboutSection from "@/components/AboutSection";
import StatsSection from "@/components/StatsSection";
import FacilitiesSection from "@/components/FacilitiesSection";
import AwardsSection from "@/components/AwardsSection";
import RDSection from "@/components/RDSection";
import SustainabilitySection from "@/components/SustainabilitySection";
import GlobalSection from "@/components/GlobalSection";
import NewsSection from "@/components/NewsSection";
import VideoSection from "@/components/VideoSection";
import ContactSection from "@/components/ContactSection";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-[var(--vaden-surface-10)]">
      {/* Navbar - fixed top navigation */}
      <Navbar />
      {/* Hero Slider - full screen, padding accounts for top bar (33px) + navbar (80px) on desktop */}
      <div className="pt-[80px] lg:pt-[113px]">
        <HeroSlider />
      </div>

      {/* News Ticker */}
      <NewsTicker />

      {/* OEM Search */}
      <OEMSearch />

      {/* About Section */}
      <AboutSection />

      {/* Products Section */}
      <ProductsSection />

      {/* Stats Section */}
      <StatsSection />

      {/* Facilities Section */}
      <FacilitiesSection />

      {/* R&D Section */}
      <RDSection />

      {/* Sustainability Section */}
      <SustainabilitySection />

      {/* Awards Section */}
      <AwardsSection />

      {/* News Section */}
      <NewsSection />

      {/* Video Section */}
      <VideoSection />

      {/* Global Section */}
      <GlobalSection />

      {/* Contact Section */}
      <ContactSection />

      {/* Footer */}
      <Footer />
    </div>
  );
}
