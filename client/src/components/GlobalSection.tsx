/*
  VADEN ORIGINAL - Global Presence Section Component
  Design: Industrial Precision - World map with stats
*/

import { Globe, Languages, MapPin, TrendingUp, Users } from "lucide-react";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";
import { asRecordArray, asString, useTemplateBackedPageContent } from "@/lib/pageContent";

type GlobalMetadata = {
  label: string;
  headingMain: string;
  headingHighlight: string;
  description: string;
  mapAlt: string;
  stats: Array<{ icon: string; value: string; label: string; description: string }>;
};

const STAT_ICONS = {
  mapPin: MapPin,
  globe: Globe,
  languages: Languages,
  users: Users,
  trendingUp: TrendingUp,
} as const;

export default function GlobalSection() {
  const { ref, isVisible } = useIntersectionObserver({ threshold: 0.1 });
  const { imageUrl, metadata } = useTemplateBackedPageContent<GlobalMetadata>("home.global");
  const stats = asRecordArray<{ icon: string; value: string; label: string; description: string }>(
    metadata.stats,
    [],
  );

  return (
    <section
      id="global"
      className="py-20 bg-[var(--vaden-surface-10)] relative overflow-hidden"
      ref={ref as React.RefObject<HTMLElement>}
    >
      <div className="container mx-auto px-6 max-w-7xl">
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
          <p className="text-[var(--vaden-text-muted)] font-['Inter'] text-base mt-4 max-w-2xl leading-relaxed">
            {asString(metadata.description)}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-center">
          <div
            className={`lg:col-span-3 transition-all duration-700 ${
              isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"
            }`}
          >
            <div className="relative">
              <img
                src={imageUrl}
                alt={asString(metadata.mapAlt, "Küresel İhracat Ağı")}
                className="w-full rounded-sm"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[oklch(0.10_0.01_250)/20] to-transparent rounded-sm"></div>
            </div>
          </div>

          <div
            className={`lg:col-span-2 space-y-4 transition-all duration-700 delay-200 ${
              isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"
            }`}
          >
            {stats.map((stat, index) => {
              const Icon = STAT_ICONS[(asString(stat.icon) as keyof typeof STAT_ICONS) || "mapPin"];
              return (
                <div
                  key={`${stat.label}-${index}`}
                  className={`flex items-start gap-4 p-4 bg-[var(--vaden-surface-14)] border border-[var(--vaden-border)] hover:border-[oklch(0.60_0.18_42)] transition-all duration-300 ${
                    isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"
                  }`}
                  style={{ transitionDelay: `${0.3 + index * 0.1}s` }}
                >
                  <div className="w-10 h-10 bg-[oklch(0.60_0.18_42)/10] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon size={18} className="text-[oklch(0.60_0.18_42)]" />
                  </div>
                  <div>
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="font-['Barlow_Condensed'] font-black text-[oklch(0.60_0.18_42)] text-2xl leading-none">
                        {asString(stat.value)}
                      </span>
                      <span className="font-['Barlow_Condensed'] font-bold text-[var(--vaden-on-surface)] text-sm uppercase tracking-wide">
                        {asString(stat.label)}
                      </span>
                    </div>
                    <p className="text-[oklch(0.45_0.01_250)] text-xs font-['Inter'] leading-relaxed">
                      {asString(stat.description)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
