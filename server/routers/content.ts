import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { articles, pageContent, products, settings } from "../../drizzle/schema";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";

type SettingValueType = "string" | "number" | "boolean" | "json";

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
      const rows = await db.select().from(settings).orderBy(settings.key);
      return rows.map((item) => ({
        ...item,
        parsedValue: parseSettingValue(item.value, item.type),
      }));
    }),

    get: publicProcedure
      .input(z.object({ key: z.string() }))
      .query(async ({ input }) => {
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
