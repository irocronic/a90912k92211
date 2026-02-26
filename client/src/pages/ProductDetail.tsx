/*
  VADEN ORIGINAL - Product Detail Page
  Design: Industrial Precision - Full product information with specs and OEM codes
*/

import { useMemo } from "react";
import { useParams, useLocation } from "wouter";
import { ChevronRight, Download, Share2, Phone, Mail, Loader2 } from "lucide-react";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import {
  getProductCategoryLabel,
  getRelatedProducts,
  matchesProductParam,
  toDisplayProduct,
} from "@/lib/contentProducts";
import { asString, useTemplateBackedPageContent } from "@/lib/pageContent";
import { useI18n } from "@/contexts/I18nContext";
import {
  getProductTranslationKey,
  localizeDisplayProduct,
  PRODUCT_CONTENT_TRANSLATION_SECTION,
} from "@/lib/contentLocalization";
import {
  parseProductTaxonomy,
  PRODUCT_TAXONOMY_SETTING_KEY,
} from "@/lib/productTaxonomy";

type ProductDetailMetadata = {
  notFoundTitle: string;
  notFoundDescription: string;
  backToHomeText: string;
  breadcrumbHome: string;
  breadcrumbProducts: string;
  featuresTitle: string;
  downloadCatalogText: string;
  shareText: string;
  contactTitle: string;
  contactPhone: string;
  contactEmail: string;
  specsTitle: string;
  oemCodesTitle: string;
  applicationsTitle: string;
  certificationsTitle: string;
  relatedProductsTitle: string;
  catalogDownloadToast: string;
  linkCopiedToast: string;
};

