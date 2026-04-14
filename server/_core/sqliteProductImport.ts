import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdtemp, rm, unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { inArray, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import {
  productOemIndex,
  products,
  settings,
  type InsertProductOemIndex,
  type Product,
  type Setting,
} from "../../drizzle/schema";
import { PRODUCT_TAXONOMY_SETTING_KEY } from "../../shared/const";

const execFileAsync = promisify(execFile);
const SQLITE_IMPORT_SOURCE = "supplier_sqlite";
const SQLITE_MAX_BUFFER = 50 * 1024 * 1024;

type SupplierProductRow = Record<string, unknown>;
type SupplierCategoryRow = Record<string, unknown>;
type SupplierBrandRow = Record<string, unknown>;

type ProductTaxonomySubcategory = {
  id: string;
  nameTr: string;
  nameEn: string;
};

type ProductTaxonomyCategory = {
  id: string;
  nameTr: string;
  nameEn: string;
  subcategories: ProductTaxonomySubcategory[];
};

type ProductTaxonomy = ProductTaxonomyCategory[];

type PreparedImportProduct = {
  sourceImportKey: string;
  product: Product;
};

export type SqliteImportSummary = {
  fileName: string;
  detectedTables: string[];
  detectedProductColumns: string[];
  totalRows: number;
  importedRows: number;
  skippedRows: number;
  createdCount: number;
  updatedCount: number;
  categoriesFound: number;
  brandsFound: number;
  taxonomyCategoriesAdded: number;
  taxonomyCategoriesUpdated: number;
  taxonomySubcategoriesAdded: number;
};

function normalizeTurkishText(value: string): string {
  return value
    .toLowerCase()
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .trim();
}

function normalizeLabel(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function createStableId(label: string): string {
  return (
    normalizeTurkishText(label)
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .replace(/-{2,}/g, "-") || `id-${Date.now().toString(36)}`
  );
}

function fitVarchar(value: string, maxLength: number): string {
  return value.length <= maxLength ? value : value.slice(0, maxLength);
}

function sanitizeUploadFileName(value: string): string {
  const trimmed = value.trim();
  const sanitized = trimmed.replace(/[/\\]+/g, "-");
  return sanitized || "products.db";
}

function parseIntLike(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.trunc(value);
  }
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return Math.trunc(parsed);
    }
  }
  return null;
}

function buildSourceImportKey(row: SupplierProductRow): string {
  const logicalRef = parseIntLike(row.LOGICALREF);
  if (logicalRef !== null) {
    return `${SQLITE_IMPORT_SOURCE}:logicalref:${logicalRef}`;
  }

  const code = normalizeLabel(row.CODE);
  if (code) {
    return `${SQLITE_IMPORT_SOURCE}:code:${normalizeTurkishText(code)}`;
  }

  const fallback = JSON.stringify(row);
  return `${SQLITE_IMPORT_SOURCE}:hash:${createHash("sha1").update(fallback).digest("hex")}`;
}

