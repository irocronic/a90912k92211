import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { ImagePlus, Loader2, Monitor, Plus, Smartphone, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { sanitizeHtml } from "@shared/htmlSanitizer";
import { toast } from "sonner";

type JsonRecord = Record<string, unknown>;
type Path = Array<string | number>;

interface PageContentPreviewProps {
  section: string;
  title: string;
  content: string;
  imageUrl: string;
  metadata: JsonRecord;
  onTitleChange: (value: string) => void;
  onContentChange: (value: string) => void;
  onImageUrlChange: (value: string) => void;
  onMetadataChange: (value: JsonRecord) => void;
  onSave: () => void;
  onDelete: () => void;
  savePending: boolean;
  deletePending: boolean;
  canDelete: boolean;
}

const PREVIEW_LABELS: Record<string, string> = {
  slides: "Slider",
  stats: "İstatistikler",
  tabs: "Sekmeler",
  awards: "Ödüller",
  features: "Özellikler",
  items: "Öğeler",
  milestones: "Dönüm Noktaları",
  jobs: "Pozisyonlar",
  benefits: "Faydalar",
  policies: "Politikalar",
  navItems: "Menü Öğeleri",
  socialLinks: "Sosyal Linkler",
  productLinks: "Ürün Linkleri",
  corporateLinks: "Kurumsal Linkler",
  policyLinks: "Politika Linkleri",
  contactInfo: "İletişim Bilgileri",
  labels: "Form Etiketleri",
  placeholders: "Placeholder Metinleri",
};

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function looksLikeHtml(value: string): boolean {
  return /<\/?[a-z][\s\S]*>/i.test(value);
}

function stripHtml(value: string): string {
  return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function cloneJson<T>(value: T): T {
  try {
    return structuredClone(value);
  } catch {
    return JSON.parse(JSON.stringify(value));
  }
}

function formatKey(key: string): string {
  const preset = PREVIEW_LABELS[key];
  if (preset) return preset;
  return key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/^\w/, (match) => match.toUpperCase());
}

function getValueAtPath(root: unknown, path: Path): unknown {
  let cursor: unknown = root;
  for (const segment of path) {
    if (typeof segment === "number") {
      if (!Array.isArray(cursor)) return undefined;
      cursor = cursor[segment];
      continue;
    }
    if (!isRecord(cursor)) return undefined;
    cursor = cursor[segment];
  }
  return cursor;
}

function setValueAtPath(root: JsonRecord, path: Path, nextValue: unknown): JsonRecord {
  const draft = cloneJson(root);
  if (path.length === 0) return draft;

  let cursor: unknown = draft;

  for (let i = 0; i < path.length - 1; i++) {
    const segment = path[i];
    const nextSegment = path[i + 1];

    if (typeof segment === "number") {
      if (!Array.isArray(cursor)) return draft;
      if (cursor[segment] === undefined) {
        cursor[segment] = typeof nextSegment === "number" ? [] : {};
      }
      cursor = cursor[segment];
      continue;
    }

    if (!isRecord(cursor)) return draft;
    if (cursor[segment] === undefined) {
      cursor[segment] = typeof nextSegment === "number" ? [] : {};
    }
    cursor = cursor[segment];
  }

  const last = path[path.length - 1];
  if (typeof last === "number") {
    if (Array.isArray(cursor)) {
      cursor[last] = nextValue;
    }
    return draft;
  }

  if (isRecord(cursor)) {
    cursor[last] = nextValue;
  }
  return draft;
}

function removeArrayIndex(root: JsonRecord, path: Path, index: number): JsonRecord {
  const draft = cloneJson(root);
  const target = getValueAtPath(draft, path);
  if (!Array.isArray(target)) return draft;
  if (index < 0 || index >= target.length) return draft;
  target.splice(index, 1);
  return draft;
}

function createEmptyFromSample(sample: unknown): unknown {
  if (typeof sample === "string") return "";
  if (typeof sample === "number") return 0;
  if (typeof sample === "boolean") return false;
  if (Array.isArray(sample)) return [];
  if (isRecord(sample)) {
    const entries = Object.entries(sample).map(([key, value]) => [key, createEmptyFromSample(value)]);
    return Object.fromEntries(entries);
  }
  return "";
}

function addArrayItem(root: JsonRecord, path: Path): JsonRecord {
  const draft = cloneJson(root);
  const target = getValueAtPath(draft, path);
  if (!Array.isArray(target)) return draft;
  const template = target.length > 0 ? createEmptyFromSample(target[0]) : "";
  target.push(template);
  return draft;
}

function renderHtml(value: string, className: string) {
  if (!value) return null;
  if (!looksLikeHtml(value)) return <p className={className}>{value}</p>;
  return (
    <div
      className={cn("prose prose-sm max-w-none dark:prose-invert", className)}
      dangerouslySetInnerHTML={{ __html: sanitizeHtml(value) }}
    />
  );
}

function summarizeMetadataValue(value: unknown): string {
  if (typeof value === "string") return stripHtml(value).slice(0, 64);
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return `${value.length} öğe`;
  if (isRecord(value)) return `${Object.keys(value).length} alan`;
  return "-";
}

export default function PageContentPreview(props: PageContentPreviewProps) {
  const [viewport, setViewport] = useState<"desktop" | "mobile">("desktop");
  const [newKey, setNewKey] = useState("");
  const [imageEditorOpen, setImageEditorOpen] = useState(false);
  const [imageDraft, setImageDraft] = useState(props.imageUrl);
  const [localImagePreview, setLocalImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadMutation = trpc.admin.storage.uploadImage.useMutation();

  useEffect(() => {
    setImageDraft(props.imageUrl);
  }, [props.imageUrl]);

  const metadataEntries = useMemo(
    () => Object.entries(props.metadata).sort(([a], [b]) => a.localeCompare(b, "tr")),
    [props.metadata],
  );

  const quickPreviewRows = useMemo(
    () =>
      metadataEntries.slice(0, 4).map(([key, value]) => ({
        key: formatKey(key),
        value: summarizeMetadataValue(value),
      })),
    [metadataEntries],
  );

  const setMetadataAtPath = (path: Path, nextValue: unknown) => {
    props.onMetadataChange(setValueAtPath(props.metadata, path, nextValue));
  };

  const removeMetadataArrayItem = (path: Path, index: number) => {
    props.onMetadataChange(removeArrayIndex(props.metadata, path, index));
  };

  const addMetadataArrayItem = (path: Path) => {
    props.onMetadataChange(addArrayItem(props.metadata, path));
  };

  const addTopLevelKey = () => {
    const key = newKey.trim();
    if (!key) return;
    if (key in props.metadata) return;
    props.onMetadataChange({ ...props.metadata, [key]: "" });
    setNewKey("");
  };

  const handleImageClear = () => {
    setLocalImagePreview(null);
    setImageDraft("");
    props.onImageUrlChange("");
    setImageEditorOpen(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleImageApplyUrl = () => {
    props.onImageUrlChange(imageDraft.trim());
    setImageEditorOpen(false);
  };

  const handleImageFileSelect = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Lütfen bir görsel dosyası seçin");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Dosya boyutu 5MB'dan küçük olmalıdır");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setLocalImagePreview((e.target?.result as string) || null);
    };
    reader.readAsDataURL(file);

    try {
      const buffer = await file.arrayBuffer();
      const result = await uploadMutation.mutateAsync({
        file: new Uint8Array(buffer) as any,
        fileName: file.name,
        contentType: file.type,
      });
      props.onImageUrlChange(result.url);
      setImageDraft(result.url);
      setLocalImagePreview(result.url);
      setImageEditorOpen(false);
      toast.success("Görsel başarıyla yüklendi");
    } catch (error) {
      setLocalImagePreview(null);
      toast.error("Görsel yükleme başarısız");
    }
  };

  const renderEditor = (value: unknown, path: Path, depth = 0): ReactNode => {
    if (value === null || value === undefined) {
      return (
        <Input
          value=""
          placeholder="Boş"
          onChange={(e) => setMetadataAtPath(path, e.target.value)}
        />
      );
    }

    if (typeof value === "string") {
      if (looksLikeHtml(value)) {
        return (
          <div
            className="min-h-[90px] rounded-md border bg-background p-3 text-sm text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            contentEditable
            suppressContentEditableWarning
            onInput={(e) =>
              setMetadataAtPath(path, (e.currentTarget as HTMLDivElement).innerHTML)
            }
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(value) }}
          />
        );
      }

      const multiline = value.includes("\n") || value.length > 120;
      if (multiline) {
        return (
          <Textarea
            rows={4}
            value={value}
            onChange={(e) => setMetadataAtPath(path, e.target.value)}
          />
        );
      }

      return (
        <Input
          value={value}
          onChange={(e) => setMetadataAtPath(path, e.target.value)}
        />
      );
    }

    if (typeof value === "number") {
      return (
        <Input
          type="number"
          value={Number.isFinite(value) ? String(value) : "0"}
          onChange={(e) => setMetadataAtPath(path, Number(e.target.value || 0))}
        />
      );
    }

    if (typeof value === "boolean") {
      return (
        <Button
          type="button"
          variant={value ? "default" : "outline"}
          size="sm"
          onClick={() => setMetadataAtPath(path, !value)}
        >
          {value ? "Aktif" : "Pasif"}
        </Button>
      );
    }

    if (Array.isArray(value)) {
      return (
        <div className="space-y-2">
          {value.map((item, index) => (
            <div key={`${path.join(".")}-${index}`} className="rounded-md border p-2 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground">Öğe {index + 1}</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeMetadataArrayItem(path, index)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
              {renderEditor(item, [...path, index], depth + 1)}
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={() => addMetadataArrayItem(path)}>
            <Plus className="w-4 h-4 mr-1" />
            Öğe Ekle
          </Button>
        </div>
      );
    }

    if (isRecord(value)) {
      const entries = Object.entries(value).sort(([a], [b]) => a.localeCompare(b, "tr"));
      return (
        <div className={cn("space-y-3", depth > 0 && "rounded-md border p-3")}>
          {entries.map(([key, child]) => (
            <div key={`${path.join(".")}-${key}`} className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">{formatKey(key)}</p>
              {renderEditor(child, [...path, key], depth + 1)}
            </div>
          ))}
        </div>
      );
    }

    return <p className="text-xs text-muted-foreground">{String(value)}</p>;
  };

  const activeImageUrl = localImagePreview || props.imageUrl;

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>Canlı Önizleme + Düzenleme</CardTitle>
            <CardDescription>Kod alanı olmadan içerikleri burada görsel olarak düzenleyin</CardDescription>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button type="button" onClick={props.onSave} disabled={props.savePending}>
              {props.savePending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Kaydediliyor...
                </>
              ) : (
                "Kaydet"
              )}
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={props.onDelete}
              disabled={!props.canDelete || props.deletePending}
            >
              {props.deletePending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Siliniyor...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Bölümü Sil
                </>
              )}
            </Button>
            <Button
              type="button"
              variant={viewport === "desktop" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewport("desktop")}
            >
              <Monitor className="w-4 h-4 mr-2" />
              Desktop
            </Button>
            <Button
              type="button"
              variant={viewport === "mobile" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewport("mobile")}
            >
              <Smartphone className="w-4 h-4 mr-2" />
              Mobil
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className={cn("mx-auto transition-all duration-200", viewport === "mobile" ? "max-w-[390px]" : "max-w-full")}>
          <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
            <div className="relative">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleImageFileSelect(file);
                }}
                className="hidden"
              />

              {activeImageUrl ? (
                <div className="h-40">
                  <img
                    src={activeImageUrl}
                    alt={props.title || props.section || "preview"}
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <div className="h-32 bg-gradient-to-r from-primary/15 via-primary/5 to-background flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <ImagePlus className="w-6 h-6 mx-auto mb-1" />
                    <p className="text-xs">Görsel yok</p>
                  </div>
                </div>
              )}
              <div className="absolute left-3 top-3 rounded-full bg-background/90 px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                {props.section || "section.key"}
              </div>
              <div className="absolute right-3 top-3 flex flex-wrap items-center gap-1.5">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="h-7 bg-background/90 hover:bg-background"
                  onClick={() => setImageEditorOpen((prev) => !prev)}
                >
                  Düzenle
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="h-7 bg-background/90 hover:bg-background"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadMutation.isPending}
                >
                  {uploadMutation.isPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Upload className="w-3.5 h-3.5" />
                  )}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  className="h-7"
                  onClick={handleImageClear}
                  disabled={uploadMutation.isPending || !activeImageUrl}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
              {uploadMutation.isPending ? (
                <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                  <div className="flex items-center gap-2 rounded-md border bg-card px-3 py-2 text-sm">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Görsel yükleniyor...
                  </div>
                </div>
              ) : null}
            </div>

            <div className="space-y-3 p-4">
              {imageEditorOpen ? (
                <div className="rounded-md border bg-background/70 p-3 space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Görsel URL</p>
                  <div className="flex flex-col md:flex-row gap-2">
                    <Input
                      value={imageDraft}
                      onChange={(e) => setImageDraft(e.target.value)}
                      placeholder="https://..."
                    />
                    <div className="flex items-center gap-2">
                      <Button type="button" size="sm" onClick={handleImageApplyUrl}>
                        Uygula
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadMutation.isPending}
                      >
                        Dosya Seç
                      </Button>
                    </div>
                  </div>
                </div>
              ) : null}

              <h3 className="text-lg font-semibold text-foreground">
                {props.title || "Başlık önizlemesi"}
              </h3>
              {renderHtml(
                props.content || "Bu alanda section açıklaması veya ana metin görünür.",
                "text-sm text-muted-foreground",
              )}
              {quickPreviewRows.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                  {quickPreviewRows.map((row) => (
                    <div key={row.key} className="rounded-md border bg-background px-3 py-2">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{row.key}</p>
                      <p className="text-xs text-foreground truncate">{row.value || "-"}</p>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="space-y-4 rounded-lg border p-4">
          <p className="text-sm font-semibold">Temel Alanlar</p>

          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground">Başlık</p>
            <Input value={props.title} onChange={(e) => props.onTitleChange(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground">İçerik</p>
            {looksLikeHtml(props.content) ? (
              <div
                className="min-h-[120px] rounded-md border bg-background p-3 text-sm text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                contentEditable
                suppressContentEditableWarning
                onInput={(e) => props.onContentChange((e.currentTarget as HTMLDivElement).innerHTML)}
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(props.content) }}
              />
            ) : (
              <Textarea
                rows={5}
                value={props.content}
                onChange={(e) => props.onContentChange(e.target.value)}
              />
            )}
          </div>
        </div>

        <div className="space-y-4 rounded-lg border p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold">Metadata Alanları</p>
            <div className="flex items-center gap-2">
              <Input
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                placeholder="Yeni alan anahtarı"
                className="h-8 w-[170px]"
              />
              <Button type="button" variant="outline" size="sm" onClick={addTopLevelKey}>
                <Plus className="w-4 h-4 mr-1" />
                Alan Ekle
              </Button>
            </div>
          </div>

          {metadataEntries.length === 0 ? (
            <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
              Metadata alanı boş. Üstteki "Alan Ekle" ile yeni bir alan oluşturabilirsiniz.
            </div>
          ) : (
            <div className="space-y-3">
              {metadataEntries.map(([key, value]) => (
                <div key={key} className="space-y-1.5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {formatKey(key)}
                  </p>
                  {renderEditor(value, [key])}
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
