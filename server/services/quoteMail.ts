import {
  QUOTE_MAIL_API_KEY_SETTING_KEY,
  QUOTE_MAIL_ENABLED_SETTING_KEY,
  QUOTE_MAIL_FROM_EMAIL_SETTING_KEY,
  QUOTE_MAIL_FROM_NAME_SETTING_KEY,
  QUOTE_MAIL_SUBJECT_PREFIX_SETTING_KEY,
  QUOTE_MAIL_TO_EMAIL_SETTING_KEY,
} from "../../shared/const";

export type QuoteMailPayload = {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  pageUrl?: string;
};

export type QuoteMailSettings = Record<string, string>;

function isEnabled(rawValue?: string): boolean {
  return rawValue === "true";
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getRequiredSetting(settings: QuoteMailSettings, key: string, label: string): string {
  const value = settings[key]?.trim();
  if (!value) {
    throw new Error(`${label} ayarı eksik.`);
  }
  return value;
}

export function validateQuoteMailConfiguration(settings: QuoteMailSettings): {
  enabled: boolean;
  issues: string[];
} {
  const enabled = isEnabled(settings[QUOTE_MAIL_ENABLED_SETTING_KEY]);
  if (!enabled) {
    return {
      enabled: false,
      issues: ["Mail gönderimi admin panelinde kapalı."],
    };
  }

  const issues: string[] = [];
  if (!settings[QUOTE_MAIL_API_KEY_SETTING_KEY]?.trim()) {
    issues.push("Resend API anahtarı eksik.");
  }
  if (!settings[QUOTE_MAIL_FROM_EMAIL_SETTING_KEY]?.trim()) {
    issues.push("Gönderici e-posta adresi eksik.");
  }
  if (!settings[QUOTE_MAIL_TO_EMAIL_SETTING_KEY]?.trim()) {
    issues.push("Tekliflerin gideceği alıcı e-posta adresi eksik.");
  }

  return {
    enabled: true,
    issues,
  };
}

export async function sendQuoteNotificationEmail(
  settings: QuoteMailSettings,
  payload: QuoteMailPayload,
): Promise<{ provider: "resend"; messageId: string }> {
  const config = validateQuoteMailConfiguration(settings);
  if (!config.enabled) {
    throw new Error(config.issues[0]);
  }
  if (config.issues.length > 0) {
    throw new Error(config.issues.join(" "));
  }

  const apiKey = getRequiredSetting(
    settings,
    QUOTE_MAIL_API_KEY_SETTING_KEY,
    "Resend API anahtarı",
  );
  const fromEmail = getRequiredSetting(
    settings,
    QUOTE_MAIL_FROM_EMAIL_SETTING_KEY,
    "Gönderici e-posta adresi",
  );
  const fromName =
    settings[QUOTE_MAIL_FROM_NAME_SETTING_KEY]?.trim() || "BRAC Teklif Formu";
  const toEmail = getRequiredSetting(
    settings,
    QUOTE_MAIL_TO_EMAIL_SETTING_KEY,
    "Alıcı e-posta adresi",
  );
  const subjectPrefix = settings[QUOTE_MAIL_SUBJECT_PREFIX_SETTING_KEY]?.trim() || "[Teklif]";

  const safeName = escapeHtml(payload.name);
  const safeEmail = escapeHtml(payload.email);
  const safePhone = escapeHtml(payload.phone?.trim() || "-");
  const safeSubject = escapeHtml(payload.subject);
  const safeMessage = escapeHtml(payload.message).replace(/\n/g, "<br />");
  const safePageUrl = escapeHtml(payload.pageUrl?.trim() || "-");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: `${fromName} <${fromEmail}>`,
      to: [toEmail],
      subject: `${subjectPrefix} ${payload.subject}`.trim(),
      replyTo: payload.email,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
          <h2>Yeni teklif talebi</h2>
          <p><strong>Ad Soyad:</strong> ${safeName}</p>
          <p><strong>E-posta:</strong> ${safeEmail}</p>
          <p><strong>Telefon:</strong> ${safePhone}</p>
          <p><strong>Konu:</strong> ${safeSubject}</p>
          <p><strong>Sayfa:</strong> ${safePageUrl}</p>
          <hr />
          <p><strong>Mesaj:</strong></p>
          <p>${safeMessage}</p>
        </div>
      `,
      text: [
        "Yeni teklif talebi",
        `Ad Soyad: ${payload.name}`,
        `E-posta: ${payload.email}`,
        `Telefon: ${payload.phone?.trim() || "-"}`,
        `Konu: ${payload.subject}`,
        `Sayfa: ${payload.pageUrl?.trim() || "-"}`,
        "",
        "Mesaj:",
        payload.message,
      ].join("\n"),
    }),
  });

  const result = (await response.json().catch(() => null)) as
    | { id?: string; message?: string; error?: unknown }
    | null;

  if (!response.ok || !result?.id) {
    const errorMessage =
      (result && typeof result.message === "string" && result.message) ||
      (result && typeof result.error === "string" && result.error) ||
      `Resend isteği başarısız oldu (${response.status}).`;
    throw new Error(errorMessage);
  }

  return {
    provider: "resend",
    messageId: result.id,
  };
}
