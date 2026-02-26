/*
  VADEN ORIGINAL - Search Results Page
  Design: Industrial Precision - Display search results with filters
*/

import { useLocation } from "wouter";
import { ChevronRight, AlertCircle, Loader2 } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { searchProducts } from "@/lib/search";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import {
  getProductCategoryLabel,
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

type SearchResultsMetadata = {
  breadcrumbHome: string;
  breadcrumbCurrent: string;
  pageTitle: string;
  queryResultPrefix: string;
  queryResultSuffix: string;
  noResultsTitle: string;
  noResultsPrefix: string;
  noResultsCtaInline: string;
  noResultsSuffix: string;
  noResultsBackHome: string;
  filtersTitle: string;
  categoryTitle: string;
  allCategoriesText: string;
  sortTitle: string;
  sortRelevance: string;
  sortName: string;
  oemMatchLabel: string;
  oemCodesLabel: string;
  moreSuffix: string;
  detailLinkText: string;
};

function injectQuery(template: string, query: string): string {
  return template.replace("{query}", query);
}

function matchesCategoryFilter(
  categoryFilter: string,
  product: { category: string; subcategory: string },
): boolean {
  if (!categoryFilter) return true;
  if (product.category === categoryFilter) return true;
  return `${product.category} / ${product.subcategory}` === categoryFilter;
}

export default function SearchResults() {
  const [location, navigate] = useLocation();
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
  const { metadata } = useTemplateBackedPageContent<SearchResultsMetadata>("pages.searchResults");
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
  const sortLocale = language === "en" ? "en-US" : "tr-TR";
  
  // Extract query from URL
  const query = useMemo(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      return params.get("q") || "";
    }
    return "";
  }, [location]);

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"relevance" | "name">("relevance");
  const [searchQuery, setSearchQuery] = useState(query);

  // Update search query when location changes
  useEffect(() => {
    setSearchQuery(query);
  }, [query]);

  const { ref, isVisible } = useIntersectionObserver({ threshold: 0.1 });

  // Search results
  const results = useMemo(() => {
    let filtered = searchProducts(displayProducts, searchQuery);

    // Filter by category if selected
    if (selectedCategory) {
      filtered = filtered.filter(
        (result) => matchesCategoryFilter(selectedCategory, result.product),
      );
    }

    // Sort results
    if (sortBy === "name") {
      filtered.sort((a, b) =>
        a.product.title.localeCompare(b.product.title, sortLocale)
      );
    }

    return filtered;
  }, [displayProducts, searchQuery, selectedCategory, sortBy, sortLocale]);

  const categories = useMemo(() => {
    const cats = new Set<string>();
    results.forEach((result) => {
      cats.add(result.product.category);
    });
    return Array.from(cats).sort((a, b) => a.localeCompare(b, sortLocale));
  }, [results, sortLocale]);

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
            <span className="text-[var(--vaden-text-muted)]">
              {asString(metadata.breadcrumbCurrent, "Arama Sonuçları")}
            </span>
          </div>
        </div>
      </div>

      {/* Search Header */}
      <div className="container mx-auto px-6 max-w-7xl py-12">
        <div className="mb-8">
          <h1 className="font-['Barlow_Condensed'] font-black text-[var(--vaden-on-surface)] text-5xl uppercase tracking-wide mb-2">
            {asString(metadata.pageTitle, "Arama Sonuçları")}
          </h1>
          <p className="text-[var(--vaden-text-muted)] text-lg font-['Inter']">
            {injectQuery(
              asString(metadata.queryResultPrefix, "\"{query}\" için"),
              searchQuery,
            )}{" "}
            <span className="text-[oklch(0.60_0.18_42)] font-bold">
              {results.length}
            </span>{" "}
            {asString(metadata.queryResultSuffix, "ürün bulundu")}
          </p>
        </div>

        {isLoading ? (
          <div className="py-12 flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-[oklch(0.60_0.18_42)]" />
          </div>
        ) : results.length === 0 ? (
          // No results
          <div className="bg-[var(--vaden-surface-14)] border border-[var(--vaden-border)] p-12 text-center">
            <AlertCircle size={48} className="mx-auto text-[oklch(0.60_0.18_42)] mb-4" />
            <h2 className="font-['Barlow_Condensed'] font-bold text-[var(--vaden-on-surface)] text-2xl uppercase mb-2">
              {asString(metadata.noResultsTitle, "Sonuç Bulunamadı")}
            </h2>
            <p className="text-[var(--vaden-text-muted)] mb-6 font-['Inter']">
              {injectQuery(
                asString(
                  metadata.noResultsPrefix,
                  "\"{query}\" için eşleşen ürün yok. Lütfen arama terimini kontrol edin veya",
                ),
                searchQuery,
              )}
              <button
                onClick={() => navigate("/#urunler")}
                className="text-[oklch(0.60_0.18_42)] hover:underline ml-1"
              >
                {asString(metadata.noResultsCtaInline, "tüm ürünleri görün")}
              </button>
              {asString(metadata.noResultsSuffix, ".")}
            </p>
            <button
              onClick={() => navigate("/")}
              className="bg-[oklch(0.60_0.18_42)] hover:bg-[oklch(0.50_0.18_42)] text-[var(--vaden-on-accent)] px-6 py-3 font-['Barlow_Condensed'] font-bold tracking-wide uppercase transition-colors"
            >
              {asString(metadata.noResultsBackHome, "Ana Sayfaya Dön")}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Filters Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-[var(--vaden-surface-14)] border border-[var(--vaden-border)] p-6 sticky top-20">
                <h3 className="font-['Barlow_Condensed'] font-bold text-[var(--vaden-on-surface)] text-lg uppercase tracking-wide mb-4">
                  {asString(metadata.filtersTitle, "Filtreler")}
                </h3>

                {/* Category Filter */}
                <div className="mb-6">
                  <p className="text-[oklch(0.60_0.18_42)] font-['Barlow_Condensed'] font-bold text-xs uppercase tracking-wide mb-3">
                    {asString(metadata.categoryTitle, "Kategori")}
                  </p>
                  <div className="space-y-2">
                    <button
                      onClick={() => setSelectedCategory(null)}
                      className={`block w-full text-left px-3 py-2 text-sm transition-colors ${
                        selectedCategory === null
                          ? "bg-[oklch(0.60_0.18_42)] text-[var(--vaden-on-accent)] font-bold"
                          : "text-[var(--vaden-text-muted)] hover:text-[oklch(0.60_0.18_42)]"
                      }`}
                    >
                      {asString(metadata.allCategoriesText, "Tümü")} ({results.length})
                    </button>
                    {categories.map((cat) => {
                      const count = results.filter(
                        (r) => matchesCategoryFilter(cat, r.product)
                      ).length;
                      return (
                        <button
                          key={cat}
                          onClick={() => setSelectedCategory(cat)}
                          className={`block w-full text-left px-3 py-2 text-sm transition-colors ${
                            selectedCategory === cat
                              ? "bg-[oklch(0.60_0.18_42)] text-[var(--vaden-on-accent)] font-bold"
                              : "text-[var(--vaden-text-muted)] hover:text-[oklch(0.60_0.18_42)]"
                          }`}
                        >
                          {cat} ({count})
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Sort */}
                <div>
                  <p className="text-[oklch(0.60_0.18_42)] font-['Barlow_Condensed'] font-bold text-xs uppercase tracking-wide mb-3">
                    {asString(metadata.sortTitle, "Sıralama")}
                  </p>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as "relevance" | "name")}
                    className="w-full bg-[var(--vaden-surface-10)] border border-[var(--vaden-border-strong)] text-[var(--vaden-on-surface)] px-3 py-2 text-sm focus:border-[oklch(0.60_0.18_42)] outline-none transition-colors"
                  >
                    <option value="relevance">{asString(metadata.sortRelevance, "İlgililik")}</option>
                    <option value="name">{asString(metadata.sortName, "Ad (A-Z)")}</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Results */}
            <div
              ref={ref as React.RefObject<HTMLDivElement>}
              className="lg:col-span-3 space-y-4"
            >
              {results.map((result, index) => (
                <Link
                  key={`${result.product.id}-${index}`}
                  href={`/product/${result.product.slug}`}
                  className={`group bg-[var(--vaden-surface-14)] border border-[var(--vaden-border)] hover:border-[oklch(0.60_0.18_42)] p-6 transition-all duration-500 block ${
                    isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                  }`}
                  style={{ transitionDelay: `${index * 0.05}s` }}
                >
                  <div className="flex gap-6">
                    {/* Product Image */}
                    <div className="w-32 h-32 flex-shrink-0 bg-[var(--vaden-surface-10)] border border-[var(--vaden-border-soft)] overflow-hidden">
                      <img
                        src={result.product.image}
                        alt={result.product.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    </div>

                    {/* Product Info */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <span className="inline-block bg-[oklch(0.60_0.18_42)] text-[var(--vaden-on-accent)] px-2 py-1 text-xs font-['Barlow_Condensed'] font-bold uppercase tracking-wide mb-2">
                            {getProductCategoryLabel(result.product)}
                          </span>
                          <h3 className="font-['Barlow_Condensed'] font-black text-[var(--vaden-on-surface)] text-xl uppercase tracking-wide">
                            {result.product.title}
                          </h3>
                          <p className="text-[oklch(0.60_0.18_42)] font-['Barlow_Condensed'] font-bold text-lg uppercase">
                            {result.product.subtitle}
                          </p>
                        </div>
                        <div className="text-right">
                          {result.matchType === "oemCode" && (
                            <div className="text-xs">
                              <p className="text-[oklch(0.45_0.01_250)] mb-1">
                                {asString(metadata.oemMatchLabel, "OEM Kodu Eşleşmesi:")}
                              </p>
                              <p className="bg-[oklch(0.60_0.18_42)/10] border border-[oklch(0.60_0.18_42)] text-[oklch(0.60_0.18_42)] px-2 py-1 font-mono font-bold rounded">
                                {result.matchedValue}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      <p className="text-[var(--vaden-text-muted)] text-sm font-['Inter'] mb-3 line-clamp-2">
                        {result.product.description}
                      </p>

                      {/* OEM Codes Preview */}
                      {result.product.oemCodes.length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs text-[oklch(0.45_0.01_250)] mb-1">
                            {asString(metadata.oemCodesLabel, "OEM Kodları:")}
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {result.product.oemCodes.slice(0, 2).map((oemGroup) => (
                              <span
                                key={oemGroup.manufacturer}
                                className="text-xs bg-[oklch(0.60_0.18_42)/10] border border-[oklch(0.60_0.18_42)] text-[oklch(0.60_0.18_42)] px-2 py-0.5 rounded"
                              >
                                {oemGroup.manufacturer}: {oemGroup.codes[0]}
                              </span>
                            ))}
                            {result.product.oemCodes.length > 2 && (
                              <span className="text-xs text-[oklch(0.45_0.01_250)] px-2 py-0.5">
                                +{result.product.oemCodes.length - 2} {asString(metadata.moreSuffix, "daha")}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-2 text-[oklch(0.60_0.18_42)] font-['Barlow_Condensed'] font-bold text-sm tracking-wide uppercase group-hover:gap-4 transition-all">
                        {asString(metadata.detailLinkText, "Detayları Gör")} <ChevronRight size={14} />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
