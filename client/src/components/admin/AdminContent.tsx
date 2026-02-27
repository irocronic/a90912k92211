import { useEffect, useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { History, Loader2, Plus, RotateCcw, Upload } from "lucide-react";
import { toast } from "sonner";
import PageContentPreview from "./PageContentPreview";
import {
  PAGE_CONTENT_TEMPLATE_MAP,
  PAGE_CONTENT_TEMPLATES,
} from "@/lib/pageContentTemplates";
import {
  EN_PAGE_CONTENT_OVERRIDES,
  type PageContentOverride,
} from "@/lib/pageContentEnOverrides";
import {
  getPageContentTranslationKey,
  PAGE_CONTENT_TRANSLATION_SECTION,
} from "@/lib/pageContentTranslationKeys";

type FormState = {
  title: string;
  content: string;
  imageUrl: string;
  metadata: Record<string, unknown>;
};

type EditingLanguage = "tr" | "en";

const EMPTY_FORM: FormState = {
  title: "",
  content: "",
  imageUrl: "",
  metadata: {},
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function deepMerge(base: unknown, override: unknown): unknown {
  if (override === undefined) return base;
  if (base === undefined) return override;

  if (Array.isArray(override)) return override;
  if (isRecord(base) && isRecord(override)) {
    const merged: Record<string, unknown> = { ...base };
    const keys = new Set([...Object.keys(base), ...Object.keys(override)]);
    keys.forEach((key) => {
      merged[key] = deepMerge(base[key], override[key]);
    });
    return merged;
  }
  return override;
}

function normalizeMetadata(value: unknown): Record<string, unknown> {
  if (!isRecord(value)) return {};
  return value;
}

function formFromTemplate(section: string): FormState {
  const template = PAGE_CONTENT_TEMPLATE_MAP[section];
  return {
    title: template?.title || "",
    content: template?.content || "",
    imageUrl: template?.imageUrl || "",
    metadata: normalizeMetadata(template?.metadata),
  };
}

function applyFormOverride(
  base: FormState,
  override?: Partial<FormState> | PageContentOverride,
): FormState {
  if (!override) return base;
  return {
    title: typeof override.title === "string" ? override.title : base.title,
    content: typeof override.content === "string" ? override.content : base.content,
    imageUrl:
      typeof override.imageUrl === "string" ? override.imageUrl : base.imageUrl,
    metadata: deepMerge(
      base.metadata,
      isRecord(override.metadata) ? override.metadata : {},
    ) as Record<string, unknown>,
  };
}

function parseEnglishOverride(
  rawValue?: string,
): Partial<FormState> | undefined {
  if (!rawValue) return undefined;
  try {
    const parsed = JSON.parse(rawValue);
    if (!isRecord(parsed)) return undefined;
    return {
      title: typeof parsed.title === "string" ? parsed.title : undefined,
      content: typeof parsed.content === "string" ? parsed.content : undefined,
      imageUrl: typeof parsed.imageUrl === "string" ? parsed.imageUrl : undefined,
      metadata: normalizeMetadata(parsed.metadata),
    };
  } catch {
    return undefined;
  }
}

function formatDateTime(value: Date | string | null | undefined): string {
  if (!value) return "-";
  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleString("tr-TR");
}

function statusLabel(status: "draft" | "published" | "archived") {
  if (status === "draft") return "Taslak";
  if (status === "published") return "Yayında";
  return "Arşiv";
}

function statusVariant(status: "draft" | "published" | "archived") {
  if (status === "published") return "default" as const;
  if (status === "draft") return "secondary" as const;
  return "outline" as const;
}

export default function AdminContent() {
  const [selectedSection, setSelectedSection] = useState("");
  const [newSection, setNewSection] = useState("");
  const [formData, setFormData] = useState<FormState>(EMPTY_FORM);
  const [editingLanguage, setEditingLanguage] = useState<EditingLanguage>("tr");
  const [rollbackRevisionId, setRollbackRevisionId] = useState<string | null>(null);

  const {
    data: sections = [],
    isLoading,
    refetch,
  } = trpc.admin.pageContent.list.useQuery();
  const updateMutation = trpc.admin.pageContent.update.useMutation();
  const publishMutation = trpc.admin.pageContent.publish.useMutation();
  const rollbackMutation = trpc.admin.pageContent.rollback.useMutation();
  const deleteMutation = trpc.admin.pageContent.delete.useMutation();

  const {
    data: revisions = [],
    isLoading: revisionsLoading,
    refetch: refetchRevisions,
  } = trpc.admin.pageContent.revisions.useQuery(
    { section: selectedSection, limit: 30 },
    {
      enabled: editingLanguage === "tr" && Boolean(selectedSection),
    },
  );

  const {
    data: englishPageContentTranslations = {},
    refetch: refetchEnglishPageContentTranslations,
  } = trpc.i18n.getSectionTranslations.useQuery({
    language: "en",
    section: PAGE_CONTENT_TRANSLATION_SECTION,
  });
  const updateTranslationMutation = trpc.i18n.updateTranslation.useMutation();
  const deleteTranslationMutation = trpc.i18n.deleteTranslation.useMutation();

  const sectionNames = useMemo(
    () =>
      Array.from(
        new Set([
          ...sections.map((item) => item.section).filter(Boolean),
          ...PAGE_CONTENT_TEMPLATES.map((item) => item.section),
        ]),
      ).sort((a, b) => a.localeCompare(b, "tr")),
    [sections],
  );

  useEffect(() => {
    if (!selectedSection && sectionNames.length > 0) {
      setSelectedSection(sectionNames[0]);
    }
  }, [selectedSection, sectionNames]);

  const selectedSectionItem = useMemo(
    () => sections.find((item) => item.section === selectedSection),
    [sections, selectedSection],
  );

  const selectedTranslationKey = useMemo(
    () => getPageContentTranslationKey(selectedSection),
    [selectedSection],
  );

  const selectedEnglishOverride = useMemo(
    () =>
      parseEnglishOverride(
        englishPageContentTranslations[selectedTranslationKey],
      ),
    [englishPageContentTranslations, selectedTranslationKey],
  );

  const hasSelectedEnglishOverride = Boolean(
    englishPageContentTranslations[selectedTranslationKey],
  );

  useEffect(() => {
    if (!selectedSection) return;

    const trSource = selectedSectionItem?.draft ?? selectedSectionItem?.published;
    const baseForm: FormState = trSource
      ? {
          title: trSource.title || "",
          content: trSource.content || "",
          imageUrl: trSource.imageUrl || "",
          metadata: normalizeMetadata(trSource.metadata),
        }
      : formFromTemplate(selectedSection);

    if (editingLanguage === "tr") {
      setFormData(baseForm);
      return;
    }

    const withStaticEnglish = applyFormOverride(
      baseForm,
      EN_PAGE_CONTENT_OVERRIDES[selectedSection],
    );
    const withStoredEnglish = applyFormOverride(
      withStaticEnglish,
      selectedEnglishOverride,
    );
    setFormData(withStoredEnglish);
  }, [
    selectedSection,
    selectedSectionItem,
    editingLanguage,
    selectedEnglishOverride,
  ]);

  const currentSectionExists = Boolean(
    selectedSectionItem?.published ||
      selectedSectionItem?.draft ||
      selectedSectionItem?.latestPublishedRevision,
  );

  const currentDraft = selectedSectionItem?.draft ?? null;
  const currentPublishedRevision = selectedSectionItem?.latestPublishedRevision ?? null;

  const handleCreateSection = () => {
    const section = newSection.trim();
    if (!section) {
      toast.error("Yeni bölüm adı gerekli");
      return;
    }
    setSelectedSection(section);
    setNewSection("");
  };

  const handleSubmit = async () => {
    const section = selectedSection.trim();
    if (!section) {
      toast.error("Bölüm seçin");
      return;
    }

    if (!formData.content.trim()) {
      toast.error("İçerik boş olamaz");
      return;
    }

    if (editingLanguage === "en") {
      try {
        const payload = {
          title: formData.title || "",
          content: formData.content,
          imageUrl: formData.imageUrl || "",
          metadata: formData.metadata,
        };

        await updateTranslationMutation.mutateAsync({
          key: getPageContentTranslationKey(section),
          section: PAGE_CONTENT_TRANSLATION_SECTION,
          language: "en",
          value: JSON.stringify(payload),
        });

        toast.success("English içerik kaydedildi");
        await refetchEnglishPageContentTranslations();
      } catch {
        toast.error("English içerik kaydedilemedi");
      }
      return;
    }

    try {
      const parsedMetadata =
        Object.keys(formData.metadata).length > 0 ? formData.metadata : undefined;

      await updateMutation.mutateAsync({
        section,
        title: formData.title || undefined,
        content: formData.content,
        imageUrl: formData.imageUrl || undefined,
        metadata: parsedMetadata,
      });
      toast.success("Taslak kaydedildi");
      await Promise.all([refetch(), refetchRevisions()]);
    } catch {
      toast.error("Taslak kaydedilemedi");
    }
  };

  const handlePublish = async () => {
    const section = selectedSection.trim();
    if (!section) {
      toast.error("Bölüm seçin");
      return;
    }

    if (!formData.content.trim()) {
      toast.error("İçerik boş olamaz");
      return;
    }

    try {
      const parsedMetadata =
        Object.keys(formData.metadata).length > 0 ? formData.metadata : undefined;

      await updateMutation.mutateAsync({
        section,
        title: formData.title || undefined,
        content: formData.content,
        imageUrl: formData.imageUrl || undefined,
        metadata: parsedMetadata,
      });

      await publishMutation.mutateAsync({ section });
      toast.success("İçerik yayınlandı");
      await Promise.all([refetch(), refetchRevisions()]);
    } catch {
      toast.error("Yayınlama başarısız");
    }
  };

  const handleRollback = async (revisionId: string, revisionNumber: number) => {
    const section = selectedSection.trim();
    if (!section) return;

    const approved = window.confirm(
      `r${revisionNumber} revizyonuna geri dönmek istiyor musunuz? Bu işlem içeriği anında yayınlar.`,
    );
    if (!approved) return;

    try {
      setRollbackRevisionId(revisionId);
      await rollbackMutation.mutateAsync({ section, revisionId });
      toast.success(`r${revisionNumber} revizyonuna geri alındı`);
      await Promise.all([refetch(), refetchRevisions()]);
    } catch {
      toast.error("Rollback başarısız");
    } finally {
      setRollbackRevisionId(null);
    }
  };

  const handleDelete = async () => {
    const section = selectedSection.trim();
    if (!section) return;

    if (editingLanguage === "en") {
      if (!hasSelectedEnglishOverride) {
        toast.error("Bu bölüm için English override bulunamadı");
        return;
      }

      const approved = window.confirm(
        `"${section}" bölümü için English override silinsin mi?`,
      );
      if (!approved) return;

      try {
        await deleteTranslationMutation.mutateAsync({
          key: getPageContentTranslationKey(section),
          section: PAGE_CONTENT_TRANSLATION_SECTION,
          language: "en",
        });
        toast.success("English override silindi");
        await refetchEnglishPageContentTranslations();
      } catch {
        toast.error("English override silinemedi");
      }
      return;
    }

    if (!currentSectionExists) {
      toast.error("Bu bölüm veritabanında kayıtlı değil");
      return;
    }

    const approved = window.confirm(
      `"${section}" bölümünü (yayın + revizyonlar) silmek istiyor musunuz?`,
    );
    if (!approved) return;

    try {
      await deleteMutation.mutateAsync({ section });
      toast.success("Bölüm silindi");
      await refetch();

      const remaining = sectionNames.filter((item) => item !== section);
      setSelectedSection(remaining[0] || "");
      setFormData(remaining[0] ? formFromTemplate(remaining[0]) : EMPTY_FORM);
    } catch {
      toast.error("Bölüm silinemedi");
    }
  };

  const previewSavePending =
    editingLanguage === "en"
      ? updateTranslationMutation.isPending
      : updateMutation.isPending;
  const previewDeletePending =
    editingLanguage === "en"
      ? deleteTranslationMutation.isPending
      : deleteMutation.isPending;
  const previewCanDelete =
    editingLanguage === "en"
      ? Boolean(selectedSection) && hasSelectedEnglishOverride
      : currentSectionExists && Boolean(selectedSection);

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)] gap-6">
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Bölümler</CardTitle>
            <CardDescription>Tüm içerik section'ları</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {sectionNames.length === 0 ? (
              <p className="text-sm text-muted-foreground">Henüz bölüm yok</p>
            ) : (
              sectionNames.map((section) => (
                <Button
                  key={section}
                  variant={selectedSection === section ? "default" : "outline"}
                  className="w-full justify-start text-left break-all whitespace-normal h-auto py-2"
                  onClick={() => setSelectedSection(section)}
                >
                  {section}
                </Button>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Yeni Bölüm</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Input
              placeholder="ör. home.hero"
              value={newSection}
              onChange={(e) => setNewSection(e.target.value)}
            />
            <Button onClick={handleCreateSection} className="w-full" variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Bölüm Oluştur
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Hazır Şablonlar</CardTitle>
            <CardDescription>Sık kullanılan section başlangıçları</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 max-h-[260px] overflow-auto">
            {PAGE_CONTENT_TEMPLATES.map((template) => (
              <Button
                key={template.section}
                variant="outline"
                className="w-full justify-start text-left break-all whitespace-normal h-auto py-2"
                onClick={() => setSelectedSection(template.section)}
              >
                {template.label}
              </Button>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        <Card>
          <CardContent className="pt-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">Düzenleme Dili</p>
              <p className="text-xs text-muted-foreground">
                {editingLanguage === "tr"
                  ? "TR akışında kaydetme taslak oluşturur, yayınlama ayrı aksiyondur."
                  : "EN modunda sadece English override kaydedilir ve canlı EN görünümünü etkiler."}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant={editingLanguage === "tr" ? "default" : "outline"}
                onClick={() => setEditingLanguage("tr")}
              >
                Türkçe
              </Button>
              <Button
                type="button"
                size="sm"
                variant={editingLanguage === "en" ? "default" : "outline"}
                onClick={() => setEditingLanguage("en")}
              >
                English
              </Button>
            </div>
          </CardContent>
        </Card>

        {editingLanguage === "tr" ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Yayın Yönetimi</CardTitle>
              <CardDescription>
                Taslağı kaydetmek için "Kaydet", canlıya almak için "Yayınla" kullanın.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                <div className="rounded-md border p-3">
                  <p className="text-muted-foreground mb-1">Aktif Taslak</p>
                  {currentDraft ? (
                    <>
                      <p className="font-medium">r{currentDraft.revisionNumber}</p>
                      <p className="text-muted-foreground">
                        {formatDateTime(currentDraft.updatedAt)}
                      </p>
                    </>
                  ) : (
                    <p className="text-muted-foreground">Taslak yok</p>
                  )}
                </div>
                <div className="rounded-md border p-3">
                  <p className="text-muted-foreground mb-1">Yayındaki Revizyon</p>
                  {currentPublishedRevision ? (
                    <>
                      <p className="font-medium">r{currentPublishedRevision.revisionNumber}</p>
                      <p className="text-muted-foreground">
                        {formatDateTime(currentPublishedRevision.publishedAt)}
                      </p>
                    </>
                  ) : (
                    <p className="text-muted-foreground">Yayın kaydı yok</p>
                  )}
                </div>
              </div>

              <Button
                type="button"
                onClick={handlePublish}
                disabled={publishMutation.isPending || updateMutation.isPending}
                className="w-full"
              >
                {publishMutation.isPending || updateMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Yayınlanıyor...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Yayınla
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ) : null}

        <PageContentPreview
          section={selectedSection}
          title={formData.title}
          content={formData.content}
          imageUrl={formData.imageUrl}
          metadata={formData.metadata}
          onTitleChange={(value) =>
            setFormData((prev) => ({ ...prev, title: value }))
          }
          onContentChange={(value) =>
            setFormData((prev) => ({ ...prev, content: value }))
          }
          onImageUrlChange={(value) =>
            setFormData((prev) => ({ ...prev, imageUrl: value }))
          }
          onMetadataChange={(value) =>
            setFormData((prev) => ({ ...prev, metadata: value }))
          }
          onSave={handleSubmit}
          onDelete={handleDelete}
          savePending={previewSavePending}
          deletePending={previewDeletePending}
          canDelete={previewCanDelete}
        />

        {editingLanguage === "tr" ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <History className="w-4 h-4" />
                Revizyon Geçmişi
              </CardTitle>
              <CardDescription>
                İstediğiniz revizyona geri alabilirsiniz. Rollback işlemi seçili revizyonu canlıya yayınlar.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {revisionsLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin" />
                </div>
              ) : revisions.length === 0 ? (
                <p className="text-sm text-muted-foreground">Henüz revizyon kaydı yok</p>
              ) : (
                <div className="space-y-2 max-h-[320px] overflow-auto">
                  {revisions.map((revision) => (
                    <div
                      key={revision.id}
                      className="rounded-md border p-3 flex flex-wrap items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold">r{revision.revisionNumber}</p>
                          <Badge variant={statusVariant(revision.status)}>
                            {statusLabel(revision.status)}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {formatDateTime(revision.updatedAt)}
                        </p>
                        {revision.rolledBackFromRevisionId ? (
                          <p className="text-xs text-muted-foreground">
                            Rollback kaynağı: {revision.rolledBackFromRevisionId}
                          </p>
                        ) : null}
                      </div>

                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          handleRollback(revision.id, revision.revisionNumber)
                        }
                        disabled={
                          rollbackMutation.isPending ||
                          revision.id === currentPublishedRevision?.id
                        }
                      >
                        {rollbackMutation.isPending &&
                        rollbackRevisionId === revision.id ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Uygulanıyor...
                          </>
                        ) : (
                          <>
                            <RotateCcw className="w-4 h-4 mr-2" />
                            Rollback
                          </>
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
