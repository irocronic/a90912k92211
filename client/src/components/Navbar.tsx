/*
  VADEN ORIGINAL - Navbar Component
  Design: Industrial Precision - Dark background with orange accent
  Fixed top navigation with transparent-to-dark scroll behavior
*/

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Mail, Menu, Phone, Search, X } from "lucide-react";
import { useI18n } from "@/contexts/I18nContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useLocation } from "wouter";
import { asRecordArray, asString, useTemplateBackedPageContent } from "@/lib/pageContent";
import { usePublicSiteSettings } from "@/lib/siteSettings";
import BrandLogo from "@/components/BrandLogo";

type NavChild = {
  labelTr: string;
  labelEn: string;
  labelAr?: string;
  href: string;
};

type NavItem = {
  labelTr: string;
  labelEn: string;
  labelAr?: string;
  href: string;
  children?: NavChild[];
};

type NavbarMetadata = {
  topBarPhone: string;
  topBarEmail: string;
  logoTitle: string;
  logoSubtitle: string;
  lightModeTitle: string;
  darkModeTitle: string;
  searchPlaceholderTr: string;
  searchPlaceholderEn: string;
  searchPlaceholderAr?: string;
  navItems: NavItem[];
};

const QUOTE_NAV_LABELS = {
  labelTr: "Teklif",
  labelEn: "Quote",
  labelAr: "طلب عرض سعر",
};

const CONTACT_FOOTER_HREF = "/#iletisim-bilgileri";

const REAL_PRODUCT_CATEGORIES = [
  "FREN SİSTEMİ",
  "ELEKTRİK SİSTEMİ",
  "HAVALI FREN KOMPRESÖRÜ",
  "SÜSPANSİYON",
  "DEBRİYAJ",
  "ŞANZIMAN",
  "KABİN PARÇALARI",
  "MOTOR",
  "SOĞUTMA SİSTEMİ",
  "DİREKSİYON",
];

