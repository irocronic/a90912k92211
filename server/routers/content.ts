import { TRPCError } from "@trpc/server";
import { and, asc, desc, eq, inArray, like, or, sql } from "drizzle-orm";
import { z } from "zod";
import {
  articles,
  pageContent,
  products,
  productOemIndex,
  settings,
  type Product,
} from "../../drizzle/schema";
import {
  PUBLIC_CONTENT_SETTING_KEYS,
  PUBLIC_SETTING_PREFIX,
} from "../../shared/const";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";

type SettingValueType = "string" | "number" | "boolean" | "json";
const PUBLIC_SETTING_KEYS = [...PUBLIC_CONTENT_SETTING_KEYS];
const SEARCH_CANDIDATE_LIMIT = 500;
let oemIndexSyncPromise: Promise<void> | null = null;

type ProductSearchMatchType = "oemCode" | "productName" | "description";

type ProductSearchResultItem = {
  product: Product;
  score: number;
  matchType: ProductSearchMatchType;
  matchedValue: string;
  manufacturers: string[];
  normalizedManufacturers: string[];
};

type ProductOemFlat = {
  manufacturer: string;
  code: string;
  normalizedManufacturer: string;
  normalizedCode: string;
};

function isPublicSettingKey(key: string) {
  return (
    PUBLIC_SETTING_KEYS.includes(
      key as (typeof PUBLIC_CONTENT_SETTING_KEYS)[number]
    ) || key.startsWith(PUBLIC_SETTING_PREFIX)
  );
}

