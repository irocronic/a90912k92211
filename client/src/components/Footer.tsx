/*
  VADEN ORIGINAL - Footer Component
  Design: Industrial Precision - Dark footer with orange accents
*/

import {
  Facebook,
  Linkedin,
  Mail,
  MapPin,
  Phone,
  Twitter,
} from "lucide-react";
import { useI18n } from "@/contexts/I18nContext";
import { asRecordArray, asString, useTemplateBackedPageContent } from "@/lib/pageContent";
import { usePublicSiteSettings } from "@/lib/siteSettings";
import BrandLogo from "@/components/BrandLogo";

type FooterMetadata = {
  logoTitle: string;
  logoSubtitle: string;
  sectionProductsTitle: string;
  sectionCorporateTitle: string;
  sectionContactTitle: string;
  brandDescription: string;
  socialLinks: Array<{ icon: string; href: string }>;
  productLinks: Array<{ label: string; href: string }>;
  corporateLinks: Array<{ label: string; href: string }>;
  addressLines: string[];
  phone: string;
  email: string;
  newsletterTitle: string;
  newsletterPlaceholder: string;
  newsletterButton: string;
  copyrightText: string;
  policyLinks: Array<{ label: string; href: string }>;
};

const SOCIAL_ICONS = {
  facebook: Facebook,
  twitter: Twitter,
  linkedin: Linkedin,
} as const;

