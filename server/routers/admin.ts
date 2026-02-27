import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  auditLogs,
  products,
  articles,
  pageContent,
  pageContentRevisions,
  productOemIndex,
  settings,
  users,
  type Product,
  type Article,
  type PageContent,
  type PageContentRevision,
  type InsertProductOemIndex,
  type Setting,
  type User,
} from "../../drizzle/schema";
import { sanitizeHtml, sanitizeUnknownDeep } from "../../shared/htmlSanitizer";
import {
  createPermissionProcedure,
  superAdminProcedure,
} from "../_core/adminAccess";
import { router } from "../_core/trpc";
import { getDb } from "../db";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { storagePut } from "../storage";

type ProductOemInput = Array<{ manufacturer: string; codes: string[] }>;

type SanitizedPageContentInput = {
  section: string;
  title?: string;
  content: string;
  imageUrl?: string;
  metadata?: Record<string, unknown>;
};

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
  oemCodes: ProductOemInput
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

async function replaceProductOemIndex(
  db: any,
  productId: string,
  oemCodes: ProductOemInput
) {
  await db.delete(productOemIndex).where(eq(productOemIndex.productId, productId));

  const rows = buildProductOemIndexRows(productId, oemCodes);
  if (rows.length > 0) {
    await db.insert(productOemIndex).values(rows);
  }
}

function sanitizePageContentInput(
  input: SanitizedPageContentInput
): SanitizedPageContentInput {
  return {
    ...input,
    title: typeof input.title === "string" ? sanitizeHtml(input.title) : input.title,
    content: sanitizeHtml(input.content),
    imageUrl:
      typeof input.imageUrl === "string" ? sanitizeHtml(input.imageUrl) : input.imageUrl,
    metadata:
      input.metadata !== undefined
        ? (sanitizeUnknownDeep(input.metadata) as Record<string, unknown>)
        : input.metadata,
  };
}

async function getNextRevisionNumber(db: any, section: string): Promise<number> {
  const latest = await db
    .select({ revisionNumber: pageContentRevisions.revisionNumber })
    .from(pageContentRevisions)
    .where(eq(pageContentRevisions.section, section))
    .orderBy(desc(pageContentRevisions.revisionNumber))
    .limit(1);
  return (latest[0]?.revisionNumber ?? 0) + 1;
}

type AdminPageContentItem = {
  section: string;
  published: PageContent | null;
  draft: PageContentRevision | null;
  latestPublishedRevision: PageContentRevision | null;
};

async function buildAdminPageContentItem(
  db: any,
  section: string
): Promise<AdminPageContentItem> {
  const [publishedRows, draftRows, publishedRevisionRows] = await Promise.all([
    db.select().from(pageContent).where(eq(pageContent.section, section)).limit(1),
    db
      .select()
      .from(pageContentRevisions)
      .where(
        and(
          eq(pageContentRevisions.section, section),
          eq(pageContentRevisions.status, "draft")
        )
      )
      .orderBy(
        desc(pageContentRevisions.revisionNumber),
        desc(pageContentRevisions.updatedAt)
      )
      .limit(1),
    db
      .select()
      .from(pageContentRevisions)
      .where(
        and(
          eq(pageContentRevisions.section, section),
          eq(pageContentRevisions.status, "published")
        )
      )
      .orderBy(
        desc(pageContentRevisions.revisionNumber),
        desc(pageContentRevisions.updatedAt)
      )
      .limit(1),
  ]);

  return {
    section,
    published: publishedRows[0] ?? null,
    draft: draftRows[0] ?? null,
    latestPublishedRevision: publishedRevisionRows[0] ?? null,
  };
}

