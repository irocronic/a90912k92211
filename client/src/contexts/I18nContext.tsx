import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { trpc } from "@/lib/trpc";

type Language = "tr" | "en";

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (section: string, key: string) => string;
  translations: Record<string, Record<string, string>>;
  isLoading: boolean;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("tr");
  const [translations, setTranslations] = useState<Record<string, Record<string, string>>>({});
  const [isLoading, setIsLoading] = useState(true);

  const { data: allTranslations } = trpc.i18n.getTranslations.useQuery({ language });
  const updatePreferencesMutation = trpc.i18n.updateUserPreferences.useMutation();

  // Initialize language from localStorage or browser preference
  useEffect(() => {
    const savedLanguage = localStorage.getItem("language") as Language | null;
    if (savedLanguage) {
      setLanguageState(savedLanguage);
    } else {
      // Use browser language preference
      const browserLang = navigator.language.split("-")[0];
      const lang = (["tr", "en"].includes(browserLang) ? browserLang : "tr") as Language;
      setLanguageState(lang);
      localStorage.setItem("language", lang);
    }
    setIsLoading(false);
  }, []);

  // Update translations when language changes
  useEffect(() => {
    if (allTranslations) {
      setTranslations(allTranslations);
    }
  }, [allTranslations, language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("language", lang);
    updatePreferencesMutation.mutate({ language: lang });
  };

  const t = (section: string, key: string): string => {
    // Return empty string when translations not loaded yet (allows || fallback in components)
    if (!translations[section]?.[key]) return "";
    return translations[section][key];
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage, t, translations, isLoading }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return context;
}
