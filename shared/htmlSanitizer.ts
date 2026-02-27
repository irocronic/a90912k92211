const BLOCKED_TAG_BLOCKS =
  /<\s*(script|style|iframe|object|embed|template)\b[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi;
const BLOCKED_SINGLE_TAGS =
  /<\s*\/?\s*(link|meta|base|form|input|button|textarea|select|option)\b[^>]*>/gi;
const EVENT_HANDLER_ATTR = /\son[a-z]+\s*=\s*(".*?"|'.*?'|[^\s>]+)/gi;
const STYLE_ATTR = /\sstyle\s*=\s*(".*?"|'.*?'|[^\s>]+)/gi;
const SRCDOC_ATTR = /\ssrcdoc\s*=\s*(".*?"|'.*?'|[^\s>]+)/gi;
const COMMENT_BLOCK = /<!--[\s\S]*?-->/g;

function isUnsafeUrl(value: string): boolean {
  const normalized = value
    .replace(/[\u0000-\u001f\u007f\s]+/g, "")
    .toLowerCase();

  return (
    normalized.startsWith("javascript:") ||
    normalized.startsWith("vbscript:") ||
    normalized.startsWith("data:text/html") ||
    normalized.startsWith("data:application/xhtml+xml")
  );
}

function sanitizeAttributeUrls(input: string): string {
  const withQuotedAttrs = input.replace(
    /\s(href|src|xlink:href)\s*=\s*("([^"]*)"|'([^']*)')/gi,
    (match, attr, rawValue, dquoteValue, squoteValue) => {
      const value = (dquoteValue ?? squoteValue ?? "").trim();
      if (isUnsafeUrl(value)) return "";
      return ` ${attr}=${rawValue}`;
    }
  );

  return withQuotedAttrs.replace(
    /\s(href|src|xlink:href)\s*=\s*([^\s>]+)/gi,
    (match, attr, value) => {
      const normalized = String(value).trim();
      if (isUnsafeUrl(normalized)) return "";
      return ` ${attr}=${value}`;
    }
  );
}

export function sanitizeHtml(input: string): string {
  if (!input) return "";

  return sanitizeAttributeUrls(
    input
      .replace(COMMENT_BLOCK, "")
      .replace(BLOCKED_TAG_BLOCKS, "")
      .replace(BLOCKED_SINGLE_TAGS, "")
      .replace(EVENT_HANDLER_ATTR, "")
      .replace(STYLE_ATTR, "")
      .replace(SRCDOC_ATTR, "")
  );
}

function sanitizeUnknownDeepInternal(value: unknown): unknown {
  if (typeof value === "string") return sanitizeHtml(value);

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeUnknownDeepInternal(item));
  }

  if (value && typeof value === "object") {
    const result: Record<string, unknown> = {};
    Object.entries(value as Record<string, unknown>).forEach(([key, item]) => {
      result[key] = sanitizeUnknownDeepInternal(item);
    });
    return result;
  }

  return value;
}

export function sanitizeUnknownDeep<T>(value: T): T {
  return sanitizeUnknownDeepInternal(value) as T;
}
