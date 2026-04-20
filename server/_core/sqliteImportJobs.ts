import { createHash } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { desc, eq, inArray } from "drizzle-orm";
import { nanoid } from "nanoid";
import {
  type InsertSetting,
  productImportJobs,
  productImportLogs,
  productOemIndex,
  products,
  settings,
  type ProductImportJob,
  type Setting,
} from "../../drizzle/schema";
import { PRODUCT_TAXONOMY_SETTING_KEY } from "../../shared/const";
import { getDb } from "../db";
import {
  SQLITE_DEFAULT_CHUNK_SIZE,
  SQLITE_IMPORT_SOURCE,
  buildProductOemIndexRows,
  isVisibleRow,
  mapSupplierRowToProduct,
  mergeImportedTaxonomy,
  normalizeLabel,
  normalizeTurkishText,
  parseExistingTaxonomy,
  parseIntLike,
  runSqliteJsonQuery,
  sanitizeUploadFileName,
  type ExistingImportLogSummary,
  type SupplierBrandRow,
  type SupplierCategoryRow,
  type SupplierProductRow,
} from "./sqliteProductImport";

const IMPORT_RUNTIME_DIR = join(process.cwd(), "runtime", "imports");
const WORKER_INTERVAL_MS = 4_000;

type QueuedJobResponse = {
  duplicate: boolean;
  previousImport: ExistingImportLogSummary | null;
  existingJob: ProductImportJob | null;
  job: ProductImportJob | null;
};

type SupplierChunkRow = SupplierProductRow & {
  __rowid__: number;
};

let workerStarted = false;
let workerBusy = false;
let workerTimer: NodeJS.Timeout | null = null;

async function ensureImportRuntimeDir() {
  await mkdir(IMPORT_RUNTIME_DIR, { recursive: true });
}

function buildStoredImportPath(fileHash: string, fileName: string) {
  return join(IMPORT_RUNTIME_DIR, `${fileHash}-${sanitizeUploadFileName(fileName)}`);
}

async function readFileHash(file: Buffer | Uint8Array) {
  const buffer = Buffer.isBuffer(file) ? file : Buffer.from(file);
  return createHash("sha256").update(buffer).digest("hex");
}

async function loadSqliteMetadata(dbPath: string) {
  const tables = await runSqliteJsonQuery<{ name: string }>(
    dbPath,
    "SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name;",
  );
  const detectedTables = tables.map((item) => item.name).filter(Boolean);
  if (!detectedTables.includes("urunler")) {
    throw new Error("Yuklenen SQLite dosyasinda 'urunler' tablosu bulunamadi.");
  }

  const [categoryRows, brandRows, totalRowsResult, productColumnsRow] = await Promise.all([
    detectedTables.includes("urun_kategorileri")
      ? runSqliteJsonQuery<SupplierCategoryRow>(
          dbPath,
          "SELECT * FROM urun_kategorileri ORDER BY id;",
        )
      : Promise.resolve([]),
    detectedTables.includes("markalar")
      ? runSqliteJsonQuery<SupplierBrandRow>(dbPath, "SELECT * FROM markalar ORDER BY id;")
      : Promise.resolve([]),
    runSqliteJsonQuery<{ total: number }>(dbPath, "SELECT COUNT(*) as total FROM urunler;"),
    runSqliteJsonQuery<Record<string, unknown>>(
      dbPath,
      "SELECT * FROM urunler LIMIT 1;",
    ),
  ]);

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

  return {
    detectedTables,
    detectedProductColumns: productColumnsRow[0] ? Object.keys(productColumnsRow[0]) : [],
    totalRows: Number(totalRowsResult[0]?.total ?? 0),
    categoryRows,
    brandRows,
    categoryLookup,
    brandLookup,
  };
}

async function loadChunk(dbPath: string, lastProcessedRowId: number, chunkSize: number) {
  return runSqliteJsonQuery<SupplierChunkRow>(
    dbPath,
    `SELECT rowid as __rowid__, * FROM urunler WHERE rowid > ${lastProcessedRowId} ORDER BY rowid LIMIT ${chunkSize};`,
  );
}

async function getLatestImportLogByHash(
  db: any,
  fileHash: string,
): Promise<ExistingImportLogSummary | null> {
  const rows = await db
    .select({
      id: productImportLogs.id,
      fileName: productImportLogs.fileName,
      fileHash: productImportLogs.fileHash,
      createdCount: productImportLogs.createdCount,
      updatedCount: productImportLogs.updatedCount,
      importedAt: productImportLogs.importedAt,
    })
    .from(productImportLogs)
    .where(eq(productImportLogs.fileHash, fileHash))
    .orderBy(desc(productImportLogs.importedAt))
    .limit(1);

  return rows[0] ?? null;
}

async function getExistingQueuedJobByHash(
  db: any,
  fileHash: string,
): Promise<ProductImportJob | null> {
  const rows = await db
    .select()
    .from(productImportJobs)
    .where(eq(productImportJobs.fileHash, fileHash))
    .orderBy(desc(productImportJobs.createdAt))
    .limit(20);

  return (
    rows.find((job: ProductImportJob) => ["queued", "running"].includes(job.status)) ?? null
  );
}