async function listAdminPageContentItems(db: any): Promise<AdminPageContentItem[]> {
  const [publishedRows, draftRows, publishedRevisionRows] = await Promise.all([
    db.select().from(pageContent),
    db
      .select()
      .from(pageContentRevisions)
      .where(eq(pageContentRevisions.status, "draft"))
      .orderBy(
        desc(pageContentRevisions.revisionNumber),
        desc(pageContentRevisions.updatedAt)
      ),
    db
      .select()
      .from(pageContentRevisions)
      .where(eq(pageContentRevisions.status, "published"))
      .orderBy(
        desc(pageContentRevisions.revisionNumber),
        desc(pageContentRevisions.updatedAt)
      ),
  ]);

  const publishedBySection = new Map<string, PageContent>();
  publishedRows.forEach((row: PageContent) => {
    publishedBySection.set(row.section, row);
  });

  const draftBySection = new Map<string, PageContentRevision>();
  draftRows.forEach((row: PageContentRevision) => {
    if (!draftBySection.has(row.section)) {
      draftBySection.set(row.section, row);
    }
  });

  const latestPublishedRevisionBySection = new Map<string, PageContentRevision>();
  publishedRevisionRows.forEach((row: PageContentRevision) => {
    if (!latestPublishedRevisionBySection.has(row.section)) {
      latestPublishedRevisionBySection.set(row.section, row);
    }
  });

  const sectionSet = new Set<string>([
    ...Array.from(publishedBySection.keys()),
    ...Array.from(draftBySection.keys()),
    ...Array.from(latestPublishedRevisionBySection.keys()),
  ]);

  return Array.from(sectionSet)
    .sort((a, b) => a.localeCompare(b, "tr"))
    .map((section) => ({
      section,
      published: publishedBySection.get(section) ?? null,
      draft: draftBySection.get(section) ?? null,
      latestPublishedRevision: latestPublishedRevisionBySection.get(section) ?? null,
    }));
}

const productsProcedure = createPermissionProcedure("products:write");
const articlesProcedure = createPermissionProcedure("articles:write");
const contentProcedure = createPermissionProcedure("content:write");
const settingsProcedure = createPermissionProcedure("settings:write");
const storageProcedure = createPermissionProcedure("storage:upload");

function isSuperAdminLikeRole(role: unknown): boolean {
  return role === "super_admin" || role === "admin";
}

const createAdminUserInput = z.object({
  openId: z
    .string()
    .trim()
    .min(3, "openId en az 3 karakter olmalıdır.")
    .max(64, "openId en fazla 64 karakter olabilir.")
    .regex(
      /^[a-zA-Z0-9:_@.-]+$/,
      "openId yalnızca harf, rakam ve : _ @ . - karakterlerini içerebilir."
    ),
  name: z
    .string()
    .trim()
    .max(255, "İsim en fazla 255 karakter olabilir.")
    .optional()
    .or(z.literal("")),
  email: z
    .string()
    .trim()
    .email("Geçerli bir e-posta adresi girin.")
    .max(320, "E-posta en fazla 320 karakter olabilir.")
    .optional()
    .or(z.literal("")),
  loginMethod: z
    .string()
    .trim()
    .max(64, "Giriş yöntemi en fazla 64 karakter olabilir.")
    .optional()
    .or(z.literal("")),
  role: z.enum(["user", "content_editor", "super_admin"]),
});

