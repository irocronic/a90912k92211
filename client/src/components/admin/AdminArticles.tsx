import { useEffect, useMemo, useState } from "react";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "../../../../server/routers";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Edit2, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import ImageUpload from "@/components/ImageUpload";
import {
  ARTICLE_CONTENT_TRANSLATION_SECTION,
  getArticleTranslationKey,
  localizeArticle,
} from "@/lib/contentLocalization";

type RouterOutputs = inferRouterOutputs<AppRouter>;
type AdminArticle = RouterOutputs["admin"]["articles"]["list"][number];
type EditingLanguage = "tr" | "en";

type ArticleFormData = {
  title: string;
  excerpt: string;
  content: string;
  imageUrl: string;
  category: string;
  published: 0 | 1;
};

type ArticleTranslationPayload = {
  title: string;
  excerpt: string;
  content: string;
  imageUrl: string;
  category: string;
};

const EMPTY_FORM: ArticleFormData = {
  title: "",
  excerpt: "",
  content: "",
  imageUrl: "",
  category: "",
  published: 1,
};

function formFromArticle(article: AdminArticle): ArticleFormData {
  return {
    title: article.title,
    excerpt: article.excerpt,
    content: article.content,
    imageUrl: article.imageUrl || "",
    category: article.category,
    published: article.published ? 1 : 0,
  };
}

function formFromEnglishArticle(
  article: AdminArticle,
  rawStoredOverride?: string,
): ArticleFormData {
  const localized = localizeArticle(article, "en", rawStoredOverride);
  return {
    title: localized.title,
    excerpt: localized.excerpt,
    content: localized.content,
    imageUrl: localized.imageUrl || "",
    category: localized.category,
    published: article.published ? 1 : 0,
  };
}

function translationPayloadFromForm(formData: ArticleFormData): ArticleTranslationPayload {
  return {
    title: formData.title.trim(),
    excerpt: formData.excerpt.trim(),
    content: formData.content.trim(),
    imageUrl: formData.imageUrl || "",
    category: formData.category.trim(),
  };
}