export async function createSqliteImportJob(
  db: any,
  input: {
    file: Buffer | Uint8Array;
    fileName: string;
    chunkSize?: number;
  },
): Promise<QueuedJobResponse> {
  const buffer = Buffer.isBuffer(input.file) ? input.file : Buffer.from(input.file);
  const fileHash = await readFileHash(buffer);

  const [previousImport, existingJob] = await Promise.all([
    getLatestImportLogByHash(db, fileHash),
    getExistingQueuedJobByHash(db, fileHash),
  ]);

  if (previousImport) {
    return {
      duplicate: true,
      previousImport,
      existingJob,
      job: null,
    };
  }

  if (existingJob) {
    return {
      duplicate: false,
      previousImport: null,
      existingJob,
      job: existingJob,
    };
  }

  await ensureImportRuntimeDir();
  const storedPath = buildStoredImportPath(fileHash, input.fileName);
  await writeFile(storedPath, buffer);

  const metadata = await loadSqliteMetadata(storedPath);
  const now = new Date();
  const job = {
    id: nanoid(),
    sourceType: SQLITE_IMPORT_SOURCE,
    fileName: sanitizeUploadFileName(input.fileName),
    fileHash,
    filePath: storedPath,
    status: "queued" as const,
    totalRows: metadata.totalRows,
    processedRows: 0,
    createdCount: 0,
    updatedCount: 0,
    skippedCount: 0,
    lastProcessedKey: null,
    chunkSize: input.chunkSize ?? SQLITE_DEFAULT_CHUNK_SIZE,
    errorMessage: null,
    startedAt: null,
    finishedAt: null,
    createdAt: now,
    updatedAt: now,
  };

  await db.insert(productImportJobs).values(job);

  return {
    duplicate: false,
    previousImport: null,
    existingJob: null,
    job,
  };
}

