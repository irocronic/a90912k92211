import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { translations, userPreferences, type Translation, type InsertTranslation } from "../../drizzle/schema";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";

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
        .where(eq(translations.language, input.language));

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
        .where(and(eq(translations.language, input.language), eq(translations.section, input.section)));

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
      if (ctx.user?.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only admins can update translations" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const existing = await db
        .select()
        .from(translations)
        .where(
          and(
            eq(translations.key, input.key),
            eq(translations.language, input.language),
            eq(translations.section, input.section)
          )
        );

      if (existing.length > 0) {
        await db
          .update(translations)
          .set({ value: input.value, updatedAt: new Date() })
          .where(eq(translations.id, existing[0].id));
        return existing[0];
      } else {
        const newTranslation: InsertTranslation = {
          id: nanoid(),
          key: input.key,
          language: input.language,
          section: input.section,
          value: input.value,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        await db.insert(translations).values(newTranslation);
        return newTranslation;
      }
    }),

  // Admin: List translation entries grouped by key/section with language values
  listTranslationEntries: protectedProcedure
    .input(
      z
        .object({
          section: z.string().optional(),
          search: z.string().optional(),
        })
        .optional(),
    )
    .query(async (opts: any) => {
      const { input, ctx } = opts;
      if (ctx.user?.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only admins can list translations" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const allRows = await db.select().from(translations);
      const filteredRows = allRows.filter((row) => {
        if (input?.section && row.section !== input.section) return false;
        if (!input?.search) return true;
        const query = input.search.toLowerCase().trim();
        if (!query) return true;
        return (
          row.key.toLowerCase().includes(query) ||
          row.section.toLowerCase().includes(query) ||
          row.value.toLowerCase().includes(query)
        );
      });

      const grouped = new Map<
        string,
        {
          key: string;
          section: string;
          values: Record<string, string>;
          updatedAt: Date;
          createdAt: Date;
        }
      >();

      filteredRows.forEach((row) => {
        const mapKey = `${row.section}::${row.key}`;
        const existing = grouped.get(mapKey);
        if (existing) {
          existing.values[row.language] = row.value;
          if (row.updatedAt > existing.updatedAt) existing.updatedAt = row.updatedAt;
          return;
        }

        grouped.set(mapKey, {
          key: row.key,
          section: row.section,
          values: { [row.language]: row.value },
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
        });
      });

      return Array.from(grouped.values())
        .map((entry) => ({
          key: entry.key,
          section: entry.section,
          value_tr: entry.values.tr || "",
          value_en: entry.values.en || "",
          createdAt: entry.createdAt,
          updatedAt: entry.updatedAt,
        }))
        .sort((a, b) => {
          if (a.section !== b.section) return a.section.localeCompare(b.section, "tr");
          return a.key.localeCompare(b.key, "tr");
        });
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
      if (ctx.user?.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only admins can delete translations" });
      }

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
      .where(eq(userPreferences.userId, ctx.user.id));

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
        .where(eq(userPreferences.userId, ctx.user.id));

      if (existing.length > 0) {
        const updateData: Record<string, unknown> = { updatedAt: new Date() };
        if (input.language) updateData.language = input.language;
        if (input.theme) updateData.theme = input.theme;

        await db.update(userPreferences).set(updateData).where(eq(userPreferences.id, existing[0].id));
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
