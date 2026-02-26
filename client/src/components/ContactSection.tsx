/*
  VADEN ORIGINAL - Contact Section Component
  Design: Industrial Precision - Dark form with orange accents
*/

import { useState } from "react";
import { Clock, Mail, MapPin, Phone, Send } from "lucide-react";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";
import { toast } from "sonner";
import { asRecordArray, asString, useTemplateBackedPageContent } from "@/lib/pageContent";

type ContactMetadata = {
  label: string;
  heading: string;
  successMessage: string;
  contactInfo: Array<{ icon: string; title: string; lines: string[] }>;
  labels: {
    name: string;
    email: string;
    phone: string;
    subject: string;
    message: string;
    submit: string;
  };
  placeholders: {
    name: string;
    email: string;
    phone: string;
    subject: string;
    message: string;
  };
};

const INFO_ICONS = {
  mapPin: MapPin,
  phone: Phone,
  mail: Mail,
  clock: Clock,
} as const;

export default function ContactSection() {
  const { ref, isVisible } = useIntersectionObserver({ threshold: 0.1 });
  const { metadata } = useTemplateBackedPageContent<ContactMetadata>("home.contact");
  const contactInfo = asRecordArray<{ icon: string; title: string; lines: string[] }>(
    metadata.contactInfo,
    [],
  );

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success(asString(metadata.successMessage, "Mesajınız alındı!"));
    setFormData({ name: "", email: "", phone: "", subject: "", message: "" });
  };

  return (
    <section
      id="iletisim"
      className="py-20 bg-[var(--vaden-surface-09)]"
      ref={ref as React.RefObject<HTMLElement>}
    >
      <div className="container mx-auto px-6 max-w-7xl">
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
            {asString(metadata.heading)}
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
          <div
            className={`lg:col-span-2 transition-all duration-700 ${
              isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"
            }`}
          >
            <div className="space-y-4">
              {contactInfo.map((info, index) => {
                const Icon = INFO_ICONS[(asString(info.icon) as keyof typeof INFO_ICONS) || "mapPin"];
                const lines = Array.isArray(info.lines) ? info.lines : [];
                return (
                  <div
                    key={`${info.title}-${index}`}
                    className={`flex items-start gap-4 p-4 bg-[var(--vaden-surface-14)] border border-[var(--vaden-border)] hover:border-[oklch(0.60_0.18_42)] transition-all duration-300 ${
                      isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                    }`}
                    style={{ transitionDelay: `${0.2 + index * 0.1}s` }}
                  >
                    <div className="w-10 h-10 bg-[oklch(0.60_0.18_42)/10] flex items-center justify-center flex-shrink-0">
                      <Icon size={18} className="text-[oklch(0.60_0.18_42)]" />
                    </div>
                    <div>
                      <h4 className="font-['Barlow_Condensed'] font-bold text-[var(--vaden-on-surface)] text-base uppercase tracking-wide mb-1">
                        {asString(info.title)}
                      </h4>
                      {lines.map((line, lineIndex) => (
                        <p key={`${line}-${lineIndex}`} className="text-[var(--vaden-text-muted)] text-sm font-['Inter']">
                          {line}
                        </p>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div
            className={`lg:col-span-3 transition-all duration-700 delay-200 ${
              isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"
            }`}
          >
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[oklch(0.60_0.18_42)] font-['Barlow_Condensed'] font-bold text-xs tracking-wide uppercase mb-1.5">
                    {asString(metadata.labels?.name)}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-[var(--vaden-surface-14)] border border-[var(--vaden-border-strong)] focus:border-[oklch(0.60_0.18_42)] px-4 py-3 text-[var(--vaden-on-surface)] placeholder-[var(--vaden-text-placeholder)] text-sm outline-none transition-colors font-['Inter']"
                    placeholder={asString(metadata.placeholders?.name)}
                  />
                </div>
                <div>
                  <label className="block text-[oklch(0.60_0.18_42)] font-['Barlow_Condensed'] font-bold text-xs tracking-wide uppercase mb-1.5">
                    {asString(metadata.labels?.email)}
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-[var(--vaden-surface-14)] border border-[var(--vaden-border-strong)] focus:border-[oklch(0.60_0.18_42)] px-4 py-3 text-[var(--vaden-on-surface)] placeholder-[var(--vaden-text-placeholder)] text-sm outline-none transition-colors font-['Inter']"
                    placeholder={asString(metadata.placeholders?.email)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[oklch(0.60_0.18_42)] font-['Barlow_Condensed'] font-bold text-xs tracking-wide uppercase mb-1.5">
                    {asString(metadata.labels?.phone)}
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-[var(--vaden-surface-14)] border border-[var(--vaden-border-strong)] focus:border-[oklch(0.60_0.18_42)] px-4 py-3 text-[var(--vaden-on-surface)] placeholder-[var(--vaden-text-placeholder)] text-sm outline-none transition-colors font-['Inter']"
                    placeholder={asString(metadata.placeholders?.phone)}
                  />
                </div>
                <div>
                  <label className="block text-[oklch(0.60_0.18_42)] font-['Barlow_Condensed'] font-bold text-xs tracking-wide uppercase mb-1.5">
                    {asString(metadata.labels?.subject)}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full bg-[var(--vaden-surface-14)] border border-[var(--vaden-border-strong)] focus:border-[oklch(0.60_0.18_42)] px-4 py-3 text-[var(--vaden-on-surface)] placeholder-[var(--vaden-text-placeholder)] text-sm outline-none transition-colors font-['Inter']"
                    placeholder={asString(metadata.placeholders?.subject)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[oklch(0.60_0.18_42)] font-['Barlow_Condensed'] font-bold text-xs tracking-wide uppercase mb-1.5">
                  {asString(metadata.labels?.message)}
                </label>
                <textarea
                  required
                  rows={5}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full bg-[var(--vaden-surface-14)] border border-[var(--vaden-border-strong)] focus:border-[oklch(0.60_0.18_42)] px-4 py-3 text-[var(--vaden-on-surface)] placeholder-[var(--vaden-text-placeholder)] text-sm outline-none transition-colors font-['Inter'] resize-none"
                  placeholder={asString(metadata.placeholders?.message)}
                />
              </div>

              <button
                type="submit"
                className="inline-flex items-center gap-2 bg-[oklch(0.60_0.18_42)] hover:bg-[oklch(0.50_0.18_42)] text-[var(--vaden-on-accent)] font-['Barlow_Condensed'] font-bold text-sm px-8 py-3.5 tracking-wide uppercase transition-all hover:shadow-[0_0_20px_oklch(0.60_0.18_42/0.3)]"
              >
                {asString(metadata.labels?.submit, "Mesaj Gönder")} <Send size={16} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
