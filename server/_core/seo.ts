import type { Request } from "express";
import { desc } from "drizzle-orm";
import { products } from "../../drizzle/schema";
import { getDb } from "../db";
import { buildProductSlugFromFields } from "../../shared/productSlug";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function getSiteOriginFromRequest(req: Request): string {
  const forwardedProto = req.headers["x-forwarded-proto"];
  const protocol = typeof forwardedProto === "string" ? forwardedProto : req.protocol || "https";
  const host = req.get("host") || "vaden.204.168.196.102.sslip.io";
  return `${protocol}://${host}`;
}

export function buildRobotsTxt(origin: string): string {
  return [`User-agent: *`, `Allow: /`, `Sitemap: ${origin}/sitemap.xml`, ``].join("\n");
}

export async function buildSitemapXml(origin: string): Promise<string> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database unavailable");
  }

  const productRows = await db
    .select({
      id: products.id,
      title: products.title,
      subtitle: products.subtitle,
      updatedAt: products.updatedAt,
      createdAt: products.createdAt,
    })
    .from(products)
    .orderBy(desc(products.updatedAt), desc(products.createdAt));

  const staticUrls = [
    { loc: `${origin}/`, changefreq: "weekly", priority: "1.0" },
    { loc: `${origin}/products`, changefreq: "daily", priority: "0.9" },
    { loc: `${origin}/kurumsal`, changefreq: "monthly", priority: "0.5" },
    { loc: `${origin}/kariyer`, changefreq: "monthly", priority: "0.5" },
    { loc: `${origin}/politikalar`, changefreq: "monthly", priority: "0.4" },
  ];

  const productUrls = productRows.map((product) => ({
    loc: `${origin}/product/${buildProductSlugFromFields(
      product.title,
      product.subtitle,
      product.id,
    )}`,
    lastmod: (product.updatedAt || product.createdAt || new Date()).toISOString(),
    changefreq: "weekly",
    priority: "0.8",
  }));

  const allUrls = [...staticUrls, ...productUrls];
  const urlNodes = allUrls
    .map(
      (entry) => `  <url>
    <loc>${escapeXml(entry.loc)}</loc>
    ${"lastmod" in entry && entry.lastmod ? `<lastmod>${entry.lastmod}</lastmod>` : ""}
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`,
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlNodes}
</urlset>`;
}

