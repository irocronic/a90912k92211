/*
  BRAC ORIGINAL - Products Section Component
  Design: Industrial Precision - Dark product cards with orange hover
*/

import { ArrowRight } from "lucide-react";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { getProductCategoryLabel, toDisplayProduct } from "@/lib/contentProducts";
import { Loader2 } from "lucide-react";
import { asNumber, asString, useTemplateBackedPageContent } from "@/lib/pageContent";
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
import { useMemo } from "react";

type ProductHeaderMetadata = {
  label: string;
  heading: string;
  viewAllText: string;
  maxItems?: number;
};

export default function ProductsSection() {
  const { ref, isVisible } = useIntersectionObserver({ threshold: 0.1 });
  const { language } = useI18n();
  const { data: products = [], isLoading } = trpc.content.products.list.useQuery();
  const { data: publicSettings = [] } = trpc.content.settings.list.useQuery(
    undefined,
    { enabled: language !== "tr" },
  );
  const { data: productTranslations = {} } =
    trpc.i18n.getSectionTranslations.useQuery(
      {
        language,
        section: PRODUCT_CONTENT_TRANSLATION_SECTION,
      },
      {
        enabled: language !== "tr",
      },
    );
  const taxonomy = useMemo(() => {
    const setting = publicSettings.find(
      (item) => item.key === PRODUCT_TAXONOMY_SETTING_KEY,
    );
    return parseProductTaxonomy(setting?.parsedValue);
  }, [publicSettings]);
  const displayProducts = useMemo(
    () =>
      products.map((product) => {
        const base = toDisplayProduct(product);
        return localizeDisplayProduct(
          base,
          language,
          productTranslations[getProductTranslationKey(product.id)],
          taxonomy,
        );
      }),
    [products, language, productTranslations, taxonomy],
  );
  const { metadata } = useTemplateBackedPageContent<ProductHeaderMetadata>("home.products");
  const cardActionText =
    language === "ar" ? "عرض المنتج" : language === "en" ? "View" : "İncele";
  const homepageProductLimit = Math.max(1, asNumber(metadata.maxItems, 6));
  const featuredProducts = useMemo(
    () => displayProducts.slice(0, homepageProductLimit),
    [displayProducts, homepageProductLimit],
  );

  return (
    <section
      id="urunler"
      className="scroll-mt-32 lg:scroll-mt-36 py-20 bg-[var(--vaden-surface-10)]"
      ref={ref as React.RefObject<HTMLElement>}
    >
      <div className="container mx-auto px-6 max-w-7xl">
        <div data-scroll-anchor="true" className="relative top-16 h-0 lg:top-0" />
        {/* Section header */}
        <div
          className={`mb-12 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
        >
          <div className="flex items-center gap-3 mb-3">
            <span className="w-10 h-0.5 bg-[oklch(0.60_0.18_42)]"></span>
            <span className="text-[oklch(0.60_0.18_42)] font-['Barlow_Condensed'] font-bold text-sm tracking-[0.2em] uppercase">
              {asString(metadata.label)}
            </span>
          </div>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <h2 className="font-['Barlow_Condensed'] font-black text-[var(--vaden-on-surface)] text-5xl md:text-6xl leading-none uppercase">
              {asString(metadata.heading)}
            </h2>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 text-[oklch(0.60_0.18_42)] font-['Barlow_Condensed'] font-bold text-sm tracking-wide uppercase hover:gap-4 transition-all"
            >
              {asString(metadata.viewAllText, "Tüm Ürünleri Gör")} <ArrowRight size={16} />
            </Link>
          </div>
        </div>

        {isLoading ? (
          <div className="py-8 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-[oklch(0.60_0.18_42)]" />
          </div>
        ) : null}

        {/* Products grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {featuredProducts.map((product, index) => (
            <Link
              key={product.id}
              href={`/product/${product.slug}`}
              className={`group relative overflow-hidden bg-[var(--vaden-surface-14)] border border-[var(--vaden-border)] hover:border-[oklch(0.60_0.18_42)] transition-all duration-500 block ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              }`}
              style={{ transitionDelay: `${index * 0.1}s` }}
            >
              {/* Image */}
              <div className="relative h-52 overflow-hidden">
                <img
                  src={product.image}
                  alt={product.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[oklch(0.10_0.01_250)] via-[oklch(0.10_0.01_250)/30] to-transparent" />
                
                {/* Category tag */}
                <div className="absolute top-3 left-3">
                  <span className="bg-[oklch(0.60_0.18_42)] text-[var(--vaden-on-accent)] font-['Barlow_Condensed'] font-bold text-xs px-2 py-1 tracking-wide">
                    {getProductCategoryLabel(product)}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-5">
                <h3 className="font-['Barlow_Condensed'] font-black text-[var(--vaden-on-surface)] text-2xl leading-tight uppercase">
                  {product.title}
                </h3>
                <h4 className="font-['Barlow_Condensed'] font-bold text-[oklch(0.60_0.18_42)] text-xl leading-tight uppercase mb-2">
                  {product.subtitle}
                </h4>
                <p className="text-[var(--vaden-text-muted)] text-sm font-['Inter'] leading-relaxed mb-4">
                  {product.description}
                </p>
                <div className="flex items-center gap-2 text-[oklch(0.60_0.18_42)] font-['Barlow_Condensed'] font-bold text-sm tracking-wide uppercase group-hover:gap-4 transition-all">
                  {cardActionText} <ArrowRight size={14} />
                </div>
              </div>

              {/* Orange bottom border on hover */}
              <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-[oklch(0.60_0.18_42)] group-hover:w-full transition-all duration-500"></div>
            </Link>
          ))}
        </div>

        {displayProducts.length > featuredProducts.length ? (
          <div className="mt-6 rounded-md border border-[var(--vaden-border)] bg-[var(--vaden-surface-12)] px-4 py-3 text-sm text-[var(--vaden-text-muted)]">
            {language === "en"
              ? `Only ${featuredProducts.length} products are highlighted on the home page. Use OEM search to explore the full catalog of ${displayProducts.length} products.`
              : language === "ar"
                ? `يتم إبراز ${featuredProducts.length} منتجات فقط في الصفحة الرئيسية. يمكنك تصفح كامل الكتالوج الذي يضم ${displayProducts.length} منتجاً.`
                : `Ana sayfada yalnizca ${featuredProducts.length} urun vitrine cikariliyor. ${displayProducts.length} urunluk tam katalog icin OEM aramayi kullanabilirsiniz.`}
          </div>
        ) : null}
      </div>
    </section>
  );
}