function buildProductId(sourceImportKey: string): string {
  return `imp_${createHash("sha1").update(sourceImportKey).digest("hex").slice(0, 24)}`;
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

function buildProductOemIndexRows(
  productId: string,
  oemCodes: Array<{ manufacturer: string; codes: string[] }>
): InsertProductOemIndex[] {
  const rows: InsertProductOemIndex[] = [];
  const seen = new Set<string>();

  oemCodes.forEach((group) => {
    const manufacturer = group.manufacturer.trim();
    if (!manufacturer) return;
    const normalizedManufacturer = normalizeSearchText(manufacturer);
    if (!normalizedManufacturer) return;

    group.codes.forEach((rawCode) => {
      const code = rawCode.trim();
      if (!code) return;
      const normalizedCode = normalizeSearchText(code);
      if (!normalizedCode) return;

      const dedupeKey = `${normalizedManufacturer}::${normalizedCode}`;
      if (seen.has(dedupeKey)) return;
      seen.add(dedupeKey);

      rows.push({
        productId,
        manufacturer,
        code,
        normalizedManufacturer,
        normalizedCode,
      });
    });
  });

  return rows;
}

function ensureJsonArray<T>(value: string): T[] {
  const trimmed = value.trim();
  if (!trimmed) return [];
  const parsed = JSON.parse(trimmed);
  return Array.isArray(parsed) ? (parsed as T[]) : [];
}

async function runSqliteJsonQuery<T>(dbPath: string, query: string): Promise<T[]> {
  try {
    const { stdout } = await execFileAsync(
      "sqlite3",
      ["-json", dbPath, query],
      { maxBuffer: SQLITE_MAX_BUFFER }
    );
    return ensureJsonArray<T>(stdout);
  } catch (error: any) {
    if (error?.code === "ENOENT") {
      throw new Error(
        "Sunucuda sqlite3 komutu bulunamadi. SQLite importu icin sqlite3 kurulumu gerekli."
      );
    }
    throw error;
  }
}

function parseExistingTaxonomy(value: string | null, type: string | null): ProductTaxonomy {
  if (!value || type !== "json") return [];

  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((item): ProductTaxonomyCategory | null => {
        if (!item || typeof item !== "object") return null;
        const raw = item as Record<string, unknown>;
        const nameTr = normalizeLabel(raw.nameTr);
        const nameEn = normalizeLabel(raw.nameEn) || nameTr;
        if (!nameTr && !nameEn) return null;

        const subcategories = Array.isArray(raw.subcategories)
          ? raw.subcategories
              .map((subcategory): ProductTaxonomySubcategory | null => {
                if (!subcategory || typeof subcategory !== "object") return null;
                const rawSub = subcategory as Record<string, unknown>;
                const subNameTr = normalizeLabel(rawSub.nameTr);
                const subNameEn = normalizeLabel(rawSub.nameEn) || subNameTr;
                if (!subNameTr && !subNameEn) return null;
                return {
                  id: fitVarchar(
                    normalizeLabel(rawSub.id) ||
                      createStableId(`${nameTr || nameEn}-${subNameTr || subNameEn}`),
                    128
                  ),
                  nameTr: subNameTr || subNameEn,
                  nameEn: subNameEn || subNameTr,
                };
              })
              .filter(
                (subcategory): subcategory is ProductTaxonomySubcategory =>
                  Boolean(subcategory)
              )
          : [];

        return {
          id: fitVarchar(normalizeLabel(raw.id) || createStableId(nameTr || nameEn), 128),
          nameTr: nameTr || nameEn,
          nameEn: nameEn || nameTr,
          subcategories,
        };
      })
      .filter((category): category is ProductTaxonomyCategory => Boolean(category));
  } catch {
    return [];
  }
}

function findCategory(
  taxonomy: ProductTaxonomy,
  nameTr: string,
  nameEn: string
): ProductTaxonomyCategory | null {
  const normalizedTr = normalizeTurkishText(nameTr);
  const normalizedEn = normalizeTurkishText(nameEn);

  return (
    taxonomy.find((category) => {
      const categoryTr = normalizeTurkishText(category.nameTr);
      const categoryEn = normalizeTurkishText(category.nameEn);
      return (
        (normalizedTr && (categoryTr === normalizedTr || categoryEn === normalizedTr)) ||
        (normalizedEn && (categoryTr === normalizedEn || categoryEn === normalizedEn))
      );
    }) ?? null
  );
}

function findSubcategory(
  category: ProductTaxonomyCategory,
  nameTr: string,
  nameEn: string
): ProductTaxonomySubcategory | null {
  const normalizedTr = normalizeTurkishText(nameTr);
  const normalizedEn = normalizeTurkishText(nameEn);

  return (
    category.subcategories.find((subcategory) => {
      const subTr = normalizeTurkishText(subcategory.nameTr);
      const subEn = normalizeTurkishText(subcategory.nameEn);
      return (
        (normalizedTr && (subTr === normalizedTr || subEn === normalizedTr)) ||
        (normalizedEn && (subTr === normalizedEn || subEn === normalizedEn))
      );
    }) ?? null
  );
}