const Navbar = () => {
  const { language, setLanguage } = useI18n();
  const { theme, setTheme } = useTheme();
  const [, navigate] = useLocation();
  const { metadata } = useTemplateBackedPageContent<NavbarMetadata>("layout.navbar");
  const siteSettings = usePublicSiteSettings();

  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const navItems = useMemo(
    () => {
      const sourceItems = asRecordArray<NavItem>(metadata.navItems, []);
      const items: NavItem[] = [];

      sourceItems.forEach((item) => {
        const trLabel = asString(item.labelTr).toLowerCase();
        const enLabel = asString(item.labelEn).toLowerCase();
        const arLabel = asString(item.labelAr).toLowerCase();
        const isProductsItem =
          trLabel === "ürünler" || enLabel === "products" || arLabel === "المنتجات";
        const normalizedHref = asString(item.href).trim();
        const isLegacyContactItem =
          (trLabel === "iletişim" || enLabel === "contact" || arLabel === "اتصل بنا") &&
          (normalizedHref === "/#iletisim" || normalizedHref === "#iletisim");

        if (isProductsItem) {
          items.push({
            ...item,
            href: "/products",
            children: REAL_PRODUCT_CATEGORIES.map((category) => ({
              labelTr: category,
              labelEn: category,
              labelAr: category,
              href: `/products?category=${encodeURIComponent(category)}`,
            })),
          });
          return;
        }

        if (isLegacyContactItem) {
          items.push({
            ...item,
            ...QUOTE_NAV_LABELS,
            href: "/#teklif",
          });
          items.push({
            labelTr: asString(item.labelTr, "İletişim"),
            labelEn: asString(item.labelEn, "Contact"),
            labelAr: asString(item.labelAr, "اتصل بنا"),
            href: CONTACT_FOOTER_HREF,
          });
          return;
        }

        items.push(item);
      });

      return items;
    },
    [metadata.navItems],
  );
  const contactItems = [
    {
      type: "phone" as const,
      value: siteSettings.contactPhone || asString(metadata.topBarPhone),
      href: `tel:${(siteSettings.contactPhone || asString(metadata.topBarPhone)).replace(/\s+/g, "")}`,
      icon: Phone,
    },
    {
      type: "email" as const,
      value: siteSettings.contactEmail || asString(metadata.topBarEmail),
      href: `mailto:${siteSettings.contactEmail || asString(metadata.topBarEmail)}`,
      icon: Mail,
    },
  ].filter((item) => item.value);

  const getLabel = (item: { labelTr: string; labelEn: string; labelAr?: string }) => {
    if (language === "ar") {
      return asString(item.labelAr, asString(item.labelEn, asString(item.labelTr)));
    }
    if (language === "en") {
      return asString(item.labelEn, asString(item.labelTr));
    }
    return asString(item.labelTr, asString(item.labelEn));
  };

  const normalizeNavHref = (href?: string) => {
    const value = asString(href, "#");
    return value === "/#urunler" || value === "#urunler" ? "/products" : value;
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchOpen(false);
      setSearchQuery("");
    }
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-[var(--vaden-surface-08)] shadow-[0_4px_20px_rgba(0,0,0,0.4)] border-b border-[oklch(0.60_0.18_42)/20]"
          : "bg-gradient-to-b from-[oklch(0.05_0.01_250)/90] via-[oklch(0.05_0.01_250)/60] to-transparent"
      }`}
    >
      <div className="hidden lg:flex items-center justify-between px-6 py-2 bg-[var(--vaden-surface-08)] text-[var(--vaden-text-muted)] text-sm border-b border-[var(--vaden-border-soft)]">
        <div className="flex items-center gap-6">
          {contactItems.map((item) => {
            const Icon = item.icon;
            return (
              <a
                key={item.type}
                href={item.href}
                className="flex items-center gap-2 hover:text-[oklch(0.60_0.18_42)] transition"
              >
                <Icon size={14} />
                <span>{item.value}</span>
              </a>
            );
          })}
        </div>
        <div className="flex items-center gap-4">
          <div className="flex gap-2">
            <button
              onClick={() => setLanguage("tr")}
              className={`px-2 py-1 rounded transition ${
                language === "tr"
                  ? "bg-orange-600 text-white"
                  : "text-[var(--vaden-text-muted)] hover:text-orange-500"
              }`}
            >
              TR
            </button>
            <button
              onClick={() => setLanguage("en")}
              className={`px-2 py-1 rounded transition ${
                language === "en"
                  ? "bg-orange-600 text-white"
                  : "text-[var(--vaden-text-muted)] hover:text-orange-500"
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setLanguage("ar")}
              className={`px-2 py-1 rounded transition ${
                language === "ar"
                  ? "bg-orange-600 text-white"
                  : "text-[var(--vaden-text-muted)] hover:text-orange-500"
              }`}
            >
              AR
            </button>
          </div>

          <div className="flex gap-2 border-l border-[var(--vaden-border)] pl-4">
            <button
              onClick={() => setTheme("light")}
              className={`px-2 py-1 rounded transition ${
                theme === "light"
                  ? "bg-orange-600 text-white"
                  : "text-[var(--vaden-text-muted)] hover:text-orange-500"
              }`}
              title={asString(metadata.lightModeTitle, "Light Mode")}
            >
              ☀️
            </button>
            <button
              onClick={() => setTheme("dark")}
              className={`px-2 py-1 rounded transition ${
                theme === "dark"
                  ? "bg-orange-600 text-white"
                  : "text-[var(--vaden-text-muted)] hover:text-orange-500"
              }`}
              title={asString(metadata.darkModeTitle, "Dark Mode")}
            >
              🌙
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 lg:px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/")}>
            <BrandLogo className="h-12 w-auto md:h-14" />
          </div>

          <div className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const label = getLabel(item);
              const children = Array.isArray(item.children) ? item.children : [];
              return (
                <div
                  key={label}
                  className="relative group"
                  onMouseEnter={() => setActiveDropdown(label)}
                  onMouseLeave={() => setActiveDropdown(null)}
                >
                  <a
                    href={normalizeNavHref(item.href)}
                    className="px-4 py-2 text-[var(--vaden-text-dim)] hover:text-[oklch(0.60_0.18_42)] transition flex items-center gap-1 rounded-lg hover:bg-[var(--vaden-surface-14)]"
                  >
                    {label}
                    {children.length > 0 && (
                      <ChevronDown
                        size={16}
                        className={`transition-transform duration-200 ${
                          activeDropdown === label ? "rotate-180" : ""
                        }`}
                      />
                    )}
                  </a>

                  {children.length > 0 && activeDropdown === label && (
                    <div className="absolute left-0 top-full mt-1 w-56 bg-[var(--vaden-surface-10)] border border-[oklch(0.60_0.18_42)/30] shadow-2xl py-2 z-50">
                      <div className="absolute top-0 left-4 w-8 h-0.5 bg-[oklch(0.60_0.18_42)]"></div>
                      {children.map((child, childIndex) => (
                        <a
                          key={`${label}-${childIndex}`}
                          href={normalizeNavHref(child.href)}
                          className="flex items-center gap-2 px-4 py-2.5 text-[var(--vaden-text-dim)] hover:text-[oklch(0.60_0.18_42)] hover:bg-[var(--vaden-surface-14)] transition group/item"
                        >
                          <span className="w-0 group-hover/item:w-2 h-px bg-[oklch(0.60_0.18_42)] transition-all duration-200 inline-block flex-shrink-0"></span>
                          <span className="text-sm font-['Inter']">{getLabel(child)}</span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              {searchOpen ? (
                <input
                  type="text"
                  placeholder={
                    language === "ar"
                      ? asString(metadata.searchPlaceholderAr, "ابحث برقم OEM أو باسم المنتج...")
                      : language === "en"
                        ? asString(metadata.searchPlaceholderEn, "Search OEM Code...")
                        : asString(metadata.searchPlaceholderTr, "OEM Kodu Ara...")
                  }
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="px-3 py-2 bg-[var(--vaden-surface-14)] border border-orange-600 rounded-lg text-[var(--vaden-on-surface)] placeholder-[var(--vaden-text-placeholder)] focus:outline-none focus:ring-2 focus:ring-orange-600 w-48"
                  autoFocus
                />
              ) : (
                <button
                  onClick={() => setSearchOpen(true)}
                  className="p-2 text-[var(--vaden-text-dim)] hover:text-orange-500 transition"
                >
                  <Search size={20} />
                </button>
              )}
            </div>

            <button
              onClick={() => setIsOpen(!isOpen)}
              className="lg:hidden p-2 text-[var(--vaden-text-dim)] hover:text-orange-500 transition"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {isOpen && (
          <div className="lg:hidden mt-4 p-2 space-y-2 rounded-xl border border-[var(--vaden-border-soft)] bg-[var(--vaden-surface-10)] shadow-[0_12px_36px_rgba(0,0,0,0.28)] backdrop-blur-xl">
            <div className="flex items-center gap-2 px-2 pb-2">
              {(["tr", "en", "ar"] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setLanguage(lang)}
                  className={`rounded-md px-3 py-1.5 text-xs font-bold uppercase transition ${
                    language === lang
                      ? "bg-orange-600 text-white"
                      : "bg-[var(--vaden-surface-14)] text-[var(--vaden-text-muted)]"
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
            {navItems.map((item, index) => {
              const label = getLabel(item);
              const children = Array.isArray(item.children) ? item.children : [];
              const key = `${label}-${index}`;
              const open = activeDropdown === key;
              return (
                <div key={key}>
                  {children.length > 0 ? (
                    <div className="flex items-center gap-2">
                      <a
                        href={normalizeNavHref(item.href)}
                        className="flex-1 px-4 py-2 text-[var(--vaden-on-surface)] hover:text-orange-500 hover:bg-[var(--vaden-surface-14)] rounded-lg transition"
                        onClick={() => {
                          setIsOpen(false);
                          setActiveDropdown(null);
                        }}
                      >
                        {label}
                      </a>
                      <button
                        onClick={() => setActiveDropdown(open ? null : key)}
                        className="px-3 py-2 text-[var(--vaden-on-surface)] hover:text-orange-500 hover:bg-[var(--vaden-surface-14)] rounded-lg transition"
                        aria-label={`${label} alt menusu`}
                      >
                        <ChevronDown size={16} className={`transition ${open ? "rotate-180" : ""}`} />
                      </button>
                    </div>
                  ) : (
                    <a
                      href={normalizeNavHref(item.href)}
                      className="block w-full text-left px-4 py-2 text-[var(--vaden-on-surface)] hover:text-orange-500 hover:bg-[var(--vaden-surface-14)] rounded-lg transition"
                      onClick={() => {
                        setIsOpen(false);
                        setActiveDropdown(null);
                      }}
                    >
                      {label}
                    </a>
                  )}
                  {children.length > 0 && open && (
                    <div className="ml-3 mr-1 mt-1 mb-2 p-1.5 rounded-lg border border-[var(--vaden-border-soft)] bg-[var(--vaden-surface-12)] space-y-1">
                      {children.map((child, childIndex) => (
                        <a
                          key={`${key}-child-${childIndex}`}
                          href={normalizeNavHref(child.href)}
                          className="block px-3 py-2 text-sm text-[var(--vaden-on-surface)]/85 hover:text-orange-500 hover:bg-[var(--vaden-surface-14)] rounded-md transition"
                          onClick={() => {
                            setIsOpen(false);
                            setActiveDropdown(null);
                          }}
                        >
                          {getLabel(child)}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