async function processJob(job: ProductImportJob) {
  const db = await getDb();
  if (!db) return;

  const metadata = await loadSqliteMetadata(job.filePath);
  const now = new Date();
  let currentTaxonomySettingRows = await db
    .select()
    .from(settings)
    .where(eq(settings.key, PRODUCT_TAXONOMY_SETTING_KEY))
    .limit(1);
  let currentTaxonomySetting = currentTaxonomySettingRows[0] ?? null;
  let currentTaxonomy = parseExistingTaxonomy(
    currentTaxonomySetting?.value ?? null,
    currentTaxonomySetting?.type ?? null,
  );

  let lastProcessedRowId = Number(job.lastProcessedKey ?? 0);
  let processedRows = Number(job.processedRows ?? 0);
  let createdCount = Number(job.createdCount ?? 0);
  let updatedCount = Number(job.updatedCount ?? 0);
  let skippedCount = Number(job.skippedCount ?? 0);

  while (true) {
    const chunkRows = await loadChunk(job.filePath, lastProcessedRowId, job.chunkSize || SQLITE_DEFAULT_CHUNK_SIZE);
    if (chunkRows.length === 0) {
      break;
    }

    const chunkNow = new Date();
    const visibleRows = chunkRows.filter(isVisibleRow);
    const preparedProducts = visibleRows
      .map((row) =>
        mapSupplierRowToProduct(row, metadata.categoryLookup, metadata.brandLookup, chunkNow),
      )
      .filter((item): item is NonNullable<typeof item> => Boolean(item));

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

    const chunkCreated = preparedProducts.filter(
      (prepared) => !existingByImportKey.has(prepared.sourceImportKey),
    ).length;
    const chunkUpdated = preparedProducts.length - chunkCreated;
    const chunkSkipped = chunkRows.length - preparedProducts.length;
    const nextLastRowId = Number(chunkRows[chunkRows.length - 1]?.__rowid__ ?? lastProcessedRowId);
    const nextTaxonomy = mergeImportedTaxonomy(
      currentTaxonomy,
      metadata.categoryRows,
      preparedProducts.map((item) => item.product),
    );

    await db.transaction(async (tx: any) => {
      for (const prepared of preparedProducts) {
        const existing = existingByImportKey.get(prepared.sourceImportKey);
        if (existing) {
          const { id: _ignoredId, createdAt: _ignoredCreatedAt, ...updateData } = prepared.product;
          await tx
            .update(products)
            .set({
              ...updateData,
              updatedAt: chunkNow,
            })
            .where(eq(products.id, existing.id));
          prepared.product.id = existing.id;
        } else {
          await tx.insert(products).values(prepared.product);
        }
      }

      const importedProductIds = preparedProducts.map((item) => item.product.id);
      if (importedProductIds.length > 0) {
        await tx
          .delete(productOemIndex)
          .where(inArray(productOemIndex.productId, importedProductIds));

        const oemIndexRows = preparedProducts.flatMap((item) =>
          buildProductOemIndexRows(item.product.id, item.product.oemCodes),
        );
        if (oemIndexRows.length > 0) {
          await tx.insert(productOemIndex).values(oemIndexRows);
        }
      }

      const serializedTaxonomy = JSON.stringify(nextTaxonomy.taxonomy);
      if (currentTaxonomySetting) {
        await tx
          .update(settings)
          .set({
            value: serializedTaxonomy,
            type: "json",
            updatedAt: chunkNow,
          })
          .where(eq(settings.key, PRODUCT_TAXONOMY_SETTING_KEY));
      } else {
        const settingRow: InsertSetting = {
          id: nanoid(),
          key: PRODUCT_TAXONOMY_SETTING_KEY,
          value: serializedTaxonomy,
          type: "json",
          createdAt: chunkNow,
          updatedAt: chunkNow,
        };
        await tx.insert(settings).values(settingRow);
      }

      await tx
        .update(productImportJobs)
        .set({
          totalRows: metadata.totalRows,
          processedRows: processedRows + chunkRows.length,
          createdCount: createdCount + chunkCreated,
          updatedCount: updatedCount + chunkUpdated,
          skippedCount: skippedCount + chunkSkipped,
          lastProcessedKey: String(nextLastRowId),
          updatedAt: chunkNow,
        })
        .where(eq(productImportJobs.id, job.id));
    });

    currentTaxonomy = nextTaxonomy.taxonomy;
    currentTaxonomySetting = currentTaxonomySetting
      ? { ...currentTaxonomySetting, value: JSON.stringify(currentTaxonomy), type: "json" }
      : ({
          id: nanoid(),
          key: PRODUCT_TAXONOMY_SETTING_KEY,
          value: JSON.stringify(currentTaxonomy),
          type: "json",
          createdAt: chunkNow,
          updatedAt: chunkNow,
        } as Setting);
    lastProcessedRowId = nextLastRowId;
    processedRows += chunkRows.length;
    createdCount += chunkCreated;
    updatedCount += chunkUpdated;
    skippedCount += chunkSkipped;
  }

  const finishedAt = new Date();
  await db.transaction(async (tx: any) => {
    await tx.insert(productImportLogs).values({
      id: nanoid(),
      sourceType: SQLITE_IMPORT_SOURCE,
      fileName: job.fileName,
      fileHash: job.fileHash,
      totalRows: metadata.totalRows,
      importedRows: processedRows - skippedCount,
      skippedRows: skippedCount,
      createdCount,
      updatedCount,
      detectedTables: metadata.detectedTables,
      detectedProductColumns: metadata.detectedProductColumns,
      importedAt: finishedAt,
      createdAt: finishedAt,
      updatedAt: finishedAt,
    });

    await tx
      .update(productImportJobs)
      .set({
        status: "completed",
        totalRows: metadata.totalRows,
        processedRows,
        createdCount,
        updatedCount,
        skippedCount,
        lastProcessedKey: String(lastProcessedRowId),
        finishedAt,
        updatedAt: finishedAt,
        errorMessage: null,
      })
      .where(eq(productImportJobs.id, job.id));
  });

  await unlink(job.filePath).catch(() => undefined);
}

async function processNextQueuedJob() {
  if (workerBusy) return;
  workerBusy = true;

  try {
    const db = await getDb();
    if (!db) return;

    const queuedRows = await db
      .select()
      .from(productImportJobs)
      .where(eq(productImportJobs.status, "queued"))
      .orderBy(desc(productImportJobs.createdAt))
      .limit(1);
    const nextJob = queuedRows[0] as ProductImportJob | undefined;
    if (!nextJob) return;

    const startedAt = new Date();
    await db
      .update(productImportJobs)
      .set({
        status: "running",
        startedAt: nextJob.startedAt ?? startedAt,
        errorMessage: null,
        updatedAt: startedAt,
      })
      .where(eq(productImportJobs.id, nextJob.id));

    try {
      await processJob({
        ...nextJob,
        status: "running",
        startedAt: nextJob.startedAt ?? startedAt,
      });
    } catch (error) {
      const failedAt = new Date();
      await db
        .update(productImportJobs)
        .set({
          status: "failed",
          errorMessage: error instanceof Error ? error.message : "Import job failed",
          finishedAt: failedAt,
          updatedAt: failedAt,
        })
        .where(eq(productImportJobs.id, nextJob.id));
    }
  } finally {
    workerBusy = false;
  }
}

export async function recoverInterruptedImportJobs() {
  const db = await getDb();
  if (!db) return;
  await db
    .update(productImportJobs)
    .set({
      status: "queued",
      errorMessage: null,
      updatedAt: new Date(),
    })
    .where(eq(productImportJobs.status, "running"));
}

export function startSqliteImportWorker() {
  if (workerStarted) return;
  workerStarted = true;
  void recoverInterruptedImportJobs().finally(() => {
    void processNextQueuedJob();
    workerTimer = setInterval(() => {
      void processNextQueuedJob();
    }, WORKER_INTERVAL_MS);
    workerTimer.unref?.();
  });
}
