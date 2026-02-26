import { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit2, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/contexts/I18nContext";
import { useTheme } from "@/contexts/ThemeContext";

type TranslationEntry = {
  key: string;
  section: string;
  value_tr: string;
  value_en: string;
};

const DEFAULT_SECTIONS = [
  "common",
  "home",
  "products",
  "about",
  "contact",
  "navbar",
  "footer",
  "admin",
];

export default function AdminLocalization() {
  const { language, setLanguage } = useI18n();
  const { theme, setTheme } = useTheme();

  const [isOpen, setIsOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TranslationEntry | null>(null);
  const [sectionFilter, setSectionFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [formData, setFormData] = useState({
    key: "",
    section: "common",
    value_tr: "",
    value_en: "",
  });

  const queryInput = {
    section: sectionFilter === "all" ? undefined : sectionFilter,
    search: search.trim() || undefined,
  };

  const {
    data: entries = [],
    isLoading,
    refetch,
  } = trpc.i18n.listTranslationEntries.useQuery(queryInput);
  const updateMutation = trpc.i18n.updateTranslation.useMutation();
  const deleteMutation = trpc.i18n.deleteTranslation.useMutation();

  const sections = useMemo(() => {
    const set = new Set<string>(DEFAULT_SECTIONS);
    entries.forEach((entry) => set.add(entry.section));
    return Array.from(set).sort((a, b) => a.localeCompare(b, "tr"));
  }, [entries]);

  const resetForm = () => {
    setEditingEntry(null);
    setFormData({
      key: "",
      section: "common",
      value_tr: "",
      value_en: "",
    });
  };

  const handleEdit = (entry: TranslationEntry) => {
    setEditingEntry(entry);
    setFormData({
      key: entry.key,
      section: entry.section,
      value_tr: entry.value_tr,
      value_en: entry.value_en,
    });
    setIsOpen(true);
  };

  const handleSubmit = async () => {
    try {
      if (!formData.key.trim()) {
        toast.error("Anahtar boş olamaz");
        return;
      }

      if (!formData.section.trim()) {
        toast.error("Bölüm boş olamaz");
        return;
      }

      if (!formData.value_tr.trim() && !formData.value_en.trim()) {
        toast.error("En az bir dilde metin girmelisiniz");
        return;
      }

      await Promise.all([
        updateMutation.mutateAsync({
          key: formData.key.trim(),
          language: "tr",
          section: formData.section.trim(),
          value: formData.value_tr,
        }),
        updateMutation.mutateAsync({
          key: formData.key.trim(),
          language: "en",
          section: formData.section.trim(),
          value: formData.value_en,
        }),
      ]);

      toast.success(editingEntry ? "Çeviri güncellendi" : "Çeviri eklendi");
      setIsOpen(false);
      resetForm();
      await refetch();
    } catch (error) {
      toast.error("Çeviri kaydedilemedi");
    }
  };

  const handleDelete = async (entry: TranslationEntry) => {
    try {
      await deleteMutation.mutateAsync({
        key: entry.key,
        section: entry.section,
      });
      toast.success("Çeviri silindi");
      await refetch();
    } catch (error) {
      toast.error("Çeviri silinemedi");
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Tema Ayarları</CardTitle>
          <CardDescription>Uygulamanın görünümünü özelleştirin</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium block mb-2">Tema</label>
            <div className="flex gap-2">
              <Button
                variant={theme === "light" ? "default" : "outline"}
                onClick={() => setTheme("light")}
              >
                Aydınlık
              </Button>
              <Button
                variant={theme === "dark" ? "default" : "outline"}
                onClick={() => setTheme("dark")}
              >
                Koyu
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dil Ayarları</CardTitle>
          <CardDescription>Tercih edilen dili seçin</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium block mb-2">Dil</label>
            <div className="flex gap-2">
              <Button
                variant={language === "tr" ? "default" : "outline"}
                onClick={() => setLanguage("tr")}
              >
                Türkçe
              </Button>
              <Button
                variant={language === "en" ? "default" : "outline"}
                onClick={() => setLanguage("en")}
              >
                English
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Çeviri Yönetimi</CardTitle>
              <CardDescription>Site metinlerini listeleyin, düzenleyin, silin</CardDescription>
            </div>

            <Dialog
              open={isOpen}
              onOpenChange={(open) => {
                setIsOpen(open);
                if (!open) resetForm();
              }}
            >
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Plus className="w-4 h-4 mr-2" />
                  Yeni Çeviri
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingEntry ? "Çeviri Düzenle" : "Yeni Çeviri Ekle"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    placeholder="Anahtar (ör. navbar.products)"
                    value={formData.key}
                    onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                    disabled={Boolean(editingEntry)}
                  />

                  <Select
                    value={formData.section}
                    onValueChange={(value) => setFormData({ ...formData, section: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Bölüm seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {sections.map((section) => (
                        <SelectItem key={section} value={section}>
                          {section}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Textarea
                    placeholder="Türkçe metin"
                    value={formData.value_tr}
                    onChange={(e) => setFormData({ ...formData, value_tr: e.target.value })}
                    rows={3}
                  />

                  <Textarea
                    placeholder="İngilizce metin"
                    value={formData.value_en}
                    onChange={(e) => setFormData({ ...formData, value_en: e.target.value })}
                    rows={3}
                  />

                  <Button
                    onClick={handleSubmit}
                    disabled={updateMutation.isPending}
                    className="w-full"
                  >
                    {updateMutation.isPending ? (
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
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Anahtar/alan/metin ara"
            />

            <Select value={sectionFilter} onValueChange={setSectionFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Bölüm filtrele" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Bölümler</SelectItem>
                {sections.map((section) => (
                  <SelectItem key={section} value={section}>
                    {section}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="text-sm text-muted-foreground flex items-center justify-start md:justify-end">
              Toplam {entries.length} kayıt
            </div>
          </div>

          {isLoading ? (
            <div className="py-8 flex justify-center">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          ) : entries.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Kayıt bulunamadı.
            </div>
          ) : (
            <div className="space-y-2">
              {entries.map((entry) => (
                <div
                  key={`${entry.section}-${entry.key}`}
                  className="border rounded-md p-3 space-y-2"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-mono text-xs text-muted-foreground">{entry.section}</div>
                      <div className="font-medium break-all">{entry.key}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(entry)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(entry)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    <div className="bg-muted/40 rounded p-2">
                      <div className="text-xs text-muted-foreground mb-1">TR</div>
                      <div className="break-words">{entry.value_tr || "-"}</div>
                    </div>
                    <div className="bg-muted/40 rounded p-2">
                      <div className="text-xs text-muted-foreground mb-1">EN</div>
                      <div className="break-words">{entry.value_en || "-"}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
