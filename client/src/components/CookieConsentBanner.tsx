import { useEffect, useMemo, useState } from "react";
import { initializeAnalytics } from "@/lib/analytics";
import {
  getCookieConsentChoice,
  setCookieConsentChoice,
  type CookieConsentChoice,
} from "@/lib/cookieConsent";
import { useI18n } from "@/contexts/I18nContext";

const COPY = {
  tr: {
    title: "Çerez Bildirimi",
    description:
      "Web sitemizde temel işlevler için zorunlu çerezler kullanılır. Performans ve kullanım analizi için analitik çerezler ise yalnızca onay vermeniz halinde etkinleştirilir.",
    accept: "Çerezleri Kabul Et",
    essential: "Sadece Gerekli Çerezler",
    policy: "Çerez Politikası",
  },
  en: {
    title: "Cookie Notice",
    description:
      "Our website uses strictly necessary cookies for core functionality. Analytics cookies are enabled only with your consent so we can improve performance and user experience.",
    accept: "Accept Cookies",
    essential: "Only Necessary Cookies",
    policy: "Cookie Policy",
  },
  ar: {
    title: "إشعار ملفات تعريف الارتباط",
    description:
      "يستخدم موقعنا ملفات تعريف ارتباط ضرورية لتشغيل الوظائف الأساسية. أما ملفات التحليلات فلا يتم تفعيلها إلا بعد موافقتك حتى نتمكن من تحسين الأداء وتجربة الاستخدام.",
    accept: "قبول ملفات تعريف الارتباط",
    essential: "الملفات الضرورية فقط",
    policy: "سياسة ملفات تعريف الارتباط",
  },
} as const;

export default function CookieConsentBanner() {
  const { language } = useI18n();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(!getCookieConsentChoice());
  }, []);

  const copy = useMemo(() => COPY[language], [language]);

  const handleChoice = (choice: CookieConsentChoice) => {
    setCookieConsentChoice(choice);
    if (choice === "accepted") initializeAnalytics();
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[90] px-4 pb-4">
      <div className="mx-auto max-w-5xl rounded-2xl border border-[var(--brac-border)] bg-[var(--brac-surface-14)] shadow-[0_20px_60px_rgba(0,0,0,0.18)] backdrop-blur">
        <div className="flex flex-col gap-5 p-5 md:flex-row md:items-end md:justify-between md:p-6">
          <div className="max-w-3xl">
            <p className="mb-2 font-['Barlow_Condensed'] text-lg font-bold uppercase tracking-wide text-[var(--brac-on-surface)]">
              {copy.title}
            </p>
            <p className="text-sm leading-6 text-[var(--brac-text-muted)]">
              {copy.description}{" "}
              <a
                href="/politikalar?tab=cookies"
                className="font-medium text-[oklch(0.60_0.18_42)] underline underline-offset-4"
              >
                {copy.policy}
              </a>
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => handleChoice("essential")}
              className="rounded-xl border border-[var(--brac-border-strong)] bg-transparent px-5 py-3 font-['Barlow_Condensed'] text-sm font-bold uppercase tracking-wide text-[var(--brac-on-surface)] transition-colors hover:border-[oklch(0.60_0.18_42)] hover:text-[oklch(0.60_0.18_42)]"
            >
              {copy.essential}
            </button>
            <button
              type="button"
              onClick={() => handleChoice("accepted")}
              className="rounded-xl bg-[oklch(0.60_0.18_42)] px-5 py-3 font-['Barlow_Condensed'] text-sm font-bold uppercase tracking-wide text-[var(--brac-on-accent)] transition-colors hover:bg-[oklch(0.54_0.18_42)]"
            >
              {copy.accept}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
