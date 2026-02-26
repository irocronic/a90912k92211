/*
  VADEN ORIGINAL - About Section Component
  Design: Industrial Precision - Asymmetric layout with timeline
*/

import { ArrowRight } from "lucide-react";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";
import { asRecordArray, asString, useTemplateBackedPageContent } from "@/lib/pageContent";

type AboutMetadata = {
  label: string;
  headingMain: string;
  headingHighlight: string;
  paragraph1: string;
  paragraph2: string;
  milestones: Array<{ year: string; text: string }>;
  ctaText: string;
  ctaHref: string;
  imageAlt: string;
  quickStats: Array<{ value: string; label: string }>;
};

export default function AboutSection() {
  const { ref, isVisible } = useIntersectionObserver({ threshold: 0.1 });
  const { imageUrl, metadata } = useTemplateBackedPageContent<AboutMetadata>("home.about");
  const milestones = asRecordArray<{ year: string; text: string }>(metadata.milestones, []);
  const quickStats = asRecordArray<{ value: string; label: string }>(metadata.quickStats, []);

  return (
    <section
      id="hakkimizda"
      className="py-20 bg-[var(--vaden-surface-09)]"
      ref={ref as React.RefObject<HTMLElement>}
    >
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div
            className={`lg:col-span-7 transition-all duration-700 ${
              isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"
            }`}
          >
            <div className="flex items-center gap-3 mb-3">
              <span className="w-10 h-0.5 bg-[oklch(0.60_0.18_42)]"></span>
              <span className="text-[oklch(0.60_0.18_42)] font-['Barlow_Condensed'] font-bold text-sm tracking-[0.2em] uppercase">
                {asString(metadata.label)}
              </span>
            </div>
            <h2 className="font-['Barlow_Condensed'] font-black text-[var(--vaden-on-surface)] text-5xl md:text-6xl leading-none uppercase mb-6">
              {asString(metadata.headingMain)}
              <br />
              <span className="text-[oklch(0.60_0.18_42)]">{asString(metadata.headingHighlight)}</span>
            </h2>
            <p className="text-[oklch(0.60_0.01_250)] font-['Inter'] text-base leading-relaxed mb-4">
              {asString(metadata.paragraph1)}
            </p>
            <p className="text-[var(--vaden-text-muted)] font-['Inter'] text-base leading-relaxed mb-8">
              {asString(metadata.paragraph2)}
            </p>

            <div className="relative pl-6 border-l border-[var(--vaden-border-strong)]">
              {milestones.map((milestone, index) => (
                <div
                  key={`${milestone.year}-${index}`}
                  className={`relative mb-6 last:mb-0 transition-all duration-500 ${
                    isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4"
                  }`}
                  style={{ transitionDelay: `${0.3 + index * 0.1}s` }}
                >
                  <div className="absolute -left-[1.625rem] w-3 h-3 bg-[oklch(0.60_0.18_42)] border-2 border-[oklch(0.09_0.01_250)]"></div>
                  <div className="flex items-center gap-3">
                    <span className="font-['Barlow_Condensed'] font-black text-[oklch(0.60_0.18_42)] text-lg">
                      {asString(milestone.year)}
                    </span>
                    <span className="text-[oklch(0.65_0.01_250)] text-sm font-['Inter']">
                      {asString(milestone.text)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <a
              href={asString(metadata.ctaHref, "#kurumsal")}
              className="inline-flex items-center gap-2 mt-8 bg-[oklch(0.60_0.18_42)] hover:bg-[oklch(0.50_0.18_42)] text-[var(--vaden-on-accent)] font-['Barlow_Condensed'] font-bold text-sm px-6 py-3 tracking-wide uppercase transition-all"
            >
              {asString(metadata.ctaText, "Daha Fazla Bilgi")} <ArrowRight size={16} />
            </a>
          </div>

          <div
            className={`lg:col-span-5 transition-all duration-700 delay-200 ${
              isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"
            }`}
          >
            <div className="relative mb-6">
              <img
                src={imageUrl}
                alt={asString(metadata.imageAlt, "Vaden Üretim")}
                className="w-full h-64 object-cover"
              />
              <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-[oklch(0.60_0.18_42)]"></div>
              <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-[oklch(0.60_0.18_42)]"></div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {quickStats.map((stat, index) => (
                <div
                  key={`${stat.label}-${index}`}
                  className="bg-[var(--vaden-surface-14)] border border-[var(--vaden-border)] p-4 text-center hover:border-[oklch(0.60_0.18_42)] transition-colors"
                >
                  <div className="font-['Barlow_Condensed'] font-black text-[oklch(0.60_0.18_42)] text-2xl leading-none mb-1">
                    {asString(stat.value)}
                  </div>
                  <div className="text-[var(--vaden-text-muted)] text-xs font-['Inter'] uppercase tracking-wide">
                    {asString(stat.label)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
