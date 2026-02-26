/*
  VADEN ORIGINAL - Career Page
  Design: Industrial Precision - Kariyer ve iş ilanları
*/

import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ArrowRight, Briefcase, Clock, MapPin } from "lucide-react";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";
import { asRecordArray, asString, useTemplateBackedPageContent } from "@/lib/pageContent";

type CareerMetadata = {
  pageTitle: string;
  metaDescription: string;
  metaKeywords: string;
  heroLabel: string;
  heroHeadingMain: string;
  heroHeadingHighlight: string;
  heroDescription: string;
  benefitsTitle: string;
  jobsTitle: string;
  benefits: Array<{ icon: string; title: string; description: string }>;
  jobs: Array<{
    id: number;
    title: string;
    department: string;
    location: string;
    type: string;
    description: string;
  }>;
  ctaTitle: string;
  ctaDescription: string;
  ctaEmail: string;
  ctaButtonText: string;
};

export default function Career() {
  const { ref, isVisible } = useIntersectionObserver({ threshold: 0.1 });
  const { metadata } = useTemplateBackedPageContent<CareerMetadata>("pages.career");
  const benefits = asRecordArray<{ icon: string; title: string; description: string }>(
    metadata.benefits,
    [],
  );
  const jobs = asRecordArray<{
    id: number;
    title: string;
    department: string;
    location: string;
    type: string;
    description: string;
  }>(metadata.jobs, []);

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

      <div className="container mx-auto px-6 max-w-7xl py-20" ref={ref as React.RefObject<HTMLDivElement>}>
        <div className="mb-20">
          <h2 className="font-['Barlow_Condensed'] font-black text-[var(--vaden-on-surface)] text-4xl mb-12 uppercase">
            {asString(metadata.benefitsTitle)}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((benefit, index) => (
              <div
                key={`${benefit.title}-${index}`}
                className={`bg-[var(--vaden-surface-14)] border border-[var(--vaden-border)] p-6 hover:border-[oklch(0.60_0.18_42)] transition-all ${
                  isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                }`}
                style={{ transitionDelay: `${index * 0.1}s` }}
              >
                <div className="text-4xl mb-4">{asString(benefit.icon)}</div>
                <h3 className="font-['Barlow_Condensed'] font-bold text-[var(--vaden-on-surface)] text-lg mb-2 uppercase">
                  {asString(benefit.title)}
                </h3>
                <p className="text-[var(--vaden-text-muted)] text-sm font-['Inter']">
                  {asString(benefit.description)}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="font-['Barlow_Condensed'] font-black text-[var(--vaden-on-surface)] text-4xl mb-12 uppercase">
            {asString(metadata.jobsTitle)}
          </h2>
          <div className="space-y-4">
            {jobs.map((job, index) => (
              <div
                key={`${job.id}-${index}`}
                className={`bg-[var(--vaden-surface-14)] border border-[var(--vaden-border)] hover:border-[oklch(0.60_0.18_42)] p-6 transition-all group cursor-pointer ${
                  isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                }`}
                style={{ transitionDelay: `${0.3 + index * 0.1}s` }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-['Barlow_Condensed'] font-bold text-[var(--vaden-on-surface)] text-xl mb-3 uppercase group-hover:text-[oklch(0.60_0.18_42)] transition-colors">
                      {asString(job.title)}
                    </h3>
                    <p className="text-[var(--vaden-text-muted)] text-sm font-['Inter'] mb-4">
                      {asString(job.description)}
                    </p>
                    <div className="flex flex-wrap items-center gap-6 text-sm">
                      <div className="flex items-center gap-2 text-[var(--vaden-text-muted)]">
                        <Briefcase size={16} className="text-[oklch(0.60_0.18_42)]" />
                        {asString(job.department)}
                      </div>
                      <div className="flex items-center gap-2 text-[var(--vaden-text-muted)]">
                        <MapPin size={16} className="text-[oklch(0.60_0.18_42)]" />
                        {asString(job.location)}
                      </div>
                      <div className="flex items-center gap-2 text-[var(--vaden-text-muted)]">
                        <Clock size={16} className="text-[oklch(0.60_0.18_42)]" />
                        {asString(job.type)}
                      </div>
                    </div>
                  </div>
                  <button className="flex-shrink-0 w-12 h-12 bg-[oklch(0.60_0.18_42)/10] flex items-center justify-center group-hover:bg-[oklch(0.60_0.18_42)] transition-colors">
                    <ArrowRight
                      size={18}
                      className="text-[oklch(0.60_0.18_42)] group-hover:text-white transition-colors"
                    />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-20 bg-gradient-to-r from-[oklch(0.60_0.18_42)/10] to-transparent border border-[oklch(0.60_0.18_42)/30] p-12 text-center">
          <h3 className="font-['Barlow_Condensed'] font-black text-[var(--vaden-on-surface)] text-3xl mb-4 uppercase">
            {asString(metadata.ctaTitle)}
          </h3>
          <p className="text-[var(--vaden-text-muted)] font-['Inter'] mb-6 max-w-2xl mx-auto">
            {asString(metadata.ctaDescription)}
          </p>
          <a
            href={`mailto:${asString(metadata.ctaEmail)}`}
            className="inline-flex items-center gap-2 bg-[oklch(0.60_0.18_42)] hover:bg-[oklch(0.50_0.18_42)] text-[var(--vaden-on-accent)] font-['Barlow_Condensed'] font-bold text-sm px-8 py-3.5 tracking-wide uppercase transition-all"
          >
            {asString(metadata.ctaButtonText)} <ArrowRight size={16} />
          </a>
        </div>
      </div>

      <Footer />
    </div>
  );
}
