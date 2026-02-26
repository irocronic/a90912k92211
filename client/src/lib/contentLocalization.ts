import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "../../../server/routers";
import type { DisplayProduct } from "@/lib/contentProducts";
import {
  findCategoryByLabel,
  findSubcategoryByLabel,
  type ProductTaxonomy,
} from "@/lib/productTaxonomy";

type RouterOutputs = inferRouterOutputs<AppRouter>;
export type DbArticle = RouterOutputs["content"]["articles"]["list"][number];
export type LanguageCode = "tr" | "en";

export const PRODUCT_CONTENT_TRANSLATION_SECTION = "productContent";
export const ARTICLE_CONTENT_TRANSLATION_SECTION = "articleContent";

type ProductOverride = Partial<
  Pick<
    DisplayProduct,
    | "category"
    | "subcategory"
    | "title"
    | "subtitle"
    | "description"
    | "fullDescription"
    | "features"
    | "specifications"
    | "applications"
    | "certifications"
  >
>;

type ArticleOverride = Partial<
  Pick<DbArticle, "title" | "excerpt" | "content" | "category">
>;

type StoredProductTranslation = Partial<{
  title: string;
  subtitle: string;
  category: string;
  subcategory: string;
  description: string;
  imageUrl: string;
  catalogUrl: string;
  oemCodes: Array<{ manufacturer: string; codes: string[] }>;
  features: string[];
  specifications: Record<string, string>;
  applications: string[];
  certifications: string[];
}>;

type StoredArticleTranslation = Partial<{
  title: string;
  excerpt: string;
  content: string;
  imageUrl: string;
  category: string;
}>;

const PRODUCT_CATEGORY_EN_BY_TR: Record<string, string> = {
  yeni: "NEW",
  kompresorler: "COMPRESSORS",
  "fren sistemleri": "BRAKE SYSTEMS",
  valfler: "VALVES",
  motor: "ENGINE",
};

const ARTICLE_CATEGORY_EN_BY_TR: Record<string, string> = {
  haber: "News",
  haberler: "News",
  duyuru: "Announcement",
  duyurular: "Announcements",
  kurumsal: "Corporate",
  teknoloji: "Technology",
  genel: "General",
};