export default function ProductDetail() {
  const params = useParams<{ slug: string }>();
  const [, navigate] = useLocation();
  const { language } = useI18n();
  const { data: products = [], isLoading } = trpc.content.products.list.useQuery();
  const { data: publicSettings = [] } = trpc.content.settings.list.useQuery(
    undefined,
    { enabled: language === "en" },
  );
  const { data: enProductTranslations = {} } =
    trpc.i18n.getSectionTranslations.useQuery(
      {
        language: "en",
        section: PRODUCT_CONTENT_TRANSLATION_SECTION,
      },
      {
        enabled: language === "en",
      },
    );
  const taxonomy = useMemo(() => {
    const setting = publicSettings.find(
      (item) => item.key === PRODUCT_TAXONOMY_SETTING_KEY,
    );
    return parseProductTaxonomy(setting?.parsedValue);
  }, [publicSettings]);
  const { metadata } = useTemplateBackedPageContent<ProductDetailMetadata>("pages.productDetail");
  const displayProducts = useMemo(
    () =>
      products.map((product) => {
        const base = toDisplayProduct(product);
        return localizeDisplayProduct(
          base,
          language,
          enProductTranslations[getProductTranslationKey(product.id)],
          taxonomy,
        );
      }),
    [products, language, enProductTranslations, taxonomy],
  );

  const slug = params?.slug;
  const product = slug
    ? displayProducts.find((item) => matchesProductParam(item, slug))
    : undefined;
  const relatedProducts = product ? getRelatedProducts(displayProducts, product.id, 3) : [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--vaden-surface-10)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[oklch(0.60_0.18_42)]" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[var(--vaden-surface-10)] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-['Barlow_Condensed'] font-black text-[var(--vaden-on-surface)] mb-4">
            {asString(metadata.notFoundTitle, "Ürün Bulunamadı")}
          </h1>
          <p className="text-[var(--vaden-text-muted)] mb-6">
            {asString(metadata.notFoundDescription, "Aradığınız ürün mevcut değil.")}
          </p>
          <button
            onClick={() => navigate("/")}
            className="bg-[oklch(0.60_0.18_42)] hover:bg-[oklch(0.50_0.18_42)] text-[var(--vaden-on-accent)] px-8 py-3 font-['Barlow_Condensed'] font-bold tracking-wide uppercase transition-colors"
          >
            {asString(metadata.backToHomeText, "Ana Sayfaya Dön")}
          </button>
        </div>
      </div>
    );
  }

  const { ref: specsRef, isVisible: specsVisible } = useIntersectionObserver({ threshold: 0.1 });
  const { ref: oemRef, isVisible: oemVisible } = useIntersectionObserver({ threshold: 0.1 });
  const { ref: relatedRef, isVisible: relatedVisible } = useIntersectionObserver({ threshold: 0.1 });

  const handleDownloadCatalog = () => {
    if (product.catalogUrl) {
      window.open(product.catalogUrl, "_blank", "noopener,noreferrer");
      return;
    }
    toast.success(asString(metadata.catalogDownloadToast, "Katalog indirme başlatıldı!"));
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product.title,
        text: product.description,
        url: window.location.href,
      });
    } else {
      toast.success(asString(metadata.linkCopiedToast, "Bağlantı kopyalandı!"));
    }
  };

  return (
    <div className="min-h-screen bg-[var(--vaden-surface-10)]">
      {/* Breadcrumb */}
      <div className="bg-[var(--vaden-surface-12)] border-b border-[var(--vaden-border-soft)]">
        <div className="container mx-auto px-6 max-w-7xl py-4">
          <div className="flex items-center gap-2 text-sm">
            <button
              onClick={() => navigate("/")}
              className="text-[oklch(0.60_0.18_42)] hover:text-[oklch(0.70_0.18_42)] transition-colors"
            >
              {asString(metadata.breadcrumbHome, "Ana Sayfa")}
            </button>
            <ChevronRight size={16} className="text-[oklch(0.40_0.01_250)]" />
            <button
              onClick={() => navigate("/#urunler")}
              className="text-[oklch(0.60_0.18_42)] hover:text-[oklch(0.70_0.18_42)] transition-colors"
            >
              {asString(metadata.breadcrumbProducts, "Ürünler")}
            </button>
            <ChevronRight size={16} className="text-[oklch(0.40_0.01_250)]" />
            <span className="text-[var(--vaden-text-muted)]">{product.title}</span>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="container mx-auto px-6 max-w-7xl py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Product Image */}
          <div className="bg-[var(--vaden-surface-14)] border border-[var(--vaden-border)] p-8 flex items-center justify-center h-96 lg:h-full">
            <img
              src={product.image}
              alt={product.title}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <div className="inline-block bg-[oklch(0.60_0.18_42)] text-[var(--vaden-on-accent)] px-3 py-1 text-xs font-['Barlow_Condensed'] font-bold tracking-wide uppercase mb-3">
                {getProductCategoryLabel(product)}
              </div>
              <h1 className="font-['Barlow_Condensed'] font-black text-[var(--vaden-on-surface)] text-5xl leading-tight mb-2">
                {product.title}
              </h1>
              <p className="text-[oklch(0.60_0.18_42)] font-['Barlow_Condensed'] font-bold text-2xl tracking-wide uppercase">
                {product.subtitle}
              </p>
              <p className="text-[var(--vaden-text-muted)] text-lg mt-4 leading-relaxed font-['Inter']">
                {product.description}
              </p>
            </div>

            {/* Full Description */}
            <div className="bg-[var(--vaden-surface-14)] border border-[var(--vaden-border)] p-6">
              <p className="text-[var(--vaden-text-muted)] leading-relaxed font-['Inter']">
                {product.fullDescription}
              </p>
            </div>

            {/* Features */}
            <div>
              <h3 className="font-['Barlow_Condensed'] font-bold text-[var(--vaden-on-surface)] text-lg uppercase tracking-wide mb-4">
                {asString(metadata.featuresTitle, "Özellikler")}
              </h3>
              <ul className="space-y-2">
                {product.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-[var(--vaden-text-muted)]">
                    <span className="w-1.5 h-1.5 bg-[oklch(0.60_0.18_42)] rounded-full mt-2 flex-shrink-0"></span>
                    <span className="font-['Inter']">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button
                onClick={handleDownloadCatalog}
                className="flex items-center justify-center gap-2 bg-[oklch(0.60_0.18_42)] hover:bg-[oklch(0.50_0.18_42)] text-[var(--vaden-on-accent)] px-6 py-3 font-['Barlow_Condensed'] font-bold tracking-wide uppercase transition-all hover:shadow-[0_0_20px_oklch(0.60_0.18_42/0.3)]"
              >
                <Download size={18} /> {asString(metadata.downloadCatalogText, "Katalog İndir")}
              </button>
              <button
                onClick={handleShare}
                className="flex items-center justify-center gap-2 border border-[oklch(0.60_0.18_42)] text-[oklch(0.60_0.18_42)] hover:bg-[oklch(0.60_0.18_42)/10] px-6 py-3 font-['Barlow_Condensed'] font-bold tracking-wide uppercase transition-colors"
              >
                <Share2 size={18} /> {asString(metadata.shareText, "Paylaş")}
              </button>
            </div>

            {/* Contact CTA */}
            <div className="bg-[var(--vaden-surface-14)] border border-[var(--vaden-border)] p-6 rounded">
              <p className="text-[var(--vaden-text-muted)] text-sm mb-3 font-['Inter']">
                {asString(metadata.contactTitle, "Sorularınız mı var?")}
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href={`tel:${asString(metadata.contactPhone, "444 9 184").replace(/\s+/g, "")}`}
                  className="flex items-center gap-2 text-[oklch(0.60_0.18_42)] hover:text-[oklch(0.70_0.18_42)] transition-colors font-['Inter'] font-semibold"
                >
                  <Phone size={16} /> {asString(metadata.contactPhone, "444 9 184")}
                </a>
                <a
                  href={`mailto:${asString(metadata.contactEmail, "info@vaden.com.tr")}`}
                  className="flex items-center gap-2 text-[oklch(0.60_0.18_42)] hover:text-[oklch(0.70_0.18_42)] transition-colors font-['Inter'] font-semibold"
                >
                  <Mail size={16} /> {asString(metadata.contactEmail, "info@vaden.com.tr")}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Specifications Section */}
      <section
        ref={specsRef as React.RefObject<HTMLElement>}
        className={`py-20 bg-[var(--vaden-surface-12)] border-t border-[var(--vaden-border-soft)] transition-all duration-700 ${
          specsVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        <div className="container mx-auto px-6 max-w-7xl">
          <h2 className="font-['Barlow_Condensed'] font-black text-[var(--vaden-on-surface)] text-4xl uppercase tracking-wide mb-12">
            {asString(metadata.specsTitle, "Teknik Özellikler")}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {product.specifications.map((spec, index) => (
              <div
                key={spec.label}
                className={`bg-[var(--vaden-surface-14)] border border-[var(--vaden-border)] p-6 transition-all duration-700 ${
                  specsVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                }`}
                style={{ transitionDelay: `${index * 0.1}s` }}
              >
                <p className="text-[oklch(0.60_0.18_42)] font-['Barlow_Condensed'] font-bold text-sm uppercase tracking-wide mb-2">
                  {spec.label}
                </p>
                <p className="text-[var(--vaden-on-surface)] font-['Barlow_Condensed'] font-black text-2xl">{spec.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* OEM Codes Section */}
      <section
        ref={oemRef as React.RefObject<HTMLElement>}
        className={`py-20 bg-[var(--vaden-surface-10)] transition-all duration-700 ${
          oemVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        <div className="container mx-auto px-6 max-w-7xl">
          <h2 className="font-['Barlow_Condensed'] font-black text-[var(--vaden-on-surface)] text-4xl uppercase tracking-wide mb-12">
            {asString(metadata.oemCodesTitle, "OEM Kodları")}
          </h2>

          <div className="space-y-6">
            {product.oemCodes.map((oem, index) => (
              <div
                key={oem.manufacturer}
                className={`bg-[var(--vaden-surface-14)] border border-[var(--vaden-border)] p-6 transition-all duration-700 ${
                  oemVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                }`}
                style={{ transitionDelay: `${index * 0.1}s` }}
              >
                <h3 className="font-['Barlow_Condensed'] font-bold text-[var(--vaden-on-surface)] text-lg uppercase tracking-wide mb-3">
                  {oem.manufacturer}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {oem.codes.map((code) => (
                    <span
                      key={code}
                      className="bg-[oklch(0.60_0.18_42)/10] border border-[oklch(0.60_0.18_42)] text-[oklch(0.60_0.18_42)] px-3 py-1.5 text-sm font-['Inter'] font-mono rounded"
                    >
                      {code}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Applications */}
          <div className="mt-12">
            <h3 className="font-['Barlow_Condensed'] font-bold text-[var(--vaden-on-surface)] text-lg uppercase tracking-wide mb-4">
              {asString(metadata.applicationsTitle, "Uygulamalar")}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {product.applications.map((app) => (
                <div
                  key={app}
                  className="bg-[var(--vaden-surface-14)] border border-[var(--vaden-border)] p-4 text-center"
                >
                  <p className="text-[var(--vaden-text-muted)] font-['Inter']">{app}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Certifications */}
          <div className="mt-12">
            <h3 className="font-['Barlow_Condensed'] font-bold text-[var(--vaden-on-surface)] text-lg uppercase tracking-wide mb-4">
              {asString(metadata.certificationsTitle, "Sertifikasyonlar")}
            </h3>
            <div className="flex flex-wrap gap-3">
              {product.certifications.map((cert) => (
                <span
                  key={cert}
                  className="bg-[oklch(0.60_0.18_42)] text-[var(--vaden-on-accent)] px-4 py-2 font-['Barlow_Condensed'] font-bold text-sm uppercase tracking-wide"
                >
                  {cert}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section
          ref={relatedRef as React.RefObject<HTMLElement>}
          className={`py-20 bg-[var(--vaden-surface-12)] border-t border-[var(--vaden-border-soft)] transition-all duration-700 ${
            relatedVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <div className="container mx-auto px-6 max-w-7xl">
            <h2 className="font-['Barlow_Condensed'] font-black text-[var(--vaden-on-surface)] text-4xl uppercase tracking-wide mb-12">
              {asString(metadata.relatedProductsTitle, "İlgili Ürünler")}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedProducts.map((relatedProduct, index) => (
                <button
                  key={relatedProduct.id}
                  onClick={() => navigate(`/product/${relatedProduct.slug}`)}
                  className={`bg-[var(--vaden-surface-14)] border border-[var(--vaden-border)] hover:border-[oklch(0.60_0.18_42)] overflow-hidden group transition-all duration-700 ${
                    relatedVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                  }`}
                  style={{ transitionDelay: `${index * 0.1}s` }}
                >
                  <div className="h-48 overflow-hidden bg-[var(--vaden-surface-10)]">
                    <img
                      src={relatedProduct.image}
                      alt={relatedProduct.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-4">
                    <p className="text-[oklch(0.60_0.18_42)] text-xs font-['Barlow_Condensed'] font-bold uppercase tracking-wide mb-2">
                      {getProductCategoryLabel(relatedProduct)}
                    </p>
                    <h3 className="font-['Barlow_Condensed'] font-bold text-[var(--vaden-on-surface)] text-base uppercase tracking-wide">
                      {relatedProduct.title}
                    </h3>
                    <p className="text-[var(--vaden-text-muted)] text-sm font-['Inter'] mt-2">
                      {relatedProduct.subtitle}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
