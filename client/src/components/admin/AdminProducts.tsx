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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { toDisplayProduct } from "@/lib/contentProducts";
import {
  getProductTranslationKey,
  localizeDisplayProduct,
  PRODUCT_CONTENT_TRANSLATION_SECTION,
} from "@/lib/contentLocalization";
import {
  createEmptyCategory,
  createEmptySubcategory,
  findCategoryByLabel,
  findSubcategoryByLabel,
  getCategoryName,
  getSubcategoryName,
  mergeTaxonomyWithProducts,
  parseProductTaxonomy,
  PRODUCT_TAXONOMY_SETTING_KEY,
  serializeProductTaxonomy,
  type ProductTaxonomy,
} from "@/lib/productTaxonomy";

type RouterOutputs = inferRouterOutputs<AppRouter>;
type AdminProduct = RouterOutputs["admin"]["products"]["list"][number];
type EditingLanguage = "tr" | "en";

type ProductFormData = {
  title: string;
  subtitle: string;
  category: string;
  subcategory: string;
  description: string;
  imageUrl: string;
  catalogUrl: string;
  oemCodesText: string;
  featuresText: string;
  specificationsText: string;
  applicationsText: string;
  certificationsText: string;
};

type ProductPayload = {
  title: string;
  subtitle: string;
  category: string;
  subcategory: string;
  description: string;
  imageUrl?: string;
  catalogUrl?: string;
  oemCodes: Array<{ manufacturer: string; codes: string[] }>;
  features: string[];
  specifications: Record<string, string>;
  applications: string[];
  certifications: string[];
};

type SubcategoryDraftState = Record<string, { nameTr: string; nameEn: string }>;

const EMPTY_FORM: ProductFormData = {
  title: "",
  subtitle: "",
  category: "",
  subcategory: "",
  description: "",
  imageUrl: "",
  catalogUrl: "",
  oemCodesText: "",
  featuresText: "",
  specificationsText: "",
  applicationsText: "",
  certificationsText: "",
};

function parseLines(value: string): string[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function parseSpecifications(value: string): Record<string, string> {
  const result: Record<string, string> = {};
  value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .forEach((line) => {
      const [label, ...rest] = line.split(":");
      const key = label?.trim();
      const val = rest.join(":").trim();
      if (key && val) result[key] = val;
    });
  return result;
}

function parseOemCodes(value: string): Array<{ manufacturer: string; codes: string[] }> {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [manufacturerRaw, ...codesRaw] = line.split(":");
      const manufacturer = manufacturerRaw?.trim();
      const codes = codesRaw
        .join(":")
        .split(",")
        .map((code) => code.trim())
        .filter(Boolean);

      if (!manufacturer) return null;
      return { manufacturer, codes };
    })
    .filter((item): item is { manufacturer: string; codes: string[] } => Boolean(item));
}

function serializeOemCodes(values: Array<{ manufacturer: string; codes: string[] }>): string {
  return values.map((item) => `${item.manufacturer}: ${item.codes.join(", ")}`).join("\n");
}

function serializeSpecifications(values: Record<string, string>): string {
  return Object.entries(values)
    .map(([label, value]) => `${label}: ${value}`)
    .join("\n");
}

function serializeDisplaySpecifications(
  values: Array<{ label: string; value: string }>,
): string {
  return values.map((item) => `${item.label}: ${item.value}`).join("\n");
}

function formFromProduct(product: AdminProduct): ProductFormData {
  return {
    title: product.title,
    subtitle: product.subtitle,
    category: product.category,
    subcategory: product.subcategory || "",
    description: product.description,
    imageUrl: product.imageUrl || "",
    catalogUrl: product.catalogUrl || "",
    oemCodesText: serializeOemCodes(product.oemCodes),
    featuresText: product.features.join("\n"),
    specificationsText: serializeSpecifications(product.specifications),
    applicationsText: product.applications.join("\n"),
    certificationsText: product.certifications.join("\n"),
  };
}

