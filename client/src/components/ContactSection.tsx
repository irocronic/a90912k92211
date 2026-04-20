/*
  VADEN ORIGINAL - Contact Section Component
  Design: Industrial Precision - Dark form with orange accents
*/

import { useState } from "react";
import { Clock, Mail, MapPin, Phone, Send } from "lucide-react";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";
import { toast } from "sonner";
import { asRecordArray, asString, useTemplateBackedPageContent } from "@/lib/pageContent";
import { trpc } from "@/lib/trpc";

type ContactMetadata = {
  label: string;
  heading: string;
  successMessage: string;
  whatsappText?: string;
  whatsappUrl?: string;
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

function WhatsAppIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="currentColor"
    >
      <path d="M19.05 4.94A9.82 9.82 0 0 0 12.03 2C6.6 2 2.2 6.4 2.2 11.82c0 1.74.45 3.44 1.31 4.95L2 22l5.39-1.41a9.8 9.8 0 0 0 4.64 1.18h.01c5.43 0 9.83-4.4 9.83-9.82a9.75 9.75 0 0 0-2.82-7.01Zm-7.02 15.17h-.01a8.16 8.16 0 0 1-4.15-1.14l-.3-.18-3.2.84.85-3.12-.2-.32a8.11 8.11 0 0 1-1.25-4.36c0-4.5 3.67-8.17 8.19-8.17 2.18 0 4.22.85 5.76 2.39a8.1 8.1 0 0 1 2.39 5.77c0 4.51-3.68 8.18-8.18 8.18Zm4.49-6.13c-.25-.12-1.47-.72-1.69-.8-.23-.08-.39-.12-.56.12-.17.25-.64.8-.79.96-.15.17-.29.19-.54.06-.25-.12-1.04-.38-1.98-1.22-.73-.65-1.22-1.45-1.36-1.7-.14-.25-.01-.39.11-.51.11-.11.25-.29.37-.43.12-.15.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.77-1.84-.2-.48-.4-.41-.56-.42h-.48c-.17 0-.43.06-.66.31-.23.25-.87.85-.87 2.06s.9 2.39 1.02 2.56c.12.17 1.76 2.69 4.26 3.77.6.26 1.07.41 1.44.52.61.19 1.16.16 1.59.1.49-.07 1.47-.6 1.68-1.18.21-.58.21-1.08.15-1.18-.06-.1-.22-.16-.46-.27Z" />
    </svg>
  );
}

function getReadableErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    try {
      const parsed = JSON.parse(error.message) as Array<{ message?: string }>;
      if (Array.isArray(parsed)) {
        const messages = parsed
          .map((item) => item?.message?.trim())
          .filter((item): item is string => Boolean(item));
        if (messages.length > 0) {
          return messages.join(" ");
        }
      }
    } catch {
      return error.message;
    }
    return error.message;
  }

  return "Mesajınız gönderilemedi. Lütfen daha sonra tekrar deneyin.";
}

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
    website: "",
  });
  const submitQuoteMutation = trpc.content.quote.submit.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const result = await submitQuoteMutation.mutateAsync({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        subject: formData.subject,
        message: formData.message,
        pageUrl: typeof window !== "undefined" ? window.location.href : undefined,
        website: formData.website,
      });
      toast.success(
        result.message || asString(metadata.successMessage, "Mesajınız alındı!"),
      );
      setFormData({
        name: "",
        email: "",
        phone: "",
        subject: "",
        message: "",
        website: "",
      });
    } catch (error) {
      const message = getReadableErrorMessage(error);
      toast.error(message);
    }
  };

  return (
    <section
      id="teklif"
      className="py-20 bg-[var(--vaden-surface-09)]"
      ref={ref as React.RefObject<HTMLElement>}
    >
      <div id="iletisim" className="pointer-events-none relative -top-28 block h-0 scroll-mt-28" />
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
              <input
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                className="hidden"
                aria-hidden="true"
              />

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
                    disabled={submitQuoteMutation.isPending}
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
                    disabled={submitQuoteMutation.isPending}
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
                    disabled={submitQuoteMutation.isPending}
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
                    disabled={submitQuoteMutation.isPending}
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
                  disabled={submitQuoteMutation.isPending}
                  className="w-full bg-[var(--vaden-surface-14)] border border-[var(--vaden-border-strong)] focus:border-[oklch(0.60_0.18_42)] px-4 py-3 text-[var(--vaden-on-surface)] placeholder-[var(--vaden-text-placeholder)] text-sm outline-none transition-colors font-['Inter'] resize-none"
                  placeholder={asString(metadata.placeholders?.message)}
                />
              </div>

              <button
                type="submit"
                disabled={submitQuoteMutation.isPending}
                className="inline-flex items-center gap-2 bg-[oklch(0.60_0.18_42)] hover:bg-[oklch(0.50_0.18_42)] text-[var(--vaden-on-accent)] font-['Barlow_Condensed'] font-bold text-sm px-8 py-3.5 tracking-wide uppercase transition-all hover:shadow-[0_0_20px_oklch(0.60_0.18_42/0.3)]"
              >
                {submitQuoteMutation.isPending
                  ? "Gönderiliyor..."
                  : asString(metadata.labels?.submit, "Mesaj Gönder")}{" "}
                <Send size={16} />
              </button>

              {asString(metadata.whatsappUrl) ? (
                <a
                  href={asString(metadata.whatsappUrl)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 border border-[var(--vaden-border-strong)] bg-[var(--vaden-surface-14)] px-8 py-3.5 font-['Barlow_Condensed'] text-sm font-bold uppercase tracking-wide text-[var(--vaden-on-surface)] transition-all hover:border-[oklch(0.60_0.18_42)] hover:text-[oklch(0.60_0.18_42)]"
                >
                  {asString(metadata.whatsappText, "WhatsApp")}
                  <WhatsAppIcon />
                </a>
              ) : null}
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
