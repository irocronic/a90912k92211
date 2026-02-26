import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { products, articles, pageContent, settings, type Product, type Article, type PageContent, type Setting } from "../../drizzle/schema";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { storagePut } from "../storage";

// Admin-only procedure
const adminProcedure = protectedProcedure.use(async (opts: any) => {
  const { ctx, next } = opts;
  if (ctx.user?.role !== "admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Only admins can access this",
    });
  }
  return next({ ctx });
});

export const adminRouter = router({
  // ===== PRODUCTS =====
  products: router({
    list: adminProcedure.query(async () => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      return db.select().from(products);
    }),

    get: adminProcedure.input(z.object({ id: z.string() })).query(async (opts: any) => {
      const { input } = opts;
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const result = await db.select().from(products).where(eq(products.id, input.id));
      return result[0] || null;
    }),

    create: adminProcedure
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

        await db.insert(products).values(newProduct);
        return newProduct;
      }),

    update: adminProcedure
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
        await db.update(products).set({ ...updateData, updatedAt: new Date() }).where(eq(products.id, id));

        const updated = await db.select().from(products).where(eq(products.id, id));
        return updated[0] || null;
      }),

    delete: adminProcedure.input(z.object({ id: z.string() })).mutation(async (opts: any) => {
      const { input } = opts;
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.delete(products).where(eq(products.id, input.id));
      return { success: true };
    }),
  }),

  // ===== ARTICLES =====
  articles: router({
    list: adminProcedure.query(async () => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      return db.select().from(articles);
    }),

    get: adminProcedure.input(z.object({ id: z.string() })).query(async (opts: any) => {
      const { input } = opts;
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const result = await db.select().from(articles).where(eq(articles.id, input.id));
      return result[0] || null;
    }),

    create: adminProcedure
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

    update: adminProcedure
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

    delete: adminProcedure.input(z.object({ id: z.string() })).mutation(async (opts: any) => {
      const { input } = opts;
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.delete(articles).where(eq(articles.id, input.id));
      return { success: true };
    }),
  }),

  // ===== PAGE CONTENT =====
  pageContent: router({
    list: adminProcedure.query(async () => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      return db.select().from(pageContent);
    }),

    get: adminProcedure.input(z.object({ section: z.string() })).query(async (opts: any) => {
      const { input } = opts;
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const result = await db.select().from(pageContent).where(eq(pageContent.section, input.section));
      return result[0] || null;
    }),

    update: adminProcedure
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
        const { input } = opts;
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        const existing = await db.select().from(pageContent).where(eq(pageContent.section, input.section));

        if (existing.length > 0) {
          await db
            .update(pageContent)
            .set({ ...input, updatedAt: new Date() })
            .where(eq(pageContent.section, input.section));
          const updated = await db.select().from(pageContent).where(eq(pageContent.section, input.section));
          return updated[0] || null;
        } else {
          const newContent: PageContent = {
            id: nanoid(),
            ...input,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          await db.insert(pageContent).values(newContent);
          return newContent;
        }
      }),

    delete: adminProcedure
      .input(z.object({ section: z.string() }))
      .mutation(async (opts: any) => {
        const { input } = opts;
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        await db.delete(pageContent).where(eq(pageContent.section, input.section));
        return { success: true };
      }),
  }),

  // ===== SETTINGS =====
  settings: router({
    list: adminProcedure.query(async () => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      return db.select().from(settings);
    }),

    get: adminProcedure.input(z.object({ key: z.string() })).query(async (opts: any) => {
      const { input } = opts;
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const result = await db.select().from(settings).where(eq(settings.key, input.key));
      return result[0] || null;
    }),

    set: adminProcedure
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

  // ===== STORAGE =====
  storage: router({
    uploadImage: adminProcedure
      .input(
        z.object({
          file: z.instanceof(Buffer),
          fileName: z.string(),
          contentType: z.string().default("image/jpeg"),
        })
      )
      .mutation(async (opts: any) => {
        const { input } = opts;
        try {
          const fileKey = `products/${Date.now()}-${input.fileName}`;
          const result = await storagePut(fileKey, input.file, input.contentType);
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