function parseSettingValue(raw: string, type: SettingValueType): unknown {
  try {
    if (type === "number") return Number(raw);
    if (type === "boolean") return raw === "true";
    if (type === "json") return JSON.parse(raw);
    return raw;
  } catch {
    return raw;
  }
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

function splitSearchTokens(value: string): string[] {
  return normalizeSearchText(value)
    .split(/\s+/)
    .filter(Boolean);
}

function toBigrams(value: string): Set<string> {
  const normalized = normalizeSearchText(value).replace(/\s+/g, "");
  if (normalized.length < 2) return new Set(normalized ? [normalized] : []);

  const grams = new Set<string>();
  for (let i = 0; i < normalized.length - 1; i += 1) {
    grams.add(normalized.slice(i, i + 2));
  }
  return grams;
}

function diceSimilarity(left: string, right: string): number {
  const leftSet = toBigrams(left);
  const rightSet = toBigrams(right);
  if (leftSet.size === 0 || rightSet.size === 0) return 0;

  let intersection = 0;
  leftSet.forEach((gram) => {
    if (rightSet.has(gram)) {
      intersection += 1;
    }
  });
  return (2 * intersection) / (leftSet.size + rightSet.size);
}

function flattenProductOemCodes(product: Pick<Product, "oemCodes">): ProductOemFlat[] {
  if (!Array.isArray(product.oemCodes)) return [];

  const flat: ProductOemFlat[] = [];
  const dedupe = new Set<string>();

  product.oemCodes.forEach((group) => {
    if (!group || typeof group !== "object") return;
    const manufacturer =
      typeof group.manufacturer === "string" ? group.manufacturer.trim() : "";
    if (!manufacturer) return;
    const normalizedManufacturer = normalizeSearchText(manufacturer);
    if (!normalizedManufacturer) return;

    const codes = Array.isArray(group.codes) ? group.codes : [];
    codes.forEach((rawCode) => {
      if (typeof rawCode !== "string") return;
      const code = rawCode.trim();
      if (!code) return;

      const normalizedCode = normalizeSearchText(code);
      if (!normalizedCode) return;

      const dedupeKey = `${normalizedManufacturer}::${normalizedCode}`;
      if (dedupe.has(dedupeKey)) return;
      dedupe.add(dedupeKey);

      flat.push({
        manufacturer,
        code,
        normalizedManufacturer,
        normalizedCode,
      });
    });
  });

  return flat;
}

function buildProductOemIndexRows(
  productId: string,
  product: Pick<Product, "oemCodes">
): Array<{
  productId: string;
  manufacturer: string;
  code: string;
  normalizedManufacturer: string;
  normalizedCode: string;
}> {
  return flattenProductOemCodes(product).map((entry) => ({
    productId,
    manufacturer: entry.manufacturer,
    code: entry.code,
    normalizedManufacturer: entry.normalizedManufacturer,
    normalizedCode: entry.normalizedCode,
  }));
}

async function ensureOemIndexSynced(db: any): Promise<void> {
  if (oemIndexSyncPromise) {
    await oemIndexSyncPromise;
    return;
  }

  oemIndexSyncPromise = (async () => {
    const [productCountRows, indexedProductCountRows] = await Promise.all([
      db.select({ count: sql<number>`COUNT(*)` }).from(products),
      db
        .select({
          count: sql<number>`COUNT(DISTINCT ${productOemIndex.productId})`,
        })
        .from(productOemIndex),
    ]);

    const productCount = Number(productCountRows[0]?.count ?? 0);
    const indexedProductCount = Number(indexedProductCountRows[0]?.count ?? 0);

    if (productCount === 0 || indexedProductCount >= productCount) return;

    const allProducts = await db
      .select({ id: products.id, oemCodes: products.oemCodes })
      .from(products);

    const rows = allProducts.flatMap((product: { id: string; oemCodes: unknown }) =>
      buildProductOemIndexRows(product.id, {
        oemCodes: product.oemCodes as Product["oemCodes"],
      })
    );

    await db.transaction(async (tx: any) => {
      await tx.delete(productOemIndex);
      if (rows.length > 0) {
        await tx.insert(productOemIndex).values(rows);
      }
    });
  })();

  try {
    await oemIndexSyncPromise;
  } catch (error) {
    oemIndexSyncPromise = null;
    throw error;
  }
}

function scoreProductMatch(
  product: Product,
  oemRows: ProductOemFlat[],
  normalizedQuery: string,
  queryTokens: string[]
): ProductSearchResultItem | null {
  const normalizedTitle = normalizeSearchText(product.title);
  const normalizedSubtitle = normalizeSearchText(product.subtitle);
  const normalizedCategory = normalizeSearchText(product.category);
  const normalizedSubcategory = normalizeSearchText(product.subcategory || "");
  const normalizedDescription = normalizeSearchText(product.description);
  const combinedTitle = `${normalizedTitle} ${normalizedSubtitle}`.trim();

  const matchCandidates: Array<{
    score: number;
    matchType: ProductSearchMatchType;
    matchedValue: string;
  }> = [];

  const pushMatch = (
    score: number,
    matchType: ProductSearchMatchType,
    matchedValue: string
  ) => {
    if (score <= 0) return;
    matchCandidates.push({ score, matchType, matchedValue });
  };

  oemRows.forEach((row) => {
    if (row.normalizedCode === normalizedQuery) {
      pushMatch(260, "oemCode", row.code);
      return;
    }
    if (row.normalizedCode.includes(normalizedQuery)) {
      pushMatch(230, "oemCode", row.code);
    }
    if (row.normalizedManufacturer.includes(normalizedQuery)) {
      pushMatch(130, "oemCode", row.code);
    }
    const codeSimilarity = diceSimilarity(normalizedQuery, row.normalizedCode);
    if (codeSimilarity >= 0.62) {
      pushMatch(Math.round(140 + codeSimilarity * 80), "oemCode", row.code);
    }
  });

  if (combinedTitle === normalizedQuery) {
    pushMatch(220, "productName", product.title);
  }
  if (
    normalizedTitle.includes(normalizedQuery) ||
    normalizedSubtitle.includes(normalizedQuery)
  ) {
    pushMatch(190, "productName", product.title);
  }
  if (normalizedCategory.includes(normalizedQuery)) {
    pushMatch(140, "productName", product.category);
  }
  if (normalizedSubcategory.includes(normalizedQuery)) {
    pushMatch(130, "productName", product.subcategory || product.category);
  }

  if (queryTokens.length > 1) {
    const allTokensInTitle = queryTokens.every(
      (token) => combinedTitle.includes(token) || normalizedCategory.includes(token)
    );
    if (allTokensInTitle) {
      pushMatch(170, "productName", product.title);
    }
  }

  if (normalizedDescription.includes(normalizedQuery)) {
    pushMatch(110, "description", product.description);
  }

  const titleSimilarity = diceSimilarity(normalizedQuery, combinedTitle);
  if (titleSimilarity >= 0.55) {
    pushMatch(Math.round(110 + titleSimilarity * 70), "productName", product.title);
  }

  const categorySimilarity = diceSimilarity(
    normalizedQuery,
    `${normalizedCategory} ${normalizedSubcategory}`.trim()
  );
  if (categorySimilarity >= 0.58) {
    pushMatch(
      Math.round(85 + categorySimilarity * 60),
      "productName",
      product.subcategory || product.category
    );
  }

  const descriptionSimilarity = diceSimilarity(normalizedQuery, normalizedDescription);
  if (descriptionSimilarity >= 0.62) {
    pushMatch(
      Math.round(70 + descriptionSimilarity * 50),
      "description",
      product.description
    );
  }

  if (matchCandidates.length === 0) return null;

  const bestMatch = matchCandidates.sort((a, b) => b.score - a.score)[0];
  const threshold = normalizedQuery.length <= 2 ? 140 : 80;
  if (bestMatch.score < threshold) return null;

  const manufacturerMap = new Map<string, string>();
  oemRows.forEach((row) => {
    if (!manufacturerMap.has(row.normalizedManufacturer)) {
      manufacturerMap.set(row.normalizedManufacturer, row.manufacturer);
    }
  });

  return {
    product,
    score: bestMatch.score,
    matchType: bestMatch.matchType,
    matchedValue: bestMatch.matchedValue,
    manufacturers: Array.from(manufacturerMap.values()),
    normalizedManufacturers: Array.from(manufacturerMap.keys()),
  };
}

export const contentRouter = router({
  products: router({
    list: publicProcedure.query(async () => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      return db.select().from(products).orderBy(desc(products.createdAt));
    }),

    get: publicProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const rows = await db
          .select()
          .from(products)
          .where(eq(products.id, input.id))
          .limit(1);
        return rows[0] ?? null;
      }),

    search: publicProcedure
      .input(
        z.object({
          query: z.string().trim().min(1).max(160),
          category: z.string().trim().optional(),
          subcategory: z.string().trim().optional(),
          manufacturer: z.string().trim().optional(),
          sortBy: z.enum(["relevance", "name"]).optional(),
          page: z.number().int().min(1).optional(),
          pageSize: z.number().int().min(1).max(100).optional(),
        })
      )
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        await ensureOemIndexSynced(db);

        const normalizedQuery = normalizeSearchText(input.query);
        if (!normalizedQuery) {
          return {
            items: [] as Array<{
              product: Product;
              score: number;
              matchType: ProductSearchMatchType;
              matchedValue: string;
            }>,
            total: 0,
            page: 1,
            pageSize: input.pageSize ?? 24,
            totalPages: 0,
            facets: {
              categories: [] as Array<{ value: string; count: number }>,
              subcategories: [] as Array<{
                category: string;
                value: string;
                count: number;
              }>,
              manufacturers: [] as Array<{ value: string; count: number }>,
            },
          };
        }

        const queryTokens = splitSearchTokens(input.query);
        const queryPattern = `%${input.query.toLowerCase()}%`;
        const normalizedPattern = `%${normalizedQuery}%`;

        const [oemCandidateRows, textCandidateRows] = await Promise.all([
          db
            .select({
              productId: productOemIndex.productId,
              manufacturer: productOemIndex.manufacturer,
              code: productOemIndex.code,
              normalizedManufacturer: productOemIndex.normalizedManufacturer,
              normalizedCode: productOemIndex.normalizedCode,
            })
            .from(productOemIndex)
            .where(
              or(
                like(productOemIndex.normalizedCode, normalizedPattern),
                like(productOemIndex.normalizedManufacturer, normalizedPattern)
              )
            )
            .limit(4000),
          db
            .select()
            .from(products)
            .where(
              sql`LOWER(${products.title}) LIKE ${queryPattern}
                  OR LOWER(${products.subtitle}) LIKE ${queryPattern}
                  OR LOWER(${products.category}) LIKE ${queryPattern}
                  OR LOWER(${products.subcategory}) LIKE ${queryPattern}
                  OR LOWER(${products.description}) LIKE ${queryPattern}`
            )
            .orderBy(desc(products.updatedAt))
            .limit(SEARCH_CANDIDATE_LIMIT),
        ]);

        const candidateIdSet = new Set<string>();
        oemCandidateRows.forEach((row) => candidateIdSet.add(row.productId));
        textCandidateRows.forEach((row) => candidateIdSet.add(row.id));

        const candidateIds = Array.from(candidateIdSet);
        const candidateProducts =
          candidateIds.length === 0
            ? await db
                .select()
                .from(products)
                .orderBy(desc(products.updatedAt))
                .limit(SEARCH_CANDIDATE_LIMIT)
            : candidateIds.length === 1
              ? await db
                  .select()
                  .from(products)
                  .where(eq(products.id, candidateIds[0]))
                  .limit(SEARCH_CANDIDATE_LIMIT)
              : await db
                  .select()
                  .from(products)
                  .where(inArray(products.id, candidateIds))
                  .limit(SEARCH_CANDIDATE_LIMIT);

        const oemRowsForCandidates =
          candidateProducts.length === 0
            ? []
            : candidateProducts.length === 1
              ? await db
                  .select({
                    productId: productOemIndex.productId,
                    manufacturer: productOemIndex.manufacturer,
                    code: productOemIndex.code,
                    normalizedManufacturer: productOemIndex.normalizedManufacturer,
                    normalizedCode: productOemIndex.normalizedCode,
                  })
                  .from(productOemIndex)
                  .where(eq(productOemIndex.productId, candidateProducts[0].id))
                  .limit(1000)
              : await db
                  .select({
                    productId: productOemIndex.productId,
                    manufacturer: productOemIndex.manufacturer,
                    code: productOemIndex.code,
                    normalizedManufacturer: productOemIndex.normalizedManufacturer,
                    normalizedCode: productOemIndex.normalizedCode,
                  })
                  .from(productOemIndex)
                  .where(
                    inArray(
                      productOemIndex.productId,
                      candidateProducts.map((product) => product.id)
                    )
                  )
                  .limit(10000);

        const indexedOemMap = new Map<string, ProductOemFlat[]>();
        oemRowsForCandidates.forEach((row) => {
          const existing = indexedOemMap.get(row.productId) ?? [];
          existing.push({
            manufacturer: row.manufacturer,
            code: row.code,
            normalizedManufacturer: row.normalizedManufacturer,
            normalizedCode: row.normalizedCode,
          });
          indexedOemMap.set(row.productId, existing);
        });

        let scored = candidateProducts
          .map((product) => {
            const indexedOemRows = indexedOemMap.get(product.id) ?? [];
            const fallbackOemRows = flattenProductOemCodes(product);
            const mergedByKey = new Map<string, ProductOemFlat>();

            [...indexedOemRows, ...fallbackOemRows].forEach((row) => {
              const key = `${row.normalizedManufacturer}::${row.normalizedCode}`;
              if (!mergedByKey.has(key)) {
                mergedByKey.set(key, row);
              }
            });

            return scoreProductMatch(
              product,
              Array.from(mergedByKey.values()),
              normalizedQuery,
              queryTokens
            );
          })
          .filter((item): item is ProductSearchResultItem => Boolean(item));

        const categoryFilter = input.category?.trim();
        const subcategoryFilter = input.subcategory?.trim();
        const manufacturerFilter = normalizeSearchText(input.manufacturer ?? "");

        if (categoryFilter) {
          scored = scored.filter((item) => item.product.category === categoryFilter);
        }
        if (subcategoryFilter) {
          scored = scored.filter(
            (item) => (item.product.subcategory || "") === subcategoryFilter
          );
        }
        if (manufacturerFilter) {
          scored = scored.filter((item) =>
            item.normalizedManufacturers.some(
              (manufacturer) =>
                manufacturer === manufacturerFilter ||
                manufacturer.includes(manufacturerFilter)
            )
          );
        }

        const categoryCountMap = new Map<string, number>();
        const subcategoryCountMap = new Map<string, { category: string; count: number }>();
        const manufacturerCountMap = new Map<string, { label: string; count: number }>();

        scored.forEach((item) => {
          const category = item.product.category;
          categoryCountMap.set(category, (categoryCountMap.get(category) ?? 0) + 1);

          const subcategory = item.product.subcategory?.trim();
          if (subcategory) {
            const subcategoryKey = `${category}::${subcategory}`;
            const existing = subcategoryCountMap.get(subcategoryKey);
            if (existing) {
              existing.count += 1;
            } else {
              subcategoryCountMap.set(subcategoryKey, { category, count: 1 });
            }
          }

          const seenManufacturers = new Set<string>();
          item.manufacturers.forEach((manufacturer, index) => {
            const normalized = item.normalizedManufacturers[index];
            if (!normalized || seenManufacturers.has(normalized)) return;
            seenManufacturers.add(normalized);

            const current = manufacturerCountMap.get(normalized);
            if (current) {
              current.count += 1;
            } else {
              manufacturerCountMap.set(normalized, {
                label: manufacturer,
                count: 1,
              });
            }
          });
        });

        if (input.sortBy === "name") {
          scored.sort((left, right) =>
            left.product.title.localeCompare(right.product.title, "tr")
          );
        } else {
          scored.sort((left, right) => {
            if (right.score !== left.score) return right.score - left.score;
            return left.product.title.localeCompare(right.product.title, "tr");
          });
        }

        const pageSize = input.pageSize ?? 24;
        const total = scored.length;
        const totalPages = total > 0 ? Math.ceil(total / pageSize) : 0;
        const requestedPage = input.page ?? 1;
        const page = totalPages > 0 ? Math.min(requestedPage, totalPages) : requestedPage;
        const offset = (page - 1) * pageSize;
        const pagedItems = scored.slice(offset, offset + pageSize);

        return {
          items: pagedItems.map((item) => ({
            product: item.product,
            score: item.score,
            matchType: item.matchType,
            matchedValue: item.matchedValue,
          })),
          total,
          page,
          pageSize,
          totalPages,
          facets: {
            categories: Array.from(categoryCountMap.entries())
              .map(([value, count]) => ({ value, count }))
              .sort((left, right) => {
                if (right.count !== left.count) return right.count - left.count;
                return left.value.localeCompare(right.value, "tr");
              }),
            subcategories: Array.from(subcategoryCountMap.entries())
              .map(([key, value]) => {
                const [, subcategory] = key.split("::");
                return {
                  category: value.category,
                  value: subcategory || "",
                  count: value.count,
                };
              })
              .sort((left, right) => {
                if (right.count !== left.count) return right.count - left.count;
                const categoryCompare = left.category.localeCompare(
                  right.category,
                  "tr"
                );
                if (categoryCompare !== 0) return categoryCompare;
                return left.value.localeCompare(right.value, "tr");
              }),
            manufacturers: Array.from(manufacturerCountMap.entries())
              .map(([, value]) => ({
                value: value.label,
                count: value.count,
              }))
              .sort((left, right) => {
                if (right.count !== left.count) return right.count - left.count;
                return left.value.localeCompare(right.value, "tr");
              }),
          },
        };
      }),

    autocomplete: publicProcedure
      .input(
        z.object({
          query: z.string().trim().min(1).max(120),
          limit: z.number().int().min(1).max(20).optional(),
        })
      )
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        await ensureOemIndexSynced(db);

        const normalizedQuery = normalizeSearchText(input.query);
        if (!normalizedQuery) return [];

        const queryPattern = `%${input.query.toLowerCase()}%`;
        const normalizedPattern = `%${normalizedQuery}%`;
        const limit = input.limit ?? 8;

        const [oemRows, productRows] = await Promise.all([
          db
            .select({
              code: productOemIndex.code,
              manufacturer: productOemIndex.manufacturer,
            })
            .from(productOemIndex)
            .where(
              or(
                like(productOemIndex.normalizedCode, normalizedPattern),
                like(productOemIndex.normalizedManufacturer, normalizedPattern)
              )
            )
            .orderBy(asc(productOemIndex.code))
            .limit(limit * 4),
          db
            .select({
              id: products.id,
              title: products.title,
              subtitle: products.subtitle,
              category: products.category,
              subcategory: products.subcategory,
            })
            .from(products)
            .where(
              sql`LOWER(${products.title}) LIKE ${queryPattern}
                  OR LOWER(${products.subtitle}) LIKE ${queryPattern}
                  OR LOWER(${products.category}) LIKE ${queryPattern}
                  OR LOWER(${products.subcategory}) LIKE ${queryPattern}`
            )
            .orderBy(desc(products.updatedAt))
            .limit(limit * 4),
        ]);

        const suggestions: Array<{
          id: string;
          label: string;
          type: "oem" | "product" | "category";
          value: string;
          icon?: string;
        }> = [];
        const seenValues = new Set<string>();

        oemRows.forEach((row) => {
          const key = `oem:${row.code.toLowerCase()}`;
          if (seenValues.has(key)) return;
          seenValues.add(key);
          suggestions.push({
            id: `oem-${row.code}`,
            label: row.code,
            type: "oem",
            value: row.code,
            icon: row.manufacturer,
          });
        });

        productRows.forEach((row) => {
          const value = row.title;
          const key = `product:${value.toLowerCase()}`;
          if (seenValues.has(key)) return;
          seenValues.add(key);
          suggestions.push({
            id: `product-${row.id}`,
            label: `${row.title} - ${row.subtitle}`,
            type: "product",
            value,
          });
        });

        productRows.forEach((row) => {
          const categoryLabel = row.subcategory
            ? `${row.category} / ${row.subcategory}`
            : row.category;
          const key = `category:${categoryLabel.toLowerCase()}`;
          if (seenValues.has(key)) return;
          seenValues.add(key);
          suggestions.push({
            id: `category-${categoryLabel}`,
            label: categoryLabel,
            type: "category",
            value: categoryLabel,
          });
        });

        return suggestions.slice(0, limit);
      }),
  }),

  articles: router({
    list: publicProcedure
      .input(
        z
          .object({
            publishedOnly: z.boolean().optional(),
            limit: z.number().int().min(1).max(100).optional(),
          })
          .optional(),
      )
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        const publishedOnly = input?.publishedOnly ?? true;
        const limit = input?.limit ?? 24;

        const query = db.select().from(articles);
        const rows = publishedOnly
          ? await query
              .where(eq(articles.published, 1))
              .orderBy(desc(articles.publishedAt), desc(articles.createdAt))
              .limit(limit)
          : await query.orderBy(desc(articles.createdAt)).limit(limit);

        return rows;
      }),

    get: publicProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const rows = await db
          .select()
          .from(articles)
          .where(and(eq(articles.id, input.id), eq(articles.published, 1)))
          .limit(1);
        return rows[0] ?? null;
      }),
  }),

  pageContent: router({
    list: publicProcedure.query(async () => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      return db.select().from(pageContent).orderBy(pageContent.section);
    }),

    get: publicProcedure
      .input(z.object({ section: z.string() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const rows = await db
          .select()
          .from(pageContent)
          .where(eq(pageContent.section, input.section))
          .limit(1);
        return rows[0] ?? null;
      }),
  }),

  settings: router({
    list: publicProcedure.query(async () => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const rows = await db
        .select()
        .from(settings)
        .where(
          or(
            inArray(settings.key, PUBLIC_SETTING_KEYS),
            like(settings.key, `${PUBLIC_SETTING_PREFIX}%`)
          )
        )
        .orderBy(settings.key);
      return rows.map((item) => ({
        ...item,
        parsedValue: parseSettingValue(item.value, item.type),
      }));
    }),

    get: publicProcedure
      .input(z.object({ key: z.string() }))
      .query(async ({ input }) => {
        if (!isPublicSettingKey(input.key)) return null;
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const rows = await db
          .select()
          .from(settings)
          .where(eq(settings.key, input.key))
          .limit(1);
        const item = rows[0];
        if (!item) return null;
        return {
          ...item,
          parsedValue: parseSettingValue(item.value, item.type),
        };
      }),
  }),
});
