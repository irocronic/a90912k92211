import { drizzle } from "drizzle-orm/mysql2";
import { translations } from "../drizzle/schema";
import mysql from "mysql2/promise";
import { nanoid } from "nanoid";

const DATABASE_URL = process.env.DATABASE_URL;

const translationData: Array<{ key: string; section: string; language: "tr" | "en"; value: string }> = [
  // Common
  { key: "common.appName", section: "common", language: "tr", value: "Vaden" },
  { key: "common.appName", section: "common", language: "en", value: "Vaden" },
  { key: "common.appDescription", section: "common", language: "tr" as const, value: "Hava Fren Sistemleri ve Otomotiv Parçaları" },
  { key: "common.appDescription", section: "common", language: "en" as const, value: "Air Brake Systems & Automotive Parts" },
  { key: "common.language", section: "common", language: "tr" as const, value: "Dil" },
  { key: "common.language", section: "common", language: "en" as const, value: "Language" },
  { key: "common.theme", section: "common", language: "tr" as const, value: "Tema" },
  { key: "common.theme", section: "common", language: "en" as const, value: "Theme" },
  { key: "common.light", section: "common", language: "tr" as const, value: "Aydınlık" },
  { key: "common.light", section: "common", language: "en" as const, value: "Light" },
  { key: "common.dark", section: "common", language: "tr" as const, value: "Koyu" },
  { key: "common.dark", section: "common", language: "en" as const, value: "Dark" },
  { key: "common.loading", section: "common", language: "tr" as const, value: "Yükleniyor..." },
  { key: "common.loading", section: "common", language: "en" as const, value: "Loading..." },
  { key: "common.error", section: "common", language: "tr" as const, value: "Hata oluştu" },
  { key: "common.error", section: "common", language: "en" as const, value: "An error occurred" },
  { key: "common.success", section: "common", language: "tr" as const, value: "Başarılı" },
  { key: "common.success", section: "common", language: "en" as const, value: "Success" },
  { key: "common.save", section: "common", language: "tr" as const, value: "Kaydet" },
  { key: "common.save", section: "common", language: "en" as const, value: "Save" },
  { key: "common.cancel", section: "common", language: "tr" as const, value: "İptal" },
  { key: "common.cancel", section: "common", language: "en" as const, value: "Cancel" },
  { key: "common.delete", section: "common", language: "tr" as const, value: "Sil" },
  { key: "common.delete", section: "common", language: "en" as const, value: "Delete" },
  { key: "common.edit", section: "common", language: "tr" as const, value: "Düzenle" },
  { key: "common.edit", section: "common", language: "en" as const, value: "Edit" },
  { key: "common.add", section: "common", language: "tr" as const, value: "Ekle" },
  { key: "common.add", section: "common", language: "en" as const, value: "Add" },
  { key: "common.search", section: "common", language: "tr" as const, value: "Ara" },
  { key: "common.search", section: "common", language: "en" as const, value: "Search" },

  // Navbar
  { key: "navbar.home", section: "navbar", language: "tr" as const, value: "Ana Sayfa" },
  { key: "navbar.home", section: "navbar", language: "en" as const, value: "Home" },
  { key: "navbar.products", section: "navbar", language: "tr" as const, value: "Ürünler" },
  { key: "navbar.products", section: "navbar", language: "en" as const, value: "Products" },
  { key: "navbar.about", section: "navbar", language: "tr" as const, value: "Hakkımızda" },
  { key: "navbar.about", section: "navbar", language: "en" as const, value: "About" },
  { key: "navbar.news", section: "navbar", language: "tr" as const, value: "Haberler" },
  { key: "navbar.news", section: "navbar", language: "en" as const, value: "News" },
  { key: "navbar.contact", section: "navbar", language: "tr" as const, value: "İletişim" },
  { key: "navbar.contact", section: "navbar", language: "en" as const, value: "Contact" },
  { key: "navbar.admin", section: "navbar", language: "tr" as const, value: "Admin" },
  { key: "navbar.admin", section: "navbar", language: "en" as const, value: "Admin" },
  { key: "navbar.login", section: "navbar", language: "tr" as const, value: "Giriş Yap" },
  { key: "navbar.login", section: "navbar", language: "en" as const, value: "Login" },
  { key: "navbar.logout", section: "navbar", language: "tr" as const, value: "Çıkış Yap" },
  { key: "navbar.logout", section: "navbar", language: "en" as const, value: "Logout" },

  // Home
  { key: "home.heroTitle", section: "home", language: "tr" as const, value: "Vaden - Otomotiv Endüstrisinin Lider Üreticisi" },
  { key: "home.heroTitle", section: "home", language: "en" as const, value: "Vaden - Leading Manufacturer in the Automotive Industry" },
  { key: "home.heroSubtitle", section: "home", language: "tr" as const, value: "Yüksek kaliteli hava fren sistemleri ve otomotiv parçaları" },
  { key: "home.heroSubtitle", section: "home", language: "en" as const, value: "High-quality air brake systems and automotive parts" },
  { key: "home.exploreProducts", section: "home", language: "tr" as const, value: "Ürünleri Keşfet" },
  { key: "home.exploreProducts", section: "home", language: "en" as const, value: "Explore Products" },
  { key: "home.aboutTitle", section: "home", language: "tr" as const, value: "Hakkımızda" },
  { key: "home.aboutTitle", section: "home", language: "en" as const, value: "About Us" },
  { key: "home.productsTitle", section: "home", language: "tr" as const, value: "Ürünlerimiz" },
  { key: "home.productsTitle", section: "home", language: "en" as const, value: "Our Products" },
  { key: "home.newsTitle", section: "home", language: "tr" as const, value: "Son Haberler" },
  { key: "home.newsTitle", section: "home", language: "en" as const, value: "Latest News" },
  { key: "home.contactTitle", section: "home", language: "tr" as const, value: "İletişim" },
  { key: "home.contactTitle", section: "home", language: "en" as const, value: "Contact" },

  // Products
  { key: "products.specifications", section: "products", language: "tr" as const, value: "Teknik Özellikler" },
  { key: "products.specifications", section: "products", language: "en" as const, value: "Specifications" },
  { key: "products.oemCodes", section: "products", language: "tr" as const, value: "OEM Kodları" },
  { key: "products.oemCodes", section: "products", language: "en" as const, value: "OEM Codes" },
  { key: "products.applications", section: "products", language: "tr" as const, value: "Uygulamalar" },
  { key: "products.applications", section: "products", language: "en" as const, value: "Applications" },
  { key: "products.certifications", section: "products", language: "tr" as const, value: "Sertifikasyonlar" },
  { key: "products.certifications", section: "products", language: "en" as const, value: "Certifications" },
  { key: "products.downloadCatalog", section: "products", language: "tr" as const, value: "Kataloğu İndir" },
  { key: "products.downloadCatalog", section: "products", language: "en" as const, value: "Download Catalog" },
  { key: "products.relatedProducts", section: "products", language: "tr" as const, value: "İlgili Ürünler" },
  { key: "products.relatedProducts", section: "products", language: "en" as const, value: "Related Products" },

  // Admin
  { key: "admin.dashboard", section: "admin", language: "tr" as const, value: "Kontrol Paneli" },
  { key: "admin.dashboard", section: "admin", language: "en" as const, value: "Dashboard" },
  { key: "admin.products", section: "admin", language: "tr" as const, value: "Ürünler" },
  { key: "admin.products", section: "admin", language: "en" as const, value: "Products" },
  { key: "admin.articles", section: "admin", language: "tr" as const, value: "Haberler" },
  { key: "admin.articles", section: "admin", language: "en" as const, value: "Articles" },
  { key: "admin.content", section: "admin", language: "tr" as const, value: "İçerik" },
  { key: "admin.content", section: "admin", language: "en" as const, value: "Content" },
  { key: "admin.settings", section: "admin", language: "tr" as const, value: "Ayarlar" },
  { key: "admin.settings", section: "admin", language: "en" as const, value: "Settings" },
  { key: "admin.localization", section: "admin", language: "tr" as const, value: "Dil & Tema" },
  { key: "admin.localization", section: "admin", language: "en" as const, value: "Language & Theme" },

  // Footer
  { key: "footer.company", section: "footer", language: "tr" as const, value: "Şirket" },
  { key: "footer.company", section: "footer", language: "en" as const, value: "Company" },
  { key: "footer.about", section: "footer", language: "tr" as const, value: "Hakkımızda" },
  { key: "footer.about", section: "footer", language: "en" as const, value: "About" },
  { key: "footer.contact", section: "footer", language: "tr" as const, value: "İletişim" },
  { key: "footer.contact", section: "footer", language: "en" as const, value: "Contact" },
  { key: "footer.followUs", section: "footer", language: "tr" as const, value: "Bizi Takip Edin" },
  { key: "footer.followUs", section: "footer", language: "en" as const, value: "Follow Us" },
  { key: "footer.copyright", section: "footer", language: "tr" as const, value: "© 2026 Vaden. Tüm Hakları Saklıdır." },
  { key: "footer.copyright", section: "footer", language: "en" as const, value: "© 2026 Vaden. All Rights Reserved." },
];

async function seedTranslations() {
  try {
    if (!DATABASE_URL) {
      console.error("❌ DATABASE_URL not set");
      process.exit(1);
    }

    const connection = await mysql.createConnection(DATABASE_URL);
    const db = drizzle(connection);

    console.log("Seeding translations...");
    
    for (const data of translationData) {
      await db.insert(translations).values({
        id: nanoid(),
        key: data.key,
        section: data.section,
        language: data.language,
        value: data.value,
      }).onDuplicateKeyUpdate({
        set: { value: data.value },
      });
    }

    console.log("✅ Translations seeded successfully!");
    await connection.end();
  } catch (error) {
    console.error("❌ Error seeding translations:", error);
    process.exit(1);
  }
}

seedTranslations();
