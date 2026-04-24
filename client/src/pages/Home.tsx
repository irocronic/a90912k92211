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
import { usePublicSiteSettings } from "@/lib/siteSettings";
import { toAbsoluteUrl } from "@/lib/seo";

export default function Home() {
  const { language } = useI18n();
  const siteSettings = usePublicSiteSettings();
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
  const canonicalUrl = toAbsoluteUrl("/");
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${canonicalUrl}#organization`,
        name: siteSettings.siteTitle || "BRAC",
        description: siteSettings.siteDescription || seo.description,
        url: canonicalUrl,
        email: siteSettings.contactEmail || undefined,
        telephone: siteSettings.contactPhone || undefined,
        sameAs: [
          siteSettings.socialFacebook,
          siteSettings.socialLinkedin,
          siteSettings.socialTwitter,
        ].filter(Boolean),
      },
      {
        "@type": "WebSite",
        "@id": `${canonicalUrl}#website`,
        url: canonicalUrl,
        name: siteSettings.siteTitle || "BRAC",
        description: siteSettings.siteDescription || seo.description,
        potentialAction: {
          "@type": "SearchAction",
          target: `${toAbsoluteUrl("/search")}?q={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      },
    ],
  };

  return (
    <div className="min-h-screen bg-[var(--brac-surface-10)]">
      <Helmet>
        <title>{seo.title}</title>
        <meta name="description" content={seo.description} />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={seo.title} />
        <meta property="og:description" content={seo.description} />
        <meta property="og:url" content={canonicalUrl} />
        <meta name="twitter:card" content="summary_large_image" />
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
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