export const adminRouter = router({
  // ===== USERS =====
  users: router({
    list: superAdminProcedure.query(async () => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      return db
        .select({
          id: users.id,
          openId: users.openId,
          name: users.name,
          email: users.email,
          role: users.role,
          loginMethod: users.loginMethod,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
          lastSignedIn: users.lastSignedIn,
        })
        .from(users)
        .orderBy(desc(users.lastSignedIn), desc(users.updatedAt));
    }),

    create: superAdminProcedure
      .input(createAdminUserInput)
      .mutation(async (opts: any) => {
        const { input } = opts;
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        const existingRows = await db
          .select({ id: users.id })
          .from(users)
          .where(eq(users.openId, input.openId))
          .limit(1);

        if (existingRows.length > 0) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Bu openId ile kayıtlı bir kullanıcı zaten var.",
          });
        }

        const now = new Date();

        try {
          await db.insert(users).values({
            openId: input.openId,
            name: input.name && input.name.length > 0 ? input.name : null,
            email:
              input.email && input.email.length > 0
                ? input.email.toLowerCase()
                : null,
            loginMethod:
              input.loginMethod && input.loginMethod.length > 0
                ? input.loginMethod
                : "manual",
            role: input.role,
            createdAt: now,
            updatedAt: now,
            lastSignedIn: now,
          });
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : String(error);
          if (message.toLowerCase().includes("duplicate")) {
            throw new TRPCError({
              code: "CONFLICT",
              message: "Bu openId ile kayıtlı bir kullanıcı zaten var.",
            });
          }
          throw error;
        }

        const createdRows = await db
          .select({
            id: users.id,
            openId: users.openId,
            name: users.name,
            email: users.email,
            role: users.role,
            loginMethod: users.loginMethod,
            createdAt: users.createdAt,
            updatedAt: users.updatedAt,
            lastSignedIn: users.lastSignedIn,
          })
          .from(users)
          .where(eq(users.openId, input.openId))
          .limit(1);

        return createdRows[0] ?? null;
      }),

    setRole: superAdminProcedure
      .input(
        z.object({
          userId: z.number().int().positive(),
          role: z.enum(["user", "content_editor", "super_admin"]),
        })
      )
      .mutation(async (opts: any) => {
        const { input, ctx } = opts;
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        const now = new Date();

        return db.transaction(async (tx: any) => {
          const targetRows = await tx
            .select()
            .from(users)
            .where(eq(users.id, input.userId))
            .limit(1);
          const target = targetRows[0] as User | undefined;
          if (!target) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Kullanıcı bulunamadı.",
            });
          }

          if (ctx.user.id === input.userId && input.role !== "super_admin") {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Kendi rolünüzü super_admin dışına alamazsınız.",
            });
          }

          if (
            isSuperAdminLikeRole(target.role) &&
            !isSuperAdminLikeRole(input.role)
          ) {
            const superAdminRows = await tx
              .select({ total: sql<number>`COUNT(*)` })
              .from(users)
              .where(inArray(users.role, ["super_admin", "admin"]));

            const superAdminCount = Number(superAdminRows[0]?.total ?? 0);
            if (superAdminCount <= 1) {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message:
                  "Sistemde en az bir super_admin kalmalıdır. Bu rol değişikliği engellendi.",
              });
            }
          }

          await tx
            .update(users)
            .set({
              role: input.role,
              updatedAt: now,
            })
            .where(eq(users.id, input.userId));

          const updatedRows = await tx
            .select({
              id: users.id,
              openId: users.openId,
              name: users.name,
              email: users.email,
              role: users.role,
              loginMethod: users.loginMethod,
              createdAt: users.createdAt,
              updatedAt: users.updatedAt,
              lastSignedIn: users.lastSignedIn,
            })
            .from(users)
            .where(eq(users.id, input.userId))
            .limit(1);

          return updatedRows[0] ?? null;
        });
      }),
  }),

  // ===== PRODUCTS =====
  products: router({
    list: productsProcedure.query(async () => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      return db.select().from(products);
    }),

    get: productsProcedure.input(z.object({ id: z.string() })).query(async (opts: any) => {
      const { input } = opts;
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const result = await db.select().from(products).where(eq(products.id, input.id));
      return result[0] || null;
    }),

    create: productsProcedure
      .input(
        z.object({
          title: z.string().min(1),
          subtitle: z.string().min(1),
          category: z.string().min(1),
          subcategory: z.string().min(1),
          description: z.string().min(1),
          imageUrl: z.string().optional(),
          oemCodes: z.array(z.object({ manufacturer: z.string(), codes: z.array(z.string()) })),
          features: z.array(z.string()),
          specifications: z.record(z.string(), z.string()),
          applications: z.array(z.string()),
          certifications: z.array(z.string()),
          catalogUrl: z.string().optional(),
        })
      )
      .mutation(async (opts: any) => {
        const { input } = opts;
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        const newProduct: Product = {
          id: nanoid(),
          ...input,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        await db.transaction(async (tx: any) => {
          await tx.insert(products).values(newProduct);
          await replaceProductOemIndex(tx, newProduct.id, newProduct.oemCodes);
        });
        return newProduct;
      }),

    update: productsProcedure
      .input(
        z.object({
          id: z.string(),
          title: z.string().min(1).optional(),
          subtitle: z.string().min(1).optional(),
          category: z.string().min(1).optional(),
          subcategory: z.string().min(1).optional(),
          description: z.string().min(1).optional(),
          imageUrl: z.string().optional(),
          oemCodes: z.array(z.object({ manufacturer: z.string(), codes: z.array(z.string()) })).optional(),
          features: z.array(z.string()).optional(),
          specifications: z.record(z.string(), z.string()).optional(),
          applications: z.array(z.string()).optional(),
          certifications: z.array(z.string()).optional(),
          catalogUrl: z.string().optional(),
        })
      )
      .mutation(async (opts: any) => {
        const { input } = opts;
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        const { id, ...updateData } = input;
        await db.transaction(async (tx: any) => {
          await tx
            .update(products)
            .set({ ...updateData, updatedAt: new Date() })
            .where(eq(products.id, id));

          if (updateData.oemCodes) {
            await replaceProductOemIndex(tx, id, updateData.oemCodes);
          }
        });

        const updated = await db.select().from(products).where(eq(products.id, id));
        return updated[0] || null;
      }),

    delete: productsProcedure.input(z.object({ id: z.string() })).mutation(async (opts: any) => {
      const { input } = opts;
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.transaction(async (tx: any) => {
        await tx.delete(products).where(eq(products.id, input.id));
        await tx.delete(productOemIndex).where(eq(productOemIndex.productId, input.id));
      });
      return { success: true };
    }),
  }),

  // ===== ARTICLES =====
  articles: router({
    list: articlesProcedure.query(async () => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      return db.select().from(articles);
    }),

    get: articlesProcedure.input(z.object({ id: z.string() })).query(async (opts: any) => {
      const { input } = opts;
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const result = await db.select().from(articles).where(eq(articles.id, input.id));
      return result[0] || null;
    }),

    create: articlesProcedure
      .input(
        z.object({
          title: z.string().min(1),
          excerpt: z.string().min(1),
          content: z.string().min(1),
          imageUrl: z.string().optional(),
          category: z.string().min(1),
          published: z.number().optional(),
          publishedAt: z.date().optional(),
        })
      )
      .mutation(async (opts: any) => {
        const { input } = opts;
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        const newArticle: Article = {
          id: nanoid(),
          ...input,
          published: input.published || 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        await db.insert(articles).values(newArticle);
        return newArticle;
      }),

    update: articlesProcedure
      .input(
        z.object({
          id: z.string(),
          title: z.string().min(1).optional(),
          excerpt: z.string().min(1).optional(),
          content: z.string().min(1).optional(),
          imageUrl: z.string().optional(),
          category: z.string().min(1).optional(),
          published: z.number().optional(),
          publishedAt: z.date().optional(),
        })
      )
      .mutation(async (opts: any) => {
        const { input } = opts;
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        const { id, ...updateData } = input;
        await db.update(articles).set({ ...updateData, updatedAt: new Date() }).where(eq(articles.id, id));

        const updated = await db.select().from(articles).where(eq(articles.id, id));
        return updated[0] || null;
      }),

    delete: articlesProcedure.input(z.object({ id: z.string() })).mutation(async (opts: any) => {
      const { input } = opts;
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.delete(articles).where(eq(articles.id, input.id));
      return { success: true };
    }),
  }),

  // ===== PAGE CONTENT =====
  pageContent: router({
    list: contentProcedure.query(async () => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      return listAdminPageContentItems(db);
    }),

    get: contentProcedure.input(z.object({ section: z.string() })).query(async (opts: any) => {
      const { input } = opts;
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      return buildAdminPageContentItem(db, input.section);
    }),

    update: contentProcedure
      .input(
        z.object({
          section: z.string(),
          title: z.string().optional(),
          content: z.string().min(1),
          imageUrl: z.string().optional(),
          metadata: z.record(z.string(), z.unknown()).optional(),
        })
      )
      .mutation(async (opts: any) => {
        const { input, ctx } = opts;
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        const sanitizedInput = sanitizePageContentInput({
          section: input.section,
          title: input.title,
          content: input.content,
          imageUrl: input.imageUrl,
          metadata: input.metadata,
        });
        const now = new Date();

        await db.transaction(async (tx: any) => {
          const nextRevisionNumber = await getNextRevisionNumber(
            tx,
            sanitizedInput.section
          );

          await tx
            .update(pageContentRevisions)
            .set({ status: "archived", updatedAt: now })
            .where(
              and(
                eq(pageContentRevisions.section, sanitizedInput.section),
                eq(pageContentRevisions.status, "draft")
              )
            );

          const newRevision: PageContentRevision = {
            id: nanoid(),
            section: sanitizedInput.section,
            title: sanitizedInput.title ?? null,
            content: sanitizedInput.content,
            imageUrl: sanitizedInput.imageUrl ?? null,
            metadata: sanitizedInput.metadata ?? null,
            revisionNumber: nextRevisionNumber,
            status: "draft",
            editorUserId: ctx.user?.id ?? null,
            publishedAt: null,
            rolledBackFromRevisionId: null,
            createdAt: now,
            updatedAt: now,
          };

          await tx.insert(pageContentRevisions).values(newRevision);
        });

        return buildAdminPageContentItem(db, sanitizedInput.section);
      }),

    publish: contentProcedure
      .input(
        z.object({
          section: z.string(),
          revisionId: z.string().optional(),
        })
      )
      .mutation(async (opts: any) => {
        const { input } = opts;
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        await db.transaction(async (tx: any) => {
          const targetRows = input.revisionId
            ? await tx
                .select()
                .from(pageContentRevisions)
                .where(
                  and(
                    eq(pageContentRevisions.section, input.section),
                    eq(pageContentRevisions.id, input.revisionId)
                  )
                )
                .limit(1)
            : await tx
                .select()
                .from(pageContentRevisions)
                .where(
                  and(
                    eq(pageContentRevisions.section, input.section),
                    eq(pageContentRevisions.status, "draft")
                  )
                )
                .orderBy(
                  desc(pageContentRevisions.revisionNumber),
                  desc(pageContentRevisions.updatedAt)
                )
                .limit(1);

          const target = targetRows[0];
          if (!target) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Publish edilecek taslak bulunamadı",
            });
          }

          const now = new Date();
          const sanitizedTarget = sanitizePageContentInput({
            section: target.section,
            title: target.title ?? undefined,
            content: target.content,
            imageUrl: target.imageUrl ?? undefined,
            metadata: target.metadata ?? undefined,
          });

          await tx
            .update(pageContentRevisions)
            .set({ status: "archived", updatedAt: now })
            .where(
              and(
                eq(pageContentRevisions.section, input.section),
                eq(pageContentRevisions.status, "draft")
              )
            );

          await tx
            .update(pageContentRevisions)
            .set({
              status: "published",
              publishedAt: now,
              updatedAt: now,
            })
            .where(eq(pageContentRevisions.id, target.id));

          const existingPublished = await tx
            .select()
            .from(pageContent)
            .where(eq(pageContent.section, input.section))
            .limit(1);

          if (existingPublished[0]) {
            await tx
              .update(pageContent)
              .set({
                title: sanitizedTarget.title ?? null,
                content: sanitizedTarget.content,
                imageUrl: sanitizedTarget.imageUrl ?? null,
                metadata: sanitizedTarget.metadata ?? null,
                updatedAt: now,
              })
              .where(eq(pageContent.section, input.section));
          } else {
            const newPublished: PageContent = {
              id: nanoid(),
              section: input.section,
              title: sanitizedTarget.title ?? null,
              content: sanitizedTarget.content,
              imageUrl: sanitizedTarget.imageUrl ?? null,
              metadata: sanitizedTarget.metadata ?? null,
              createdAt: now,
              updatedAt: now,
            };
            await tx.insert(pageContent).values(newPublished);
          }
        });

        return buildAdminPageContentItem(db, input.section);
      }),

    revisions: contentProcedure
      .input(
        z.object({
          section: z.string(),
          limit: z.number().int().min(1).max(100).optional(),
        })
      )
      .query(async (opts: any) => {
        const { input } = opts;
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        return db
          .select()
          .from(pageContentRevisions)
          .where(eq(pageContentRevisions.section, input.section))
          .orderBy(
            desc(pageContentRevisions.revisionNumber),
            desc(pageContentRevisions.updatedAt)
          )
          .limit(input.limit ?? 30);
      }),

    rollback: contentProcedure
      .input(
        z.object({
          section: z.string(),
          revisionId: z.string(),
        })
      )
      .mutation(async (opts: any) => {
        const { input, ctx } = opts;
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        await db.transaction(async (tx: any) => {
          const targetRows = await tx
            .select()
            .from(pageContentRevisions)
            .where(
              and(
                eq(pageContentRevisions.section, input.section),
                eq(pageContentRevisions.id, input.revisionId)
              )
            )
            .limit(1);

          const target = targetRows[0];
          if (!target) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Rollback için revizyon bulunamadı",
            });
          }

          const now = new Date();
          const nextRevisionNumber = await getNextRevisionNumber(tx, input.section);
          const sanitizedTarget = sanitizePageContentInput({
            section: target.section,
            title: target.title ?? undefined,
            content: target.content,
            imageUrl: target.imageUrl ?? undefined,
            metadata: target.metadata ?? undefined,
          });

          await tx
            .update(pageContentRevisions)
            .set({ status: "archived", updatedAt: now })
            .where(
              and(
                eq(pageContentRevisions.section, input.section),
                eq(pageContentRevisions.status, "draft")
              )
            );

          const rollbackRevision: PageContentRevision = {
            id: nanoid(),
            section: input.section,
            title: sanitizedTarget.title ?? null,
            content: sanitizedTarget.content,
            imageUrl: sanitizedTarget.imageUrl ?? null,
            metadata: sanitizedTarget.metadata ?? null,
            revisionNumber: nextRevisionNumber,
            status: "published",
            editorUserId: ctx.user?.id ?? null,
            publishedAt: now,
            rolledBackFromRevisionId: target.id,
            createdAt: now,
            updatedAt: now,
          };
          await tx.insert(pageContentRevisions).values(rollbackRevision);

          const existingPublished = await tx
            .select()
            .from(pageContent)
            .where(eq(pageContent.section, input.section))
            .limit(1);

          if (existingPublished[0]) {
            await tx
              .update(pageContent)
              .set({
                title: rollbackRevision.title,
                content: rollbackRevision.content,
                imageUrl: rollbackRevision.imageUrl,
                metadata: rollbackRevision.metadata,
                updatedAt: now,
              })
              .where(eq(pageContent.section, input.section));
          } else {
            const newPublished: PageContent = {
              id: nanoid(),
              section: input.section,
              title: rollbackRevision.title ?? null,
              content: rollbackRevision.content,
              imageUrl: rollbackRevision.imageUrl ?? null,
              metadata: rollbackRevision.metadata ?? null,
              createdAt: now,
              updatedAt: now,
            };
            await tx.insert(pageContent).values(newPublished);
          }
        });

        return buildAdminPageContentItem(db, input.section);
      }),

    delete: contentProcedure
      .input(z.object({ section: z.string() }))
      .mutation(async (opts: any) => {
        const { input } = opts;
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        await db.transaction(async (tx: any) => {
          await tx.delete(pageContent).where(eq(pageContent.section, input.section));
          await tx
            .delete(pageContentRevisions)
            .where(eq(pageContentRevisions.section, input.section));
        });
        return { success: true };
      }),
  }),

  // ===== SETTINGS =====
  settings: router({
    list: settingsProcedure.query(async () => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      return db.select().from(settings);
    }),

    get: settingsProcedure.input(z.object({ key: z.string() })).query(async (opts: any) => {
      const { input } = opts;
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const result = await db.select().from(settings).where(eq(settings.key, input.key));
      return result[0] || null;
    }),

    set: settingsProcedure
      .input(
        z.object({
          key: z.string(),
          value: z.string(),
          type: z.enum(["string", "number", "boolean", "json"]).optional(),
        })
      )
      .mutation(async (opts: any) => {
        const { input } = opts;
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        const existing = await db.select().from(settings).where(eq(settings.key, input.key));

        if (existing.length > 0) {
          await db
            .update(settings)
            .set({ value: input.value, type: input.type || "string", updatedAt: new Date() })
            .where(eq(settings.key, input.key));
          const updated = await db.select().from(settings).where(eq(settings.key, input.key));
          return updated[0] || null;
        } else {
          const newSetting: Setting = {
            id: nanoid(),
            key: input.key,
            value: input.value,
            type: (input.type || "string") as "string" | "number" | "boolean" | "json",
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          await db.insert(settings).values(newSetting);
          return newSetting;
        }
      }),
  }),

  // ===== AUDIT =====
  audit: router({
    list: superAdminProcedure
      .input(
        z
          .object({
            page: z.number().int().min(1).optional(),
            pageSize: z.number().int().min(1).max(200).optional(),
            resource: z.string().optional(),
            status: z.enum(["success", "error", "denied"]).optional(),
            actorUserId: z.number().int().optional(),
          })
          .optional()
      )
      .query(async (opts: any) => {
        const { input } = opts;
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        const page = input?.page ?? 1;
        const pageSize = input?.pageSize ?? 50;
        const offset = (page - 1) * pageSize;
        const conditions = [];

        if (input?.resource) {
          conditions.push(eq(auditLogs.resource, input.resource));
        }
        if (input?.status) {
          conditions.push(eq(auditLogs.status, input.status));
        }
        if (input?.actorUserId) {
          conditions.push(eq(auditLogs.actorUserId, input.actorUserId));
        }

        const whereClause =
          conditions.length > 0 ? and(...conditions) : undefined;

        const totalRows = whereClause
          ? await db.select({ total: sql<number>`COUNT(*)` }).from(auditLogs).where(whereClause)
          : await db.select({ total: sql<number>`COUNT(*)` }).from(auditLogs);
        const total = Number(totalRows[0]?.total ?? 0);
        const totalPages = total > 0 ? Math.ceil(total / pageSize) : 0;

        const baseRowsQuery = db
          .select()
          .from(auditLogs)
          .orderBy(desc(auditLogs.createdAt), desc(auditLogs.id))
          .limit(pageSize)
          .offset(offset);

        const rows = whereClause
          ? await baseRowsQuery.where(whereClause)
          : await baseRowsQuery;

        return {
          items: rows,
          total,
          page,
          pageSize,
          totalPages,
        };
      }),
  }),

  // ===== STORAGE =====
  storage: router({
    uploadImage: storageProcedure
      .input(
        z.object({
          file: z.union([z.instanceof(Uint8Array), z.instanceof(Buffer)]),
          fileName: z.string(),
          contentType: z.string().default("image/jpeg"),
        })
      )
      .mutation(async (opts: any) => {
        const { input } = opts;
        try {
          const fileBuffer = Buffer.isBuffer(input.file)
            ? input.file
            : Buffer.from(input.file);
          const fileKey = `products/${Date.now()}-${input.fileName}`;
          const result = await storagePut(
            fileKey,
            fileBuffer,
            input.contentType
          );
          return result;
        } catch (error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Upload failed: ${error instanceof Error ? error.message : "Unknown error"}`,
          });
        }
      }),
  }),
});
