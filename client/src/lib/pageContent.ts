import { useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { PAGE_CONTENT_TEMPLATE_MAP } from "@/lib/pageContentTemplates";
import { useI18n } from "@/contexts/I18nContext";
import { EN_PAGE_CONTENT_OVERRIDES } from "@/lib/pageContentEnOverrides";
import {
  getPageContentTranslationKey,
  PAGE_CONTENT_TRANSLATION_SECTION,
} from "@/lib/pageContentTranslationKeys";

export type JsonRecord = Record<string, unknown>;

export interface PageContentSectionValue<TMetadata extends JsonRecord> {
  title: string;
  content: string;
  imageUrl: string;
  metadata: TMetadata;
  isLoading: boolean;
}

function isJsonRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function deepMerge(base: unknown, override: unknown): unknown {
  if (override === undefined) return base;
  if (base === undefined) return override;

  if (Array.isArray(override)) {
    return override;
  }

  if (isJsonRecord(base) && isJsonRecord(override)) {
    const merged: JsonRecord = { ...base };
    const keys = new Set([...Object.keys(base), ...Object.keys(override)]);
    keys.forEach((key) => {
      merged[key] = deepMerge(base[key], override[key]);
    });
    return merged;
  }

  return override;
}

function mergeMetadata<TMetadata extends JsonRecord>(fallback: TMetadata, incoming: unknown): TMetadata {
  if (!isJsonRecord(incoming)) return fallback;
  return { ...fallback, ...incoming } as TMetadata;
}

function localizeSectionValue<TMetadata extends JsonRecord>(
  section: string,
  language: "tr" | "en",
  value: PageContentSectionValue<TMetadata>,
  storedOverride?: JsonRecord,
): PageContentSectionValue<TMetadata> {
  if (language !== "en") return value;

  const staticOverride = EN_PAGE_CONTENT_OVERRIDES[section] ?? {};
  const mergedOverride = deepMerge(
    staticOverride,
    storedOverride ?? {},
  ) as {
    title?: string;
    content?: string;
    imageUrl?: string;
    metadata?: JsonRecord;
  };

  if (Object.keys(mergedOverride).length === 0) return value;

  return {
    ...value,
    title: mergedOverride.title ?? value.title,
    content: mergedOverride.content ?? value.content,
    imageUrl: mergedOverride.imageUrl ?? value.imageUrl,
    metadata: deepMerge(value.metadata, mergedOverride.metadata ?? {}) as TMetadata,
  };
}

function parseStoredOverride(
  rawValue?: string,
): JsonRecord | undefined {
  if (!rawValue) return undefined;
  try {
    const parsed = JSON.parse(rawValue);
    if (!isJsonRecord(parsed)) return undefined;
    return parsed;
  } catch {
    return undefined;
  }
}

export function usePageContentSection<TMetadata extends JsonRecord>(
  section: string,
  fallback: {
    title?: string;
    content?: string;
    imageUrl?: string;
    metadata: TMetadata;
  },
): PageContentSectionValue<TMetadata> {
  const { language } = useI18n();
  const { data = [], isLoading } = trpc.content.pageContent.list.useQuery();
  const { data: enPageContentTranslations = {} } = trpc.i18n.getSectionTranslations.useQuery(
    {
      language: "en",
      section: PAGE_CONTENT_TRANSLATION_SECTION,
    },
    {
      enabled: language === "en",
    },
  );

  const item = useMemo(
    () => data.find((entry) => entry.section === section),
    [data, section],
  );

  const storedEnOverride = useMemo(
    () =>
      parseStoredOverride(
        enPageContentTranslations[getPageContentTranslationKey(section)],
      ),
    [enPageContentTranslations, section],
  );

  const mergedValue: PageContentSectionValue<TMetadata> = {
    title: item?.title ?? fallback.title ?? "",
    content: item?.content ?? fallback.content ?? "",
    imageUrl: item?.imageUrl ?? fallback.imageUrl ?? "",
    metadata: mergeMetadata(fallback.metadata, item?.metadata),
    isLoading,
  };

  return localizeSectionValue(section, language, mergedValue, storedEnOverride);
}

export function useTemplateBackedPageContent<TMetadata extends JsonRecord>(
  section: string,
): PageContentSectionValue<TMetadata> {
  const template = PAGE_CONTENT_TEMPLATE_MAP[section];
  return usePageContentSection(section, {
    title: template?.title ?? "",
    content: template?.content ?? "",
    imageUrl: template?.imageUrl ?? "",
    metadata: ((template?.metadata as TMetadata | undefined) ?? ({} as TMetadata)),
  });
}

export function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

export function asNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export function asStringArray(value: unknown, fallback: string[] = []): string[] {
  if (!Array.isArray(value)) return fallback;
  return value.filter((item): item is string => typeof item === "string");
}

export function asRecordArray<T extends JsonRecord>(
  value: unknown,
  fallback: T[] = [],
): T[] {
  if (!Array.isArray(value)) return fallback;
  return value.filter((item): item is T => isJsonRecord(item)) as T[];
}
