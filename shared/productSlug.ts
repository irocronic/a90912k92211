function normalizeSlugText(value: string): string {
  return value
    .toLowerCase()
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c");
}

export function slugify(value: string): string {
  return normalizeSlugText(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export function buildProductSlugFromFields(title: string, subtitle: string, id: string): string {
  return `${slugify(`${title}-${subtitle}`)}-${id.slice(0, 6)}`;
}

