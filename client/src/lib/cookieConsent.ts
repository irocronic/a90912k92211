export const COOKIE_CONSENT_STORAGE_KEY = "brac-cookie-consent";

export type CookieConsentChoice = "accepted" | "essential";

export function getCookieConsentChoice(): CookieConsentChoice | null {
  if (typeof window === "undefined") return null;
  const rawValue = window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
  if (rawValue === "accepted" || rawValue === "essential") return rawValue;
  return null;
}

export function setCookieConsentChoice(choice: CookieConsentChoice) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, choice);
}

export function hasAcceptedAnalytics() {
  return getCookieConsentChoice() === "accepted";
}
