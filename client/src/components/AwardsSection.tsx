/*
  VADEN ORIGINAL - Awards & Achievements Section Component
  Design: Industrial Precision - Dark cards with orange accents
*/

import { ArrowRight, Award, Trophy, TrendingUp } from "lucide-react";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";
import { asRecordArray, asString, useTemplateBackedPageContent } from "@/lib/pageContent";

type AwardsMetadata = {
  label: string;
  headingMain: string;
  headingHighlight: string;
  readMoreText: string;
  awards: Array<{
    id: number;
    icon: string;
    rank: string;
    list: string;
    title: string;
    description: string;
    href: string;
  }>;
  tabs: string[];
};

const AWARD_ICONS = {
  trophy: Trophy,
  trendingUp: TrendingUp,
  award: Award,
} as const;

export default function AwardsSection() {
  const { ref, isVisible } = useIntersectionObserver({ threshold: 0.1 });
  const { metadata } = useTemplateBackedPageContent<AwardsMetadata>("home.awards");
  const awards = asRecordArray<{
    id: number;
    icon: string;
    rank: string;
    list: string;
    title: string;
    description: string;
    href: string;
  }>(metadata.awards, []);
  const tabs = Array.isArray(metadata.tabs) ? metadata.tabs : [];

  return (
    <section
      id="oduller"
      className="py-20 bg-[var(--vaden-surface-09)] relative overflow-hidden"
      ref={ref as React.RefObject<HTMLElement>}
    >
      <div className="absolute top-0 right-0 w-96 h-96 bg-[oklch(0.60_0.18_42)/3] rounded-full blur-3xl"></div>

      <div className="container mx-auto px-6 max-w-7xl relative z-10">
        <div
          className={`mb-12 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {awards.map((award, index) => {
            const Icon = AWARD_ICONS[(asString(award.icon) as keyof typeof AWARD_ICONS) || "trophy"];
            return (
              <div
                key={`${award.id}-${index}`}
                className={`bg-[var(--vaden-surface-12)] border border-[var(--vaden-border)] hover:border-[oklch(0.60_0.18_42)] p-6 group transition-all duration-300 ${
                  isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                }`}
                style={{ transitionDelay: `${index * 0.15}s` }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-[oklch(0.60_0.18_42)/10] flex items-center justify-center group-hover:bg-[oklch(0.60_0.18_42)/20] transition-colors">
                    <Icon size={22} className="text-[oklch(0.60_0.18_42)]" />
                  </div>
                  <div className="text-right">
                    <div className="font-['Barlow_Condensed'] font-black text-[oklch(0.60_0.18_42)] text-4xl leading-none">
                      {asString(award.rank)}
                    </div>
                    <div className="font-['Barlow_Condensed'] font-bold text-[oklch(0.50_0.01_250)] text-sm tracking-wide">
                      {asString(award.list)}
                    </div>
                  </div>
                </div>

                <h3 className="font-['Barlow_Condensed'] font-bold text-[var(--vaden-on-surface)] text-lg leading-tight mb-3 uppercase">
                  {asString(award.title)}
                </h3>
                <p className="text-[oklch(0.50_0.01_250)] text-sm font-['Inter'] leading-relaxed mb-4">
                  {asString(award.description)}
                </p>

                <a
                  href={asString(award.href, "#")}
                  className="inline-flex items-center gap-2 text-[oklch(0.60_0.18_42)] font-['Barlow_Condensed'] font-bold text-sm tracking-wide uppercase hover:gap-4 transition-all"
                >
                  {asString(metadata.readMoreText, "Devamını Oku")} <ArrowRight size={14} />
                </a>
              </div>
            );
          })}
        </div>

        <div
          className={`flex items-center gap-4 justify-center transition-all duration-700 delay-500 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          {tabs.map((tab, index) => (
            <button
              key={`${tab}-${index}`}
              className={`font-['Barlow_Condensed'] font-bold text-sm px-6 py-2.5 tracking-wide uppercase transition-all ${
                index === 0
                  ? "bg-[oklch(0.60_0.18_42)] text-[var(--vaden-on-accent)]"
                  : "border border-[oklch(0.30_0.01_250)] text-[var(--vaden-text-muted)] hover:border-[oklch(0.60_0.18_42)] hover:text-[oklch(0.60_0.18_42)]"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
