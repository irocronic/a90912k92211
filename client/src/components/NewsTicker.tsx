/*
  VADEN ORIGINAL - News Ticker / Announcements Component
  Design: Industrial Precision - Orange accent news strip
*/

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { asString, useTemplateBackedPageContent } from "@/lib/pageContent";
import { useI18n } from "@/contexts/I18nContext";
import {
  ARTICLE_CONTENT_TRANSLATION_SECTION,
  getArticleTranslationKey,
  localizeArticle,
} from "@/lib/contentLocalization";

type NewsTickerMetadata = {
  labelText: string;
  readMoreText: string;
};

export default function NewsTicker() {
  const { language } = useI18n();
  const { data: articles = [] } = trpc.content.articles.list.useQuery({
    publishedOnly: true,
    limit: 12,
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
  const { metadata } = useTemplateBackedPageContent<NewsTickerMetadata>("home.newsTicker");
  const news = useMemo(
    () =>
      articles.slice(0, 6).map((entry) => {
        const article = localizeArticle(
          entry,
          language,
          enArticleTranslations[getArticleTranslationKey(entry.id)],
        );
        return {
        id: article.id,
        tag: article.category,
        text: article.excerpt || article.title,
        link: "#",
        };
      }),
    [articles, language, enArticleTranslations],
  );
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (news.length === 0) return;
    if (current < news.length) return;
    setCurrent(0);
  }, [current, news.length]);

  if (news.length === 0) return null;

  const prev = () => setCurrent((c) => (c - 1 + news.length) % news.length);
  const next = () => setCurrent((c) => (c + 1) % news.length);

  return (
    <div className="bg-[oklch(0.60_0.18_42)] text-white">
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="flex items-center h-12">
          {/* Label */}
          <div className="hidden md:flex items-center gap-2 pr-4 border-r border-white/20 mr-4 flex-shrink-0">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span className="font-['Barlow_Condensed'] font-bold text-sm tracking-[0.15em] uppercase">
              {asString(metadata.labelText, "DUYURULAR")}
            </span>
          </div>

          {/* Tag */}
          <span className="bg-white/20 text-white font-['Barlow_Condensed'] font-bold text-xs px-2 py-0.5 mr-3 flex-shrink-0 tracking-wide">
            {news[current].tag}
          </span>

          {/* Text */}
          <p className="flex-1 text-sm font-['Inter'] truncate text-white/90">
            {news[current].text}
          </p>

          {/* Read more */}
          <a
            href={news[current].link}
            className="hidden md:flex items-center gap-1 text-xs font-['Barlow_Condensed'] font-bold tracking-wide uppercase ml-4 hover:text-white/70 transition-colors flex-shrink-0"
          >
            {asString(metadata.readMoreText, "Devamını Oku")} <ArrowRight size={12} />
          </a>

          {/* Navigation */}
          <div className="flex items-center gap-1 ml-4 flex-shrink-0">
            <button onClick={prev} className="p-1 hover:bg-white/20 transition-colors">
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs font-['Barlow_Condensed'] font-bold px-1">
              {current + 1}/{news.length}
            </span>
            <button onClick={next} className="p-1 hover:bg-white/20 transition-colors">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