export default function AdminArticles() {
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingLanguage, setEditingLanguage] = useState<EditingLanguage>("tr");
  const [formData, setFormData] = useState<ArticleFormData>(EMPTY_FORM);

  const { data: articles = [], isLoading, refetch } =
    trpc.admin.articles.list.useQuery();
  const createMutation = trpc.admin.articles.create.useMutation();
  const updateMutation = trpc.admin.articles.update.useMutation();
  const deleteMutation = trpc.admin.articles.delete.useMutation();

  const {
    data: englishArticleTranslations = {},
    refetch: refetchEnglishArticleTranslations,
  } = trpc.i18n.getSectionTranslations.useQuery({
    language: "en",
    section: ARTICLE_CONTENT_TRANSLATION_SECTION,
  });
  const updateTranslationMutation = trpc.i18n.updateTranslation.useMutation();
  const deleteTranslationMutation = trpc.i18n.deleteTranslation.useMutation();

  const editingArticle = useMemo(
    () => articles.find((article) => article.id === editingId),
    [articles, editingId],
  );
  const englishTranslationKey = editingId
    ? getArticleTranslationKey(editingId)
    : null;
  const hasEnglishOverride = Boolean(
    englishTranslationKey && englishArticleTranslations[englishTranslationKey],
  );

  const resetForm = () => {
    setEditingId(null);
    setEditingLanguage("tr");
    setFormData(EMPTY_FORM);
  };

  useEffect(() => {
    if (!isOpen || !editingArticle) return;

    if (editingLanguage === "en") {
      setFormData(
        formFromEnglishArticle(
          editingArticle,
          englishArticleTranslations[getArticleTranslationKey(editingArticle.id)],
        ),
      );
      return;
    }

    setFormData(formFromArticle(editingArticle));
  }, [isOpen, editingArticle, editingLanguage, englishArticleTranslations]);

  const openCreateDialog = () => {
    setEditingLanguage("tr");
    setEditingId(null);
    setFormData(EMPTY_FORM);
  };

  const openEditDialog = (article: AdminArticle) => {
    setEditingId(article.id);
    if (editingLanguage === "en") {
      setFormData(
        formFromEnglishArticle(
          article,
          englishArticleTranslations[getArticleTranslationKey(article.id)],
        ),
      );
    } else {
      setFormData(formFromArticle(article));
    }
    setIsOpen(true);
  };

  const handleSubmit = async () => {
    const payload = translationPayloadFromForm(formData);

    if (!payload.title || !payload.excerpt || !payload.content || !payload.category) {
      toast.error("Başlık, özet, içerik ve kategori zorunludur");
      return;
    }

    if (editingLanguage === "en") {
      if (!editingId) {
        toast.error("English çeviri için önce haberi Türkçe oluşturun");
        return;
      }

      try {
        await updateTranslationMutation.mutateAsync({
          key: getArticleTranslationKey(editingId),
          language: "en",
          section: ARTICLE_CONTENT_TRANSLATION_SECTION,
          value: JSON.stringify(payload),
        });
        toast.success("Haberin English çevirisi kaydedildi");
        await refetchEnglishArticleTranslations();
        setIsOpen(false);
        resetForm();
      } catch {
        toast.error("English çeviri kaydedilemedi");
      }
      return;
    }

    try {
      if (editingId) {
        await updateMutation.mutateAsync({
          id: editingId,
          title: payload.title,
          excerpt: payload.excerpt,
          content: payload.content,
          imageUrl: payload.imageUrl || undefined,
          category: payload.category,
          published: formData.published,
          publishedAt: formData.published ? new Date() : undefined,
        });
        toast.success("Haber güncellendi");
      } else {
        await createMutation.mutateAsync({
          title: payload.title,
          excerpt: payload.excerpt,
          content: payload.content,
          imageUrl: payload.imageUrl || undefined,
          category: payload.category,
          published: formData.published,
          publishedAt: formData.published ? new Date() : undefined,
        });
        toast.success("Haber oluşturuldu");
      }

      setIsOpen(false);
      resetForm();
      await refetch();
    } catch {
      toast.error("Hata oluştu");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync({ id });
      toast.success("Haber silindi");
      await refetch();
    } catch {
      toast.error("Silme hatası");
    }
  };

  const handleDeleteEnglishOverride = async () => {
    if (!editingId || !hasEnglishOverride) return;
    const approved = window.confirm("Bu haberin English çevirisini silmek istiyor musunuz?");
    if (!approved) return;

    try {
      await deleteTranslationMutation.mutateAsync({
        key: getArticleTranslationKey(editingId),
        section: ARTICLE_CONTENT_TRANSLATION_SECTION,
        language: "en",
      });
      toast.success("English çeviri silindi");
      await refetchEnglishArticleTranslations();
      if (editingArticle) {
        setFormData(formFromEnglishArticle(editingArticle));
      }
    } catch {
      toast.error("English çeviri silinemedi");
    }
  };

  const isSaving =
    createMutation.isPending ||
    updateMutation.isPending ||
    updateTranslationMutation.isPending;

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Haber Yönetimi</h2>
          <p className="text-sm text-muted-foreground">Toplam {articles.length} haber</p>
        </div>
        <Dialog
          open={isOpen}
          onOpenChange={(open) => {
            setIsOpen(open);
            if (!open) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="w-4 h-4 mr-2" />
              Yeni Haber
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? "Haberi Düzenle" : "Yeni Haber"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2 rounded-md border p-3">
                <div>
                  <p className="text-sm font-semibold">Düzenleme Dili</p>
                  <p className="text-xs text-muted-foreground">
                    {editingLanguage === "tr"
                      ? "Türkçe kayıt haberin ana verisini günceller."
                      : "English kayıt sadece çeviri katmanını günceller."}
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
              </div>

              {editingLanguage === "en" && !editingId ? (
                <p className="text-xs text-muted-foreground">
                  English çeviri için önce haberi Türkçe olarak oluşturun, sonra düzenle ekranından English sekmesine geçin.
                </p>
              ) : null}

              <Input
                placeholder="Başlık"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
              <Input
                placeholder="Kısa Özet"
                value={formData.excerpt}
                onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
              />
              <Textarea
                placeholder="İçerik"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={6}
              />
              <Input
                placeholder="Kategori"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              />
              <div>
                <label className="text-sm font-medium block mb-2">Haber Görseli</label>
                <ImageUpload
                  currentImageUrl={formData.imageUrl}
                  onImageUploaded={(url) => setFormData({ ...formData, imageUrl: url })}
                />
              </div>

              {editingLanguage === "tr" ? (
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={formData.published === 1}
                    onChange={(e) =>
                      setFormData({ ...formData, published: e.target.checked ? 1 : 0 })
                    }
                  />
                  Yayında (public sitede görünsün)
                </label>
              ) : null}

              {editingLanguage === "en" && editingId && hasEnglishOverride ? (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleDeleteEnglishOverride}
                  disabled={deleteTranslationMutation.isPending}
                >
                  {deleteTranslationMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Çeviri Siliniyor...
                    </>
                  ) : (
                    "English Çeviriyi Sil"
                  )}
                </Button>
              ) : null}

              <Button
                onClick={handleSubmit}
                disabled={isSaving || (editingLanguage === "en" && !editingId)}
                className="w-full"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Kaydediliyor...
                  </>
                ) : (
                  "Kaydet"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {articles.map((article) => (
          <Card key={article.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{article.title}</CardTitle>
                  <CardDescription>
                    {article.category} {article.published ? "• Yayında" : "• Taslak"}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(article)}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(article.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground line-clamp-2">{article.excerpt}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