function formFromEnglishProduct(
  product: AdminProduct,
  taxonomy: ProductTaxonomy,
  rawStoredOverride?: string,
): ProductFormData {
  const localized = localizeDisplayProduct(
    toDisplayProduct(product),
    "en",
    rawStoredOverride,
  );
  const categoryNode = findCategoryByLabel(taxonomy, product.category);
  const subcategoryNode =
    categoryNode && product.subcategory
      ? findSubcategoryByLabel(categoryNode, product.subcategory)
      : null;

  return {
    title: localized.title,
    subtitle: localized.subtitle,
    category:
      categoryNode?.nameEn ||
      localized.category,
    subcategory:
      subcategoryNode?.nameEn ||
      localized.subcategory ||
      "",
    description: localized.description,
    imageUrl: localized.image || "",
    catalogUrl: localized.catalogUrl || "",
    oemCodesText: serializeOemCodes(localized.oemCodes),
    featuresText: localized.features.join("\n"),
    specificationsText: serializeDisplaySpecifications(localized.specifications),
    applicationsText: localized.applications.join("\n"),
    certificationsText: localized.certifications.join("\n"),
  };
}

function payloadFromForm(formData: ProductFormData): ProductPayload {
  return {
    title: formData.title.trim(),
    subtitle: formData.subtitle.trim(),
    category: formData.category.trim(),
    subcategory: formData.subcategory.trim(),
    description: formData.description.trim(),
    imageUrl: formData.imageUrl || undefined,
    catalogUrl: formData.catalogUrl || undefined,
    oemCodes: parseOemCodes(formData.oemCodesText),
    features: parseLines(formData.featuresText),
    specifications: parseSpecifications(formData.specificationsText),
    applications: parseLines(formData.applicationsText),
    certifications: parseLines(formData.certificationsText),
  };
}

