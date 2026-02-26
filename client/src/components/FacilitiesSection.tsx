/*
  VADEN ORIGINAL - Production Facilities Section Component
  Design: Industrial Precision - Split layout with factory imagery
*/

import { ArrowRight, Cpu, Factory, Users, Zap } from "lucide-react";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";
import { asRecordArray, asString, useTemplateBackedPageContent } from "@/lib/pageContent";

type FacilityMetadata = {
  label: string;
  headingMain: string;
  headingHighlight: string;
  description: string;
  tabs: string[];
  ctaText: string;
  ctaHref: string;
  imageAlt: string;
  badgeValue: string;
  badgeLine1: string;
  badgeLine2: string;
  stats: Array<{ icon: string; value: string; label: string }>;
};

const STAT_ICONS = {
  users: Users,
  zap: Zap,
  factory: Factory,
  cpu: Cpu,
} as const;

export default function FacilitiesSection() {
  const { ref, isVisible } = useIntersectionObserver({ threshold: 0.15 });
  const { imageUrl, metadata } = useTemplateBackedPageContent<FacilityMetadata>("home.facilities");
  const stats = asRecordArray<{ icon: string; value: string; label: string }>(metadata.stats, []);
  const tabs = Array.isArray(metadata.tabs) ? metadata.tabs : [];

  return (
    <section
      id="uretim"
      className="py-20 bg-[var(--vaden-surface-10)]"
      ref={ref as React.RefObject<HTMLElement>}
    >
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div
            className={`transition-all duration-700 ${
              isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"
            }`}
          >
            <div className="flex items-center gap-3 mb-3">
              <span className="w-10 h-0.5 bg-[oklch(0.60_0.18_42)]"></span>
              <span className="text-[oklch(0.60_0.18_42)] font-['Barlow_Condensed'] font-bold text-sm tracking-[0.2em] uppercase">
                {asString(metadata.label)}
              </span>
            </div>
            <h2 className="font-['Inter'] font-extrabold text-[oklch(0.14_0.01_250)] text-5xl md:text-6xl leading-[0.92] tracking-[-0.01em] uppercase mb-6">
              {asString(metadata.headingMain)}
              <br />
              <span className="text-[oklch(0.60_0.18_42)] font-['Inter'] font-extrabold">
                {asString(metadata.headingHighlight)}
              </span>
            </h2>
            <p className="text-[oklch(0.60_0.01_250)] font-['Inter'] text-base leading-relaxed mb-8">
              {asString(metadata.description)}
            </p>

            <div className="flex gap-3 mb-8">
              {tabs.map((tab, index) => (
                <button
                  key={`${tab}-${index}`}
                  className={`font-['Barlow_Condensed'] font-bold text-sm px-5 py-2.5 tracking-wide uppercase transition-all ${
                    index === 0
                      ? "bg-[oklch(0.60_0.18_42)] text-[var(--vaden-on-accent)]"
                      : "border border-[oklch(0.30_0.01_250)] text-[oklch(0.60_0.01_250)] hover:border-[oklch(0.60_0.18_42)] hover:text-[oklch(0.60_0.18_42)]"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3 mb-8">
              {stats.map((stat, index) => {
                const Icon = STAT_ICONS[(asString(stat.icon) as keyof typeof STAT_ICONS) || "users"];
                return (
                  <div
                    key={`${stat.label}-${index}`}
                    className="bg-[var(--vaden-surface-14)] border border-[var(--vaden-border)] p-4 flex items-center gap-3 hover:border-[oklch(0.60_0.18_42)] transition-colors"
                  >
                    <div className="w-10 h-10 bg-[oklch(0.60_0.18_42)/10] flex items-center justify-center flex-shrink-0">
                      <Icon size={18} className="text-[oklch(0.60_0.18_42)]" />
                    </div>
                    <div>
                      <div className="font-['Inter'] font-extrabold text-[oklch(0.14_0.01_250)] text-2xl leading-none tracking-tight">
                        {asString(stat.value)}
                      </div>
                      <div className="text-[oklch(0.50_0.01_250)] text-xs font-['Inter']">
                        {asString(stat.label)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <a
              href={asString(metadata.ctaHref, "#uretim")}
              className="inline-flex items-center gap-2 bg-transparent border border-[oklch(0.60_0.18_42)] text-[oklch(0.60_0.18_42)] hover:bg-[oklch(0.60_0.18_42)] hover:text-[var(--vaden-on-accent)] font-['Barlow_Condensed'] font-bold text-sm px-6 py-3 tracking-wide uppercase transition-all"
            >
              {asString(metadata.ctaText, "Daha Fazla Bilgi")} <ArrowRight size={16} />
            </a>
          </div>

          <div
            className={`transition-all duration-700 delay-200 ${
              isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"
            }`}
          >
            <div className="relative">
              <img
                src={imageUrl}
                alt={asString(metadata.imageAlt, "Konya Üretim Tesisi")}
                className="w-full h-80 lg:h-[500px] object-cover"
              />
              <div className="absolute top-0 right-0 w-16 h-16 border-t-4 border-r-4 border-[oklch(0.60_0.18_42)]"></div>
              <div className="absolute bottom-0 left-0 w-16 h-16 border-b-4 border-l-4 border-[oklch(0.60_0.18_42)]"></div>

              <div className="absolute bottom-6 right-6 bg-[oklch(0.09_0.01_250)/90] border border-[oklch(0.60_0.18_42)] p-4 backdrop-blur-sm">
                <div className="font-['Barlow_Condensed'] font-black text-[oklch(0.60_0.18_42)] text-3xl leading-none">
                  {asString(metadata.badgeValue, "56")}
                </div>
                <div className="font-['Barlow_Condensed'] font-bold text-[var(--vaden-on-surface)] text-sm uppercase tracking-wide">
                  {asString(metadata.badgeLine1)}
                </div>
                <div className="font-['Barlow_Condensed'] font-bold text-[var(--vaden-on-surface)] text-sm uppercase tracking-wide">
                  {asString(metadata.badgeLine2)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
