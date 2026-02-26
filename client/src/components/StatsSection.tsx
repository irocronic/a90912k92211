/*
  VADEN ORIGINAL - Stats/Achievements Section Component
  Design: Industrial Precision - Counter animations, orange accents
*/

import { useEffect, useState, useRef } from "react";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";
import {
  asNumber,
  asRecordArray,
  asString,
  useTemplateBackedPageContent,
} from "@/lib/pageContent";

interface CounterProps {
  end: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
  isVisible: boolean;
}

function Counter({ end, suffix = "", prefix = "", duration = 2000, isVisible }: CounterProps) {
  const [count, setCount] = useState(0);
  const startedRef = useRef(false);

  useEffect(() => {
    if (!isVisible || startedRef.current) return;
    startedRef.current = true;

    const startTime = performance.now();
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * end));
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }, [isVisible, end, duration]);

  return (
    <span>
      {prefix}
      {count.toLocaleString("tr-TR")}
      {suffix}
    </span>
  );
}

type StatsMetadata = {
  label: string;
  heading: string;
  stats: Array<{
    value: number;
    suffix?: string;
    prefix?: string;
    label: string;
    description: string;
  }>;
};

export default function StatsSection() {
  const { ref, isVisible } = useIntersectionObserver({ threshold: 0.2 });
  const { metadata } = useTemplateBackedPageContent<StatsMetadata>("home.stats");
  const stats = asRecordArray<{
    value: number;
    suffix?: string;
    prefix?: string;
    label: string;
    description: string;
  }>(metadata.stats, []);

  return (
    <section
      className="py-20 bg-[var(--vaden-surface-09)] relative overflow-hidden"
      ref={ref as React.RefObject<HTMLElement>}
    >
      <div className="absolute inset-0 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, transparent, transparent 40px, oklch(0.60 0.18 42) 40px, oklch(0.60 0.18 42) 41px), repeating-linear-gradient(90deg, transparent, transparent 40px, oklch(0.60 0.18 42) 40px, oklch(0.60 0.18 42) 41px)",
          }}
        />
      </div>

      <div className="container mx-auto px-6 max-w-7xl relative z-10">
        <div
          className={`mb-12 text-center transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <div className="flex items-center justify-center gap-3 mb-3">
            <span className="w-10 h-0.5 bg-[oklch(0.60_0.18_42)]"></span>
            <span className="text-[oklch(0.60_0.18_42)] font-['Barlow_Condensed'] font-bold text-sm tracking-[0.2em] uppercase">
              {asString(metadata.label)}
            </span>
            <span className="w-10 h-0.5 bg-[oklch(0.60_0.18_42)]"></span>
          </div>
          <h2 className="font-['Barlow_Condensed'] font-black text-[var(--vaden-on-surface)] text-5xl md:text-6xl leading-none uppercase">
            {asString(metadata.heading)}
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-px bg-[var(--vaden-surface-border)]">
          {stats.map((stat, index) => (
            <div
              key={`${asString(stat.label)}-${index}`}
              className={`bg-[var(--vaden-surface-12)] p-6 text-center group hover:bg-[oklch(0.16_0.01_250)] transition-all duration-300 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              }`}
              style={{ transitionDelay: `${index * 0.1}s` }}
            >
              <div className="font-['Barlow_Condensed'] font-black text-3xl md:text-4xl text-[oklch(0.60_0.18_42)] leading-none mb-1">
                <Counter
                  end={asNumber(stat.value)}
                  prefix={asString(stat.prefix)}
                  suffix={asString(stat.suffix)}
                  isVisible={isVisible}
                  duration={2000 + index * 200}
                />
              </div>
              <div className="font-['Barlow_Condensed'] font-bold text-[var(--vaden-on-surface)] text-sm uppercase tracking-wide mb-1">
                {asString(stat.label)}
              </div>
              <div className="text-[oklch(0.45_0.01_250)] text-xs font-['Inter']">
                {asString(stat.description)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
