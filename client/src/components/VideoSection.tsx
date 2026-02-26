/*
  VADEN ORIGINAL - Promotional Video Section Component
  Design: Industrial Precision - Dark video section with play button
*/

import { useState } from "react";
import { Play, X } from "lucide-react";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";
import { asString, useTemplateBackedPageContent } from "@/lib/pageContent";

type VideoMetadata = {
  kicker: string;
  headingMain: string;
  headingHighlight: string;
  imageAlt: string;
  videoTitle: string;
  videoUrl: string;
};

export default function VideoSection() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { ref, isVisible } = useIntersectionObserver({ threshold: 0.2 });
  const { imageUrl, metadata } = useTemplateBackedPageContent<VideoMetadata>("home.video");

  return (
    <>
      <section className="relative py-0 overflow-hidden" ref={ref as React.RefObject<HTMLElement>}>
        <div className="relative h-[500px] md:h-[600px]">
          <img
            src={imageUrl}
            alt={asString(metadata.imageAlt, "Vaden Fabrika Tanıtım Filmi")}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-[oklch(0.08_0.01_250)/75]"></div>

          <div
            className={`absolute inset-0 flex items-center justify-center flex-col gap-8 transition-all duration-700 ${
              isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
            }`}
          >
            <button
              onClick={() => setIsModalOpen(true)}
              className="group relative w-24 h-24 flex items-center justify-center"
            >
              <div className="absolute inset-0 rounded-full border-2 border-[oklch(0.60_0.18_42)/40] animate-ping"></div>
              <div
                className="absolute inset-2 rounded-full border-2 border-[oklch(0.60_0.18_42)/60] animate-ping"
                style={{ animationDelay: "0.3s" }}
              ></div>
              <div className="relative w-20 h-20 rounded-full bg-[oklch(0.60_0.18_42)] flex items-center justify-center group-hover:bg-[oklch(0.50_0.18_42)] transition-colors shadow-[0_0_40px_oklch(0.60_0.18_42/0.5)]">
                <Play size={28} className="text-white ml-1" fill="white" />
              </div>
            </button>

            <div className="text-center">
              <p className="text-[oklch(0.60_0.18_42)] font-['Barlow_Condensed'] font-bold text-sm tracking-[0.2em] uppercase mb-2">
                {asString(metadata.kicker)}
              </p>
              <h2 className="font-['Barlow_Condensed'] font-black text-white text-4xl md:text-5xl leading-none uppercase">
                {asString(metadata.headingMain)}
                <br />
                <span className="text-[oklch(0.60_0.18_42)]">{asString(metadata.headingHighlight)}</span>
              </h2>
            </div>
          </div>
        </div>
      </section>

      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setIsModalOpen(false)}
        >
          <div className="relative w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute -top-12 right-0 text-white hover:text-[oklch(0.60_0.18_42)] transition-colors"
            >
              <X size={28} />
            </button>
            <div className="aspect-video bg-black">
              <iframe
                src={asString(metadata.videoUrl)}
                title={asString(metadata.videoTitle, "Tanıtım Filmi")}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
