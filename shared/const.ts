export const COOKIE_NAME = "app_session_id";
export const ONE_YEAR_MS = 1000 * 60 * 60 * 24 * 365;
export const AXIOS_TIMEOUT_MS = 30_000;
export const UNAUTHED_ERR_MSG = 'Please login (10001)';
export const NOT_ADMIN_ERR_MSG = 'You do not have required permission (10002)';
export const PRODUCT_TAXONOMY_SETTING_KEY = "product_taxonomy";
export const PUBLIC_SETTING_PREFIX = "public_";
export const QUOTE_MAIL_ENABLED_SETTING_KEY = "quote_mail_enabled";
export const QUOTE_MAIL_API_KEY_SETTING_KEY = "quote_mail_api_key";
export const QUOTE_MAIL_FROM_EMAIL_SETTING_KEY = "quote_mail_from_email";
export const QUOTE_MAIL_FROM_NAME_SETTING_KEY = "quote_mail_from_name";
export const QUOTE_MAIL_TO_EMAIL_SETTING_KEY = "quote_mail_to_email";
export const QUOTE_MAIL_SUBJECT_PREFIX_SETTING_KEY = "quote_mail_subject_prefix";
export const PUBLIC_CONTENT_SETTING_KEYS = [
  PRODUCT_TAXONOMY_SETTING_KEY,
  "site_title",
  "site_description",
  "contact_email",
  "contact_phone",
  "social_twitter",
  "social_linkedin",
  "social_facebook",
] as const;