const PRODUCT_EN_OVERRIDES_BY_KEY: Record<string, ProductOverride> = {
  "hava isleme unitesi e apu": {
    category: "NEW",
    subcategory: "Air Processing Unit",
    title: "Air Processing Unit",
    subtitle: "(E-APU)",
    description: "Safe and Efficient Air Management",
    fullDescription:
      "Vaden Original E-APU (Electric Air Processing Unit) is developed to meet the growing air management needs of modern vehicles. It is designed with low noise, high efficiency, and long service life.",
    features: [
      "Low noise level (<75 dB)",
      "High efficiency (95%+)",
      "Compact design",
      "Easy installation",
      "Long service life (500,000+ hours)",
    ],
    specifications: [
      { label: "Voltage", value: "24V / 12V" },
      { label: "Power", value: "2.5 - 5 kW" },
      { label: "Flow Capacity", value: "150 - 300 m3/h" },
      { label: "Operating Temperature", value: "-20C to +60C" },
      { label: "Weight", value: "12 kg" },
      { label: "Dimensions", value: "450 x 350 x 200 mm" },
    ],
    applications: [
      "Heavy commercial vehicles",
      "Buses",
      "Trucks",
      "Construction machinery",
    ],
    certifications: ["ISO 9001", "ISO 14001", "IATF 16949"],
  },
  "hava fren kompresorleri": {
    category: "COMPRESSORS",
    subcategory: "Air Brake Compressors",
    title: "Air Brake",
    subtitle: "Compressors",
    description:
      "Reliable and high-performance compressors equipped with advanced technology",
    fullDescription:
      "Vaden Original air brake compressors are designed for applications requiring high pressure and reliability. With over 1 million units produced, our compressors are recognized as a trusted brand worldwide.",
    features: [
      "High efficiency",
      "Low maintenance requirement",
      "Noise control",
      "Fast pressure build-up",
      "Long service life",
    ],
    specifications: [
      { label: "Maximum Pressure", value: "10 bar" },
      { label: "Displacement", value: "5.5 - 11 cc/rev" },
      { label: "Flow Capacity", value: "400 - 800 l/min" },
      { label: "Power Requirement", value: "35 - 75 kW" },
      { label: "Operating Temperature", value: "-10C to +70C" },
      { label: "Weight", value: "45 - 65 kg" },
    ],
    applications: [
      "Heavy-duty trucks",
      "Buses",
      "Cement trucks",
      "Concrete mixers",
    ],
    certifications: ["ISO 9001", "ISO 14001", "IATF 16949", "E-Mark"],
  },
  "hava fren sistemleri": {
    category: "BRAKE SYSTEMS",
    subcategory: "Air Brake Systems",
    title: "Air Brake",
    subtitle: "Systems",
    description: "Clean Air, Superior Quality Standards!",
    fullDescription:
      "Vaden Original air brake systems are among the most critical components of vehicle safety. We provide complete system solutions from compressors to brake actuators.",
    features: [
      "Full system integration",
      "Safety certifications",
      "Fast response time",
      "Low air consumption",
      "Easy maintenance",
    ],
    specifications: [
      { label: "System Pressure", value: "8 - 10 bar" },
      { label: "Response Time", value: "< 200 ms" },
      { label: "Air Consumption", value: "15 - 25 l/brake" },
      { label: "Operating Temperature", value: "-15C to +80C" },
      { label: "Weight", value: "120 - 150 kg (full system)" },
    ],
    applications: [
      "Heavy commercial vehicles",
      "Buses",
      "Trailers",
      "Semi-trailers",
    ],
    certifications: ["ISO 9001", "ECE R13", "IATF 16949"],
  },
  "sanziman solenoid valfler": {
    category: "VALVES",
    subcategory: "Transmission Solenoid Valves",
    title: "Transmission, Solenoid",
    subtitle: "Valves",
    description: "Technological Precision, Excellence in Control!",
    fullDescription:
      "Vaden Original solenoid valves are electromagnetic valves that deliver precise control and reliable performance. They are used in transmission and brake systems.",
    features: [
      "Fast response time",
      "Low power consumption",
      "Compact design",
      "Long service life",
      "Wide operating range",
    ],
    specifications: [
      { label: "Voltage", value: "12V / 24V DC" },
      { label: "Power Consumption", value: "8 - 15 W" },
      { label: "Response Time", value: "< 50 ms" },
      { label: "Maximum Pressure", value: "10 bar" },
      { label: "Flow Capacity", value: "50 - 150 l/min" },
    ],
    applications: [
      "Automatic transmission",
      "Air brake system",
      "HVAC system",
    ],
    certifications: ["ISO 9001", "IATF 16949"],
  },
  "motor egzoz fren valfleri": {
    category: "ENGINE",
    subcategory: "Engine Exhaust Brake Valves",
    title: "Engine, Exhaust",
    subtitle: "Brake Valves",
    description: "Where Performance Meets Quality!",
    fullDescription:
      "Vaden Original engine and exhaust brake valves optimize vehicle performance while reducing fuel consumption.",
    features: [
      "High temperature resistance",
      "Low emissions",
      "Efficient control",
      "Long service life",
    ],
    specifications: [
      { label: "Maximum Temperature", value: "250C" },
      { label: "Response Time", value: "< 100 ms" },
      { label: "Pressure Range", value: "0 - 8 bar" },
    ],
    applications: ["Diesel engines", "Exhaust systems"],
    certifications: ["ISO 9001", "Euro 6"],
  },
  "motor volan muhafazasi": {
    category: "ENGINE",
    subcategory: "Engine Flywheel Housing",
    title: "Engine, Flywheel",
    subtitle: "Housing",
    description: "Superior Quality, Flawless Performance!",
    fullDescription:
      "Vaden Original flywheel housing is designed for engine protection and vibration control.",
    features: [
      "Vibration absorption",
      "High durability",
      "Lightweight",
      "Easy installation",
    ],
    specifications: [
      { label: "Material", value: "Alloy steel" },
      { label: "Weight", value: "8 - 12 kg" },
      { label: "Operating Temperature", value: "-20C to +100C" },
    ],
    applications: ["Heavy-duty trucks", "Buses"],
    certifications: ["ISO 9001"],
  },
};

