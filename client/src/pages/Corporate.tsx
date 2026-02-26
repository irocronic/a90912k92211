/*
  VADEN ORIGINAL - Corporate Page
  Design: Industrial Precision - Kurumsal bilgiler ve alt sayfalar
*/

import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";
import { asRecordArray, asString, asStringArray, useTemplateBackedPageContent } from "@/lib/pageContent";

type CorporateMetadata = {
  pageTitle: string;
  metaDescription: string;
  metaKeywords: string;
  heroLabel: string;
  heroHeadingMain: string;
  heroHeadingHighlight: string;
  heroDescription: string;
  tabs: Array<{ id: string; label: string; title: string }>;
  aboutParagraphs: string[];
  milestones: Array<{ year: string; text: string }>;
  boardMembers: Array<{ name: string; title: string }>;
  certifications: Array<{ name: string; description: string; alt: string }>;
};

export default function Corporate() {
  const { ref, isVisible } = useIntersectionObserver({ threshold: 0.1 });
  const { metadata } = useTemplateBackedPageContent<CorporateMetadata>("pages.corporate");
  const tabs = asRecordArray<{ id: string; label: string; title: string }>(metadata.tabs, []);
  const milestones = asRecordArray<{ year: string; text: string }>(metadata.milestones, []);
  const boardMembers = asRecordArray<{ name: string; title: string }>(metadata.boardMembers, []);
  const certifications = asRecordArray<{ name: string; description: string; alt: string }>(
    metadata.certifications,
    [],
  );
  const aboutParagraphs = asStringArray(metadata.aboutParagraphs, []);

  const initialTab = useMemo(() => {
    const fromUrl =
      typeof window !== "undefined"
        ? new URL(window.location.href).searchParams.get("tab") || "about"
        : "about";
    if (tabs.some((tab) => tab.id === fromUrl)) return fromUrl;
    return tabs[0]?.id || "about";
  }, [tabs]);

  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    if (tabs.some((tab) => tab.id === activeTab)) return;
    setActiveTab(tabs[0]?.id || "about");
  }, [activeTab, tabs]);

  return (
    <div className="min-h-screen bg-[var(--vaden-surface-10)]">
      <Helmet>
        <title>{asString(metadata.pageTitle)}</title>
        <meta name="description" content={asString(metadata.metaDescription)} />
        <meta name="keywords" content={asString(metadata.metaKeywords)} />
      </Helmet>
      <Navbar />

      <div className="pt-[80px] lg:pt-[113px] bg-gradient-to-b from-[var(--vaden-surface-09)] to-[var(--vaden-surface-10)]">
        <div className="container mx-auto px-6 max-w-7xl py-20">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3 mb-4">
              <span className="w-10 h-0.5 bg-[oklch(0.60_0.18_42)]"></span>
              <span className="text-[oklch(0.60_0.18_42)] font-['Barlow_Condensed'] font-bold text-sm tracking-[0.2em] uppercase">
                {asString(metadata.heroLabel)}
              </span>
            </div>
            <h1 className="font-['Barlow_Condensed'] font-black text-[var(--vaden-on-surface)] text-5xl md:text-6xl leading-none uppercase mb-4">
              {asString(metadata.heroHeadingMain)}
              <br />
              <span className="text-[oklch(0.60_0.18_42)]">{asString(metadata.heroHeadingHighlight)}</span>
            </h1>
            <p className="text-[var(--vaden-text-muted)] text-lg font-['Inter'] leading-relaxed">
              {asString(metadata.heroDescription)}
            </p>
          </div>
        </div>
      </div>

      <div className="border-b border-[var(--vaden-border)]">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="flex gap-0 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-4 font-['Barlow_Condensed'] font-bold text-sm tracking-wide uppercase border-b-2 transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? "border-[oklch(0.60_0.18_42)] text-[oklch(0.60_0.18_42)]"
                    : "border-transparent text-[var(--vaden-text-muted)] hover:text-[var(--vaden-text-dim)]"
                }`}
              >
                {asString(tab.label)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 max-w-7xl py-20" ref={ref as React.RefObject<HTMLDivElement>}>
        {activeTab === "about" && (
          <div className={`transition-all duration-500 ${isVisible ? "opacity-100" : "opacity-0"}`}>
            <div className="max-w-3xl">
              <h2 className="font-['Barlow_Condensed'] font-black text-[var(--vaden-on-surface)] text-4xl mb-6 uppercase">
                {asString(tabs.find((tab) => tab.id === "about")?.title, "Hakkımızda")}
              </h2>
              <div className="space-y-4 text-[var(--vaden-text-muted)] font-['Inter'] leading-relaxed">
                {aboutParagraphs.map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "history" && (
          <div className={`transition-all duration-500 ${isVisible ? "opacity-100" : "opacity-0"}`}>
            <h2 className="font-['Barlow_Condensed'] font-black text-[var(--vaden-on-surface)] text-4xl mb-12 uppercase">
              {asString(tabs.find((tab) => tab.id === "history")?.title, "Tarihçe")}
            </h2>
            <div className="relative pl-6 border-l border-[var(--vaden-border-strong)]">
              {milestones.map((milestone, index) => (
                <div key={`${milestone.year}-${index}`} className="relative mb-10 last:mb-0">
                  <div className="absolute -left-[1.625rem] w-3 h-3 bg-[oklch(0.60_0.18_42)] border-2 border-[var(--vaden-surface-10)]"></div>
                  <div>
                    <div className="font-['Barlow_Condensed'] font-black text-[oklch(0.60_0.18_42)] text-xl mb-2">
                      {asString(milestone.year)}
                    </div>
                    <p className="text-[var(--vaden-text-muted)] font-['Inter']">{asString(milestone.text)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "board" && (
          <div className={`transition-all duration-500 ${isVisible ? "opacity-100" : "opacity-0"}`}>
            <h2 className="font-['Barlow_Condensed'] font-black text-[var(--vaden-on-surface)] text-4xl mb-12 uppercase">
              {asString(tabs.find((tab) => tab.id === "board")?.title, "Yönetim Kurulu")}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {boardMembers.map((member, index) => (
                <div
                  key={`${member.name}-${index}`}
                  className="bg-[var(--vaden-surface-14)] border border-[var(--vaden-border)] p-6 hover:border-[oklch(0.60_0.18_42)] transition-colors"
                >
                  <div className="w-16 h-16 bg-[oklch(0.60_0.18_42)/10] rounded-full mb-4 flex items-center justify-center">
                    <span className="text-[oklch(0.60_0.18_42)] font-['Barlow_Condensed'] font-black text-2xl">
                      {asString(member.name).charAt(0)}
                    </span>
                  </div>
                  <h3 className="font-['Barlow_Condensed'] font-bold text-[var(--vaden-on-surface)] text-lg mb-1 uppercase">
                    {asString(member.title)}
                  </h3>
                  <p className="text-[var(--vaden-text-muted)] text-sm font-['Inter']">
                    {asString(member.name)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "certifications" && (
          <div className={`transition-all duration-500 ${isVisible ? "opacity-100" : "opacity-0"}`}>
            <h2 className="font-['Barlow_Condensed'] font-black text-[var(--vaden-on-surface)] text-4xl mb-12 uppercase">
              {asString(tabs.find((tab) => tab.id === "certifications")?.title, "Sertifikalar")}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {certifications.map((cert, index) => (
                <div
                  key={`${cert.name}-${index}`}
                  className="bg-[var(--vaden-surface-14)] border border-[var(--vaden-border)] p-8 hover:border-[oklch(0.60_0.18_42)] transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-[oklch(0.60_0.18_42)/10] flex items-center justify-center flex-shrink-0">
                      <span className="text-[oklch(0.60_0.18_42)] font-['Barlow_Condensed'] font-black text-xl">
                        ✓
                      </span>
                    </div>
                    <div>
                      <h3 className="font-['Barlow_Condensed'] font-bold text-[var(--vaden-on-surface)] text-lg mb-1 uppercase">
                        {asString(cert.name)}
                      </h3>
                      <p className="text-[var(--vaden-text-muted)] text-sm font-['Inter']">
                        {asString(cert.description)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