function mergeImportedTaxonomy(
  current: ProductTaxonomy,
  categoryRows: SupplierCategoryRow[],
  importedProducts: Product[]
): {
  taxonomy: ProductTaxonomy;
  categoriesAdded: number;
  categoriesUpdated: number;
  subcategoriesAdded: number;
} {
  const taxonomy = current.map((category) => ({
    ...category,
    subcategories: [...category.subcategories],
  }));

  let categoriesAdded = 0;
  let categoriesUpdated = 0;
  let subcategoriesAdded = 0;

  categoryRows.forEach((row) => {
    const nameTr = normalizeLabel(row.urun_kat_tr);
    const nameEn = normalizeLabel(row.urun_kat_eng) || nameTr;
    if (!nameTr && !nameEn) return;

    const existing = findCategory(taxonomy, nameTr, nameEn);
    if (!existing) {
      taxonomy.push({
        id: fitVarchar(createStableId(nameTr || nameEn), 128),
        nameTr: nameTr || nameEn,
        nameEn: nameEn || nameTr,
        subcategories: [],
      });
      categoriesAdded += 1;
      return;
    }

    const nextNameTr = existing.nameTr || nameTr || existing.nameEn;
    const importedNameEn = nameEn || existing.nameEn || existing.nameTr;
    const shouldUpdateNameEn =
      importedNameEn &&
      (!existing.nameEn ||
        normalizeTurkishText(existing.nameEn) === normalizeTurkishText(existing.nameTr));

    if (existing.nameTr !== nextNameTr || (shouldUpdateNameEn && existing.nameEn !== importedNameEn)) {
      existing.nameTr = nextNameTr;
      if (shouldUpdateNameEn) {
        existing.nameEn = importedNameEn;
      }
      categoriesUpdated += 1;
    }
  });

  importedProducts.forEach((product) => {
    const categoryName = normalizeLabel(product.category);
    if (!categoryName) return;

    let category = findCategory(taxonomy, categoryName, categoryName);
    if (!category) {
      category = {
        id: fitVarchar(createStableId(categoryName), 128),
        nameTr: categoryName,
        nameEn: categoryName,
        subcategories: [],
      };
      taxonomy.push(category);
      categoriesAdded += 1;
    }

    const subcategoryName = normalizeLabel(product.subcategory);
    if (!subcategoryName) return;

    const existingSubcategory = findSubcategory(
      category,
      subcategoryName,
      subcategoryName
    );
    if (existingSubcategory) return;

    category.subcategories.push({
      id: fitVarchar(createStableId(`${category.id}-${subcategoryName}`), 128),
      nameTr: subcategoryName,
      nameEn: subcategoryName,
    });
    subcategoriesAdded += 1;
  });

  taxonomy.sort((left, right) => left.nameTr.localeCompare(right.nameTr, "tr"));
  taxonomy.forEach((category) => {
    category.subcategories.sort((left, right) =>
      left.nameTr.localeCompare(right.nameTr, "tr")
    );
  });

  return {
    taxonomy,
    categoriesAdded,
    categoriesUpdated,
    subcategoriesAdded,
  };
}

function buildProductDescription(params: {
  title: string;
  category: string;
  brand: string;
  code: string;
  region: string;
}): string {
  const segments = [
    params.category ? `${params.category} kategorisinde` : "",
    params.brand ? `${params.brand} marka` : "",
    params.code ? `ürün kodu ${params.code}` : "",
    params.region ? `${params.region} bölgesi kaydı` : "",
  ].filter(Boolean);

  if (segments.length === 0) {
    return `${params.title} ürünü tedarikçi veri tabanından içe aktarıldı.`;
  }

  return `${params.title} ürünü ${segments.join(", ")} ile tedarikçi veri tabanından içe aktarıldı.`;
}

function buildProductSpecifications(params: {
  code: string;
  brand: string;
  category: string;
  logicalRef: number | null;
  specCode: string;
  region: string;
  channel: string;
}): Record<string, string> {
  const specifications: Record<string, string> = {};
  if (params.code) specifications["Ürün Kodu"] = params.code;
  if (params.brand) specifications["Marka"] = params.brand;
  if (params.category) specifications["Kaynak Kategori"] = params.category;
  if (params.logicalRef !== null) specifications["Kaynak Ref"] = String(params.logicalRef);
  if (params.specCode) specifications["Specode"] = params.specCode;
  if (params.region) specifications["Bölge"] = params.region;
  if (params.channel) specifications["Mecra"] = params.channel;
  return specifications;
}

