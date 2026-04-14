import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import HeroSlider from "@/components/HeroSlider";
import HeroVideoSection from "@/components/HeroVideoSection";
import ProductsSection from "@/components/ProductsSection";
import AboutSection from "@/components/AboutSection";
import StatsSection from "@/components/StatsSection";
import GlobalSection from "@/components/GlobalSection";
import ContactSection from "@/components/ContactSection";
import Footer from "@/components/Footer";
import { useI18n } from "@/contexts/I18nContext";

export default function Home() {
  const { language } = useI18n();
  const seo = {
    tr: {
      title: "45+ Yıllık Tecrübe ile Ağır Vasıta Yedek Parça | BRAC",
      description:
        "ZF WABCO, Knorr Bremse, Haldex ve Provia ürünleriyle global ağır vasıta yedek parça tedarikçisi.",
    },
    en: {
      title: "Heavy Vehicle Spare Parts Supplier | 45+ Years Experience | BRAC",
      description:
        "Trusted global supplier of truck spare parts with 45+ years of experience. Supplying ZF WABCO, Knorr-Bremse, Haldex, Provia and more.",
    },
    ar: {
      title: "قطع غيار شاحنات بخبرة 45 عاماً | BRAC",
      description:
        "توريد عالمي لقطع غيار الشاحنات من أفضل العلامات مثل ZF WABCO وKnorr Bremse وHaldex.",
    },
  }[language];

  return (
    <div className="min-h-screen bg-[var(--vaden-surface-10)]">
      <Helmet>
        <title>{seo.title}</title>
        <meta name="description" content={seo.description} />
      </Helmet>

      <Navbar />
      <div className="pt-[80px] lg:pt-[113px]">
        <HeroSlider />
      </div>
      <AboutSection />
      <ProductsSection />
      <StatsSection />
      <GlobalSection />
      <ContactSection />
      <HeroVideoSection />
      <Footer />
    </div>
  );
}
