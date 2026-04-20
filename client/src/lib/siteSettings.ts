import { useMemo } from "react";
import { trpc } from "@/lib/trpc";

type PublicSettingRow = {
  key: string;
  value: string;
  type: "string" | "number" | "boolean" | "json";
  parsedValue?: unknown;
};

function normalizeUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function usePublicSiteSettings() {
  const { data: settings = [] } = trpc.content.settings.list.useQuery();

  return useMemo(() => {
    const map = new Map<string, PublicSettingRow>();
    settings.forEach((item) => {
      map.set(item.key, item as PublicSettingRow);
    });

    const getString = (key: string) => {
      const raw = map.get(key)?.parsedValue;
      return typeof raw === "string" ? raw.trim() : "";
    };

    const contactEmail = getString("contact_email");
    const contactPhone = getString("contact_phone");
    const siteTitle = getString("site_title");
    const siteDescription = getString("site_description");
    const socialFacebook = normalizeUrl(getString("social_facebook"));
    const socialLinkedin = normalizeUrl(getString("social_linkedin"));
    const socialTwitter = normalizeUrl(getString("social_twitter"));

    return {
      contactEmail,
      contactPhone,
      siteTitle,
      siteDescription,
      socialFacebook,
      socialLinkedin,
      socialTwitter,
    };
  }, [settings]);
}
