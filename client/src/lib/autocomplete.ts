/*
  BRAC ORIGINAL - Autocomplete Suggestions
  Generate search suggestions from products
*/

import type { DisplayProduct } from "./contentProducts";

export interface AutocompleteSuggestion {
  id: string;
  label: string;
  type: "oem" | "product" | "category";
  value: string;
  icon?: string;
}

function normalizeSearchText(value: string): string {
  return value
    .toLowerCase()
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function normalizeSearchCompact(value: string): string {
  return normalizeSearchText(value).replace(/\s+/g, "");
}

/**
 * Generate autocomplete suggestions based on input
 */
export function getAutocompleteSuggestions(
  products: DisplayProduct[],
  input: string,
  limit = 8
): AutocompleteSuggestion[] {
  if (!input.trim()) return [];

  const normalizedInput = normalizeSearchText(input);
  const compactNormalizedInput = normalizeSearchCompact(input);
  const suggestions: AutocompleteSuggestion[] = [];
  const seen = new Set<string>();

  // 1. OEM Code suggestions (highest priority)
  products.forEach((product) => {
    product.oemCodes.forEach((oemGroup) => {
      oemGroup.codes.forEach((code) => {
        const normalizedCode = normalizeSearchText(code);
        const compactNormalizedCode = normalizeSearchCompact(code);
        if (
          (normalizedCode.includes(normalizedInput) ||
            compactNormalizedCode.includes(compactNormalizedInput)) &&
          !seen.has(code)
        ) {
          suggestions.push({
            id: `oem-${code}`,
            label: code,
            type: "oem",
            value: code,
            icon: oemGroup.manufacturer,
          });
          seen.add(code);
        }
      });
    });
  });

  // 2. Product name suggestions
  products.forEach((product) => {
    const productLabel = `${product.title} - ${product.subtitle}`;
    if (
      (normalizeSearchText(product.title).includes(normalizedInput) ||
        normalizeSearchText(product.subtitle).includes(normalizedInput)) &&
      !seen.has(product.title)
    ) {
      suggestions.push({
        id: `product-${product.id}`,
        label: productLabel,
        type: "product",
        value: product.title,
      });
      seen.add(product.title);
    }
  });

  // 3. Category suggestions
  const categories = new Set<string>();
  products.forEach((product) => {
    if (normalizeSearchText(product.category).includes(normalizedInput)) {
      categories.add(product.category);
    }
    if (normalizeSearchText(product.subcategory).includes(normalizedInput)) {
      categories.add(`${product.category} / ${product.subcategory}`);
    }
  });

  categories.forEach((category) => {
    if (!seen.has(category)) {
      suggestions.push({
        id: `category-${category}`,
        label: category,
        type: "category",
        value: category,
      });
      seen.add(category);
    }
  });

  // Return top suggestions
  return suggestions.slice(0, limit);
}

/**
 * Get all searchable items for initial suggestions
 */
export function getPopularSuggestions(
  products: DisplayProduct[],
  limit = 5,
): AutocompleteSuggestion[] {
  const suggestions: AutocompleteSuggestion[] = [];
  const seen = new Set<string>();

  // Get first few OEM codes
  products.forEach((product) => {
    if (suggestions.length >= limit) return;
    product.oemCodes.forEach((oemGroup) => {
      if (suggestions.length >= limit) return;
      oemGroup.codes.slice(0, 1).forEach((code) => {
        if (!seen.has(code)) {
          suggestions.push({
            id: `oem-${code}`,
            label: code,
            type: "oem",
            value: code,
            icon: oemGroup.manufacturer,
          });
          seen.add(code);
        }
      });
    });
  });

  return suggestions;
}

/**
 * Highlight matching text in suggestion
 */
export function highlightMatch(text: string, query: string): string {
  const regex = new RegExp(`(${query})`, "gi");
  return text.replace(regex, "<mark>$1</mark>");
}
