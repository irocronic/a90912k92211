import { TRPCError } from "@trpc/server";
import { hasAdminPermission } from "@shared/adminRoles";
import { z } from "zod";
import {
  translations,
  userPreferences,
  type InsertTranslation,
} from "../../drizzle/schema";
import { writeAuditLog } from "../_core/adminAccess";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { eq, and, asc, desc, or, sql } from "drizzle-orm";
import { nanoid } from "nanoid";

function assertLocalizationPermission(ctx: { user?: { role: unknown } | null }) {
  if (!ctx.user || !hasAdminPermission(ctx.user.role, "localization:write")) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Yeterli localization yetkiniz bulunmuyor.",
    });
  }
}

export const i18nRouter = router({
  // Get all translations for a specific language
  getTranslations: publicProcedure
    .input(z.object({ language: z.string().default("tr") }))
    .query(async (opts: any) => {
      const { input } = opts;
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const result = await db
        .select()
        .from(translations)
        .where(eq(translations.language, input.language))
        .orderBy(desc(translations.updatedAt));

      // Convert to nested object structure
      const grouped: Record<string, Record<string, string>> = {};
      result.forEach((t) => {
        if (!grouped[t.section]) grouped[t.section] = {};
        grouped[t.section][t.key] = t.value;
      });

      return grouped;
    }),

  // Get translations for a specific section
  getSectionTranslations: publicProcedure
    .input(z.object({ language: z.string().default("tr"), section: z.string() }))
    .query(async (opts: any) => {
      const { input } = opts;
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const result = await db
        .select()
        .from(translations)
        .where(and(eq(translations.language, input.language), eq(translations.section, input.section)))
        .orderBy(desc(translations.updatedAt));

      const grouped: Record<string, string> = {};
      result.forEach((t) => {
        grouped[t.key] = t.value;
      });

      return grouped;
    }),

  // Admin: Update translation
  updateTranslation: protectedProcedure
    .input(
      z.object({
        key: z.string(),
        language: z.string(),
        section: z.string(),
        value: z.string(),
      })
    )
    .mutation(async (opts: any) => {
      const { input, ctx } = opts;
      assertLocalizationPermission(ctx);

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const now = new Date();
      const newTranslation: InsertTranslation = {
        id: nanoid(),
        key: input.key,
        language: input.language,
        section: input.section,
        value: input.value,
        createdAt: now,
        updatedAt: now,
      };

      await db
        .insert(translations)
        .values(newTranslation)
        .onDuplicateKeyUpdate({
          set: { value: input.value, updatedAt: now },
        });

      const result = await db
        .select()
        .from(translations)
        .where(
          and(
            eq(translations.key, input.key),
            eq(translations.language, input.language),
            eq(translations.section, input.section),
          ),
        )
        .orderBy(desc(translations.updatedAt))
        .limit(1);

      if (result[0]) {
        await writeAuditLog({
          actorUserId: ctx.user.id,
          actorRole: String(ctx.user.role),
          action: "mutation:i18n.updateTranslation",
          resource: "i18n",
          resourceId: `${input.section}:${input.key}:${input.language}`,
          status: "success",
          metadata: {
            section: input.section,
            key: input.key,
            language: input.language,
          },
        });
        return result[0];
      }
      await writeAuditLog({
        actorUserId: ctx.user.id,
        actorRole: String(ctx.user.role),
        action: "mutation:i18n.updateTranslation",
        resource: "i18n",
        resourceId: `${input.section}:${input.key}:${input.language}`,
        status: "error",
        metadata: {
          section: input.section,
          key: input.key,
          language: input.language,
        },
      });
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Translation could not be read after upsert",
      });
    }),

  // Admin: List translation entries grouped by key/section with language values
  listTranslationEntries: protectedProcedure
    .input(
      z
        .object({
          section: z.string().optional(),
          search: z.string().optional(),
          page: z.number().int().min(1).optional(),
          pageSize: z.number().int().min(1).max(200).optional(),
        })
        .optional(),
    )
    .query(async (opts: any) => {
      const { input, ctx } = opts;
      assertLocalizationPermission(ctx);

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const pageSize = input?.pageSize ?? 50;
      const requestedPage = input?.page ?? 1;
      const section = input?.section?.trim();
      const search = input?.search?.trim().toLowerCase();

      const filters: Array<ReturnType<typeof eq> | ReturnType<typeof or>> = [];
      if (section) {
        filters.push(eq(translations.section, section));
      }
      if (search) {
        const pattern = `%${search}%`;
        filters.push(
          or(
            sql`LOWER(${translations.key}) LIKE ${pattern}`,
            sql`LOWER(${translations.section}) LIKE ${pattern}`,
            sql`LOWER(${translations.value}) LIKE ${pattern}`,
          )!,
        );
      }

      const whereCondition =
        filters.length > 0 ? and(...filters) : undefined;

      const totalQuery = db
        .select({
          total:
            sql<number>`COUNT(DISTINCT CONCAT(${translations.section}, '::', ${translations.key}))`,
        })
        .from(translations);
      const totalRows = whereCondition
        ? await totalQuery.where(whereCondition)
        : await totalQuery;
      const total = Number(totalRows[0]?.total ?? 0);
      const totalPages = total > 0 ? Math.ceil(total / pageSize) : 0;
      const page =
        totalPages > 0 ? Math.min(requestedPage, totalPages) : requestedPage;
      const offset = (page - 1) * pageSize;

      const groupedPageQuery = db
        .select({
          key: translations.key,
          section: translations.section,
          createdAt: sql<Date>`MIN(${translations.createdAt})`,
          updatedAt: sql<Date>`MAX(${translations.updatedAt})`,
        })
        .from(translations);
      const groupedPage = (
        whereCondition
          ? groupedPageQuery.where(whereCondition)
          : groupedPageQuery
      )
        .groupBy(translations.section, translations.key)
        .orderBy(asc(translations.section), asc(translations.key))
        .limit(pageSize)
        .offset(offset);

      const groupedEntries = await groupedPage;
      if (groupedEntries.length === 0) {
        return {
          items: [] as Array<{
            key: string;
            section: string;
            value_tr: string;
            value_en: string;
            createdAt: Date;
            updatedAt: Date;
          }>,
          total,
          page,
          pageSize,
          totalPages,
        };
      }

      const pairFilters = groupedEntries.map((entry) =>
        and(
          eq(translations.section, entry.section),
          eq(translations.key, entry.key),
        ),
      );

      const translationRowsQuery = db
        .select({
          key: translations.key,
          section: translations.section,
          language: translations.language,
          value: translations.value,
        })
        .from(translations)
        .orderBy(desc(translations.updatedAt));

      const translationRows =
        pairFilters.length === 1
          ? await translationRowsQuery.where(pairFilters[0])
          : await translationRowsQuery.where(or(...pairFilters)!);

      const valueMap = new Map<string, { tr: string; en: string }>();
      translationRows.forEach((row) => {
        const mapKey = `${row.section}::${row.key}`;
        const existing = valueMap.get(mapKey) ?? { tr: "", en: "" };

        if (row.language === "tr" && !existing.tr) {
          existing.tr = row.value;
        }
        if (row.language === "en" && !existing.en) {
          existing.en = row.value;
        }

        valueMap.set(mapKey, existing);
      });

      const items = groupedEntries.map((entry) => {
        const mapKey = `${entry.section}::${entry.key}`;
        const values = valueMap.get(mapKey) ?? { tr: "", en: "" };
        return {
          key: entry.key,
          section: entry.section,
          value_tr: values.tr,
          value_en: values.en,
          createdAt: entry.createdAt,
          updatedAt: entry.updatedAt,
        };
      });

      return {
        items,
        total,
        page,
        pageSize,
        totalPages,
      };
    }),

  // Admin: Delete translation by key/section, optionally per language
  deleteTranslation: protectedProcedure
    .input(
      z.object({
        key: z.string(),
        section: z.string(),
        language: z.string().optional(),
      }),
    )
    .mutation(async (opts: any) => {
      const { input, ctx } = opts;
      assertLocalizationPermission(ctx);

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      if (input.language) {
        await db
          .delete(translations)
          .where(
            and(
              eq(translations.key, input.key),
              eq(translations.section, input.section),
              eq(translations.language, input.language),
            ),
          );
      } else {
        await db
          .delete(translations)
          .where(and(eq(translations.key, input.key), eq(translations.section, input.section)));
      }

      await writeAuditLog({
        actorUserId: ctx.user.id,
        actorRole: String(ctx.user.role),
        action: "mutation:i18n.deleteTranslation",
        resource: "i18n",
        resourceId: input.language
          ? `${input.section}:${input.key}:${input.language}`
          : `${input.section}:${input.key}`,
        status: "success",
        metadata: {
          section: input.section,
          key: input.key,
          language: input.language ?? null,
        },
      });

      return { success: true };
    }),

  // Get user preferences
  getUserPreferences: protectedProcedure.query(async (opts: any) => {
    const { ctx } = opts;
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const result = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, ctx.user.id))
      .orderBy(desc(userPreferences.updatedAt))
      .limit(1);

    return result[0] || { language: "tr", theme: "dark" };
  }),

  // Update user preferences
  updateUserPreferences: protectedProcedure
    .input(
      z.object({
        language: z.string().optional(),
        theme: z.enum(["light", "dark"]).optional(),
      })
    )
    .mutation(async (opts: any) => {
      const { input, ctx } = opts;
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const existing = await db
        .select()
        .from(userPreferences)
        .where(eq(userPreferences.userId, ctx.user.id))
        .orderBy(desc(userPreferences.updatedAt))
        .limit(1);

      if (existing.length > 0) {
        const updateData: Record<string, unknown> = { updatedAt: new Date() };
        if (input.language) updateData.language = input.language;
        if (input.theme) updateData.theme = input.theme;

        await db
          .update(userPreferences)
          .set(updateData)
          .where(eq(userPreferences.userId, ctx.user.id));
        return { ...existing[0], ...updateData };
      } else {
        const newPreference = {
          id: nanoid(),
          userId: ctx.user.id,
          language: input.language || "tr",
          theme: input.theme || "dark",
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        await db.insert(userPreferences).values(newPreference);
        return newPreference;
      }
    }),

  // Get default preferences (for non-authenticated users)
  getDefaultPreferences: publicProcedure.query(() => {
    return { language: "tr", theme: "dark" };
  }),
});
