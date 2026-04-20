import { useEffect, useRef, useState } from "react";
import { ArrowRight, Pause, Play, Volume2, VolumeX } from "lucide-react";
import BrandLogo from "@/components/BrandLogo";
import { useI18n } from "@/contexts/I18nContext";
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

const sectionCopy = {
  tr: {
    overline: "BRAC tanitim videosu",
    supporting: "Scroll ile ulasildiginda sessiz ve otomatik oynayan kisa tanitim alani.",
    autoplay: "Gorunur olunca otomatik oynar",
    muted: "Sessiz baslangic",
    floatingCard: "Canli tanitim",
    statusPlaying: "Su an oynuyor",
    statusWaiting: "Bolume ulasinca baslar",
    primaryAction: "Urunleri incele",
    secondaryAction: "Hakkimizda",
  },
  en: {
    overline: "BRAC showcase video",
    supporting: "A short muted showcase that starts automatically when visitors scroll into view.",
    autoplay: "Auto-plays in view",
    muted: "Muted preview",
    floatingCard: "Live showcase",
    statusPlaying: "Now playing",
    statusWaiting: "Starts on scroll",
    primaryAction: "Explore products",
    secondaryAction: "About us",
  },
  ar: {
    overline: "فيديو تعريفي لبرّاك",
    supporting: "عرض صامت قصير يبدأ تلقائياً عند وصول الزائر إلى هذا القسم.",
    autoplay: "يعمل تلقائياً عند الظهور",
    muted: "بداية صامتة",
    floatingCard: "عرض حي للعلامة",
    statusPlaying: "يعمل الآن",
    statusWaiting: "يبدأ عند الوصول",
    primaryAction: "استعرض المنتجات",
    secondaryAction: "من نحن",
  },
} as const;

