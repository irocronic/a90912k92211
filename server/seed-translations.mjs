import { drizzle } from "drizzle-orm/mysql2";
import { translations } from "../drizzle/schema.ts";
import mysql from "mysql2/promise";

const DATABASE_URL = process.env.DATABASE_URL;

const translationData = [
  // Common
  { key: "common.appName", section: "common", language: "tr", value: "Vaden" },
  { key: "common.appName", section: "common", language: "en", value: "Vaden" },
  { key: "common.appDescription", section: "common", language: "tr", value: "Hava Fren Sistemleri ve Otomotiv Parçaları" },
  { key: "common.appDescription", section: "common", language: "en", value: "Air Brake Systems & Automotive Parts" },
  { key: "common.language", section: "common", language: "tr", value: "Dil" },
  { key: "common.language", section: "common", language: "en", value: "Language" },
  { key: "common.theme", section: "common", language: "tr", value: "Tema" },
  { key: "common.theme", section: "common", language: "en", value: "Theme" },
  { key: "common.light", section: "common", language: "tr", value: "Aydınlık" },
  { key: "common.light", section: "common", language: "en", value: "Light" },
  { key: "common.dark", section: "common", language: "tr", value: "Koyu" },
  { key: "common.dark", section: "common", language: "en", value: "Dark" },
  { key: "common.loading", section: "common", language: "tr", value: "Yükleniyor..." },
  { key: "common.loading", section: "common", language: "en", value: "Loading..." },
  { key: "common.error", section: "common", language: "tr", value: "Hata oluştu" },
  { key: "common.error", section: "common", language: "en", value: "An error occurred" },
  { key: "common.success", section: "common", language: "tr", value: "Başarılı" },
  { key: "common.success", section: "common", language: "en", value: "Success" },
  { key: "common.save", section: "common", language: "tr", value: "Kaydet" },
  { key: "common.save", section: "common", language: "en", value: "Save" },
  { key: "common.cancel", section: "common", language: "tr", value: "İptal" },
  { key: "common.cancel", section: "common", language: "en", value: "Cancel" },
  { key: "common.delete", section: "common", language: "tr", value: "Sil" },
  { key: "common.delete", section: "common", language: "en", value: "Delete" },
  { key: "common.edit", section: "common", language: "tr", value: "Düzenle" },
  { key: "common.edit", section: "common", language: "en", value: "Edit" },
  { key: "common.add", section: "common", language: "tr", value: "Ekle" },
  { key: "common.add", section: "common", language: "en", value: "Add" },
  { key: "common.search", section: "common", language: "tr", value: "Ara" },
  { key: "common.search", section: "common", language: "en", value: "Search" },

  // Navbar
  { key: "navbar.home", section: "navbar", language: "tr", value: "Ana Sayfa" },
  { key: "navbar.home", section: "navbar", language: "en", value: "Home" },
  { key: "navbar.products", section: "navbar", language: "tr", value: "Ürünler" },
  { key: "navbar.products", section: "navbar", language: "en", value: "Products" },
  { key: "navbar.about", section: "navbar", language: "tr", value: "Hakkımızda" },
  { key: "navbar.about", section: "navbar", language: "en", value: "About" },
  { key: "navbar.news", section: "navbar", language: "tr", value: "Haberler" },
  { key: "navbar.news", section: "navbar", language: "en", value: "News" },
  { key: "navbar.contact", section: "navbar", language: "tr", value: "İletişim" },
  { key: "navbar.contact", section: "navbar", language: "en", value: "Contact" },
  { key: "navbar.admin", section: "navbar", language: "tr", value: "Admin" },
  { key: "navbar.admin", section: "navbar", language: "en", value: "Admin" },
  { key: "navbar.login", section: "navbar", language: "tr", value: "Giriş Yap" },
  { key: "navbar.login", section: "navbar", language: "en", value: "Login" },
  { key: "navbar.logout", section: "navbar", language: "tr", value: "Çıkış Yap" },
  { key: "navbar.logout", section: "navbar", language: "en", value: "Logout" },

  // Home
  { key: "home.heroTitle", section: "home", language: "tr", value: "Vaden - Otomotiv Endüstrisinin Lider Üreticisi" },
  { key: "home.heroTitle", section: "home", language: "en", value: "Vaden - Leading Manufacturer in the Automotive Industry" },
  { key: "home.heroSubtitle", section: "home", language: "tr", value: "Yüksek kaliteli hava fren sistemleri ve otomotiv parçaları" },
  { key: "home.heroSubtitle", section: "home", language: "en", value: "High-quality air brake systems and automotive parts" },
  { key: "home.exploreProducts", section: "home", language: "tr", value: "Ürünleri Keşfet" },
  { key: "home.exploreProducts", section: "home", language: "en", value: "Explore Products" },
  { key: "home.aboutTitle", section: "home", language: "tr", value: "Hakkımızda" },
  { key: "home.aboutTitle", section: "home", language: "en", value: "About Us" },
  { key: "home.productsTitle", section: "home", language: "tr", value: "Ürünlerimiz" },
  { key: "home.productsTitle", section: "home", language: "en", value: "Our Products" },
  { key: "home.newsTitle", section: "home", language: "tr", value: "Son Haberler" },
  { key: "home.newsTitle", section: "home", language: "en", value: "Latest News" },
  { key: "home.contactTitle", section: "home", language: "tr", value: "İletişim" },
  { key: "home.contactTitle", section: "home", language: "en", value: "Contact" },

  // Products
  { key: "products.specifications", section: "products", language: "tr", value: "Teknik Özellikler" },
  { key: "products.specifications", section: "products", language: "en", value: "Specifications" },
  { key: "products.oemCodes", section: "products", language: "tr", value: "OEM Kodları" },
  { key: "products.oemCodes", section: "products", language: "en", value: "OEM Codes" },
  { key: "products.applications", section: "products", language: "tr", value: "Uygulamalar" },
  { key: "products.applications", section: "products", language: "en", value: "Applications" },
  { key: "products.certifications", section: "products", language: "tr", value: "Sertifikasyonlar" },
  { key: "products.certifications", section: "products", language: "en", value: "Certifications" },
  { key: "products.downloadCatalog", section: "products", language: "tr", value: "Kataloğu İndir" },
  { key: "products.downloadCatalog", section: "products", language: "en", value: "Download Catalog" },
  { key: "products.relatedProducts", section: "products", language: "tr", value: "İlgili Ürünler" },
  { key: "products.relatedProducts", section: "products", language: "en", value: "Related Products" },

  // Admin
  { key: "admin.dashboard", section: "admin", language: "tr", value: "Kontrol Paneli" },
  { key: "admin.dashboard", section: "admin", language: "en", value: "Dashboard" },
  { key: "admin.products", section: "admin", language: "tr", value: "Ürünler" },
  { key: "admin.products", section: "admin", language: "en", value: "Products" },
  { key: "admin.articles", section: "admin", language: "tr", value: "Haberler" },
  { key: "admin.articles", section: "admin", language: "en", value: "Articles" },
  { key: "admin.content", section: "admin", language: "tr", value: "İçerik" },
  { key: "admin.content", section: "admin", language: "en", value: "Content" },
  { key: "admin.settings", section: "admin", language: "tr", value: "Ayarlar" },
  { key: "admin.settings", section: "admin", language: "en", value: "Settings" },
  { key: "admin.localization", section: "admin", language: "tr", value: "Dil & Tema" },
  { key: "admin.localization", section: "admin", language: "en", value: "Language & Theme" },

  // Footer
  { key: "footer.company", section: "footer", language: "tr", value: "Şirket" },
  { key: "footer.company", section: "footer", language: "en", value: "Company" },
  { key: "footer.about", section: "footer", language: "tr", value: "Hakkımızda" },
  { key: "footer.about", section: "footer", language: "en", value: "About" },
  { key: "footer.contact", section: "footer", language: "tr", value: "İletişim" },
  { key: "footer.contact", section: "footer", language: "en", value: "Contact" },
  { key: "footer.followUs", section: "footer", language: "tr", value: "Bizi Takip Edin" },
  { key: "footer.followUs", section: "footer", language: "en", value: "Follow Us" },
  { key: "footer.copyright", section: "footer", language: "tr", value: "© 2026 Vaden. Tüm Hakları Saklıdır." },
  { key: "footer.copyright", section: "footer", language: "en", value: "© 2026 Vaden. All Rights Reserved." },
];

async function seedTranslations() {
  try {
    const connection = await mysql.createConnection(DATABASE_URL);
    const db = drizzle(connection);

    console.log("Seeding translations...");
    
    for (const data of translationData) {
      await db.insert(translations).values(data).onDuplicateKeyUpdate({
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
