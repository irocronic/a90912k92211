type LanguageCode = "tr" | "en";

export type ProductTaxonomySubcategory = {
  id: string;
  nameTr: string;
  nameEn: string;
};

export type ProductTaxonomyCategory = {
  id: string;
  nameTr: string;
  nameEn: string;
  subcategories: ProductTaxonomySubcategory[];
};

export type ProductTaxonomy = ProductTaxonomyCategory[];

export const PRODUCT_TAXONOMY_SETTING_KEY = "product_taxonomy";

const DEFAULT_PRODUCT_TAXONOMY: ProductTaxonomy = [
  {
    id: "air-brake",
    nameTr: "Hava Fren Sistemleri",
    nameEn: "Air Brake Systems",
    subcategories: [
      {
        id: "air-processing-unit",
        nameTr: "Hava Isleme Unitesi (E-APU)",
        nameEn: "Air Processing Unit (E-APU)",
      },
      {
        id: "air-brake-compressors",
        nameTr: "Hava Fren Kompresorleri",
        nameEn: "Air Brake Compressors",
      },
      {
        id: "air-brake-valves",
        nameTr: "Hava Fren Sistemleri ve Valfler",
        nameEn: "Air Brake System Valves",
      },
    ],
  },
  {
    id: "transmission",
    nameTr: "Sanziman Bilesenleri",
    nameEn: "Transmission Components",
    subcategories: [
      {
        id: "solenoid-valves",
        nameTr: "Solenoid Valfler",
        nameEn: "Transmission Solenoid Valves",
      },
    ],
  },
  {
    id: "engine",
    nameTr: "Motor Bilesenleri",
    nameEn: "Engine Components",
    subcategories: [
      {
        id: "exhaust-brake-valves",
        nameTr: "Egzoz Fren Valfleri",
        nameEn: "Engine Exhaust Brake Valves",
      },
      {
        id: "flywheel-housing",
        nameTr: "Volan Muhafazasi",
        nameEn: "Engine Flywheel Housing",
      },
    ],
  },
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeText(value: string): string {
  return value.trim();
}

function normalizeId(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function createIdFromLabel(label: string): string {
  return normalizeId(label) || `id-${Date.now().toString(36)}`;
}

function uniqueById<T extends { id: string }>(values: T[]): T[] {
  const map = new Map<string, T>();
  values.forEach((item) => map.set(item.id, item));
  return Array.from(map.values());
}

function sanitizeSubcategory(
  raw: unknown,
  fallbackId: string,
): ProductTaxonomySubcategory | null {
  if (!isRecord(raw)) return null;

  const nameTr = typeof raw.nameTr === "string" ? normalizeText(raw.nameTr) : "";
  const nameEn = typeof raw.nameEn === "string" ? normalizeText(raw.nameEn) : "";
  if (!nameTr && !nameEn) return null;

  const idSource =
    typeof raw.id === "string" && raw.id.trim()
      ? raw.id
      : nameTr || nameEn || fallbackId;
  const id = normalizeId(idSource) || fallbackId;

  return {
    id,
    nameTr: nameTr || nameEn,
    nameEn: nameEn || nameTr,
  };
}

function sanitizeCategory(
  raw: unknown,
  fallbackId: string,
): ProductTaxonomyCategory | null {
  if (!isRecord(raw)) return null;

  const nameTr = typeof raw.nameTr === "string" ? normalizeText(raw.nameTr) : "";
  const nameEn = typeof raw.nameEn === "string" ? normalizeText(raw.nameEn) : "";
  if (!nameTr && !nameEn) return null;

  const idSource =
    typeof raw.id === "string" && raw.id.trim()
      ? raw.id
      : nameTr || nameEn || fallbackId;
  const id = normalizeId(idSource) || fallbackId;

  const rawSubcategories = Array.isArray(raw.subcategories) ? raw.subcategories : [];
  const subcategories = uniqueById(
    rawSubcategories
      .map((item, index) => sanitizeSubcategory(item, `${id}-sub-${index + 1}`))
      .filter(
        (item): item is ProductTaxonomySubcategory => Boolean(item),
      ),
  );

  return {
    id,
    nameTr: nameTr || nameEn,
    nameEn: nameEn || nameTr,
    subcategories,
  };
}

export function parseProductTaxonomy(value: unknown): ProductTaxonomy {
  if (!Array.isArray(value)) return DEFAULT_PRODUCT_TAXONOMY;

  const parsed = uniqueById(
    value
      .map((item, index) => sanitizeCategory(item, `category-${index + 1}`))
      .filter((item): item is ProductTaxonomyCategory => Boolean(item)),
  );

  if (parsed.length === 0) return DEFAULT_PRODUCT_TAXONOMY;
  return parsed;
}

export function serializeProductTaxonomy(value: ProductTaxonomy): string {
  return JSON.stringify(value);
}

export function getCategoryName(
  category: ProductTaxonomyCategory,
  language: LanguageCode,
): string {
  return language === "en" ? category.nameEn : category.nameTr;
}

export function getSubcategoryName(
  subcategory: ProductTaxonomySubcategory,
  language: LanguageCode,
): string {
  return language === "en" ? subcategory.nameEn : subcategory.nameTr;
}

export function findCategoryByLabel(
  taxonomy: ProductTaxonomy,
  label: string,
): ProductTaxonomyCategory | null {
  const normalized = normalizeText(label);
  if (!normalized) return null;

  return (
    taxonomy.find(
      (category) =>
        category.nameTr === normalized || category.nameEn === normalized,
    ) ?? null
  );
}

export function findSubcategoryByLabel(
  category: ProductTaxonomyCategory,
  label: string,
): ProductTaxonomySubcategory | null {
  const normalized = normalizeText(label);
  if (!normalized) return null;

  return (
    category.subcategories.find(
      (subcategory) =>
        subcategory.nameTr === normalized ||
        subcategory.nameEn === normalized,
    ) ?? null
  );
}

export function mergeTaxonomyWithProducts(
  taxonomy: ProductTaxonomy,
  products: Array<{ category: string; subcategory?: string | null }>,
): ProductTaxonomy {
  const next: ProductTaxonomy = taxonomy.map((category) => ({
    ...category,
    subcategories: [...category.subcategories],
  }));

  products.forEach((product) => {
    const categoryLabel = normalizeText(product.category || "");
    if (!categoryLabel) return;

    let category = findCategoryByLabel(next, categoryLabel);
    if (!category) {
      category = {
        id: createIdFromLabel(categoryLabel),
        nameTr: categoryLabel,
        nameEn: categoryLabel,
        subcategories: [],
      };
      next.push(category);
    }

    const subcategoryLabel = normalizeText(product.subcategory || "");
    if (!subcategoryLabel) return;

    const subcategory = findSubcategoryByLabel(category, subcategoryLabel);
    if (subcategory) return;

    category.subcategories.push({
      id: createIdFromLabel(`${category.id}-${subcategoryLabel}`),
      nameTr: subcategoryLabel,
      nameEn: subcategoryLabel,
    });
  });

  return next
    .map((category) => ({
      ...category,
      subcategories: uniqueById(category.subcategories).sort((a, b) =>
        a.nameTr.localeCompare(b.nameTr, "tr"),
      ),
    }))
    .sort((a, b) => a.nameTr.localeCompare(b.nameTr, "tr"));
}

export function createEmptyCategory(nameTr: string, nameEn: string): ProductTaxonomyCategory {
  const baseLabel = normalizeText(nameTr || nameEn);
  return {
    id: createIdFromLabel(baseLabel),
    nameTr: normalizeText(nameTr || nameEn),
    nameEn: normalizeText(nameEn || nameTr),
    subcategories: [],
  };
}

export function createEmptySubcategory(
  categoryId: string,
  nameTr: string,
  nameEn: string,
): ProductTaxonomySubcategory {
  const baseLabel = normalizeText(nameTr || nameEn);
  return {
    id: createIdFromLabel(`${categoryId}-${baseLabel}`),
    nameTr: normalizeText(nameTr || nameEn),
    nameEn: normalizeText(nameEn || nameTr),
  };
}
