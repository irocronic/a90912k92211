/*
  VADEN ORIGINAL - Search Results Page
  Design: Industrial Precision - Display search results with filters
*/

import { useLocation } from "wouter";
import { ChevronRight, AlertCircle, Loader2 } from "lucide-react";
import { useState, useMemo, useEffect, type RefObject } from "react";
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
  subcategoryTitle: string;
  manufacturerTitle: string;
  allCategoriesText: string;
  allSubcategoriesText: string;
  allManufacturersText: string;
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

export default function SearchResults() {
  const [location, navigate] = useLocation();
  const { language } = useI18n();
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
  const sortLocale = language === "en" ? "en-US" : "tr-TR";

  const query = useMemo(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      return params.get("q") || "";
    }
    return "";
  }, [location]);

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [selectedManufacturer, setSelectedManufacturer] = useState<string | null>(
    null,
  );
  const [sortBy, setSortBy] = useState<"relevance" | "name">("relevance");
  const [searchQuery, setSearchQuery] = useState(query);

  useEffect(() => {
    setSearchQuery(query);
  }, [query]);

  useEffect(() => {
    setSelectedCategory(null);
    setSelectedSubcategory(null);
    setSelectedManufacturer(null);
    setSortBy("relevance");
  }, [searchQuery]);

  const searchInput = useMemo(
    () => ({
      query: searchQuery.trim(),
      category: selectedCategory || undefined,
      subcategory: selectedSubcategory || undefined,
      manufacturer: selectedManufacturer || undefined,
      sortBy,
      page: 1,
      pageSize: 120,
    }),
    [
      searchQuery,
      selectedCategory,
      selectedSubcategory,
      selectedManufacturer,
      sortBy,
    ],
  );

  const searchEnabled = searchInput.query.length > 0;

  const { data: searchData, isLoading } = trpc.content.products.search.useQuery(
    searchInput,
    {
      enabled: searchEnabled,
      refetchOnWindowFocus: false,
    },
  );

  const results = useMemo(
    () =>
      (searchData?.items ?? []).map((item) => {
        const base = toDisplayProduct(item.product);
        return {
          ...item,
          rawCategory: item.product.category,
          rawSubcategory: item.product.subcategory || "",
          product: localizeDisplayProduct(
            base,
            language,
            enProductTranslations[getProductTranslationKey(item.product.id)],
            taxonomy,
          ),
        };
      }),
    [searchData, language, enProductTranslations, taxonomy],
  );

  const categoryFacets = searchData?.facets.categories ?? [];
  const manufacturerFacets = searchData?.facets.manufacturers ?? [];

  const categoryLabelMap = useMemo(() => {
    const map = new Map<string, string>();
    results.forEach((item) => {
      if (!map.has(item.rawCategory)) {
        map.set(item.rawCategory, item.product.category);
      }
    });
    return map;
  }, [results]);

  const subcategoryLabelMap = useMemo(() => {
    const map = new Map<string, string>();
    results.forEach((item) => {
      if (!item.rawSubcategory) return;
      const key = `${item.rawCategory}::${item.rawSubcategory}`;
      if (!map.has(key)) {
        map.set(key, item.product.subcategory || item.rawSubcategory);
      }
    });
    return map;
  }, [results]);

  const subcategoryFacets = useMemo(() => {
    const all = searchData?.facets.subcategories ?? [];
    if (!selectedCategory) return all;
    return all.filter((item) => item.category === selectedCategory);
  }, [searchData, selectedCategory]);

  const totalResults = searchData?.total ?? results.length;

  const { ref, isVisible } = useIntersectionObserver({ threshold: 0.1 });

  return (
    <div className="min-h-screen bg-[var(--vaden-surface-10)]">
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
              {totalResults}
            </span>{" "}
            {asString(metadata.queryResultSuffix, "ürün bulundu")}
          </p>
        </div>

        {!searchEnabled ? (
          <div className="bg-[var(--vaden-surface-14)] border border-[var(--vaden-border)] p-12 text-center">
            <AlertCircle size={48} className="mx-auto text-[oklch(0.60_0.18_42)] mb-4" />
            <h2 className="font-['Barlow_Condensed'] font-bold text-[var(--vaden-on-surface)] text-2xl uppercase mb-2">
              {asString(metadata.noResultsTitle, "Arama Terimi Gerekli")}
            </h2>
            <p className="text-[var(--vaden-text-muted)] mb-6 font-['Inter']">
              OEM kodu, ürün adı veya kategori ile arama yapabilirsiniz.
            </p>
          </div>
        ) : isLoading ? (
          <div className="py-12 flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-[oklch(0.60_0.18_42)]" />
          </div>
        ) : results.length === 0 ? (
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
            <div className="lg:col-span-1">
              <div className="bg-[var(--vaden-surface-14)] border border-[var(--vaden-border)] p-6 sticky top-20 space-y-6">
                <h3 className="font-['Barlow_Condensed'] font-bold text-[var(--vaden-on-surface)] text-lg uppercase tracking-wide">
                  {asString(metadata.filtersTitle, "Filtreler")}
                </h3>

                <div>
                  <p className="text-[oklch(0.60_0.18_42)] font-['Barlow_Condensed'] font-bold text-xs uppercase tracking-wide mb-3">
                    {asString(metadata.categoryTitle, "Kategori")}
                  </p>
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        setSelectedCategory(null);
                        setSelectedSubcategory(null);
                      }}
                      className={`block w-full text-left px-3 py-2 text-sm transition-colors ${
                        selectedCategory === null
                          ? "bg-[oklch(0.60_0.18_42)] text-[var(--vaden-on-accent)] font-bold"
                          : "text-[var(--vaden-text-muted)] hover:text-[oklch(0.60_0.18_42)]"
                      }`}
                    >
                      {asString(metadata.allCategoriesText, "Tümü")}
                    </button>
                    {categoryFacets.map((category) => (
                      <button
                        key={category.value}
                        onClick={() => {
                          setSelectedCategory(category.value);
                          setSelectedSubcategory(null);
                        }}
                        className={`block w-full text-left px-3 py-2 text-sm transition-colors ${
                          selectedCategory === category.value
                            ? "bg-[oklch(0.60_0.18_42)] text-[var(--vaden-on-accent)] font-bold"
                            : "text-[var(--vaden-text-muted)] hover:text-[oklch(0.60_0.18_42)]"
                        }`}
                      >
                        {categoryLabelMap.get(category.value) || category.value} ({category.count})
                      </button>
                    ))}
                  </div>
                </div>

                {subcategoryFacets.length > 0 ? (
                  <div>
                    <p className="text-[oklch(0.60_0.18_42)] font-['Barlow_Condensed'] font-bold text-xs uppercase tracking-wide mb-3">
                      {asString(metadata.subcategoryTitle, "Alt Kategori")}
                    </p>
                    <div className="space-y-2">
                      <button
                        onClick={() => setSelectedSubcategory(null)}
                        className={`block w-full text-left px-3 py-2 text-sm transition-colors ${
                          selectedSubcategory === null
                            ? "bg-[oklch(0.60_0.18_42)] text-[var(--vaden-on-accent)] font-bold"
                            : "text-[var(--vaden-text-muted)] hover:text-[oklch(0.60_0.18_42)]"
                        }`}
                      >
                        {asString(metadata.allSubcategoriesText, "Tümü")}
                      </button>
                      {subcategoryFacets.map((subcategory) => (
                        <button
                          key={`${subcategory.category}-${subcategory.value}`}
                          onClick={() => {
                            setSelectedCategory(subcategory.category);
                            setSelectedSubcategory(subcategory.value);
                          }}
                          className={`block w-full text-left px-3 py-2 text-sm transition-colors ${
                            selectedSubcategory === subcategory.value
                              ? "bg-[oklch(0.60_0.18_42)] text-[var(--vaden-on-accent)] font-bold"
                              : "text-[var(--vaden-text-muted)] hover:text-[oklch(0.60_0.18_42)]"
                          }`}
                        >
                          {subcategoryLabelMap.get(
                            `${subcategory.category}::${subcategory.value}`,
                          ) || subcategory.value} ({subcategory.count})
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                {manufacturerFacets.length > 0 ? (
                  <div>
                    <p className="text-[oklch(0.60_0.18_42)] font-['Barlow_Condensed'] font-bold text-xs uppercase tracking-wide mb-3">
                      {asString(metadata.manufacturerTitle, "OEM Üretici")}
                    </p>
                    <div className="space-y-2">
                      <button
                        onClick={() => setSelectedManufacturer(null)}
                        className={`block w-full text-left px-3 py-2 text-sm transition-colors ${
                          selectedManufacturer === null
                            ? "bg-[oklch(0.60_0.18_42)] text-[var(--vaden-on-accent)] font-bold"
                            : "text-[var(--vaden-text-muted)] hover:text-[oklch(0.60_0.18_42)]"
                        }`}
                      >
                        {asString(metadata.allManufacturersText, "Tümü")}
                      </button>
                      {manufacturerFacets.map((manufacturer) => (
                        <button
                          key={manufacturer.value}
                          onClick={() => setSelectedManufacturer(manufacturer.value)}
                          className={`block w-full text-left px-3 py-2 text-sm transition-colors ${
                            selectedManufacturer === manufacturer.value
                              ? "bg-[oklch(0.60_0.18_42)] text-[var(--vaden-on-accent)] font-bold"
                              : "text-[var(--vaden-text-muted)] hover:text-[oklch(0.60_0.18_42)]"
                          }`}
                        >
                          {manufacturer.value} ({manufacturer.count})
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

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

            <div
              ref={ref as RefObject<HTMLDivElement>}
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
                    <div className="w-32 h-32 flex-shrink-0 bg-[var(--vaden-surface-10)] border border-[var(--vaden-border-soft)] overflow-hidden">
                      <img
                        src={result.product.image}
                        alt={result.product.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    </div>

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
