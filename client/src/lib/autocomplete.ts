/*
  VADEN ORIGINAL - Autocomplete Suggestions
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

/**
 * Generate autocomplete suggestions based on input
 */
export function getAutocompleteSuggestions(
  products: DisplayProduct[],
  input: string,
  limit = 8
): AutocompleteSuggestion[] {
  if (!input.trim()) return [];

  const normalizedInput = input.toLowerCase().trim();
  const suggestions: AutocompleteSuggestion[] = [];
  const seen = new Set<string>();

  // 1. OEM Code suggestions (highest priority)
  products.forEach((product) => {
    product.oemCodes.forEach((oemGroup) => {
      oemGroup.codes.forEach((code) => {
        if (
          code.toLowerCase().includes(normalizedInput) &&
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
      (product.title.toLowerCase().includes(normalizedInput) ||
        product.subtitle.toLowerCase().includes(normalizedInput)) &&
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
    if (product.category.toLowerCase().includes(normalizedInput)) {
      categories.add(product.category);
    }
    if (product.subcategory.toLowerCase().includes(normalizedInput)) {
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