const ARTICLE_EN_OVERRIDES_BY_TITLE: Record<string, ArticleOverride> = {
  "test haber": {
    title: "Test News",
    excerpt: "Test",
  },
};

const ARTICLE_EXACT_TEXT_EN_BY_TR: Record<string, string> = {
  deneme: "Test",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeTurkishText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[\u0131]/g, "i")
    .replace(/[\u011f]/g, "g")
    .replace(/[\u00fc]/g, "u")
    .replace(/[\u015f]/g, "s")
    .replace(/[\u00f6]/g, "o")
    .replace(/[\u00e7]/g, "c")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function productLookupKey(
  product: Pick<DisplayProduct, "title" | "subtitle">,
): string {
  return normalizeTurkishText(`${product.title} ${product.subtitle}`);
}

function parseStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const next = value.filter((item): item is string => typeof item === "string");
  return next;
}

function parseOemCodes(
  value: unknown,
): Array<{ manufacturer: string; codes: string[] }> | undefined {
  if (!Array.isArray(value)) return undefined;
  const parsed = value
    .map((item) => {
      if (!isRecord(item)) return null;
      if (typeof item.manufacturer !== "string") return null;
      if (!Array.isArray(item.codes)) return null;

      const codes = item.codes.filter(
        (code): code is string => typeof code === "string",
      );
      return {
        manufacturer: item.manufacturer,
        codes,
      };
    })
    .filter(
      (
        item,
      ): item is {
        manufacturer: string;
        codes: string[];
      } => Boolean(item),
    );
  return parsed;
}

function parseSpecificationsRecord(
  value: unknown,
): Record<string, string> | undefined {
  if (!isRecord(value)) return undefined;
  const entries = Object.entries(value).filter(
    (entry): entry is [string, string] => typeof entry[1] === "string",
  );
  return Object.fromEntries(entries);
}

function parseStoredRecord(rawValue?: string): Record<string, unknown> | undefined {
  if (!rawValue) return undefined;
  try {
    const parsed = JSON.parse(rawValue);
    if (!isRecord(parsed)) return undefined;
    return parsed;
  } catch {
    return undefined;
  }
}

export function getProductTranslationKey(productId: string): string {
  return `product:${productId}`;
}

export function getArticleTranslationKey(articleId: string): string {
  return `article:${articleId}`;
}

export function parseStoredProductTranslation(
  rawValue?: string,
): StoredProductTranslation | undefined {
  const record = parseStoredRecord(rawValue);
  if (!record) return undefined;

  return {
    title: typeof record.title === "string" ? record.title : undefined,
    subtitle: typeof record.subtitle === "string" ? record.subtitle : undefined,
    category: typeof record.category === "string" ? record.category : undefined,
    subcategory:
      typeof record.subcategory === "string" ? record.subcategory : undefined,
    description:
      typeof record.description === "string" ? record.description : undefined,
    imageUrl: typeof record.imageUrl === "string" ? record.imageUrl : undefined,
    catalogUrl:
      typeof record.catalogUrl === "string" ? record.catalogUrl : undefined,
    oemCodes: parseOemCodes(record.oemCodes),
    features: parseStringArray(record.features),
    specifications: parseSpecificationsRecord(record.specifications),
    applications: parseStringArray(record.applications),
    certifications: parseStringArray(record.certifications),
  };
}

export function parseStoredArticleTranslation(
  rawValue?: string,
): StoredArticleTranslation | undefined {
  const record = parseStoredRecord(rawValue);
  if (!record) return undefined;

  return {
    title: typeof record.title === "string" ? record.title : undefined,
    excerpt: typeof record.excerpt === "string" ? record.excerpt : undefined,
    content: typeof record.content === "string" ? record.content : undefined,
    imageUrl: typeof record.imageUrl === "string" ? record.imageUrl : undefined,
    category: typeof record.category === "string" ? record.category : undefined,
  };
}

