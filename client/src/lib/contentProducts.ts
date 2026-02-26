import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "../../../server/routers";
import {
  localizeDisplayProduct,
  type LanguageCode,
} from "@/lib/contentLocalization";

type RouterOutputs = inferRouterOutputs<AppRouter>;
export type DbProduct = RouterOutputs["content"]["products"]["list"][number];

export interface DisplayProduct {
  id: string;
  slug: string;
  category: string;
  subcategory: string;
  title: string;
  subtitle: string;
  description: string;
  fullDescription: string;
  image: string;
  oemCodes: Array<{ manufacturer: string; codes: string[] }>;
  features: string[];
  specifications: Array<{ label: string; value: string }>;
  applications: string[];
  certifications: string[];
  catalogUrl?: string;
}

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c");
}

export function slugify(value: string): string {
  return normalizeText(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function normalizeStringArray(values: unknown): string[] {
  if (!Array.isArray(values)) return [];
  return values.filter((item): item is string => typeof item === "string");
}

function normalizeOemCodes(values: unknown): Array<{ manufacturer: string; codes: string[] }> {
  if (!Array.isArray(values)) return [];

  return values
    .map((item) => {
      if (!item || typeof item !== "object") return null;

      const manufacturer =
        "manufacturer" in item && typeof item.manufacturer === "string"
          ? item.manufacturer
          : "";
      const codes =
        "codes" in item && Array.isArray(item.codes)
          ? item.codes.filter((code: unknown): code is string => typeof code === "string")
          : [];

      if (!manufacturer) return null;
      return { manufacturer, codes };
    })
    .filter((item): item is { manufacturer: string; codes: string[] } => Boolean(item));
}

function normalizeSpecifications(values: unknown): Array<{ label: string; value: string }> {
  if (!values || typeof values !== "object") return [];

  return Object.entries(values)
    .filter((entry): entry is [string, string] => typeof entry[1] === "string")
    .map(([label, value]) => ({ label, value }));
}

export function buildProductSlug(product: DbProduct): string {
  return `${slugify(`${product.title}-${product.subtitle}`)}-${product.id.slice(0, 6)}`;
}

export function toDisplayProduct(
  product: DbProduct,
  language: LanguageCode = "tr",
): DisplayProduct {
  const normalized: DisplayProduct = {
    id: product.id,
    slug: buildProductSlug(product),
    category: product.category,
    subcategory: product.subcategory || "",
    title: product.title,
    subtitle: product.subtitle,
    description: product.description,
    fullDescription: product.description,
    image: product.imageUrl || "",
    oemCodes: normalizeOemCodes(product.oemCodes),
    features: normalizeStringArray(product.features),
    specifications: normalizeSpecifications(product.specifications),
    applications: normalizeStringArray(product.applications),
    certifications: normalizeStringArray(product.certifications),
    catalogUrl: product.catalogUrl || undefined,
  };

  return localizeDisplayProduct(normalized, language);
}

export function getProductCategoryLabel(
  product: Pick<DisplayProduct, "category" | "subcategory">,
): string {
  if (product.subcategory) {
    return `${product.category} / ${product.subcategory}`;
  }
  return product.category;
}

export function matchesProductParam(product: DisplayProduct, param: string): boolean {
  const normalizedParam = slugify(param);
  if (product.id === param) return true;
  if (product.slug === normalizedParam || product.slug === param) return true;
  return slugify(`${product.title}-${product.subtitle}`) === normalizedParam;
}

export function getRelatedProducts(
  products: DisplayProduct[],
  currentProductId: string,
  limit = 3,
): DisplayProduct[] {
  const current = products.find((item) => item.id === currentProductId);
  if (!current) return [];

  const sameCategory = products.filter(
    (item) => item.id !== current.id && item.category === current.category,
  );
  const others = products.filter(
    (item) => item.id !== current.id && item.category !== current.category,
  );

  return [...sameCategory, ...others].slice(0, limit);
}