export default function Footer() {
  const { language } = useI18n();
  const { metadata } = useTemplateBackedPageContent<FooterMetadata>("layout.footer");
  const siteSettings = usePublicSiteSettings();
  const socialLinks = [
    ...(siteSettings.socialFacebook
      ? [{ icon: "facebook", href: siteSettings.socialFacebook }]
      : []),
    ...(siteSettings.socialTwitter
      ? [{ icon: "twitter", href: siteSettings.socialTwitter }]
      : []),
    ...(siteSettings.socialLinkedin
      ? [{ icon: "linkedin", href: siteSettings.socialLinkedin }]
      : []),
    ...asRecordArray<{ icon: string; href: string }>(metadata.socialLinks, []).filter(
      (item) =>
        !["facebook", "twitter", "linkedin"].includes(asString(item.icon).toLowerCase()),
    ),
  ];
  const productLinks = asRecordArray<{ label: string; href: string }>(metadata.productLinks, []);
  const corporateLinks = asRecordArray<{ label: string; href: string }>(metadata.corporateLinks, []);
  const policyLinks = asRecordArray<{ label: string; href: string }>(metadata.policyLinks, []);
  const addressLines = Array.isArray(metadata.addressLines) ? metadata.addressLines : [];
  const displayPhone = siteSettings.contactPhone || asString(metadata.phone);
  const displayEmail = siteSettings.contactEmail || asString(metadata.email);
  const displayDescription =
    siteSettings.siteDescription || asString(metadata.brandDescription);
  const rawContactTitle = asString(metadata.sectionContactTitle).trim();
  const localizedContactTitle =
    language === "ar" ? "اتصل بنا" : language === "en" ? "Contact" : "İletişim";
  const displayContactTitle =
    !rawContactTitle ||
    ["teklif", "quote", "request quote", "طلب عرض سعر"].includes(rawContactTitle.toLowerCase())
      ? localizedContactTitle
      : rawContactTitle;

  return (
    <footer
      id="iletisim-bilgileri"
      className="scroll-mt-32 lg:scroll-mt-36 bg-[var(--vaden-surface-08)] border-t border-[var(--vaden-border-soft)]"
    >
      <div className="container mx-auto px-6 max-w-7xl py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          <div className="lg:col-span-1">
            <div className="flex items-center mb-6">
              <BrandLogo className="h-16 w-auto" />
            </div>
            <p className="text-[var(--vaden-text-muted)] text-sm leading-relaxed font-['Inter'] mb-6">
              {displayDescription}
            </p>
            {socialLinks.length > 0 ? (
              <div className="flex flex-wrap items-center gap-3">
                {socialLinks.map((item, index) => {
                  const Icon =
                    SOCIAL_ICONS[(asString(item.icon).toLowerCase() as keyof typeof SOCIAL_ICONS) || "facebook"];
                  return (
                    <a
                      key={`${item.href}-${index}`}
                      href={asString(item.href, "#")}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-8 h-8 flex items-center justify-center border border-[var(--vaden-border-strong)] text-[var(--vaden-text-muted)] hover:border-[oklch(0.60_0.18_42)] hover:text-[oklch(0.60_0.18_42)] transition-all"
                      aria-label={asString(item.icon)}
                    >
                      <Icon size={14} />
                    </a>
                  );
                })}
              </div>
            ) : null}
          </div>

          <div>
            <h4 className="font-['Barlow_Condensed'] font-bold text-[var(--vaden-on-surface)] text-lg tracking-wide uppercase mb-4 flex items-center gap-2">
              <span className="w-6 h-0.5 bg-[oklch(0.60_0.18_42)] inline-block"></span>
              {asString(metadata.sectionProductsTitle, "Ürünler")}
            </h4>
            <ul className="space-y-2.5">
              {productLinks.map((item, index) => (
                <li key={`${item.label}-${index}`}>
                  <a
                    href={asString(item.href, "#")}
                    className="text-[var(--vaden-text-muted)] hover:text-[oklch(0.60_0.18_42)] text-sm transition-colors font-['Inter'] flex items-center gap-2 group"
                  >
                    <span className="w-0 group-hover:w-3 h-px bg-[oklch(0.60_0.18_42)] transition-all duration-300 inline-block"></span>
                    {asString(item.label)}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-['Barlow_Condensed'] font-bold text-[var(--vaden-on-surface)] text-lg tracking-wide uppercase mb-4 flex items-center gap-2">
              <span className="w-6 h-0.5 bg-[oklch(0.60_0.18_42)] inline-block"></span>
              {asString(metadata.sectionCorporateTitle, "Kurumsal")}
            </h4>
            <ul className="space-y-2.5">
              {corporateLinks.map((item, index) => (
                <li key={`${item.label}-${index}`}>
                  <a
                    href={asString(item.href, "#")}
                    className="text-[var(--vaden-text-muted)] hover:text-[oklch(0.60_0.18_42)] text-sm transition-colors font-['Inter'] flex items-center gap-2 group"
                  >
                    <span className="w-0 group-hover:w-3 h-px bg-[oklch(0.60_0.18_42)] transition-all duration-300 inline-block"></span>
                    {asString(item.label)}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-['Barlow_Condensed'] font-bold text-[var(--vaden-on-surface)] text-lg tracking-wide uppercase mb-4 flex items-center gap-2">
              <span className="w-6 h-0.5 bg-[oklch(0.60_0.18_42)] inline-block"></span>
              {displayContactTitle}
            </h4>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin size={16} className="text-[oklch(0.60_0.18_42)] mt-0.5 flex-shrink-0" />
                <p className="text-[var(--vaden-text-muted)] text-sm font-['Inter'] leading-relaxed">
                  {addressLines.map((line, index) => (
                    <span key={`${line}-${index}`}>
                      {line}
                      {index < addressLines.length - 1 ? <br /> : null}
                    </span>
                  ))}
                </p>
              </div>
              {displayPhone ? (
                <div className="flex items-center gap-3">
                  <Phone size={16} className="text-[oklch(0.60_0.18_42)] flex-shrink-0" />
                  <a
                    href={`tel:${displayPhone.replace(/\s+/g, "")}`}
                    className="text-[var(--vaden-text-muted)] hover:text-[oklch(0.60_0.18_42)] text-sm font-['Inter'] transition-colors"
                  >
                    {displayPhone}
                  </a>
                </div>
              ) : null}
              {displayEmail ? (
                <div className="flex items-center gap-3">
                  <Mail size={16} className="text-[oklch(0.60_0.18_42)] flex-shrink-0" />
                  <a
                    href={`mailto:${displayEmail}`}
                    className="text-[var(--vaden-text-muted)] hover:text-[oklch(0.60_0.18_42)] text-sm font-['Inter'] transition-colors"
                  >
                    {displayEmail}
                  </a>
                </div>
              ) : null}
            </div>

            {asString(metadata.newsletterTitle) ? (
              <div className="mt-6">
                <p className="text-[var(--vaden-text-muted)] text-xs font-['Inter'] mb-3">
                  {asString(metadata.newsletterTitle)}
                </p>
                <div className="flex">
                  <input
                    type="email"
                    placeholder={asString(metadata.newsletterPlaceholder)}
                    className="flex-1 bg-[var(--vaden-surface-14)] border border-[var(--vaden-border-strong)] px-3 py-2 text-sm text-[var(--vaden-text-dim)] placeholder-[var(--vaden-text-placeholder)] outline-none focus:border-[oklch(0.60_0.18_42)] transition-colors font-['Inter']"
                  />
                  <button className="bg-[oklch(0.60_0.18_42)] hover:bg-[oklch(0.50_0.18_42)] text-[var(--vaden-on-accent)] px-4 py-2 text-sm font-['Barlow_Condensed'] font-bold tracking-wide transition-colors">
                    {asString(metadata.newsletterButton, "ABONE OL")}
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="border-t border-[oklch(0.15_0.01_250)]">
        <div className="container mx-auto px-6 max-w-7xl py-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-[oklch(0.40_0.01_250)] font-['Inter']">
            <p>{asString(metadata.copyrightText)}</p>
            <div className="flex items-center gap-4">
              {policyLinks.map((item, index) => (
                <span key={`${item.label}-${index}`} className="flex items-center gap-4">
                  {index > 0 ? <span>|</span> : null}
                  <a
                    href={asString(item.href, "#")}
                    className="hover:text-[oklch(0.60_0.18_42)] transition-colors"
                  >
                    {asString(item.label)}
                  </a>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