export default function HeroVideoSection() {
  const { language } = useI18n();
  const { metadata } = useTemplateBackedPageContent<HeroMetadata>("home.hero");
  const ui = sectionCopy[language];
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const sectionRef = useRef<HTMLElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isInView, setIsInView] = useState(false);
  const [manualPause, setManualPause] = useState(false);

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

  if (slides.length === 0) {
    return null;
  }

  const primarySlide = slides[0];

  useEffect(() => {
    const sectionEl = sectionRef.current;
    if (!sectionEl) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting && entry.intersectionRatio >= 0.45);
      },
      { threshold: [0.2, 0.45, 0.7] },
    );

    observer.observe(sectionEl);

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    const videoEl = videoRef.current;

    if (!videoEl) {
      return;
    }

    videoEl.muted = isMuted;

    if (isInView && !manualPause) {
      videoEl
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
      return;
    }

    videoEl.pause();
    setIsPlaying(false);
  }, [isInView, isMuted, manualPause]);

  const handleTogglePlay = () => {
    const videoEl = videoRef.current;

    if (!videoEl) {
      return;
    }

    if (videoEl.paused) {
      setManualPause(false);
      videoEl
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
      return;
    }

    setManualPause(true);
    videoEl.pause();
    setIsPlaying(false);
  };

  const handleToggleMute = () => {
    const videoEl = videoRef.current;

    if (!videoEl) {
      return;
    }

    videoEl.muted = !videoEl.muted;
    setIsMuted(videoEl.muted);
  };

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden border-t border-[var(--vaden-border-soft)] py-20 lg:py-28"
      style={{ background: "var(--hero-video-section-bg)" }}
    >
      <div className="hero-video-grid absolute inset-0 opacity-40" />
      <div className="absolute left-[-6rem] top-16 h-56 w-56 rounded-full bg-[oklch(0.6_0.18_42/0.2)] blur-3xl" />
      <div className="absolute bottom-[-5rem] right-[-3rem] h-72 w-72 rounded-full bg-[oklch(0.6_0.18_42/0.12)] blur-3xl" />

      <div className="container relative z-10 grid items-center gap-8 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:gap-14">
        <div className="order-2 max-w-2xl lg:order-1">
          <div className="mb-5 inline-flex items-center gap-3 rounded-full border border-[var(--vaden-border)] bg-[var(--hero-video-chip-bg)] px-4 py-2 text-[var(--vaden-on-surface)] backdrop-blur">
            <BrandLogo className="h-7 w-auto" alt="BRAC logo" />
            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--vaden-text-dim)]">
              {ui.overline}
            </span>
          </div>

          <div className="mb-4 inline-flex items-center gap-2">
            <span className="h-0.5 w-10 bg-[oklch(0.6_0.18_42)]" />
            <span className="font-['Barlow_Condensed'] text-sm font-bold uppercase tracking-[0.2em] text-[oklch(0.6_0.18_42)]">
              {primarySlide.tag}
            </span>
          </div>

          <h1
            className="font-['Barlow_Condensed'] leading-none text-[var(--vaden-on-surface)]"
            style={{ fontSize: "clamp(3.4rem, 9vw, 7rem)" }}
          >
            {primarySlide.title}
          </h1>
          <h2
            className="mb-6 font-['Barlow_Condensed'] leading-none text-[oklch(0.6_0.18_42)]"
            style={{ fontSize: "clamp(2.2rem, 6vw, 4.6rem)" }}
          >
            {primarySlide.subtitle}
          </h2>

          <p className="max-w-xl text-base leading-7 text-[var(--vaden-text-dim)] md:text-lg">
            {ui.supporting}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-4">
            <a
              href={primarySlide.ctaHref || "#urunler"}
              className="inline-flex items-center gap-2 rounded-full bg-[oklch(0.6_0.18_42)] px-7 py-3 font-['Barlow_Condensed'] text-lg font-bold uppercase tracking-[0.08em] text-white transition-all hover:bg-[oklch(0.53_0.18_42)] hover:shadow-[0_0_30px_oklch(0.6_0.18_42/0.35)]"
            >
              {ui.primaryAction}
              <ArrowRight size={18} />
            </a>
            <a
              href={asString(metadata.secondaryCtaHref, "#hakkimizda")}
              className="inline-flex items-center gap-2 rounded-full border border-[var(--vaden-border)] bg-[var(--hero-video-chip-bg)] px-7 py-3 font-['Barlow_Condensed'] text-lg font-bold uppercase tracking-[0.08em] text-[var(--vaden-on-surface)] transition-all hover:border-[oklch(0.6_0.18_42)] hover:text-[oklch(0.6_0.18_42)]"
            >
              {ui.secondaryAction}
            </a>
          </div>
        </div>

        <div className="order-1 relative lg:order-2 lg:justify-self-end">
          <div className="hero-video-float pointer-events-none absolute -left-8 top-8 hidden rounded-2xl border border-[var(--hero-video-chip-border)] bg-[var(--hero-video-floating-bg)] px-4 py-3 text-sm text-[var(--vaden-on-surface)] shadow-[var(--hero-video-soft-shadow)] backdrop-blur lg:flex lg:items-center lg:gap-3">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                isPlaying ? "bg-[oklch(0.6_0.18_42)]" : "bg-[var(--vaden-text-placeholder)]"
              }`}
            />
            <span>{isPlaying ? ui.statusPlaying : ui.floatingCard}</span>
          </div>

          <div className="hero-video-shell relative overflow-hidden rounded-[32px] border border-[var(--vaden-border)] bg-[var(--hero-video-frame-bg)] shadow-[var(--hero-video-shadow)]">
            <video
              ref={videoRef}
              className="aspect-[16/10] w-full min-h-[280px] object-cover md:min-h-[420px]"
              src="/brac-hero-video.mp4"
              muted
              loop
              playsInline
              preload="metadata"
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onVolumeChange={() => setIsMuted(videoRef.current?.muted ?? true)}
            />
            <div
              className="pointer-events-none absolute inset-0"
              style={{ background: "var(--hero-video-overlay)" }}
            />

            <div className="absolute left-4 top-4 z-10 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleTogglePlay}
                title={isPlaying ? ui.statusPlaying : ui.statusWaiting}
                aria-label={isPlaying ? ui.statusPlaying : ui.statusWaiting}
                className={`inline-flex h-11 w-11 items-center justify-center rounded-full border backdrop-blur transition-all ${
                  isPlaying
                    ? "border-[oklch(0.6_0.18_42)] bg-[oklch(0.6_0.18_42)] text-white shadow-[0_10px_24px_oklch(0.6_0.18_42/0.28)]"
                    : "border-[var(--hero-video-chip-border)] bg-[var(--hero-video-chip-bg)] text-[var(--vaden-on-surface)] hover:border-[oklch(0.6_0.18_42)] hover:text-[oklch(0.6_0.18_42)]"
                }`}
              >
                {isPlaying ? <Pause size={16} /> : <Play size={16} />}
              </button>
              <button
                type="button"
                onClick={handleToggleMute}
                title={ui.muted}
                aria-label={ui.muted}
                className={`inline-flex h-11 w-11 items-center justify-center rounded-full border backdrop-blur transition-all ${
                  isMuted
                    ? "border-[var(--hero-video-chip-border)] bg-[var(--hero-video-chip-bg)] text-[var(--vaden-on-surface)] hover:border-[oklch(0.6_0.18_42)] hover:text-[oklch(0.6_0.18_42)]"
                    : "border-[oklch(0.6_0.18_42)] bg-[oklch(0.6_0.18_42)] text-white shadow-[0_10px_24px_oklch(0.6_0.18_42/0.28)]"
                }`}
              >
                {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </button>
            </div>

            <div className="absolute inset-x-0 bottom-0 z-10 p-4 md:p-6">
              <div className="inline-flex items-center gap-3 rounded-full border border-[var(--hero-video-chip-border)] bg-[var(--hero-video-badge-bg)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--vaden-on-surface)] backdrop-blur">
                <span className="h-2.5 w-2.5 rounded-full bg-[oklch(0.6_0.18_42)]" />
                <span>BRAC</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
