/*
  VADEN ORIGINAL - Hero Slider Component
  Design: Industrial Precision - Full-width hero with product slides
  Features: Auto-play carousel, dark overlay, orange accents
*/

import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { asRecordArray, asString, useTemplateBackedPageContent } from "@/lib/pageContent";

type HeroSlide = {
  id: number;
  image: string;
  tag: string;
  title: string;
  subtitle: string;
  description: string;
  cta: string;
  ctaHref?: string;
};

type HeroMetadata = {
  secondaryCtaText: string;
  secondaryCtaHref: string;
  slides: HeroSlide[];
};

export default function HeroSlider() {
  const { metadata } = useTemplateBackedPageContent<HeroMetadata>("home.hero");
  const slides = asRecordArray<HeroSlide>(metadata.slides, []).map((slide, index) => ({
    id: typeof slide.id === "number" ? slide.id : index + 1,
    image: asString(slide.image),
    tag: asString(slide.tag),
    title: asString(slide.title),
    subtitle: asString(slide.subtitle),
    description: asString(slide.description),
    cta: asString(slide.cta),
    ctaHref: asString(slide.ctaHref, "#urunler"),
  }));

  const [current, setCurrent] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (current < slides.length) return;
    setCurrent(0);
  }, [current, slides.length]);

  const goTo = useCallback(
    (index: number) => {
      if (isAnimating || slides.length === 0) return;
      setIsAnimating(true);
      setCurrent(index);
      setTimeout(() => setIsAnimating(false), 600);
    },
    [isAnimating, slides.length],
  );

  const next = useCallback(() => {
    if (slides.length === 0) return;
    goTo((current + 1) % slides.length);
  }, [current, goTo, slides.length]);

  const prev = useCallback(() => {
    if (slides.length === 0) return;
    goTo((current - 1 + slides.length) % slides.length);
  }, [current, goTo, slides.length]);

  useEffect(() => {
    if (slides.length === 0) return;
    const timer = setInterval(next, 6000);
    return () => clearInterval(timer);
  }, [next, slides.length]);

  if (slides.length === 0) return null;

  return (
    <div
      className="relative w-full"
      style={{ height: "calc(100vh - 113px)", minHeight: "500px", maxHeight: "800px" }}
    >
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-700 ${
            index === current ? "opacity-100" : "opacity-0"
          }`}
        >
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${slide.image})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[oklch(0.08_0.01_250)/96] via-[oklch(0.08_0.01_250)/70] to-[oklch(0.08_0.01_250)/16]" />
          <div className="absolute inset-0 bg-gradient-to-t from-[oklch(0.08_0.01_250)/90] via-[oklch(0.08_0.01_250)/24] to-[oklch(0.08_0.01_250)/12]" />
          <div className="absolute inset-0 md:hidden bg-[linear-gradient(180deg,rgba(6,10,16,0.24)_0%,rgba(6,10,16,0.34)_28%,rgba(6,10,16,0.72)_62%,rgba(6,10,16,0.9)_100%)]" />
          <div className="absolute inset-y-0 left-0 w-[78%] md:w-[56%] bg-[linear-gradient(90deg,rgba(6,10,16,0.72)_0%,rgba(6,10,16,0.4)_62%,rgba(6,10,16,0)_100%)]" />
        </div>
      ))}

      <div className="relative z-10 h-full flex items-center">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="max-w-2xl rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(8,12,18,0.78)_0%,rgba(8,12,18,0.5)_55%,rgba(8,12,18,0.28)_100%)] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.28)] backdrop-blur-[6px] md:border-transparent md:bg-transparent md:p-0 md:shadow-none md:backdrop-blur-0">
            <div
              key={`tag-${current}`}
              className="inline-flex items-center gap-2 mb-4 fade-in-up"
              style={{ animationDelay: "0.1s" }}
            >
              <span className="w-8 h-0.5 bg-[oklch(0.60_0.18_42)]"></span>
              <span className="text-[oklch(0.60_0.18_42)] font-['Barlow_Condensed'] font-bold text-xs md:text-sm tracking-[0.2em] uppercase">
                {slides[current].tag}
              </span>
            </div>

            <h1
              key={`title-${current}`}
              className="font-['Barlow_Condensed'] font-black text-white leading-none mb-2 fade-in-up [text-shadow:0_6px_18px_rgba(0,0,0,0.45)]"
              style={{ fontSize: "clamp(2.6rem, 8vw, 6rem)", animationDelay: "0.2s" }}
            >
              {slides[current].title}
            </h1>
            <h2
              key={`subtitle-${current}`}
              className="font-['Barlow_Condensed'] font-black text-[oklch(0.60_0.18_42)] leading-none mb-5 md:mb-6 fade-in-up [text-shadow:0_6px_18px_rgba(0,0,0,0.35)]"
              style={{ fontSize: "clamp(2.2rem, 7vw, 5rem)", animationDelay: "0.3s" }}
            >
              {slides[current].subtitle}
            </h2>

            <p
              key={`desc-${current}`}
              className="text-[oklch(0.82_0.005_250)] text-base md:text-lg leading-relaxed mb-7 md:mb-8 max-w-lg font-['Inter'] fade-in-up [text-shadow:0_4px_14px_rgba(0,0,0,0.5)]"
              style={{ animationDelay: "0.4s" }}
            >
              {slides[current].description}
            </p>

            <div
              key={`cta-${current}`}
              className="flex flex-wrap items-center gap-3 md:gap-4 fade-in-up"
              style={{ animationDelay: "0.5s" }}
            >
              <a
                href={slides[current].ctaHref || "#urunler"}
                className="inline-flex items-center gap-2 bg-[oklch(0.60_0.18_42)] hover:bg-[oklch(0.50_0.18_42)] text-white px-6 md:px-8 py-3.5 font-['Barlow_Condensed'] font-bold text-base md:text-lg tracking-wide uppercase transition-all hover:shadow-[0_0_30px_oklch(0.60_0.18_42/0.4)]"
              >
                {slides[current].cta}
                <ArrowRight size={18} />
              </a>
              <a
                href={asString(metadata.secondaryCtaHref, "#hakkimizda")}
                className="inline-flex items-center gap-2 border border-white/35 bg-white/6 hover:border-[oklch(0.60_0.18_42)] text-white hover:text-[oklch(0.60_0.18_42)] px-6 md:px-8 py-3.5 font-['Barlow_Condensed'] font-bold text-base md:text-lg tracking-wide uppercase transition-all"
              >
                {asString(metadata.secondaryCtaText, "Hakkımızda")}
              </a>
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={prev}
        className="absolute left-6 top-1/2 -translate-y-1/2 z-20 w-12 h-12 flex items-center justify-center border border-white/20 hover:border-[oklch(0.60_0.18_42)] text-white hover:text-[oklch(0.60_0.18_42)] transition-all bg-black/20 hover:bg-black/40"
      >
        <ChevronLeft size={24} />
      </button>
      <button
        onClick={next}
        className="absolute right-6 top-1/2 -translate-y-1/2 z-20 w-12 h-12 flex items-center justify-center border border-white/20 hover:border-[oklch(0.60_0.18_42)] text-white hover:text-[oklch(0.60_0.18_42)] transition-all bg-black/20 hover:bg-black/40"
      >
        <ChevronRight size={24} />
      </button>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goTo(index)}
            className={`transition-all duration-300 ${
              index === current
                ? "w-8 h-1 bg-[oklch(0.60_0.18_42)]"
                : "w-4 h-1 bg-white/30 hover:bg-white/60"
            }`}
          />
        ))}
      </div>

      <div className="absolute bottom-8 right-6 z-20 font-['Barlow_Condensed'] text-sm text-white/50">
        <span className="text-[oklch(0.60_0.18_42)] font-bold text-lg">
          {String(current + 1).padStart(2, "0")}
        </span>
        <span className="mx-1">/</span>
        <span>{String(slides.length).padStart(2, "0")}</span>
      </div>
    </div>
  );
}
