/*
  VADEN ORIGINAL - Policies Page
  Design: Industrial Precision - Gizlilik, KVKK, Çerez Politikaları
*/

import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ChevronDown } from "lucide-react";
import { asRecordArray, asString, useTemplateBackedPageContent } from "@/lib/pageContent";

type PoliciesMetadata = {
  pageTitle: string;
  metaDescription: string;
  metaKeywords: string;
  heroLabel: string;
  heroHeadingMain: string;
  heroHeadingHighlight: string;
  heroDescription: string;
  policies: Array<{ id: string; title: string; content: string }>;
  contactTitle: string;
  contactDescription: string;
  contactButtonText: string;
  contactButtonHref: string;
};

export default function Policies() {
  const { metadata } = useTemplateBackedPageContent<PoliciesMetadata>("pages.policies");
  const policies = asRecordArray<{ id: string; title: string; content: string }>(
    metadata.policies,
    [],
  );

  const initialPolicy = useMemo(() => {
    const fromUrl =
      typeof window !== "undefined"
        ? new URL(window.location.href).searchParams.get("tab") || "privacy"
        : "privacy";
    if (policies.some((policy) => policy.id === fromUrl)) return fromUrl;
    return policies[0]?.id || "privacy";
  }, [policies]);

  const [expandedPolicy, setExpandedPolicy] = useState(initialPolicy);

  useEffect(() => {
    if (policies.some((policy) => policy.id === expandedPolicy)) return;
    setExpandedPolicy(policies[0]?.id || "");
  }, [expandedPolicy, policies]);

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

      <div className="container mx-auto px-6 max-w-4xl py-20">
        <div className="space-y-4">
          {policies.map((policy) => (
            <div key={policy.id} className="border border-[var(--vaden-border)] bg-[var(--vaden-surface-14)]">
              <button
                onClick={() => setExpandedPolicy(expandedPolicy === policy.id ? "" : policy.id)}
                className="w-full flex items-center justify-between p-6 hover:bg-[var(--vaden-surface-12)] transition-colors"
              >
                <h2 className="font-['Barlow_Condensed'] font-bold text-[var(--vaden-on-surface)] text-xl uppercase tracking-wide">
                  {asString(policy.title)}
                </h2>
                <ChevronDown
                  size={24}
                  className={`text-[oklch(0.60_0.18_42)] transition-transform ${
                    expandedPolicy === policy.id ? "rotate-180" : ""
                  }`}
                />
              </button>

              {expandedPolicy === policy.id && (
                <div className="border-t border-[var(--vaden-border)] p-6">
                  <div
                    className="prose prose-invert max-w-none text-[var(--vaden-text-muted)] font-['Inter'] text-sm leading-relaxed"
                    dangerouslySetInnerHTML={{
                      __html: asString(policy.content)
                        .replace(
                          /<h3>/g,
                          '<h3 class="font-bold text-[var(--vaden-on-surface)] mt-6 mb-3 uppercase">',
                        )
                        .replace(/<p>/g, '<p class="mb-3">')
                        .replace(/<ul>/g, '<ul class="list-disc list-inside mb-3 space-y-2">')
                        .replace(/<li>/g, '<li class="ml-2">'),
                    }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-20 bg-[var(--vaden-surface-14)] border border-[var(--vaden-border)] p-8 text-center">
          <h3 className="font-['Barlow_Condensed'] font-bold text-[var(--vaden-on-surface)] text-xl mb-3 uppercase">
            {asString(metadata.contactTitle)}
          </h3>
          <p className="text-[var(--vaden-text-muted)] font-['Inter'] mb-4">
            {asString(metadata.contactDescription)}
          </p>
          <a
            href={asString(metadata.contactButtonHref, "#iletisim")}
            className="inline-flex items-center gap-2 bg-[oklch(0.60_0.18_42)] hover:bg-[oklch(0.50_0.18_42)] text-[var(--vaden-on-accent)] font-['Barlow_Condensed'] font-bold text-sm px-6 py-3 tracking-wide uppercase transition-all"
          >
            {asString(metadata.contactButtonText)}
          </a>
        </div>
      </div>

      <Footer />
    </div>
  );
}
