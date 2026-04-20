/*
  VADEN ORIGINAL - Search Utilities
  Functions for searching products by OEM codes and product names
*/

import type { DisplayProduct } from "./contentProducts";

export interface SearchResult {
  product: DisplayProduct;
  matchType: "oemCode" | "productName" | "description";
  matchedValue: string;
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
 * Search products by OEM code or product name
 * @param products - Product source list
 * @param query - Search query (OEM code or product name)
 * @returns Array of matching products with match details
 */
export function searchProducts(products: DisplayProduct[], query: string): SearchResult[] {
  if (!query.trim()) return [];

  const normalizedQuery = normalizeSearchText(query);
  const compactNormalizedQuery = normalizeSearchCompact(query);
  const results: SearchResult[] = [];
  const seenProductIds = new Set<string>();

  // Search through all products
  products.forEach((product) => {
    // Search by OEM codes
    product.oemCodes.forEach((oemGroup) => {
      oemGroup.codes.forEach((code) => {
        const normalizedCode = normalizeSearchText(code);
        const compactNormalizedCode = normalizeSearchCompact(code);
        if (
          normalizedCode.includes(normalizedQuery) ||
          compactNormalizedCode.includes(compactNormalizedQuery)
        ) {
          if (!seenProductIds.has(product.id)) {
            results.push({
              product,
              matchType: "oemCode",
              matchedValue: code,
            });
            seenProductIds.add(product.id);
          }
        }
      });
    });

    // Search by product name/title
    if (
      normalizeSearchText(product.title).includes(normalizedQuery) ||
      normalizeSearchText(product.subtitle).includes(normalizedQuery)
    ) {
      if (!seenProductIds.has(product.id)) {
        results.push({
          product,
          matchType: "productName",
          matchedValue: product.title,
        });
        seenProductIds.add(product.id);
      }
    }

    // Search by category
    if (normalizeSearchText(product.category).includes(normalizedQuery)) {
      if (!seenProductIds.has(product.id)) {
        results.push({
          product,
          matchType: "productName",
          matchedValue: product.category,
        });
        seenProductIds.add(product.id);
      }
    }

    // Search by subcategory
    if (normalizeSearchText(product.subcategory).includes(normalizedQuery)) {
      if (!seenProductIds.has(product.id)) {
        results.push({
          product,
          matchType: "productName",
          matchedValue: product.subcategory,
        });
        seenProductIds.add(product.id);
      }
    }

    // Search by description
    if (normalizeSearchText(product.description).includes(normalizedQuery)) {
      if (!seenProductIds.has(product.id)) {
        results.push({
          product,
          matchType: "description",
          matchedValue: product.description,
        });
        seenProductIds.add(product.id);
      }
    }

    // Search by applications
    product.applications.forEach((app) => {
      if (normalizeSearchText(app).includes(normalizedQuery)) {
        if (!seenProductIds.has(product.id)) {
          results.push({
            product,
            matchType: "description",
            matchedValue: app,
          });
          seenProductIds.add(product.id);
        }
      }
    });
  });

  return results;
}

/**
 * Get all OEM codes from all products
 * Useful for autocomplete suggestions
 */
export function getAllOEMCodes(products: DisplayProduct[]): string[] {
  const codes = new Set<string>();

  products.forEach((product) => {
    product.oemCodes.forEach((oemGroup) => {
      oemGroup.codes.forEach((code) => {
        codes.add(code);
      });
    });
  });

  return Array.from(codes).sort();
}

/**
 * Get all manufacturers
 */
export function getAllManufacturers(products: DisplayProduct[]): string[] {
  const manufacturers = new Set<string>();

  products.forEach((product) => {
    product.oemCodes.forEach((oemGroup) => {
      manufacturers.add(oemGroup.manufacturer);
    });
  });

  return Array.from(manufacturers).sort();
}

/**
 * Get OEM codes for a specific manufacturer
 */
export function getOEMCodesByManufacturer(
  products: DisplayProduct[],
  manufacturer: string,
): string[] {
  const codes: string[] = [];

  products.forEach((product) => {
    product.oemCodes.forEach((oemGroup) => {
      if (oemGroup.manufacturer.toLowerCase() === manufacturer.toLowerCase()) {
        codes.push(...oemGroup.codes);
      }
    });
  });

  return codes.sort();
}

/**
 * Get product categories
 */
export function getProductCategories(products: DisplayProduct[]): string[] {
  const categories = new Set<string>();

  products.forEach((product) => {
    categories.add(product.category);
    if (product.subcategory) {
      categories.add(`${product.category} / ${product.subcategory}`);
    }
  });

  return Array.from(categories).sort();
}
