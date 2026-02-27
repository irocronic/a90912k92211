import {
  index,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  json,
  uniqueIndex,
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "content_editor", "super_admin", "admin"])
    .default("user")
    .notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const auditLogs = mysqlTable(
  "auditLogs",
  {
    id: int("id").autoincrement().primaryKey(),
    actorUserId: int("actorUserId").notNull(),
    actorRole: varchar("actorRole", { length: 32 }).notNull(),
    action: varchar("action", { length: 191 }).notNull(),
    resource: varchar("resource", { length: 128 }).notNull(),
    resourceId: varchar("resourceId", { length: 128 }),
    status: mysqlEnum("status", ["success", "error", "denied"])
      .default("success")
      .notNull(),
    metadata: json("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    createdAtIdx: index("auditLogs_createdAt_idx").on(table.createdAt),
    actorUserIdIdx: index("auditLogs_actorUserId_idx").on(table.actorUserId),
    actionIdx: index("auditLogs_action_idx").on(table.action),
    resourceIdx: index("auditLogs_resource_idx").on(table.resource),
    statusIdx: index("auditLogs_status_idx").on(table.status),
  })
);

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;

// Products table
export const products = mysqlTable("products", {
  id: varchar("id", { length: 64 }).primaryKey(),
  title: text("title").notNull(),
  subtitle: text("subtitle").notNull(),
  category: varchar("category", { length: 128 }).notNull(),
  subcategory: varchar("subcategory", { length: 128 }).default("").notNull(),
  description: text("description").notNull(),
  imageUrl: text("imageUrl"),
  oemCodes: json("oemCodes").$type<Array<{ manufacturer: string; codes: string[] }>>().notNull(),
  features: json("features").$type<string[]>().notNull(),
  specifications: json("specifications").$type<Record<string, string>>().notNull(),
  applications: json("applications").$type<string[]>().notNull(),
  certifications: json("certifications").$type<string[]>().notNull(),
  catalogUrl: text("catalogUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

export const productOemIndex = mysqlTable(
  "productOemIndex",
  {
    id: int("id").autoincrement().primaryKey(),
    productId: varchar("productId", { length: 64 }).notNull(),
    manufacturer: varchar("manufacturer", { length: 128 }).notNull(),
    code: varchar("code", { length: 255 }).notNull(),
    normalizedManufacturer: varchar("normalizedManufacturer", {
      length: 128,
    }).notNull(),
    normalizedCode: varchar("normalizedCode", { length: 255 }).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    productCodeUnique: uniqueIndex("productOemIndex_product_code_unique").on(
      table.productId,
      table.normalizedManufacturer,
      table.normalizedCode
    ),
    normalizedCodeIdx: index("productOemIndex_normalizedCode_idx").on(
      table.normalizedCode
    ),
    normalizedManufacturerIdx: index(
      "productOemIndex_normalizedManufacturer_idx"
    ).on(table.normalizedManufacturer),
    productIdIdx: index("productOemIndex_productId_idx").on(table.productId),
  })
);

export type ProductOemIndex = typeof productOemIndex.$inferSelect;
export type InsertProductOemIndex = typeof productOemIndex.$inferInsert;

// News/Articles table
export const articles = mysqlTable("articles", {
  id: varchar("id", { length: 64 }).primaryKey(),
  title: text("title").notNull(),
  excerpt: text("excerpt").notNull(),
  content: text("content").notNull(),
  imageUrl: text("imageUrl"),
  category: varchar("category", { length: 128 }).notNull(),
  published: int("published").default(0).notNull(),
  publishedAt: timestamp("publishedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Article = typeof articles.$inferSelect;
export type InsertArticle = typeof articles.$inferInsert;

// Page content table (for editable sections)
export const pageContent = mysqlTable("pageContent", {
  id: varchar("id", { length: 64 }).primaryKey(),
  section: varchar("section", { length: 128 }).notNull().unique(),
  title: text("title"),
  content: text("content").notNull(),
  imageUrl: text("imageUrl"),
  metadata: json("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PageContent = typeof pageContent.$inferSelect;
export type InsertPageContent = typeof pageContent.$inferInsert;

export const pageContentRevisions = mysqlTable(
  "pageContentRevisions",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    section: varchar("section", { length: 128 }).notNull(),
    title: text("title"),
    content: text("content").notNull(),
    imageUrl: text("imageUrl"),
    metadata: json("metadata").$type<Record<string, unknown>>(),
    revisionNumber: int("revisionNumber").notNull(),
    status: mysqlEnum("status", ["draft", "published", "archived"])
      .default("draft")
      .notNull(),
    editorUserId: int("editorUserId"),
    publishedAt: timestamp("publishedAt"),
    rolledBackFromRevisionId: varchar("rolledBackFromRevisionId", {
      length: 64,
    }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    sectionRevisionUnique: uniqueIndex(
      "pageContentRevisions_section_revision_unique"
    ).on(table.section, table.revisionNumber),
    sectionStatusIdx: index("pageContentRevisions_section_status_idx").on(
      table.section,
      table.status
    ),
    sectionUpdatedAtIdx: index("pageContentRevisions_section_updatedAt_idx").on(
      table.section,
      table.updatedAt
    ),
  })
);

export type PageContentRevision = typeof pageContentRevisions.$inferSelect;
export type InsertPageContentRevision = typeof pageContentRevisions.$inferInsert;

// Settings table
export const settings = mysqlTable("settings", {
  id: varchar("id", { length: 64 }).primaryKey(),
  key: varchar("key", { length: 128 }).notNull().unique(),
  value: text("value").notNull(),
  type: mysqlEnum("type", ["string", "number", "boolean", "json"]).default("string").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Setting = typeof settings.$inferSelect;
export type InsertSetting = typeof settings.$inferInsert;

// Translations table for multi-language support
export const translations = mysqlTable(
  "translations",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    key: varchar("key", { length: 255 }).notNull(),
    language: varchar("language", { length: 10 }).notNull(), // 'tr', 'en'
    value: text("value").notNull(),
    section: varchar("section", { length: 128 }).notNull(), // 'common', 'home', 'products', etc.
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    keyLanguageSectionUnique: uniqueIndex(
      "translations_key_language_section_unique"
    ).on(table.key, table.language, table.section),
  })
);

export type Translation = typeof translations.$inferSelect;
export type InsertTranslation = typeof translations.$inferInsert;

// User preferences table
export const userPreferences = mysqlTable("userPreferences", {
  id: varchar("id", { length: 64 }).primaryKey(),
  userId: int("userId").notNull().unique(),
  language: varchar("language", { length: 10 }).default("tr").notNull(),
  theme: mysqlEnum("theme", ["light", "dark"]).default("dark").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserPreference = typeof userPreferences.$inferSelect;
export type InsertUserPreference = typeof userPreferences.$inferInsert;
