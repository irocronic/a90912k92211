/*
  VADEN ORIGINAL - News Section Component
  Design: Industrial Precision - Dark news cards
*/

import { useMemo } from "react";
import { ArrowRight, Calendar } from "lucide-react";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";
import { trpc } from "@/lib/trpc";
import { asString, useTemplateBackedPageContent } from "@/lib/pageContent";
import { useI18n } from "@/contexts/I18nContext";
import {
  ARTICLE_CONTENT_TRANSLATION_SECTION,
  getArticleTranslationKey,
  localizeArticle,
} from "@/lib/contentLocalization";

type NewsHeaderMetadata = {
  label: string;
  headingMain: string;
  headingHighlight: string;
  viewAllText: string;
};

function formatDate(value: Date | string | null | undefined, language: "tr" | "en"): string {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(language === "en" ? "en-US" : "tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export default function NewsSection() {
  const { ref, isVisible } = useIntersectionObserver({ threshold: 0.1 });
  const { language } = useI18n();
  const { metadata } = useTemplateBackedPageContent<NewsHeaderMetadata>("home.news");
  const { data: articles = [] } = trpc.content.articles.list.useQuery({
    publishedOnly: true,
    limit: 8,
  });
  const { data: enArticleTranslations = {} } =
    trpc.i18n.getSectionTranslations.useQuery(
      {
        language: "en",
        section: ARTICLE_CONTENT_TRANSLATION_SECTION,
      },
      {
        enabled: language === "en",
      },
    );

  const newsItems = useMemo(
    () =>
      articles.slice(0, 4).map((entry) => {
        const article = localizeArticle(
          entry,
          language,
          enArticleTranslations[getArticleTranslationKey(entry.id)],
        );
        return {
        id: article.id,
        date: formatDate(article.publishedAt ?? article.createdAt, language),
        category: article.category,
        title: article.title,
        excerpt: article.excerpt,
        image: article.imageUrl || "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=600&q=80",
        href: "#",
        };
      }),
    [articles, language, enArticleTranslations],
  );

  return (
    <section
      id="haberler"
      className="py-20 bg-[var(--vaden-surface-10)]"
      ref={ref as React.RefObject<HTMLElement>}
    >
      <div className="container mx-auto px-6 max-w-7xl">
        {/* Section header */}
        <div className={`mb-12 flex flex-col md:flex-row md:items-end justify-between gap-4 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className="w-10 h-0.5 bg-[oklch(0.60_0.18_42)]"></span>
              <span className="text-[oklch(0.60_0.18_42)] font-['Barlow_Condensed'] font-bold text-sm tracking-[0.2em] uppercase">
                {asString(metadata.label)}
              </span>
            </div>
            <h2 className="font-['Barlow_Condensed'] font-black text-[var(--vaden-on-surface)] text-5xl md:text-6xl leading-none uppercase">
              {asString(metadata.headingMain)}
              <br />
              <span className="text-[oklch(0.60_0.18_42)]">{asString(metadata.headingHighlight)}</span>
            </h2>
          </div>
          <a
            href="#haberler"
            className="inline-flex items-center gap-2 text-[oklch(0.60_0.18_42)] font-['Barlow_Condensed'] font-bold text-sm tracking-wide uppercase hover:gap-4 transition-all"
          >
            {asString(metadata.viewAllText, "Tüm Haberleri Gör")} <ArrowRight size={16} />
          </a>
        </div>

        {/* News grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {newsItems.map((item, index) => (
            <a
              key={item.id}
              href={item.href}
              className={`group bg-[var(--vaden-surface-14)] border border-[var(--vaden-border)] hover:border-[oklch(0.60_0.18_42)] overflow-hidden block transition-all duration-300 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              }`}
              style={{ transitionDelay: `${index * 0.1}s` }}
            >
              {/* Image */}
              <div className="relative h-44 overflow-hidden">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[oklch(0.10_0.01_250)] to-transparent"></div>
                <div className="absolute top-3 left-3">
                  <span className="bg-[oklch(0.60_0.18_42)] text-[var(--vaden-on-accent)] font-['Barlow_Condensed'] font-bold text-xs px-2 py-1 tracking-wide">
                    {item.category}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <div className="flex items-center gap-1.5 text-[oklch(0.45_0.01_250)] text-xs font-['Inter'] mb-2">
                  <Calendar size={12} />
                  {item.date}
                </div>
                <h3 className="font-['Barlow_Condensed'] font-bold text-[var(--vaden-on-surface)] text-lg leading-tight uppercase mb-2 group-hover:text-[oklch(0.60_0.18_42)] transition-colors">
                  {item.title}
                </h3>
                <p className="text-[oklch(0.45_0.01_250)] text-xs font-['Inter'] leading-relaxed line-clamp-3">
                  {item.excerpt}
                </p>
              </div>

              {/* Bottom border on hover */}
              <div className="h-0.5 w-0 bg-[oklch(0.60_0.18_42)] group-hover:w-full transition-all duration-500"></div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
