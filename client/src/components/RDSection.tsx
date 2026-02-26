/*
  VADEN ORIGINAL - R&D Section Component
  Design: Industrial Precision - Dark split layout
*/

import { ArrowRight, Cpu, FlaskConical, Lightbulb, Shield } from "lucide-react";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";
import { asRecordArray, asString, useTemplateBackedPageContent } from "@/lib/pageContent";

type RDMetadata = {
  label: string;
  headingMain: string;
  headingHighlight: string;
  description: string;
  imageAlt: string;
  badgeRank: string;
  badgeTitle: string;
  badgeDescription: string;
  ctaText: string;
  ctaHref: string;
  features: Array<{ icon: string; title: string; description: string }>;
};

const FEATURE_ICONS = {
  lightbulb: Lightbulb,
  flask: FlaskConical,
  cpu: Cpu,
  shield: Shield,
} as const;

export default function RDSection() {
  const { ref, isVisible } = useIntersectionObserver({ threshold: 0.1 });
  const { imageUrl, metadata } = useTemplateBackedPageContent<RDMetadata>("home.rd");
  const features = asRecordArray<{ icon: string; title: string; description: string }>(
    metadata.features,
    [],
  );

  return (
    <section
      id="arge"
      className="py-20 bg-[var(--vaden-surface-09)]"
      ref={ref as React.RefObject<HTMLElement>}
    >
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div
            className={`transition-all duration-700 ${
              isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"
            }`}
          >
            <div className="relative">
              <img
                src={imageUrl}
                alt={asString(metadata.imageAlt, "Ar-Ge Departmanı")}
                className="w-full h-80 lg:h-[480px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[oklch(0.09_0.01_250)/60] to-transparent"></div>
              <div className="absolute top-0 left-0 w-16 h-16 border-t-4 border-l-4 border-[oklch(0.60_0.18_42)]"></div>
              <div className="absolute bottom-0 right-0 w-16 h-16 border-b-4 border-r-4 border-[oklch(0.60_0.18_42)]"></div>

              <div className="absolute bottom-6 left-6 bg-[oklch(0.09_0.01_250)/90] border border-[oklch(0.60_0.18_42)] p-4 backdrop-blur-sm max-w-xs">
                <div className="font-['Barlow_Condensed'] font-black text-[oklch(0.60_0.18_42)] text-2xl leading-none mb-1">
                  {asString(metadata.badgeRank)}
                </div>
                <div className="font-['Barlow_Condensed'] font-bold text-[var(--vaden-on-surface)] text-sm uppercase tracking-wide">
                  {asString(metadata.badgeTitle)}
                </div>
                <div className="text-[var(--vaden-text-muted)] text-xs font-['Inter'] mt-1">
                  {asString(metadata.badgeDescription)}
                </div>
              </div>
            </div>
          </div>

          <div
            className={`transition-all duration-700 delay-200 ${
              isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"
            }`}
          >
            <div className="flex items-center gap-3 mb-3">
              <span className="w-10 h-0.5 bg-[oklch(0.60_0.18_42)]"></span>
              <span className="text-[oklch(0.60_0.18_42)] font-['Barlow_Condensed'] font-bold text-sm tracking-[0.2em] uppercase">
                {asString(metadata.label)}
              </span>
            </div>
            <h2 className="font-['Barlow_Condensed'] font-black text-[var(--vaden-on-surface)] text-5xl md:text-6xl leading-none uppercase mb-4">
              {asString(metadata.headingMain)}
              <br />
              <span className="text-[oklch(0.60_0.18_42)]">{asString(metadata.headingHighlight)}</span>
            </h2>
            <p className="text-[var(--vaden-text-muted)] font-['Inter'] text-base leading-relaxed mb-8">
              {asString(metadata.description)}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              {features.map((feature, index) => {
                const Icon =
                  FEATURE_ICONS[
                    (asString(feature.icon) as keyof typeof FEATURE_ICONS) || "lightbulb"
                  ];
                return (
                  <div
                    key={`${feature.title}-${index}`}
                    className={`flex items-start gap-3 transition-all duration-500 ${
                      isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                    }`}
                    style={{ transitionDelay: `${0.4 + index * 0.1}s` }}
                  >
                    <div className="w-8 h-8 bg-[oklch(0.60_0.18_42)/10] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Icon size={16} className="text-[oklch(0.60_0.18_42)]" />
                    </div>
                    <div>
                      <h4 className="font-['Barlow_Condensed'] font-bold text-[var(--vaden-on-surface)] text-base uppercase tracking-wide mb-1">
                        {asString(feature.title)}
                      </h4>
                      <p className="text-[oklch(0.45_0.01_250)] text-xs font-['Inter'] leading-relaxed">
                        {asString(feature.description)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <a
              href={asString(metadata.ctaHref, "#arge")}
              className="inline-flex items-center gap-2 bg-[oklch(0.60_0.18_42)] hover:bg-[oklch(0.50_0.18_42)] text-[var(--vaden-on-accent)] font-['Barlow_Condensed'] font-bold text-sm px-6 py-3 tracking-wide uppercase transition-all hover:shadow-[0_0_20px_oklch(0.60_0.18_42/0.3)]"
            >
              {asString(metadata.ctaText)} <ArrowRight size={16} />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