export default function AdminProducts() {
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingLanguage, setEditingLanguage] = useState<EditingLanguage>("tr");
  const [formData, setFormData] = useState<ProductFormData>(EMPTY_FORM);
  const [taxonomyDraft, setTaxonomyDraft] = useState<ProductTaxonomy>([]);
  const [taxonomyDirty, setTaxonomyDirty] = useState(false);
  const [newCategoryTr, setNewCategoryTr] = useState("");
  const [newCategoryEn, setNewCategoryEn] = useState("");
  const [subcategoryDrafts, setSubcategoryDrafts] = useState<SubcategoryDraftState>(
    {},
  );

  const { data: products = [], isLoading, refetch } =
    trpc.admin.products.list.useQuery();
  const { data: settings = [], refetch: refetchSettings } =
    trpc.admin.settings.list.useQuery();
  const createMutation = trpc.admin.products.create.useMutation();
  const updateMutation = trpc.admin.products.update.useMutation();
  const deleteMutation = trpc.admin.products.delete.useMutation();
  const setSettingMutation = trpc.admin.settings.set.useMutation();

  const {
    data: englishProductTranslations = {},
    refetch: refetchEnglishProductTranslations,
  } = trpc.i18n.getSectionTranslations.useQuery({
    language: "en",
    section: PRODUCT_CONTENT_TRANSLATION_SECTION,
  });
  const updateTranslationMutation = trpc.i18n.updateTranslation.useMutation();
  const deleteTranslationMutation = trpc.i18n.deleteTranslation.useMutation();

  const taxonomySetting = useMemo(
    () => settings.find((item) => item.key === PRODUCT_TAXONOMY_SETTING_KEY),
    [settings],
  );
  const mergedTaxonomy = useMemo(() => {
    let rawValue: unknown = undefined;
    if (taxonomySetting?.type === "json") {
      try {
        rawValue = JSON.parse(taxonomySetting.value);
      } catch {
        rawValue = undefined;
      }
    }
    return mergeTaxonomyWithProducts(parseProductTaxonomy(rawValue), products);
  }, [taxonomySetting, products]);

  useEffect(() => {
    if (taxonomyDirty) return;
    setTaxonomyDraft(mergedTaxonomy);
  }, [mergedTaxonomy, taxonomyDirty]);

  const selectedCategoryNode = useMemo(
    () => findCategoryByLabel(taxonomyDraft, formData.category),
    [taxonomyDraft, formData.category],
  );
  const selectedSubcategoryNode = useMemo(() => {
    if (!selectedCategoryNode) return null;
    return findSubcategoryByLabel(selectedCategoryNode, formData.subcategory);
  }, [selectedCategoryNode, formData.subcategory]);
  const availableSubcategories = selectedCategoryNode
    ? selectedCategoryNode.subcategories
    : [];

  const editingProduct = useMemo(
    () => products.find((product) => product.id === editingId),
    [products, editingId],
  );
  const englishTranslationKey = editingId
    ? getProductTranslationKey(editingId)
    : null;
  const hasEnglishOverride = Boolean(
    englishTranslationKey && englishProductTranslations[englishTranslationKey],
  );

  const resetForm = () => {
    setFormData(EMPTY_FORM);
    setEditingId(null);
    setEditingLanguage("tr");
  };

  useEffect(() => {
    if (!isOpen || !editingProduct) return;

    if (editingLanguage === "en") {
      setFormData(
        formFromEnglishProduct(
          editingProduct,
          taxonomyDraft,
          englishProductTranslations[getProductTranslationKey(editingProduct.id)],
        ),
      );
      return;
    }

    setFormData(formFromProduct(editingProduct));
  }, [
    isOpen,
    editingProduct,
    editingLanguage,
    englishProductTranslations,
    taxonomyDraft,
  ]);

  const openCreateDialog = () => {
    setEditingLanguage("tr");
    setEditingId(null);
    setFormData(EMPTY_FORM);
  };

  const openEditDialog = (product: AdminProduct) => {
    setEditingId(product.id);
    if (editingLanguage === "en") {
      setFormData(
        formFromEnglishProduct(
          product,
          taxonomyDraft,
          englishProductTranslations[getProductTranslationKey(product.id)],
        ),
      );
    } else {
      setFormData(formFromProduct(product));
    }
    setIsOpen(true);
  };

  const categoryOptions = useMemo(
    () =>
      taxonomyDraft.map((item) => ({
        id: item.id,
        label: getCategoryName(item, editingLanguage),
      })),
    [taxonomyDraft, editingLanguage],
  );

  const selectedCategoryValue = selectedCategoryNode?.id;
  const selectedSubcategoryValue = selectedSubcategoryNode?.id;

  const handleCategoryChange = (categoryId: string) => {
    const category = taxonomyDraft.find((item) => item.id === categoryId);
    if (!category) return;
    setFormData((prev) => ({
      ...prev,
      category: getCategoryName(category, editingLanguage),
      subcategory: "",
    }));
  };

  const handleSubcategoryChange = (subcategoryId: string) => {
    if (!selectedCategoryNode) return;
    const subcategory = selectedCategoryNode.subcategories.find(
      (item) => item.id === subcategoryId,
    );
    if (!subcategory) return;
    setFormData((prev) => ({
      ...prev,
      subcategory: getSubcategoryName(subcategory, editingLanguage),
    }));
  };

  const handleCategoryNameChange = (
    categoryId: string,
    field: "nameTr" | "nameEn",
    value: string,
  ) => {
    setTaxonomyDirty(true);
    setTaxonomyDraft((prev) =>
      prev.map((item) =>
        item.id === categoryId ? { ...item, [field]: value } : item,
      ),
    );
  };

  const handleDeleteCategory = (categoryId: string) => {
    setTaxonomyDirty(true);
    setTaxonomyDraft((prev) => prev.filter((item) => item.id !== categoryId));
  };

  const handleAddCategory = () => {
    const categoryTr = newCategoryTr.trim();
    const categoryEn = newCategoryEn.trim();
    if (!categoryTr && !categoryEn) {
      toast.error("Kategori için TR veya EN isim girin");
      return;
    }

    const category = createEmptyCategory(categoryTr, categoryEn);
    setTaxonomyDirty(true);
    setTaxonomyDraft((prev) => {
      const exists = prev.some(
        (item) =>
          item.nameTr === category.nameTr ||
          item.nameEn === category.nameEn ||
          item.id === category.id,
      );
      if (exists) {
        toast.error("Bu kategori zaten mevcut");
        return prev;
      }

      return [...prev, category].sort((a, b) =>
        a.nameTr.localeCompare(b.nameTr, "tr"),
      );
    });
    setNewCategoryTr("");
    setNewCategoryEn("");
  };

  const handleSubcategoryDraftChange = (
    categoryId: string,
    field: "nameTr" | "nameEn",
    value: string,
  ) => {
    setSubcategoryDrafts((prev) => ({
      ...prev,
      [categoryId]: {
        nameTr: prev[categoryId]?.nameTr || "",
        nameEn: prev[categoryId]?.nameEn || "",
        [field]: value,
      },
    }));
  };

  const handleAddSubcategory = (categoryId: string) => {
    const draft = subcategoryDrafts[categoryId] || { nameTr: "", nameEn: "" };
    const nameTr = draft.nameTr.trim();
    const nameEn = draft.nameEn.trim();
    if (!nameTr && !nameEn) {
      toast.error("Alt kategori için TR veya EN isim girin");
      return;
    }

    setTaxonomyDirty(true);
    setTaxonomyDraft((prev) =>
      prev.map((category) => {
        if (category.id !== categoryId) return category;

        const subcategory = createEmptySubcategory(categoryId, nameTr, nameEn);
        const exists = category.subcategories.some(
          (item) =>
            item.nameTr === subcategory.nameTr ||
            item.nameEn === subcategory.nameEn ||
            item.id === subcategory.id,
        );
        if (exists) {
          toast.error("Bu alt kategori zaten mevcut");
          return category;
        }

        return {
          ...category,
          subcategories: [...category.subcategories, subcategory].sort((a, b) =>
            a.nameTr.localeCompare(b.nameTr, "tr"),
          ),
        };
      }),
    );

    setSubcategoryDrafts((prev) => ({
      ...prev,
      [categoryId]: { nameTr: "", nameEn: "" },
    }));
  };

  const handleSubcategoryNameChange = (
    categoryId: string,
    subcategoryId: string,
    field: "nameTr" | "nameEn",
    value: string,
  ) => {
    setTaxonomyDirty(true);
    setTaxonomyDraft((prev) =>
      prev.map((category) => {
        if (category.id !== categoryId) return category;
        return {
          ...category,
          subcategories: category.subcategories.map((subcategory) =>
            subcategory.id === subcategoryId
              ? { ...subcategory, [field]: value }
              : subcategory,
          ),
        };
      }),
    );
  };

  const handleDeleteSubcategory = (categoryId: string, subcategoryId: string) => {
    setTaxonomyDirty(true);
    setTaxonomyDraft((prev) =>
      prev.map((category) => {
        if (category.id !== categoryId) return category;
        return {
          ...category,
          subcategories: category.subcategories.filter(
            (subcategory) => subcategory.id !== subcategoryId,
          ),
        };
      }),
    );
  };

  const handleSaveTaxonomy = async () => {
    try {
      await setSettingMutation.mutateAsync({
        key: PRODUCT_TAXONOMY_SETTING_KEY,
        value: serializeProductTaxonomy(taxonomyDraft),
        type: "json",
      });
      setTaxonomyDirty(false);
      await refetchSettings();
      toast.success("Kategori yapısı kaydedildi");
    } catch {
      toast.error("Kategori yapısı kaydedilemedi");
    }
  };

  const handleSubmit = async () => {
    const payload = payloadFromForm(formData);

    if (
      !payload.title ||
      !payload.subtitle ||
      !payload.category ||
      !payload.subcategory ||
      !payload.description
    ) {
      toast.error("Başlık, alt başlık, kategori, alt kategori ve açıklama zorunludur");
      return;
    }

    if (editingLanguage === "en") {
      if (!editingId) {
        toast.error("English çeviri için önce ürünü Türkçe oluşturun");
        return;
      }

      try {
        await updateTranslationMutation.mutateAsync({
          key: getProductTranslationKey(editingId),
          language: "en",
          section: PRODUCT_CONTENT_TRANSLATION_SECTION,
          value: JSON.stringify(payload),
        });
        toast.success("Ürünün English çevirisi kaydedildi");
        await refetchEnglishProductTranslations();
        setIsOpen(false);
        resetForm();
      } catch {
        toast.error("English çeviri kaydedilemedi");
      }
      return;
    }

    try {
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, ...payload });
        toast.success("Ürün güncellendi");
      } else {
        await createMutation.mutateAsync(payload);
        toast.success("Ürün oluşturuldu");
      }

      setIsOpen(false);
      resetForm();
      await refetch();
    } catch {
      toast.error("Ürün kaydedilemedi");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync({ id });
      toast.success("Ürün silindi");
      await refetch();
    } catch {
      toast.error("Ürün silinemedi");
    }
  };

  const handleDeleteEnglishOverride = async () => {
    if (!editingId || !hasEnglishOverride) return;
    const approved = window.confirm("Bu ürünün English çevirisini silmek istiyor musunuz?");
    if (!approved) return;

    try {
      await deleteTranslationMutation.mutateAsync({
        key: getProductTranslationKey(editingId),
        section: PRODUCT_CONTENT_TRANSLATION_SECTION,
        language: "en",
      });
      toast.success("English çeviri silindi");
      await refetchEnglishProductTranslations();
      if (editingProduct) {
        setFormData(formFromEnglishProduct(editingProduct, taxonomyDraft));
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
          <h2 className="text-2xl font-bold">Ürün Yönetimi</h2>
          <p className="text-sm text-muted-foreground">Toplam {products.length} ürün</p>
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
              Yeni Ürün
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? "Ürünü Düzenle" : "Yeni Ürün"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2 rounded-md border p-3">
                <div>
                  <p className="text-sm font-semibold">Düzenleme Dili</p>
                  <p className="text-xs text-muted-foreground">
                    {editingLanguage === "tr"
                      ? "Türkçe kayıt ürünün ana verisini günceller."
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
                  English çeviri için önce ürünü Türkçe olarak oluşturun, sonra düzenle ekranından English sekmesine geçin.
                </p>
              ) : null}

              <Input
                placeholder="Başlık"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
              <Input
                placeholder="Alt Başlık"
                value={formData.subtitle}
                onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
              />
              <div className="space-y-1.5">
                <p className="text-sm font-medium">
                  {editingLanguage === "en" ? "Category" : "Kategori"}
                </p>
                {categoryOptions.length > 0 ? (
                  <Select
                    value={selectedCategoryValue}
                    onValueChange={handleCategoryChange}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue
                        placeholder={
                          editingLanguage === "en"
                            ? "Select category"
                            : "Kategori seçin"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {categoryOptions.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    placeholder={editingLanguage === "en" ? "Category" : "Kategori"}
                    value={formData.category}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, category: e.target.value }))
                    }
                  />
                )}
              </div>

              <div className="space-y-1.5">
                <p className="text-sm font-medium">
                  {editingLanguage === "en" ? "Subcategory" : "Alt Kategori"}
                </p>
                {availableSubcategories.length > 0 ? (
                  <Select
                    value={selectedSubcategoryValue}
                    onValueChange={handleSubcategoryChange}
                    disabled={!selectedCategoryNode}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue
                        placeholder={
                          editingLanguage === "en"
                            ? "Select subcategory"
                            : "Alt kategori seçin"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSubcategories.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {getSubcategoryName(item, editingLanguage)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    placeholder={
                      editingLanguage === "en" ? "Subcategory" : "Alt kategori"
                    }
                    value={formData.subcategory}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        subcategory: e.target.value,
                      }))
                    }
                    disabled={!formData.category}
                  />
                )}
              </div>
              <Textarea
                placeholder="Açıklama"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />

              <div>
                <label className="text-sm font-medium block mb-2">Ürün Görseli</label>
                <ImageUpload
                  currentImageUrl={formData.imageUrl}
                  onImageUploaded={(url) => setFormData({ ...formData, imageUrl: url })}
                />
              </div>

              <Input
                placeholder="Katalog URL"
                value={formData.catalogUrl}
                onChange={(e) => setFormData({ ...formData, catalogUrl: e.target.value })}
              />

              <Textarea
                placeholder={"OEM Kodları (satır başına):\nVolvo: 12345, 67890"}
                value={formData.oemCodesText}
                onChange={(e) => setFormData({ ...formData, oemCodesText: e.target.value })}
                rows={4}
              />

              <Textarea
                placeholder={"Özellikler (satır başına)"}
                value={formData.featuresText}
                onChange={(e) => setFormData({ ...formData, featuresText: e.target.value })}
                rows={4}
              />

              <Textarea
                placeholder={"Teknik Özellikler (satır başına):\nVoltaj: 24V"}
                value={formData.specificationsText}
                onChange={(e) => setFormData({ ...formData, specificationsText: e.target.value })}
                rows={4}
              />

              <Textarea
                placeholder={"Uygulamalar (satır başına)"}
                value={formData.applicationsText}
                onChange={(e) => setFormData({ ...formData, applicationsText: e.target.value })}
                rows={4}
              />

              <Textarea
                placeholder={"Sertifikalar (satır başına)"}
                value={formData.certificationsText}
                onChange={(e) => setFormData({ ...formData, certificationsText: e.target.value })}
                rows={4}
              />

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

      <Card>
        <CardHeader>
          <CardTitle>Kategori & Alt Kategori Yönetimi</CardTitle>
          <CardDescription>
            Ürün kategorilerini ve alt kategorileri Türkçe/English olarak yönetin.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-2">
            <Input
              placeholder="Kategori TR"
              value={newCategoryTr}
              onChange={(e) => setNewCategoryTr(e.target.value)}
            />
            <Input
              placeholder="Category EN"
              value={newCategoryEn}
              onChange={(e) => setNewCategoryEn(e.target.value)}
            />
            <Button type="button" variant="outline" onClick={handleAddCategory}>
              <Plus className="w-4 h-4 mr-2" />
              Kategori Ekle
            </Button>
          </div>

          {taxonomyDraft.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Henüz kategori yok.
            </p>
          ) : (
            <div className="space-y-3">
              {taxonomyDraft.map((category) => (
                <div key={category.id} className="rounded-md border p-3 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-2">
                    <Input
                      value={category.nameTr}
                      onChange={(e) =>
                        handleCategoryNameChange(
                          category.id,
                          "nameTr",
                          e.target.value,
                        )
                      }
                      placeholder="Kategori TR"
                    />
                    <Input
                      value={category.nameEn}
                      onChange={(e) =>
                        handleCategoryNameChange(
                          category.id,
                          "nameEn",
                          e.target.value,
                        )
                      }
                      placeholder="Category EN"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteCategory(category.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="pl-3 border-l space-y-2">
                    {category.subcategories.map((subcategory) => (
                      <div
                        key={subcategory.id}
                        className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-2"
                      >
                        <Input
                          value={subcategory.nameTr}
                          onChange={(e) =>
                            handleSubcategoryNameChange(
                              category.id,
                              subcategory.id,
                              "nameTr",
                              e.target.value,
                            )
                          }
                          placeholder="Alt Kategori TR"
                        />
                        <Input
                          value={subcategory.nameEn}
                          onChange={(e) =>
                            handleSubcategoryNameChange(
                              category.id,
                              subcategory.id,
                              "nameEn",
                              e.target.value,
                            )
                          }
                          placeholder="Subcategory EN"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleDeleteSubcategory(category.id, subcategory.id)
                          }
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}

                    <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-2">
                      <Input
                        placeholder="Yeni Alt Kategori TR"
                        value={subcategoryDrafts[category.id]?.nameTr || ""}
                        onChange={(e) =>
                          handleSubcategoryDraftChange(
                            category.id,
                            "nameTr",
                            e.target.value,
                          )
                        }
                      />
                      <Input
                        placeholder="New Subcategory EN"
                        value={subcategoryDrafts[category.id]?.nameEn || ""}
                        onChange={(e) =>
                          handleSubcategoryDraftChange(
                            category.id,
                            "nameEn",
                            e.target.value,
                          )
                        }
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddSubcategory(category.id)}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Alt Kategori
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end">
            <Button
              type="button"
              onClick={handleSaveTaxonomy}
              disabled={setSettingMutation.isPending || !taxonomyDirty}
            >
              {setSettingMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Kaydediliyor...
                </>
              ) : (
                "Kategori Yapisini Kaydet"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {products.map((product) => (
          <Card key={product.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{product.title}</CardTitle>
                  <CardDescription>
                    {product.category}
                    {product.subcategory ? ` / ${product.subcategory}` : ""}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(product)}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(product.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{product.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
