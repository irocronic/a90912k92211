/*
  VADEN ORIGINAL - Sustainability Section Component
  Design: Industrial Precision - Green accents on dark background
*/

import { Leaf, Recycle, Sun, Wind } from "lucide-react";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";
import { asRecordArray, asString, useTemplateBackedPageContent } from "@/lib/pageContent";

type SustainabilityMetadata = {
  label: string;
  headingMain: string;
  headingHighlight: string;
  items: Array<{ icon: string; title: string; value: string; description: string }>;
};

const ITEM_ICONS = {
  sun: Sun,
  leaf: Leaf,
  recycle: Recycle,
  wind: Wind,
} as const;

export default function SustainabilitySection() {
  const { ref, isVisible } = useIntersectionObserver({ threshold: 0.1 });
  const { metadata } = useTemplateBackedPageContent<SustainabilityMetadata>("home.sustainability");
  const items = asRecordArray<{ icon: string; title: string; value: string; description: string }>(
    metadata.items,
    [],
  );

  return (
    <section
      id="surdurulebilirlik"
      className="py-20 bg-[var(--vaden-surface-10)] relative overflow-hidden"
      ref={ref as React.RefObject<HTMLElement>}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-[oklch(0.25_0.08_160)/5] to-transparent"></div>

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
            <span className="text-[oklch(0.55_0.14_160)]">{asString(metadata.headingHighlight)}</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {items.map((item, index) => {
            const Icon = ITEM_ICONS[(asString(item.icon) as keyof typeof ITEM_ICONS) || "sun"];
            return (
              <div
                key={`${item.title}-${index}`}
                className={`bg-[var(--vaden-surface-14)] border border-[var(--vaden-border)] hover:border-[oklch(0.55_0.14_160)] p-6 group transition-all duration-300 ${
                  isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                }`}
                style={{ transitionDelay: `${index * 0.1}s` }}
              >
                <div className="w-12 h-12 bg-[oklch(0.55_0.14_160)/10] flex items-center justify-center mb-4 group-hover:bg-[oklch(0.55_0.14_160)/20] transition-colors">
                  <Icon size={22} className="text-[oklch(0.55_0.14_160)]" />
                </div>
                <div className="font-['Barlow_Condensed'] font-black text-[oklch(0.55_0.14_160)] text-3xl leading-none mb-1">
                  {asString(item.value)}
                </div>
                <h3 className="font-['Barlow_Condensed'] font-bold text-[var(--vaden-on-surface)] text-lg uppercase tracking-wide mb-2">
                  {asString(item.title)}
                </h3>
                <p className="text-[oklch(0.50_0.01_250)] text-sm font-['Inter'] leading-relaxed">
                  {asString(item.description)}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