function mapSupplierRowToProduct(
  row: SupplierProductRow,
  categoryLookup: Map<string, SupplierCategoryRow>,
  brandLookup: Map<number, SupplierBrandRow>,
  now: Date
): PreparedImportProduct | null {
  const sourceImportKey = buildSourceImportKey(row);
  const logicalRef = parseIntLike(row.LOGICALREF);
  const code = normalizeLabel(row.CODE);
  const title = normalizeLabel(row.NAME) || code;
  const category = normalizeLabel(row.kat);
  const specCode = normalizeLabel(row.SPECODE);
  const sourceBrandId = parseIntLike(row.marka_id);
  const fallbackBrand =
    sourceBrandId !== null ? normalizeLabel(brandLookup.get(sourceBrandId)?.firma_ismi) : "";
  const brand = normalizeLabel(row.marka) || fallbackBrand || specCode;
  const region = normalizeLabel(row.bolge_adi);
  const channel = normalizeLabel(row.mecra_adi);
  const subcategory = brand || code || category;

  if (!title || !category) {
    return null;
  }

  const matchedCategoryRow = categoryLookup.get(normalizeTurkishText(category));
  const categoryEn = normalizeLabel(matchedCategoryRow?.urun_kat_eng) || category;
  const oemManufacturer = brand || specCode || "OEM";
  const oemCodes = code
    ? [
        {
          manufacturer: oemManufacturer,
          codes: [code],
        },
      ]
    : [];

  const product: Product = {
    id: buildProductId(sourceImportKey),
    title,
    subtitle: code || brand || title,
    category,
    subcategory,
    description: buildProductDescription({
      title,
      category,
      brand,
      code,
      region,
    }),
    imageUrl: null,
    oemCodes,
    features: [],
    specifications: buildProductSpecifications({
      code,
      brand,
      category,
      logicalRef,
      specCode,
      region,
      channel,
    }),
    applications: [],
    certifications: [],
    catalogUrl: null,
    sourceType: SQLITE_IMPORT_SOURCE,
    sourceImportKey,
    sourceLogicalRef: logicalRef,
    sourceCode: fitVarchar(code, 255) || null,
    sourceSpecCode: fitVarchar(specCode, 191) || null,
    sourceBrand: fitVarchar(brand, 191) || null,
    sourceBrandId,
    sourceOtoUrunLogref: fitVarchar(normalizeLabel(row.oto_urun_logref), 191) || null,
    sourceKayitUrunLogref: parseIntLike(row.kayit_urun_logref),
    sourceRegion: fitVarchar(region, 191) || null,
    sourceChannel: fitVarchar(channel, 191) || null,
    sourceVisibility: parseIntLike(row.urun_final_gorunurluk),
    sourceIsVirtual: parseIntLike(row.sanal),
    sourceData: {
      rawProduct: row,
      rawCategory: matchedCategoryRow ?? null,
      rawBrand: sourceBrandId !== null ? brandLookup.get(sourceBrandId) ?? null : null,
      categoryEn,
    },
    sourceLastImportedAt: now,
    createdAt: now,
    updatedAt: now,
  };

  return {
    sourceImportKey,
    product,
  };
}

function isVisibleRow(row: SupplierProductRow): boolean {
  const visibility = parseIntLike(row.urun_final_gorunurluk);
  return visibility === null || visibility !== 0;
}