function translateCategory(
  value: string,
  categoryMap: Record<string, string>,
): string {
  const translated = categoryMap[normalizeTurkishText(value)];
  return translated ?? value;
}

function translateArticleText(value: string): string {
  const translated = ARTICLE_EXACT_TEXT_EN_BY_TR[normalizeTurkishText(value)];
  return translated ?? value;
}

function specsFromRecord(
  value: Record<string, string>,
): Array<{ label: string; value: string }> {
  return Object.entries(value).map(([label, specValue]) => ({
    label,
    value: specValue,
  }));
}

export function localizeDisplayProduct(
  product: DisplayProduct,
  language: LanguageCode,
  rawStoredOverride?: string,
  taxonomy?: ProductTaxonomy,
): DisplayProduct {
  if (language !== "en") return product;

  const staticOverride = PRODUCT_EN_OVERRIDES_BY_KEY[productLookupKey(product)];
  const withStatic = staticOverride
    ? {
        ...product,
        ...staticOverride,
        category:
          staticOverride.category ??
          translateCategory(product.category, PRODUCT_CATEGORY_EN_BY_TR),
      }
    : {
        ...product,
        category: translateCategory(product.category, PRODUCT_CATEGORY_EN_BY_TR),
      };

  const taxonomyCategory = taxonomy
    ? findCategoryByLabel(taxonomy, product.category)
    : null;
  const taxonomySubcategory =
    taxonomyCategory && product.subcategory
      ? findSubcategoryByLabel(taxonomyCategory, product.subcategory)
      : null;

  const withTaxonomy: DisplayProduct = {
    ...withStatic,
    category: taxonomyCategory?.nameEn || withStatic.category,
    subcategory: taxonomySubcategory?.nameEn || withStatic.subcategory,
  };

  const stored = parseStoredProductTranslation(rawStoredOverride);
  if (!stored) return withTaxonomy;

  return {
    ...withTaxonomy,
    title: stored.title ?? withTaxonomy.title,
    subtitle: stored.subtitle ?? withTaxonomy.subtitle,
    category: stored.category ?? withTaxonomy.category,
    subcategory: stored.subcategory ?? withTaxonomy.subcategory,
    description: stored.description ?? withTaxonomy.description,
    fullDescription: stored.description ?? withTaxonomy.fullDescription,
    image: stored.imageUrl ?? withTaxonomy.image,
    catalogUrl:
      stored.catalogUrl !== undefined ? stored.catalogUrl : withTaxonomy.catalogUrl,
    oemCodes: stored.oemCodes ?? withTaxonomy.oemCodes,
    features: stored.features ?? withTaxonomy.features,
    specifications: stored.specifications
      ? specsFromRecord(stored.specifications)
      : withTaxonomy.specifications,
    applications: stored.applications ?? withTaxonomy.applications,
    certifications: stored.certifications ?? withTaxonomy.certifications,
  };
}

export function localizeArticle(
  article: DbArticle,
  language: LanguageCode,
  rawStoredOverride?: string,
): DbArticle {
  if (language !== "en") return article;

  const staticOverride =
    ARTICLE_EN_OVERRIDES_BY_TITLE[normalizeTurkishText(article.title)];
  const withStatic: DbArticle = {
    ...article,
    title: staticOverride?.title ?? translateArticleText(article.title),
    excerpt: staticOverride?.excerpt ?? translateArticleText(article.excerpt),
    content: staticOverride?.content ?? translateArticleText(article.content),
    category:
      staticOverride?.category ??
      translateCategory(article.category, ARTICLE_CATEGORY_EN_BY_TR),
  };

  const stored = parseStoredArticleTranslation(rawStoredOverride);
  if (!stored) return withStatic;

  return {
    ...withStatic,
    title: stored.title ?? withStatic.title,
    excerpt: stored.excerpt ?? withStatic.excerpt,
    content: stored.content ?? withStatic.content,
    imageUrl: stored.imageUrl ?? withStatic.imageUrl,
    category: stored.category ?? withStatic.category,
  };
}
