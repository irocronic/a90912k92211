import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import {
  ArrowRight,
  Boxes,
  ChevronRight,
  Clock3,
  Factory,
  Filter,
  Hash,
  Loader2,
  PackageSearch,
  Sparkles,
  X,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SearchAutocomplete from "@/components/SearchAutocomplete";
import { trpc } from "@/lib/trpc";
import {
  getProductCategoryLabel,
  toDisplayProduct,
  type DbProduct,
  type DisplayProduct,
} from "@/lib/contentProducts";
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
import { toAbsoluteUrl } from "@/lib/seo";
import type { AutocompleteSuggestion } from "@/lib/autocomplete";

type SortMode = "featured" | "name" | "recent";

type CatalogEntry = {
  raw: DbProduct;
  display: DisplayProduct;
  brand: string;
  oemCodeCount: number;
  manufacturerCount: number;
  discoveryScore: number;
  freshness: number;
  searchIndex: string;
};

type LocalizedCopy = {
  pageTitle: string;
  pageDescription: string;
  heroLabel: string;
  heroHeading: string;
  heroDescription: string;
  breadcrumbHome: string;
  breadcrumbCurrent: string;
  searchPanelTitle: string;
  searchPanelDescription: string;
  searchPlaceholder: string;
  searchButton: string;
  deepSearchButton: string;
  quickSuggestionsTitle: string;
  categoryPanelTitle: string;
  categoryPanelDescription: string;
  categorySearchPlaceholder: string;
  brandPanelTitle: string;
  brandPanelDescription: string;
  brandSearchPlaceholder: string;
  activeFiltersTitle: string;
  clearFilters: string;
  filtersEmpty: string;
  sortFeatured: string;
  sortName: string;
  sortRecent: string;
  recommendationTitle: string;
  recommendationSubtitle: string;
  recentTitle: string;
  recentSubtitle: string;
  catalogTitle: string;
  catalogSubtitle: string;
  detailText: string;
  productsText: string;
  categoriesMetric: string;
  brandsMetric: string;
  oemMetric: string;
  oemCodesLabel: string;
  manufacturersLabel: string;
  brandLabel: string;
  codeLabel: string;
  pageLabel: string;
  pagePrevious: string;
  pageNext: string;
  pageRangeText: string;
  noResultsTitle: string;
  noResultsDescription: string;
  removeFilterText: string;
};

const PRODUCTS_PER_PAGE = 25;

const copyByLanguage: Record<"tr" | "en" | "ar", LocalizedCopy> = {
  tr: {
    pageTitle: "BRAC Tam Katalog",
    pageDescription: "BRAC tüm ürünleri, OEM arama ve akıllı filtrelerle tek ekranda inceleyin.",
    heroLabel: "Tam Katalog",
    heroHeading: "Tüm Ürünlerde Hızlı Erişim",
    heroDescription:
      "OEM kodu, ürün grubu, marka ve katalog sinyalleriyle ihtiyacınız olan parçaya daha hızlı ulaşın. Bu ekran gezmek için değil, doğru ürünü hızla daraltmak için tasarlandı.",
    breadcrumbHome: "Ana Sayfa",
    breadcrumbCurrent: "Tam Katalog",
    searchPanelTitle: "Hızlı OEM Kodu Arama",
    searchPanelDescription:
      "OEM kodu, ürün adı, kategori veya marka yazın. İsterseniz bu ekranda filtreleyin, isterseniz detaylı sonuç sayfasına gidin.",
    searchPlaceholder: "oem no, ürün adı, marka, model",
    searchButton: "Katalogda Filtrele",
    deepSearchButton: "Detaylı OEM Sonucu",
    quickSuggestionsTitle: "Hızlı Öneriler",
    categoryPanelTitle: "Ürün Grubu Seç",
    categoryPanelDescription:
      "Kategoriye göre kataloğu hızlıca daraltın. Yoğun ürün grupları önce gösterilir.",
    categorySearchPlaceholder: "Kategori ara...",
    brandPanelTitle: "Markalar",
    brandPanelDescription:
      "Marka veya OEM üreticisine göre seçim yapın. Seçim anında ürün listesini günceller.",
    brandSearchPlaceholder: "Marka ara...",
    activeFiltersTitle: "Aktif Akış",
    clearFilters: "Temizle",
    filtersEmpty: "Henüz filtre seçilmedi. OEM araması, kategori veya marka ile başlayabilirsiniz.",
    sortFeatured: "Önerilen",
    sortName: "İsme Göre",
    sortRecent: "Yeniye Göre",
    recommendationTitle: "Akıllı Ürün Önerileri",
    recommendationSubtitle:
      "Seçtiğiniz akışa göre OEM eşleşmesi güçlü ve katalog sinyali zengin ürünler öne çıkarılıyor.",
    recentTitle: "Yeni Eklenenler",
    recentSubtitle: "Son güncellenen ürünleri hızlıca inceleyin.",
    catalogTitle: "Katalog Sonuçları",
    catalogSubtitle: "Filtrelenmiş ürünler canlı olarak aşağıda güncellenir.",
    detailText: "Ürünü İncele",
    productsText: "ürün",
    categoriesMetric: "kategori",
    brandsMetric: "marka",
    oemMetric: "OEM kodu",
    oemCodesLabel: "OEM",
    manufacturersLabel: "Üretici",
    brandLabel: "Marka",
    codeLabel: "Kod",
    pageLabel: "Sayfa",
    pagePrevious: "Önceki",
    pageNext: "Sonraki",
    pageRangeText: "{start}-{end} / {total} ürün",
    noResultsTitle: "Bu filtrelerde ürün bulunamadı",
    noResultsDescription:
      "Aramayı sadeleştirin ya da kategori ve marka seçimlerini temizleyin. İsterseniz detaylı OEM arama sayfasına da geçebilirsiniz.",
    removeFilterText: "kaldır",
  },
  en: {
    pageTitle: "BRAC Full Catalog",
    pageDescription: "Explore all BRAC products with OEM search and smart filters in one screen.",
    heroLabel: "Full Catalog",
    heroHeading: "Fast Access Across The Full Catalog",
    heroDescription:
      "Reach the right spare part faster with OEM code, product group, brand and catalog signals. This page is designed to narrow products down quickly, not just browse.",
    breadcrumbHome: "Home",
    breadcrumbCurrent: "Full Catalog",
    searchPanelTitle: "Fast OEM Code Search",
    searchPanelDescription:
      "Type an OEM code, product name, category or brand. Filter on this page or jump to the deeper results page.",
    searchPlaceholder: "oem no, product name, brand, model",
    searchButton: "Filter Catalog",
    deepSearchButton: "Detailed OEM Results",
    quickSuggestionsTitle: "Quick Suggestions",
    categoryPanelTitle: "Choose Product Group",
    categoryPanelDescription:
      "Narrow the catalog quickly by category. Dense product groups are shown first.",
    categorySearchPlaceholder: "Search category...",
    brandPanelTitle: "Brands",
    brandPanelDescription:
      "Filter by brand or OEM manufacturer. The product list updates instantly.",
    brandSearchPlaceholder: "Search brand...",
    activeFiltersTitle: "Active Flow",
    clearFilters: "Clear",
    filtersEmpty: "No filters selected yet. Start with OEM search, category or brand.",
    sortFeatured: "Recommended",
    sortName: "By Name",
    sortRecent: "Newest",
    recommendationTitle: "Smart Product Recommendations",
    recommendationSubtitle:
      "Products with strong OEM matching and richer catalog signals are surfaced for the current flow.",
    recentTitle: "Recently Added",
    recentSubtitle: "Review the most recently updated items quickly.",
    catalogTitle: "Catalog Results",
    catalogSubtitle: "Filtered products update live below.",
    detailText: "View Product",
    productsText: "products",
    categoriesMetric: "categories",
    brandsMetric: "brands",
    oemMetric: "OEM codes",
    oemCodesLabel: "OEM",
    manufacturersLabel: "Manufacturer",
    brandLabel: "Brand",
    codeLabel: "Code",
    pageLabel: "Page",
    pagePrevious: "Previous",
    pageNext: "Next",
    pageRangeText: "{start}-{end} of {total} products",
    noResultsTitle: "No products match these filters",
    noResultsDescription:
      "Simplify the query or clear category and brand selections. You can also switch to the detailed OEM results page.",
    removeFilterText: "remove",
  },
  ar: {
    pageTitle: "كتالوج BRAC الكامل",
    pageDescription: "استعرض جميع منتجات BRAC مع بحث OEM وفلاتر ذكية في شاشة واحدة.",
    heroLabel: "الكتالوج الكامل",
    heroHeading: "وصول أسرع إلى جميع المنتجات",
    heroDescription:
      "اعثر على القطعة المناسبة بشكل أسرع عبر رقم OEM أو مجموعة المنتج أو العلامة التجارية أو إشارات الكتالوج. هذه الصفحة مصممة لتضييق النتائج بسرعة لا للتصفح فقط.",
    breadcrumbHome: "الرئيسية",
    breadcrumbCurrent: "الكتالوج الكامل",
    searchPanelTitle: "بحث سريع برقم OEM",
    searchPanelDescription:
      "اكتب رقم OEM أو اسم المنتج أو الفئة أو العلامة التجارية. يمكنك التصفية داخل هذه الصفحة أو الانتقال إلى صفحة النتائج التفصيلية.",
    searchPlaceholder: "رقم oem، اسم المنتج، العلامة، الموديل",
    searchButton: "تصفية الكتالوج",
    deepSearchButton: "نتائج OEM التفصيلية",
    quickSuggestionsTitle: "اقتراحات سريعة",
    categoryPanelTitle: "اختر مجموعة المنتج",
    categoryPanelDescription:
      "قلّص الكتالوج بسرعة حسب الفئة. يتم عرض المجموعات الأكثر كثافة أولاً.",
    categorySearchPlaceholder: "ابحث في الفئات...",
    brandPanelTitle: "العلامات التجارية",
    brandPanelDescription:
      "قم بالتصفية حسب العلامة أو الشركة المصنعة لـ OEM. يتم تحديث قائمة المنتجات فوراً.",
    brandSearchPlaceholder: "ابحث عن علامة...",
    activeFiltersTitle: "المسار النشط",
    clearFilters: "مسح",
    filtersEmpty: "لا توجد فلاتر مختارة بعد. ابدأ ببحث OEM أو الفئة أو العلامة التجارية.",
    sortFeatured: "الموصى به",
    sortName: "بالاسم",
    sortRecent: "الأحدث",
    recommendationTitle: "ترشيحات ذكية للمنتجات",
    recommendationSubtitle:
      "يتم إبراز المنتجات ذات مطابقة OEM الأقوى وإشارات الكتالوج الأغنى حسب المسار الحالي.",
    recentTitle: "المضافة حديثاً",
    recentSubtitle: "راجع العناصر الأحدث تحديثاً بسرعة.",
    catalogTitle: "نتائج الكتالوج",
    catalogSubtitle: "يتم تحديث المنتجات المفلترة مباشرة أدناه.",
    detailText: "عرض المنتج",
    productsText: "منتج",
    categoriesMetric: "فئات",
    brandsMetric: "علامات",
    oemMetric: "أكواد OEM",
    oemCodesLabel: "OEM",
    manufacturersLabel: "الشركة المصنعة",
    brandLabel: "العلامة",
    codeLabel: "الرمز",
    pageLabel: "الصفحة",
    pagePrevious: "السابق",
    pageNext: "التالي",
    pageRangeText: "{start}-{end} من {total} منتج",
    noResultsTitle: "لا توجد منتجات لهذه الفلاتر",
    noResultsDescription:
      "خفف عبارة البحث أو امسح الفئة والعلامة التجارية. ويمكنك أيضاً الانتقال إلى صفحة نتائج OEM التفصيلية.",
    removeFilterText: "إزالة",
  },
};

function normalizeFilterText(value: string): string {
  return value
    .toLowerCase()
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9\s]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function countOemCodes(product: DisplayProduct): number {
  return product.oemCodes.reduce((total, group) => total + group.codes.length, 0);
}

function getBrandLabel(product: DbProduct, display: DisplayProduct): string {
  const sourceBrand = product.sourceBrand?.trim();
  if (sourceBrand) return sourceBrand;
  const manufacturer = display.oemCodes[0]?.manufacturer?.trim();
  if (manufacturer) return manufacturer;
  return product.category;
}

function buildSearchIndex(product: DbProduct, display: DisplayProduct, brand: string): string {
  const oemCodes = display.oemCodes.flatMap((group) => [
    group.manufacturer,
    ...group.codes,
  ]);

  return normalizeFilterText(
    [
      product.title,
      product.subtitle,
      product.description,
      product.category,
      product.subcategory,
      product.sourceCode,
      product.sourceBrand,
      brand,
      ...oemCodes,
    ]
      .filter(Boolean)
      .join(" "),
  );
}

function buildPageRangeText(
  template: string,
  start: number,
  end: number,
  total: number,
  locale: string,
): string {
  return template
    .replace("{start}", start.toLocaleString(locale))
    .replace("{end}", end.toLocaleString(locale))
    .replace("{total}", total.toLocaleString(locale));
}

function getVisiblePageNumbers(currentPage: number, totalPages: number): number[] {
  const start = Math.max(1, currentPage - 2);
  const end = Math.min(totalPages, start + 4);
  const adjustedStart = Math.max(1, end - 4);
  return Array.from(
    { length: end - adjustedStart + 1 },
    (_, index) => adjustedStart + index,
  );
}

function ProductShowcaseCard({
  entry,
  copy,
}: {
  entry: CatalogEntry;
  copy: LocalizedCopy;
}) {
  return (
    <Link
      href={`/product/${entry.display.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-[28px] border border-[var(--brac-border)] bg-[var(--brac-surface-14)] shadow-[0_28px_80px_-52px_rgba(15,23,42,0.45)] transition-all duration-500 hover:-translate-y-1 hover:border-[oklch(0.60_0.18_42)]"
    >
      <div className="relative h-52 overflow-hidden">
        <img
          src={entry.display.image}
          alt={entry.display.title}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[rgba(8,15,25,0.92)] via-[rgba(8,15,25,0.35)] to-transparent" />
        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          <span className="rounded-full bg-[oklch(0.60_0.18_42)] px-3 py-1 font-['Barlow_Condensed'] text-xs font-bold uppercase tracking-[0.18em] text-[var(--brac-on-accent)]">
            {getProductCategoryLabel(entry.display)}
          </span>
          {entry.raw.sourceCode ? (
            <span className="rounded-full border border-white/25 bg-white/12 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
              {copy.codeLabel}: {entry.raw.sourceCode}
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="mb-4 flex flex-wrap gap-2 text-xs text-[var(--brac-text-muted)]">
          <span className="rounded-full border border-[var(--brac-border-soft)] px-3 py-1">
            {copy.brandLabel}: {entry.brand}
          </span>
          <span className="rounded-full border border-[var(--brac-border-soft)] px-3 py-1">
            {entry.oemCodeCount} {copy.oemCodesLabel}
          </span>
          <span className="rounded-full border border-[var(--brac-border-soft)] px-3 py-1">
            {entry.manufacturerCount} {copy.manufacturersLabel}
          </span>
        </div>

        <h2 className="font-['Barlow_Condensed'] text-3xl font-black uppercase leading-none text-[var(--brac-on-surface)]">
          {entry.display.title}
        </h2>
        <p className="mt-2 font-['Barlow_Condensed'] text-xl font-bold uppercase leading-tight text-[oklch(0.60_0.18_42)]">
          {entry.display.subtitle}
        </p>
        <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-[var(--brac-text-muted)]">
          {entry.display.description}
        </p>

        <div className="mt-auto flex items-center gap-2 pt-5 font-['Barlow_Condensed'] text-sm font-bold uppercase tracking-[0.14em] text-[oklch(0.60_0.18_42)] transition-all group-hover:gap-4">
          {copy.detailText}
          <ArrowRight size={15} />
        </div>
      </div>
    </Link>
  );
}

export default function ProductsCatalog() {
  const [, navigate] = useLocation();
  const { language } = useI18n();
  const copy = copyByLanguage[language];
  const numberLocale = language === "ar" ? "ar" : language === "en" ? "en-US" : "tr-TR";
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [categorySearch, setCategorySearch] = useState("");
  const [brandSearch, setBrandSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>("featured");
  const [currentPage, setCurrentPage] = useState(1);

  const initialCategoryFromUrl = useMemo(() => {
    if (typeof window === "undefined") return null;
    const params = new URLSearchParams(window.location.search);
    return params.get("category");
  }, []);

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
  const { data: suggestions = [] } = trpc.content.products.autocomplete.useQuery(
    { query: debouncedQuery, limit: 8 },
    { enabled: debouncedQuery.trim().length > 1 },
  );

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 180);
    return () => window.clearTimeout(timer);
  }, [query]);

  const taxonomy = useMemo(() => {
    const setting = publicSettings.find(
      (item) => item.key === PRODUCT_TAXONOMY_SETTING_KEY,
    );
    return parseProductTaxonomy(setting?.parsedValue);
  }, [publicSettings]);

  const entries = useMemo<CatalogEntry[]>(() => {
    return products.map((product) => {
      const base = toDisplayProduct(product);
      const display = localizeDisplayProduct(
        base,
        language,
        productTranslations[getProductTranslationKey(product.id)],
        taxonomy,
      );
      const brand = getBrandLabel(product, display);
      const oemCodeCount = countOemCodes(display);
      const manufacturerCount = display.oemCodes.length;
      const discoveryScore =
        oemCodeCount * 6 +
        manufacturerCount * 4 +
        display.features.length * 2 +
        display.applications.length +
        display.certifications.length;
      const freshness = new Date(product.updatedAt).getTime();

      return {
        raw: product,
        display,
        brand,
        oemCodeCount,
        manufacturerCount,
        discoveryScore,
        freshness,
        searchIndex: buildSearchIndex(product, display, brand),
      };
    });
  }, [products, language, productTranslations, taxonomy]);

  const categoryOptions = useMemo(() => {
    const map = new Map<string, { label: string; count: number }>();
    entries.forEach((entry) => {
      const current = map.get(entry.raw.category);
      if (current) {
        current.count += 1;
      } else {
        map.set(entry.raw.category, {
          label: entry.display.category,
          count: 1,
        });
      }
    });

    const searchValue = normalizeFilterText(categorySearch);

    return Array.from(map.entries())
      .map(([value, meta]) => ({ value, ...meta }))
      .filter((item) =>
        searchValue
          ? normalizeFilterText(`${item.value} ${item.label}`).includes(searchValue)
          : true,
      )
      .sort((left, right) => {
        if (right.count !== left.count) return right.count - left.count;
        return left.label.localeCompare(right.label, language === "ar" ? "ar" : "tr");
      });
  }, [entries, categorySearch, language]);

  useEffect(() => {
    if (!initialCategoryFromUrl || categoryOptions.length === 0) return;

    const matchingCategory = categoryOptions.find(
      (item) => item.value === initialCategoryFromUrl || item.label === initialCategoryFromUrl,
    );

    if (matchingCategory) {
      setSelectedCategory((current) => current ?? matchingCategory.value);
    }
  }, [categoryOptions, initialCategoryFromUrl]);

  const brandOptions = useMemo(() => {
    const map = new Map<string, number>();
    entries.forEach((entry) => {
      map.set(entry.brand, (map.get(entry.brand) ?? 0) + 1);
    });

    const searchValue = normalizeFilterText(brandSearch);

    return Array.from(map.entries())
      .map(([value, count]) => ({ value, count }))
      .filter((item) =>
        searchValue ? normalizeFilterText(item.value).includes(searchValue) : true,
      )
      .sort((left, right) => {
        if (right.count !== left.count) return right.count - left.count;
        return left.value.localeCompare(right.value, language === "ar" ? "ar" : "tr");
      });
  }, [entries, brandSearch, language]);

  const quickSuggestions = useMemo(() => {
    const fromAutocomplete = suggestions.slice(0, 4);
    if (fromAutocomplete.length > 0) return fromAutocomplete;

    return entries.slice(0, 4).map<AutocompleteSuggestion>((entry) => ({
      id: `product-${entry.raw.id}`,
      label: `${entry.display.title} - ${entry.display.subtitle}`,
      type: "product",
      value: entry.raw.sourceCode || entry.display.title,
      icon: entry.brand,
    }));
  }, [entries, suggestions]);

  const filteredEntries = useMemo(() => {
    const normalizedQuery = normalizeFilterText(query);

    return entries.filter((entry) => {
      if (selectedCategory && entry.raw.category !== selectedCategory) return false;
      if (selectedBrand && entry.brand !== selectedBrand) return false;
      if (!normalizedQuery) return true;
      return entry.searchIndex.includes(normalizedQuery);
    });
  }, [entries, query, selectedCategory, selectedBrand]);

  const sortedEntries = useMemo(() => {
    const nextEntries = [...filteredEntries];

    if (sortMode === "name") {
      nextEntries.sort((left, right) =>
        left.display.title.localeCompare(
          right.display.title,
          language === "ar" ? "ar" : language === "en" ? "en-US" : "tr",
        ),
      );
      return nextEntries;
    }

    if (sortMode === "recent") {
      nextEntries.sort((left, right) => right.freshness - left.freshness);
      return nextEntries;
    }

    nextEntries.sort((left, right) => {
      if (right.discoveryScore !== left.discoveryScore) {
        return right.discoveryScore - left.discoveryScore;
      }
      return right.freshness - left.freshness;
    });
    return nextEntries;
  }, [filteredEntries, sortMode, language]);

  const recommendedEntries = useMemo(() => sortedEntries.slice(0, 4), [sortedEntries]);
  const recentEntries = useMemo(
    () => [...filteredEntries].sort((left, right) => right.freshness - left.freshness).slice(0, 4),
    [filteredEntries],
  );
  const totalPages = Math.max(1, Math.ceil(sortedEntries.length / PRODUCTS_PER_PAGE));
  const paginatedEntries = useMemo(() => {
    const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
    return sortedEntries.slice(startIndex, startIndex + PRODUCTS_PER_PAGE);
  }, [sortedEntries, currentPage]);
  const pageNumbers = useMemo(
    () => getVisiblePageNumbers(currentPage, totalPages),
    [currentPage, totalPages],
  );
  const pageStart = sortedEntries.length === 0 ? 0 : (currentPage - 1) * PRODUCTS_PER_PAGE + 1;
  const pageEnd = Math.min(currentPage * PRODUCTS_PER_PAGE, sortedEntries.length);

  const totalOemCodes = useMemo(
    () => entries.reduce((sum, entry) => sum + entry.oemCodeCount, 0),
    [entries],
  );
  const canonicalUrl = toAbsoluteUrl("/products");

  const hasActiveFilters = Boolean(query.trim() || selectedCategory || selectedBrand);

  useEffect(() => {
    setCurrentPage(1);
  }, [query, selectedCategory, selectedBrand, sortMode]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const clearFilters = () => {
    setQuery("");
    setDebouncedQuery("");
    setCategorySearch("");
    setBrandSearch("");
    setSelectedCategory(null);
    setSelectedBrand(null);
    setSortMode("featured");
    setCurrentPage(1);
  };

  const scrollToCatalogResults = () => {
    if (typeof window !== "undefined") {
      window.requestAnimationFrame(() => {
        document
          .getElementById("catalog-results")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  };

  const handleCatalogSearch = (searchValue: string) => {
    setQuery(searchValue.trim());
    scrollToCatalogResults();
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    scrollToCatalogResults();
  };

  return (
    <div className="min-h-screen bg-[var(--brac-surface-10)]">
      <Helmet>
        <title>{copy.pageTitle}</title>
        <meta name="description" content={copy.pageDescription} />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={copy.pageTitle} />
        <meta property="og:description" content={copy.pageDescription} />
        <meta property="og:url" content={canonicalUrl} />
      </Helmet>

      <Navbar />

      <div className="bg-[linear-gradient(180deg,var(--brac-surface-09)_0%,var(--brac-surface-10)_100%)] pt-[80px] lg:pt-[113px]">
        <div className="container mx-auto max-w-7xl px-6 py-6">
          <div className="flex items-center gap-2 text-sm">
            <button
              onClick={() => navigate("/")}
              className="text-[oklch(0.60_0.18_42)] transition-colors hover:text-[oklch(0.70_0.18_42)]"
            >
              {copy.breadcrumbHome}
            </button>
            <ChevronRight size={16} className="text-[oklch(0.40_0.01_250)]" />
            <span className="text-[var(--brac-text-muted)]">{copy.breadcrumbCurrent}</span>
          </div>
        </div>

        <div className="container mx-auto grid max-w-7xl gap-8 px-6 pb-14 pt-4 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="max-w-3xl">
            <div className="mb-4 flex items-center gap-3">
              <span className="h-0.5 w-10 bg-[oklch(0.60_0.18_42)]"></span>
              <span className="font-['Barlow_Condensed'] text-sm font-bold uppercase tracking-[0.2em] text-[oklch(0.60_0.18_42)]">
                {copy.heroLabel}
              </span>
            </div>
            <h1 className="font-['Barlow_Condensed'] text-5xl font-black uppercase leading-none text-[var(--brac-on-surface)] md:text-6xl">
              {copy.heroHeading}
            </h1>
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-[var(--brac-text-muted)]">
              {copy.heroDescription}
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="rounded-[24px] border border-[var(--brac-border)] bg-[var(--brac-surface-14)] p-5 shadow-[0_24px_60px_-48px_rgba(15,23,42,0.45)]">
                <div className="mb-3 flex items-center gap-2 text-[oklch(0.60_0.18_42)]">
                  <Boxes size={16} />
                  <span className="font-['Barlow_Condensed'] text-xs font-bold uppercase tracking-[0.18em]">
                    BRAC
                  </span>
                </div>
                <div className="font-['Barlow_Condensed'] text-4xl font-black text-[var(--brac-on-surface)]">
                  {entries.length}
                </div>
                <p className="mt-1 text-sm text-[var(--brac-text-muted)]">
                  {copy.productsText}
                </p>
              </div>

              <div className="rounded-[24px] border border-[var(--brac-border)] bg-[var(--brac-surface-14)] p-5 shadow-[0_24px_60px_-48px_rgba(15,23,42,0.45)]">
                <div className="mb-3 flex items-center gap-2 text-[oklch(0.60_0.18_42)]">
                  <Filter size={16} />
                  <span className="font-['Barlow_Condensed'] text-xs font-bold uppercase tracking-[0.18em]">
                    Filter
                  </span>
                </div>
                <div className="font-['Barlow_Condensed'] text-4xl font-black text-[var(--brac-on-surface)]">
                  {categoryOptions.length}
                </div>
                <p className="mt-1 text-sm text-[var(--brac-text-muted)]">
                  {copy.categoriesMetric}
                </p>
              </div>

              <div className="rounded-[24px] border border-[var(--brac-border)] bg-[var(--brac-surface-14)] p-5 shadow-[0_24px_60px_-48px_rgba(15,23,42,0.45)]">
                <div className="mb-3 flex items-center gap-2 text-[oklch(0.60_0.18_42)]">
                  <Hash size={16} />
                  <span className="font-['Barlow_Condensed'] text-xs font-bold uppercase tracking-[0.18em]">
                    OEM
                  </span>
                </div>
                <div className="font-['Barlow_Condensed'] text-4xl font-black text-[var(--brac-on-surface)]">
                  {totalOemCodes}
                </div>
                <p className="mt-1 text-sm text-[var(--brac-text-muted)]">
                  {copy.oemMetric}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[32px] border border-[var(--brac-border)] bg-[linear-gradient(180deg,var(--brac-surface-14)_0%,var(--brac-surface-12)_100%)] p-6 shadow-[0_36px_90px_-55px_rgba(15,23,42,0.5)]">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="font-['Barlow_Condensed'] text-sm font-bold uppercase tracking-[0.18em] text-[oklch(0.60_0.18_42)]">
                  BRAC OEM
                </p>
                <h2 className="mt-2 font-['Barlow_Condensed'] text-4xl font-black uppercase leading-none text-[var(--brac-on-surface)]">
                  {copy.searchPanelTitle}
                </h2>
              </div>
              <div className="rounded-full border border-[var(--brac-border-soft)] bg-[var(--brac-surface-10)] px-4 py-2 text-xs text-[var(--brac-text-muted)]">
                {brandOptions.length} {copy.brandsMetric}
              </div>
            </div>

            <p className="mb-5 max-w-xl text-sm leading-relaxed text-[var(--brac-text-muted)]">
              {copy.searchPanelDescription}
            </p>

            <div className="flex flex-col gap-3 lg:flex-row">
              <SearchAutocomplete
                suggestions={suggestions}
                value={query}
                onChange={setQuery}
                onSelect={() => undefined}
                onSearch={handleCatalogSearch}
                placeholder={copy.searchPlaceholder}
                labels={{
                  oem: "OEM",
                  product: language === "ar" ? "المنتجات" : language === "en" ? "Products" : "Ürünler",
                  category: language === "ar" ? "الفئات" : language === "en" ? "Categories" : "Kategoriler",
                }}
              />
              <button
                onClick={() => handleCatalogSearch(query)}
                className="inline-flex min-w-[210px] items-center justify-center gap-2 rounded-[20px] bg-[oklch(0.60_0.18_42)] px-6 py-3.5 font-['Barlow_Condensed'] text-sm font-bold uppercase tracking-[0.16em] text-[var(--brac-on-accent)] transition-colors hover:bg-[oklch(0.50_0.18_42)]"
              >
                {copy.searchButton}
                <ArrowRight size={16} />
              </button>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                onClick={() =>
                  query.trim()
                    ? navigate(`/search?q=${encodeURIComponent(query.trim())}`)
                    : navigate("/search")
                }
                className="inline-flex items-center gap-2 rounded-full border border-[var(--brac-border)] bg-[var(--brac-surface-10)] px-4 py-2 text-sm font-semibold text-[var(--brac-on-surface)] transition-colors hover:border-[oklch(0.60_0.18_42)] hover:text-[oklch(0.60_0.18_42)]"
              >
                <PackageSearch size={15} />
                {copy.deepSearchButton}
              </button>
              <span className="text-xs text-[var(--brac-text-muted)]">
                {copy.quickSuggestionsTitle}
              </span>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              {quickSuggestions.map((suggestion) => (
                <button
                  key={suggestion.id}
                  onClick={() => handleCatalogSearch(suggestion.value)}
                  className="rounded-full border border-[var(--brac-border)] bg-[var(--brac-surface-10)] px-4 py-2 text-sm text-[var(--brac-on-surface)] transition-all hover:-translate-y-0.5 hover:border-[oklch(0.60_0.18_42)] hover:text-[oklch(0.60_0.18_42)]"
                >
                  {suggestion.value}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-7xl px-6 py-12">
        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <section className="rounded-[30px] border border-[var(--brac-border)] bg-[var(--brac-surface-14)] p-6 shadow-[0_30px_90px_-60px_rgba(15,23,42,0.45)]">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[oklch(0.60_0.18_42)/0.16] text-[oklch(0.60_0.18_42)]">
                <Boxes size={18} />
              </div>
              <div>
                <h2 className="font-['Barlow_Condensed'] text-4xl font-black uppercase leading-none text-[var(--brac-on-surface)]">
                  {copy.categoryPanelTitle}
                </h2>
                <p className="mt-1 text-sm text-[var(--brac-text-muted)]">
                  {copy.categoryPanelDescription}
                </p>
              </div>
            </div>

            <input
              type="text"
              value={categorySearch}
              onChange={(event) => setCategorySearch(event.target.value)}
              placeholder={copy.categorySearchPlaceholder}
              className="mb-5 w-full rounded-[20px] border border-[var(--brac-border)] bg-[var(--brac-surface-10)] px-5 py-3.5 text-sm text-[var(--brac-on-surface)] outline-none transition-colors placeholder:text-[var(--brac-text-placeholder)] focus:border-[oklch(0.60_0.18_42)]"
            />

            <div className="grid gap-3 sm:grid-cols-2">
              {categoryOptions.slice(0, 10).map((category) => {
                const active = selectedCategory === category.value;
                return (
                  <button
                    key={category.value}
                    onClick={() =>
                      setSelectedCategory(active ? null : category.value)
                    }
                    className={`rounded-[22px] border px-4 py-4 text-left transition-all ${
                      active
                        ? "border-[oklch(0.60_0.18_42)] bg-[oklch(0.60_0.18_42)]/10"
                        : "border-[var(--brac-border)] bg-[var(--brac-surface-10)] hover:border-[oklch(0.60_0.18_42)]"
                    }`}
                  >
                    <div className="font-['Barlow_Condensed'] text-2xl font-black uppercase leading-none text-[var(--brac-on-surface)]">
                      {category.label}
                    </div>
                    <div className="mt-2 text-sm text-[var(--brac-text-muted)]">
                      {category.count} {copy.productsText}
                    </div>
                  </button>
                );
              })}
            </div>

            <button
              onClick={scrollToCatalogResults}
              className="mt-5 inline-flex min-w-[210px] items-center justify-center gap-2 rounded-[20px] bg-[oklch(0.60_0.18_42)] px-6 py-3.5 font-['Barlow_Condensed'] text-sm font-bold uppercase tracking-[0.16em] text-[var(--brac-on-accent)] transition-colors hover:bg-[oklch(0.50_0.18_42)]"
            >
              {copy.searchButton}
              <ArrowRight size={16} />
            </button>
          </section>

          <section className="rounded-[30px] border border-[var(--brac-border)] bg-[var(--brac-surface-14)] p-6 shadow-[0_30px_90px_-60px_rgba(15,23,42,0.45)]">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[oklch(0.60_0.18_42)/0.16] text-[oklch(0.60_0.18_42)]">
                <Factory size={18} />
              </div>
              <div>
                <h2 className="font-['Barlow_Condensed'] text-4xl font-black uppercase leading-none text-[var(--brac-on-surface)]">
                  {copy.brandPanelTitle}
                </h2>
                <p className="mt-1 text-sm text-[var(--brac-text-muted)]">
                  {copy.brandPanelDescription}
                </p>
              </div>
            </div>

            <input
              type="text"
              value={brandSearch}
              onChange={(event) => setBrandSearch(event.target.value)}
              placeholder={copy.brandSearchPlaceholder}
              className="mb-5 w-full rounded-[20px] border border-[var(--brac-border)] bg-[var(--brac-surface-10)] px-5 py-3.5 text-sm text-[var(--brac-on-surface)] outline-none transition-colors placeholder:text-[var(--brac-text-placeholder)] focus:border-[oklch(0.60_0.18_42)]"
            />

            <div className="grid max-h-[420px] gap-3 overflow-y-auto pr-1 sm:grid-cols-2">
              {brandOptions.slice(0, 24).map((brand) => {
                const active = selectedBrand === brand.value;
                return (
                  <button
                    key={brand.value}
                    onClick={() => setSelectedBrand(active ? null : brand.value)}
                    className={`flex items-center justify-between rounded-[22px] border px-4 py-4 text-left transition-all ${
                      active
                        ? "border-[oklch(0.60_0.18_42)] bg-[oklch(0.60_0.18_42)]/10"
                        : "border-[var(--brac-border)] bg-[var(--brac-surface-10)] hover:border-[oklch(0.60_0.18_42)]"
                    }`}
                  >
                    <span className="font-semibold text-[var(--brac-on-surface)]">
                      {brand.value}
                    </span>
                    <span className="rounded-full bg-[var(--brac-surface-14)] px-3 py-1 text-xs text-[var(--brac-text-muted)]">
                      {brand.count}
                    </span>
                  </button>
                );
              })}
            </div>

            <button
              onClick={scrollToCatalogResults}
              className="mt-5 inline-flex min-w-[210px] items-center justify-center gap-2 rounded-[20px] bg-[oklch(0.60_0.18_42)] px-6 py-3.5 font-['Barlow_Condensed'] text-sm font-bold uppercase tracking-[0.16em] text-[var(--brac-on-accent)] transition-colors hover:bg-[oklch(0.50_0.18_42)]"
            >
              {copy.searchButton}
              <ArrowRight size={16} />
            </button>
          </section>
        </div>

        <section className="mt-6 rounded-[30px] border border-[var(--brac-border)] bg-[var(--brac-surface-14)] p-6 shadow-[0_30px_90px_-60px_rgba(15,23,42,0.45)]">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="font-['Barlow_Condensed'] text-sm font-bold uppercase tracking-[0.18em] text-[oklch(0.60_0.18_42)]">
                {copy.activeFiltersTitle}
              </p>
              <div className="mt-3 flex flex-wrap gap-3">
                {query.trim() ? (
                  <button
                    onClick={() => setQuery("")}
                    className="inline-flex items-center gap-2 rounded-full border border-[var(--brac-border)] bg-[var(--brac-surface-10)] px-4 py-2 text-sm text-[var(--brac-on-surface)]"
                  >
                    OEM: {query.trim()}
                    <X size={14} />
                  </button>
                ) : null}
                {selectedCategory ? (
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className="inline-flex items-center gap-2 rounded-full border border-[var(--brac-border)] bg-[var(--brac-surface-10)] px-4 py-2 text-sm text-[var(--brac-on-surface)]"
                  >
                    {categoryOptions.find((item) => item.value === selectedCategory)?.label ??
                      selectedCategory}
                    <X size={14} />
                  </button>
                ) : null}
                {selectedBrand ? (
                  <button
                    onClick={() => setSelectedBrand(null)}
                    className="inline-flex items-center gap-2 rounded-full border border-[var(--brac-border)] bg-[var(--brac-surface-10)] px-4 py-2 text-sm text-[var(--brac-on-surface)]"
                  >
                    {selectedBrand}
                    <X size={14} />
                  </button>
                ) : null}
                {!hasActiveFilters ? (
                  <span className="text-sm text-[var(--brac-text-muted)]">
                    {copy.filtersEmpty}
                  </span>
                ) : null}
              </div>
            </div>

            <div className="flex flex-col gap-4 xl:items-end">
              <div className="flex flex-wrap gap-2">
                {(["featured", "name", "recent"] as SortMode[]).map((mode) => {
                  const label =
                    mode === "featured"
                      ? copy.sortFeatured
                      : mode === "name"
                        ? copy.sortName
                        : copy.sortRecent;
                  const active = sortMode === mode;
                  return (
                    <button
                      key={mode}
                      onClick={() => setSortMode(mode)}
                      className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                        active
                          ? "bg-[oklch(0.60_0.18_42)] text-[var(--brac-on-accent)]"
                          : "border border-[var(--brac-border)] bg-[var(--brac-surface-10)] text-[var(--brac-on-surface)] hover:border-[oklch(0.60_0.18_42)]"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--brac-text-muted)] transition-colors hover:text-[oklch(0.60_0.18_42)]"
              >
                <X size={14} />
                {copy.clearFilters}
              </button>
            </div>
          </div>
        </section>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <section className="rounded-[32px] border border-[var(--brac-border)] bg-[linear-gradient(180deg,var(--brac-surface-14)_0%,var(--brac-surface-12)_100%)] p-6 shadow-[0_34px_90px_-60px_rgba(15,23,42,0.5)]">
            <div className="mb-6 flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[oklch(0.60_0.18_42)/0.16] text-[oklch(0.60_0.18_42)]">
                <Sparkles size={18} />
              </div>
              <div>
                <h2 className="font-['Barlow_Condensed'] text-4xl font-black uppercase leading-none text-[var(--brac-on-surface)]">
                  {copy.recommendationTitle}
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--brac-text-muted)]">
                  {copy.recommendationSubtitle}
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {recommendedEntries.map((entry) => (
                <ProductShowcaseCard key={entry.raw.id} entry={entry} copy={copy} />
              ))}
            </div>
          </section>

          <section className="rounded-[32px] border border-[var(--brac-border)] bg-[linear-gradient(180deg,var(--brac-surface-12)_0%,var(--brac-surface-14)_100%)] p-6 text-[var(--brac-on-surface)] shadow-[0_34px_90px_-60px_rgba(15,23,42,0.35)]">
            <div className="mb-6 flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[oklch(0.60_0.18_42)/0.16] text-[oklch(0.60_0.18_42)]">
                <Clock3 size={18} />
              </div>
              <div>
                <h2 className="font-['Barlow_Condensed'] text-4xl font-black uppercase leading-none text-[var(--brac-on-surface)]">
                  {copy.recentTitle}
                </h2>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-[var(--brac-text-muted)]">
                  {copy.recentSubtitle}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {recentEntries.map((entry) => (
                <Link
                  key={entry.raw.id}
                  href={`/product/${entry.display.slug}`}
                  className="group flex items-center gap-4 rounded-[24px] border border-[var(--brac-border)] bg-[var(--brac-surface-12)] p-4 transition-all hover:border-[oklch(0.60_0.18_42)] hover:bg-[var(--brac-surface-10)]"
                >
                  <img
                    src={entry.display.image}
                    alt={entry.display.title}
                    className="h-20 w-20 rounded-[18px] object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs uppercase tracking-[0.16em] text-[oklch(0.60_0.18_42)]">
                      {entry.brand}
                    </p>
                    <h3 className="mt-1 font-['Barlow_Condensed'] text-2xl font-black uppercase leading-none text-[var(--brac-on-surface)]">
                      {entry.display.title}
                    </h3>
                    <p className="mt-1 line-clamp-2 text-sm text-[var(--brac-text-muted)]">
                      {entry.display.subtitle}
                    </p>
                  </div>
                  <ArrowRight
                    size={18}
                    className="shrink-0 text-[var(--brac-text-muted)] transition-transform group-hover:translate-x-1 group-hover:text-[oklch(0.60_0.18_42)]"
                  />
                </Link>
              ))}
            </div>
          </section>
        </div>

        <section id="catalog-results" className="mt-8">
          <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="font-['Barlow_Condensed'] text-sm font-bold uppercase tracking-[0.18em] text-[oklch(0.60_0.18_42)]">
                BRAC Catalog
              </p>
              <h2 className="mt-2 font-['Barlow_Condensed'] text-5xl font-black uppercase leading-none text-[var(--brac-on-surface)]">
                {copy.catalogTitle}
              </h2>
              <p className="mt-2 text-sm text-[var(--brac-text-muted)]">
                {copy.catalogSubtitle}
              </p>
            </div>
            <div className="rounded-full border border-[var(--brac-border)] bg-[var(--brac-surface-14)] px-5 py-3 text-sm text-[var(--brac-on-surface)] shadow-[0_12px_40px_-32px_rgba(15,23,42,0.45)]">
              {sortedEntries.length} {copy.productsText}
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-[oklch(0.60_0.18_42)]" />
            </div>
          ) : sortedEntries.length === 0 ? (
            <div className="rounded-[28px] border border-[var(--brac-border)] bg-[var(--brac-surface-14)] p-10 text-center shadow-[0_24px_80px_-60px_rgba(15,23,42,0.45)]">
              <h3 className="font-['Barlow_Condensed'] text-4xl font-black uppercase text-[var(--brac-on-surface)]">
                {copy.noResultsTitle}
              </h3>
              <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-[var(--brac-text-muted)]">
                {copy.noResultsDescription}
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <button
                  onClick={clearFilters}
                  className="rounded-full bg-[oklch(0.60_0.18_42)] px-5 py-3 font-['Barlow_Condensed'] text-sm font-bold uppercase tracking-[0.16em] text-[var(--brac-on-accent)]"
                >
                  {copy.clearFilters}
                </button>
                <button
                  onClick={() =>
                    query.trim()
                      ? navigate(`/search?q=${encodeURIComponent(query.trim())}`)
                      : navigate("/search")
                  }
                  className="rounded-full border border-[var(--brac-border)] px-5 py-3 text-sm font-semibold text-[var(--brac-on-surface)]"
                >
                  {copy.deepSearchButton}
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-5 flex flex-col gap-3 rounded-[24px] border border-[var(--brac-border)] bg-[var(--brac-surface-14)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-[var(--brac-text-muted)]">
                  {buildPageRangeText(
                    copy.pageRangeText,
                    pageStart,
                    pageEnd,
                    sortedEntries.length,
                    numberLocale,
                  )}
                </div>
                <div className="text-sm text-[var(--brac-text-muted)]">
                  {copy.pageLabel} {currentPage} / {totalPages}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                {paginatedEntries.map((entry) => (
                  <ProductShowcaseCard key={entry.raw.id} entry={entry} copy={copy} />
                ))}
              </div>

              <div className="mt-8 flex flex-col gap-4 rounded-[28px] border border-[var(--brac-border)] bg-[var(--brac-surface-14)] px-5 py-5 shadow-[0_24px_80px_-60px_rgba(15,23,42,0.35)] sm:flex-row sm:items-center sm:justify-between">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="inline-flex items-center justify-center rounded-full border border-[var(--brac-border)] px-5 py-3 text-sm font-semibold text-[var(--brac-on-surface)] transition-colors hover:border-[oklch(0.60_0.18_42)] hover:text-[oklch(0.60_0.18_42)] disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {copy.pagePrevious}
                </button>

                <div className="flex flex-wrap items-center justify-center gap-2">
                  {pageNumbers.map((pageNumber) => {
                    const active = pageNumber === currentPage;
                    return (
                      <button
                        key={pageNumber}
                        onClick={() => handlePageChange(pageNumber)}
                        className={`h-11 min-w-[2.75rem] rounded-full px-4 text-sm font-semibold transition-colors ${
                          active
                            ? "bg-[oklch(0.60_0.18_42)] text-[var(--brac-on-accent)]"
                            : "border border-[var(--brac-border)] bg-[var(--brac-surface-10)] text-[var(--brac-on-surface)] hover:border-[oklch(0.60_0.18_42)] hover:text-[oklch(0.60_0.18_42)]"
                        }`}
                      >
                        {pageNumber}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="inline-flex items-center justify-center rounded-full border border-[var(--brac-border)] px-5 py-3 text-sm font-semibold text-[var(--brac-on-surface)] transition-colors hover:border-[oklch(0.60_0.18_42)] hover:text-[oklch(0.60_0.18_42)] disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {copy.pageNext}
                </button>
              </div>
            </>
          )}
        </section>
      </div>

      <Footer />
    </div>
  );
}