export async function importProductsFromSqliteBuffer(
  db: any,
  input: {
    file: Buffer | Uint8Array;
    fileName: string;
  }
): Promise<SqliteImportSummary> {
  const tempDir = await mkdtemp(join(tmpdir(), "vaden-sqlite-import-"));
  const safeFileName = sanitizeUploadFileName(input.fileName);
  const tempDbPath = join(tempDir, safeFileName);
  const fileBuffer = Buffer.isBuffer(input.file) ? input.file : Buffer.from(input.file);

  try {
    await writeFile(tempDbPath, fileBuffer);

    const tables = await runSqliteJsonQuery<{ name: string }>(
      tempDbPath,
      "SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name;"
    );
    const detectedTables = tables.map((item) => item.name).filter(Boolean);

    if (!detectedTables.includes("urunler")) {
      throw new Error("Yuklenen SQLite dosyasinda 'urunler' tablosu bulunamadi.");
    }

    const [categoryRows, brandRows, productRows] = await Promise.all([
      detectedTables.includes("urun_kategorileri")
        ? runSqliteJsonQuery<SupplierCategoryRow>(
            tempDbPath,
            "SELECT * FROM urun_kategorileri ORDER BY id;"
          )
        : Promise.resolve([]),
      detectedTables.includes("markalar")
        ? runSqliteJsonQuery<SupplierBrandRow>(
            tempDbPath,
            "SELECT * FROM markalar ORDER BY id;"
          )
        : Promise.resolve([]),
      runSqliteJsonQuery<SupplierProductRow>(
        tempDbPath,
        "SELECT * FROM urunler ORDER BY LOGICALREF;"
      ),
    ]);

    const now = new Date();
    const categoryLookup = new Map<string, SupplierCategoryRow>();
    categoryRows.forEach((row) => {
      const categoryName = normalizeLabel(row.urun_kat_tr);
      if (categoryName) {
        categoryLookup.set(normalizeTurkishText(categoryName), row);
      }
    });

    const brandLookup = new Map<number, SupplierBrandRow>();
    brandRows.forEach((row) => {
      const brandId = parseIntLike(row.id);
      if (brandId !== null) {
        brandLookup.set(brandId, row);
      }
    });

    const visibleRows = productRows.filter(isVisibleRow);
    const preparedProducts = visibleRows
      .map((row) => mapSupplierRowToProduct(row, categoryLookup, brandLookup, now))
      .filter((item): item is PreparedImportProduct => Boolean(item));

    const sourceKeys = preparedProducts.map((item) => item.sourceImportKey);
    const existingByImportKey = new Map<string, { id: string }>();

    if (sourceKeys.length > 0) {
      const existingRows = await db
        .select({ id: products.id, sourceImportKey: products.sourceImportKey })
        .from(products)
        .where(inArray(products.sourceImportKey, sourceKeys));

      existingRows.forEach((row: { id: string; sourceImportKey: string | null }) => {
        if (row.sourceImportKey) {
          existingByImportKey.set(row.sourceImportKey, { id: row.id });
        }
      });
    }

    let createdCount = 0;
    let updatedCount = 0;

    const taxonomySummary = await db.transaction(async (tx: any) => {
      for (const prepared of preparedProducts) {
        const existing = existingByImportKey.get(prepared.sourceImportKey);
        if (existing) {
          updatedCount += 1;
          const { id: _ignoredId, createdAt: _ignoredCreatedAt, ...updateData } =
            prepared.product;
          await tx
            .update(products)
            .set({
              ...updateData,
              updatedAt: now,
            })
            .where(eq(products.id, existing.id));
          prepared.product.id = existing.id;
          continue;
        }

        createdCount += 1;
        await tx.insert(products).values(prepared.product);
      }

      const importedProductIds = preparedProducts.map((item) => item.product.id);
      if (importedProductIds.length > 0) {
        await tx
          .delete(productOemIndex)
          .where(inArray(productOemIndex.productId, importedProductIds));

        const oemIndexRows = preparedProducts.flatMap((item) =>
          buildProductOemIndexRows(item.product.id, item.product.oemCodes)
        );

        if (oemIndexRows.length > 0) {
          await tx.insert(productOemIndex).values(oemIndexRows);
        }
      }

      const existingTaxonomySettingRows = await tx
        .select()
        .from(settings)
        .where(eq(settings.key, PRODUCT_TAXONOMY_SETTING_KEY))
        .limit(1);
      const existingTaxonomySetting = existingTaxonomySettingRows[0] ?? null;
      const mergedTaxonomy = mergeImportedTaxonomy(
        parseExistingTaxonomy(
          existingTaxonomySetting?.value ?? null,
          existingTaxonomySetting?.type ?? null
        ),
        categoryRows,
        preparedProducts.map((item) => item.product)
      );

      const serializedTaxonomy = JSON.stringify(mergedTaxonomy.taxonomy);
      if (existingTaxonomySetting) {
        await tx
          .update(settings)
          .set({
            value: serializedTaxonomy,
            type: "json",
            updatedAt: now,
          })
          .where(eq(settings.key, PRODUCT_TAXONOMY_SETTING_KEY));
      } else {
        const settingRow: Setting = {
          id: nanoid(),
          key: PRODUCT_TAXONOMY_SETTING_KEY,
          value: serializedTaxonomy,
          type: "json",
          createdAt: now,
          updatedAt: now,
        };
        await tx.insert(settings).values(settingRow);
      }

      return mergedTaxonomy;
    });

    return {
      fileName: safeFileName,
      detectedTables,
      detectedProductColumns: productRows[0] ? Object.keys(productRows[0]) : [],
      totalRows: productRows.length,
      importedRows: preparedProducts.length,
      skippedRows: productRows.length - preparedProducts.length,
      createdCount,
      updatedCount,
      categoriesFound: categoryRows.length,
      brandsFound: brandRows.length,
      taxonomyCategoriesAdded: taxonomySummary.categoriesAdded,
      taxonomyCategoriesUpdated: taxonomySummary.categoriesUpdated,
      taxonomySubcategoriesAdded: taxonomySummary.subcategoriesAdded,
    };
  } finally {
    await unlink(tempDbPath).catch(() => undefined);
    await rm(tempDir, { recursive: true, force: true }).catch(() => undefined);
  }
}
