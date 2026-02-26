export const PAGE_CONTENT_TRANSLATION_SECTION = "pageContent";

export function getPageContentTranslationKey(section: string): string {
  return `section:${section}`;
}
