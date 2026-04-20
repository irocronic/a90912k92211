import { useEffect, useMemo, useRef, useState } from "react";
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
import { Plus, Edit2, Trash2, Loader2, Upload } from "lucide-react";
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
  parseProductTaxonomy,
  PRODUCT_TAXONOMY_SETTING_KEY,
  serializeProductTaxonomy,
  type ProductTaxonomy,
} from "@/lib/productTaxonomy";

const SUPPLIER_SQLITE_SOURCE = "supplier_sqlite";
const PRODUCTS_PAGE_SIZE = 25;

type RouterOutputs = inferRouterOutputs<AppRouter>;
type AdminProduct = RouterOutputs["admin"]["products"]["listPage"]["items"][number];
type ProductImportPreview = RouterOutputs["admin"]["products"]["previewImportSqlite"];
type ProductImportJob = RouterOutputs["admin"]["products"]["listImportJobs"][number];
type EditingLanguage = "tr" | "en" | "ar";

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

type SubcategoryDraftState = Record<
  string,
  { nameTr: string; nameEn: string; nameAr: string }
>;

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

function formatEta(seconds: number | null): string {
  if (seconds === null || !Number.isFinite(seconds) || seconds <= 0) return "-";
  if (seconds < 60) return `${Math.round(seconds)} sn`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);
  if (minutes < 60) return `${minutes} dk ${remainingSeconds} sn`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours} sa ${remainingMinutes} dk`;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeOemValue(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function renderHighlightedText(text: string, term: string) {
  if (!term.trim()) return text;
  const pattern = new RegExp(`(${escapeRegExp(term.trim())})`, "ig");
  const parts = text.split(pattern);
  return parts.map((part, index) =>
    part.toLowerCase() === term.trim().toLowerCase() ? (
      <mark key={`${part}-${index}`} className="rounded bg-amber-200 px-0.5 text-inherit">
        {part}
      </mark>
    ) : (
      part
    ),
  );
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

function formFromTranslatedProduct(
  product: AdminProduct,
  language: EditingLanguage,
  taxonomy: ProductTaxonomy,
  rawStoredOverride?: string,
): ProductFormData {
  const localized = localizeDisplayProduct(
    toDisplayProduct(product),
    language,
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
      getCategoryName(categoryNode ?? { nameTr: "", nameEn: "", nameAr: "", id: "", subcategories: [] }, language) ||
      localized.category,
    subcategory:
      (subcategoryNode ? getSubcategoryName(subcategoryNode, language) : "") ||
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
  const initialParams =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search)
      : new URLSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingLanguage, setEditingLanguage] = useState<EditingLanguage>("tr");
  const [formData, setFormData] = useState<ProductFormData>(EMPTY_FORM);
  const [taxonomyDraft, setTaxonomyDraft] = useState<ProductTaxonomy>([]);
  const [taxonomyDirty, setTaxonomyDirty] = useState(false);
  const [newCategoryTr, setNewCategoryTr] = useState("");
  const [newCategoryEn, setNewCategoryEn] = useState("");
  const [newCategoryAr, setNewCategoryAr] = useState("");
  const [currentPage, setCurrentPage] = useState(
    Math.max(1, Number(initialParams.get("productsPage") || "1") || 1),
  );
  const [searchTerm, setSearchTerm] = useState(initialParams.get("productsSearch") || "");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(
    initialParams.get("productsSearch") || "",
  );
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState(
    initialParams.get("productsCategory") || "__all__",
  );
  const [selectedBrandFilter, setSelectedBrandFilter] = useState(
    initialParams.get("productsBrand") || "__all__",
  );
  const [oemSearchTerm, setOemSearchTerm] = useState(initialParams.get("productsOem") || "");
  const [debouncedOemSearchTerm, setDebouncedOemSearchTerm] = useState(
    initialParams.get("productsOem") || "",
  );
  const [sortBy, setSortBy] = useState<"updated_desc" | "title_asc" | "brand_asc">(
    (initialParams.get("productsSort") as "updated_desc" | "title_asc" | "brand_asc") ||
      "updated_desc",
  );
  const [goToPageValue, setGoToPageValue] = useState(initialParams.get("productsPage") || "");
  const [subcategoryDrafts, setSubcategoryDrafts] = useState<SubcategoryDraftState>(
    {},
  );
  const [selectedImportFile, setSelectedImportFile] = useState<File | null>(null);
  const [importPreviewResult, setImportPreviewResult] =
    useState<ProductImportPreview | null>(null);
  const importFileInputRef = useRef<HTMLInputElement>(null);
  const notifiedJobStatusRef = useRef<Set<string>>(new Set());

  const { data: productPageData, isLoading, isFetching, refetch } =
    trpc.admin.products.listPage.useQuery({
      page: currentPage,
      pageSize: PRODUCTS_PAGE_SIZE,
      search: debouncedSearchTerm || undefined,
      category: selectedCategoryFilter === "__all__" ? undefined : selectedCategoryFilter,
      brand: selectedBrandFilter === "__all__" ? undefined : selectedBrandFilter,
      oemCode: debouncedOemSearchTerm || undefined,
      sortBy,
    }, {
      placeholderData: (previous) => previous,
    });
  const products = productPageData?.items ?? [];
  const { data: productFilterOptions } = trpc.admin.products.filterOptions.useQuery();
  const { data: settings = [], refetch: refetchSettings } =
    trpc.admin.settings.list.useQuery();
  const createMutation = trpc.admin.products.create.useMutation();
  const updateMutation = trpc.admin.products.update.useMutation();
  const previewImportMutation = trpc.admin.products.previewImportSqlite.useMutation();
  const createImportJobMutation = trpc.admin.products.createImportJob.useMutation();
  const deleteImportedMutation = trpc.admin.products.deleteImported.useMutation();
  const deleteImportedWithTaxonomyMutation =
    trpc.admin.products.deleteImportedWithTaxonomy.useMutation();
  const deleteMutation = trpc.admin.products.delete.useMutation();
  const setSettingMutation = trpc.admin.settings.set.useMutation();
  const { data: importJobs = [], refetch: refetchImportJobs } =
    trpc.admin.products.listImportJobs.useQuery(
      { limit: 12 },
      {
        refetchInterval: (query) => {
          const jobs = query.state.data ?? [];
          return jobs.some((job) => job.status === "queued" || job.status === "running")
            ? 3000
            : 10000;
        },
      },
    );

  const {
    data: englishProductTranslations = {},
    refetch: refetchEnglishProductTranslations,
  } = trpc.i18n.getSectionTranslations.useQuery({
    language: "en",
    section: PRODUCT_CONTENT_TRANSLATION_SECTION,
  });
  const {
    data: arabicProductTranslations = {},
    refetch: refetchArabicProductTranslations,
  } = trpc.i18n.getSectionTranslations.useQuery({
    language: "ar",
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
    return parseProductTaxonomy(rawValue);
  }, [taxonomySetting]);

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
  const translationKey = editingId
    ? getProductTranslationKey(editingId)
    : null;
  const hasSelectedOverride = Boolean(
    translationKey &&
      (editingLanguage === "en"
        ? englishProductTranslations[translationKey]
        : editingLanguage === "ar"
          ? arabicProductTranslations[translationKey]
          : false),
  );

  const resetForm = () => {
    setFormData(EMPTY_FORM);
    setEditingId(null);
    setEditingLanguage("tr");
  };

  useEffect(() => {
    if (!isOpen || !editingProduct) return;

    if (editingLanguage !== "tr") {
      setFormData(
        formFromTranslatedProduct(
          editingProduct,
          editingLanguage,
          taxonomyDraft,
          editingLanguage === "en"
            ? englishProductTranslations[getProductTranslationKey(editingProduct.id)]
            : arabicProductTranslations[getProductTranslationKey(editingProduct.id)],
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
    arabicProductTranslations,
    taxonomyDraft,
  ]);

  useEffect(() => {
    importJobs.forEach((job) => {
      const key = `${job.id}:${job.status}`;
      if (notifiedJobStatusRef.current.has(key)) return;

      if (job.status === "completed") {
        notifiedJobStatusRef.current.add(key);
        void Promise.all([refetch(), refetchSettings()]);
        toast.success(`${job.fileName} importu tamamlandi`);
      }

      if (job.status === "failed") {
        notifiedJobStatusRef.current.add(key);
        toast.error(job.errorMessage || `${job.fileName} importu basarisiz oldu`);
      }
    });
  }, [importJobs, refetch, refetchSettings]);

  useEffect(() => {
    const totalPages = productPageData?.totalPages ?? 1;
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, productPageData?.totalPages]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, selectedCategoryFilter, selectedBrandFilter, debouncedOemSearchTerm, sortBy]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [searchTerm]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedOemSearchTerm(oemSearchTerm);
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [oemSearchTerm]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const setOrDelete = (key: string, value: string, emptyValue = "") => {
      if (!value || value === emptyValue) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    };

    setOrDelete("productsPage", String(currentPage), "1");
    setOrDelete("productsSearch", debouncedSearchTerm);
    setOrDelete("productsCategory", selectedCategoryFilter, "__all__");
    setOrDelete("productsBrand", selectedBrandFilter, "__all__");
    setOrDelete("productsOem", debouncedOemSearchTerm);
    setOrDelete("productsSort", sortBy, "updated_desc");

    const nextSearch = params.toString();
    const nextUrl = `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ""}${window.location.hash}`;
    const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    if (nextUrl === currentUrl) return;

    const scrollX = window.scrollX;
    const scrollY = window.scrollY;
    window.history.replaceState(window.history.state, "", nextUrl);
    window.requestAnimationFrame(() => {
      window.scrollTo({ left: scrollX, top: scrollY, behavior: "auto" });
    });
  }, [currentPage, debouncedSearchTerm, selectedCategoryFilter, selectedBrandFilter, debouncedOemSearchTerm, sortBy]);

  const openCreateDialog = () => {
    setEditingLanguage("tr");
    setEditingId(null);
    setFormData(EMPTY_FORM);
  };

  const openEditDialog = (product: AdminProduct) => {
    setEditingId(product.id);
    if (editingLanguage !== "tr") {
      setFormData(
        formFromTranslatedProduct(
          product,
          editingLanguage,
          taxonomyDraft,
          editingLanguage === "en"
            ? englishProductTranslations[getProductTranslationKey(product.id)]
            : arabicProductTranslations[getProductTranslationKey(product.id)],
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
        trLabel: item.nameTr,
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
    field: "nameTr" | "nameEn" | "nameAr",
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
    const categoryAr = newCategoryAr.trim();
    if (!categoryTr && !categoryEn && !categoryAr) {
      toast.error("Kategori için TR, EN veya AR isim girin");
      return;
    }

    const category = createEmptyCategory(categoryTr, categoryEn, categoryAr);
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
    setNewCategoryAr("");
  };

  const handleSubcategoryDraftChange = (
    categoryId: string,
    field: "nameTr" | "nameEn" | "nameAr",
    value: string,
  ) => {
    setSubcategoryDrafts((prev) => ({
      ...prev,
      [categoryId]: {
        nameTr: prev[categoryId]?.nameTr || "",
        nameEn: prev[categoryId]?.nameEn || "",
        nameAr: prev[categoryId]?.nameAr || "",
        [field]: value,
      },
    }));
  };

  const handleAddSubcategory = (categoryId: string) => {
    const draft = subcategoryDrafts[categoryId] || { nameTr: "", nameEn: "", nameAr: "" };
    const nameTr = draft.nameTr.trim();
    const nameEn = draft.nameEn.trim();
    const nameAr = draft.nameAr.trim();
    if (!nameTr && !nameEn && !nameAr) {
      toast.error("Alt kategori için TR, EN veya AR isim girin");
      return;
    }

    setTaxonomyDirty(true);
    setTaxonomyDraft((prev) =>
      prev.map((category) => {
        if (category.id !== categoryId) return category;

        const subcategory = createEmptySubcategory(categoryId, nameTr, nameEn, nameAr);
        const exists = category.subcategories.some(
          (item) =>
            item.nameTr === subcategory.nameTr ||
            item.nameEn === subcategory.nameEn ||
            item.nameAr === subcategory.nameAr ||
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
      [categoryId]: { nameTr: "", nameEn: "", nameAr: "" },
    }));
  };

  const handleSubcategoryNameChange = (
    categoryId: string,
    subcategoryId: string,
    field: "nameTr" | "nameEn" | "nameAr",
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

    if (editingLanguage !== "tr") {
      if (!editingId) {
        toast.error(
          editingLanguage === "ar"
            ? "Arapça çeviri için önce ürünü Türkçe oluşturun"
            : "English çeviri için önce ürünü Türkçe oluşturun",
        );
        return;
      }

      try {
        await updateTranslationMutation.mutateAsync({
          key: getProductTranslationKey(editingId),
          language: editingLanguage,
          section: PRODUCT_CONTENT_TRANSLATION_SECTION,
          value: JSON.stringify(payload),
        });
        toast.success(
          editingLanguage === "ar"
            ? "Ürünün Arapça çevirisi kaydedildi"
            : "Ürünün English çevirisi kaydedildi",
        );
        await (editingLanguage === "ar"
          ? refetchArabicProductTranslations()
          : refetchEnglishProductTranslations());
        setIsOpen(false);
        resetForm();
      } catch {
        toast.error(
          editingLanguage === "ar"
            ? "Arapça çeviri kaydedilemedi"
            : "English çeviri kaydedilemedi",
        );
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

  const handleDeleteTranslationOverride = async () => {
    if (!editingId || editingLanguage === "tr" || !hasSelectedOverride) return;
    const languageLabel = editingLanguage === "ar" ? "Arapça" : "English";
    const approved = window.confirm(
      `Bu ürünün ${languageLabel} çevirisini silmek istiyor musunuz?`,
    );
    if (!approved) return;

    try {
      await deleteTranslationMutation.mutateAsync({
        key: getProductTranslationKey(editingId),
        section: PRODUCT_CONTENT_TRANSLATION_SECTION,
        language: editingLanguage,
      });
      toast.success(`${languageLabel} çeviri silindi`);
      await (editingLanguage === "ar"
        ? refetchArabicProductTranslations()
        : refetchEnglishProductTranslations());
      if (editingProduct) {
        setFormData(formFromTranslatedProduct(editingProduct, editingLanguage, taxonomyDraft));
      }
    } catch {
      toast.error(`${languageLabel} çeviri silinemedi`);
    }
  };

  const handleSelectImportFile = (file: File | null) => {
    if (!file) {
      setSelectedImportFile(null);
      setImportPreviewResult(null);
      return;
    }

    const fileName = file.name.toLowerCase();
    const isSupported =
      fileName.endsWith(".db") ||
      fileName.endsWith(".sqlite") ||
      fileName.endsWith(".sqlite3");
    if (!isSupported) {
      toast.error("Lutfen .db, .sqlite veya .sqlite3 uzantili bir dosya secin");
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      toast.error("Dosya boyutu 25MB'dan kucuk olmalidir");
      return;
    }

    setSelectedImportFile(file);
    setImportPreviewResult(null);
  };

  const handlePreviewImport = async () => {
    if (!selectedImportFile) {
      toast.error("Once analiz edilecek DB dosyasini secin");
      return;
    }

    try {
      const buffer = await selectedImportFile.arrayBuffer();
      const result = await previewImportMutation.mutateAsync({
        file: new Uint8Array(buffer) as any,
        fileName: selectedImportFile.name,
      });
      setImportPreviewResult(result);
      toast.success("Dry run analizi hazir");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "SQLite urun dosyasi analiz edilemedi",
      );
    }
  };

  const handleImportProducts = async () => {
    if (!selectedImportFile) {
      toast.error("Once import edilecek DB dosyasini secin");
      return;
    }

    try {
      const buffer = await selectedImportFile.arrayBuffer();
      const result = await createImportJobMutation.mutateAsync({
        file: new Uint8Array(buffer) as any,
        fileName: selectedImportFile.name,
      });
      await refetchImportJobs();

      if (result.duplicate && result.previousImport) {
        toast.message(
          "Bu dosya daha once ayni hash ile ice aktarildigi icin yeniden kuyruga alinmadi.",
        );
        return;
      }

      if (result.existingJob) {
        toast.message("Bu dosya icin zaten aktif bir import isi bulunuyor.");
        return;
      }

      if (result.job) {
        setTaxonomyDirty(false);
        toast.success("Import isi kuyruga alindi. Arka planda islenmeye baslayacak.");
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "SQLite urun dosyasi import edilemedi",
      );
    }
  };

  const activeImportJob = useMemo(
    () => importJobs.find((job) => job.status === "running" || job.status === "queued") ?? null,
    [importJobs],
  );

  const latestFinishedImportJob = useMemo(
    () =>
      importJobs.find(
        (job) => job.status === "completed" || job.status === "failed" || job.status === "cancelled",
      ) ?? null,
    [importJobs],
  );

  const activeImportProgress = useMemo(() => {
    if (!activeImportJob) return null;
    const totalRows = Math.max(activeImportJob.totalRows || 0, 0);
    const processedRows = Math.max(activeImportJob.processedRows || 0, 0);
    const percent = totalRows > 0 ? Math.min(100, Math.round((processedRows / totalRows) * 100)) : 0;
    const startedAt = activeImportJob.startedAt ? new Date(activeImportJob.startedAt).getTime() : null;
    const now = Date.now();
    const elapsedSeconds = startedAt ? Math.max(1, (now - startedAt) / 1000) : null;
    const throughput = elapsedSeconds && processedRows > 0 ? processedRows / elapsedSeconds : null;
    const remainingRows = totalRows > 0 ? Math.max(0, totalRows - processedRows) : null;
    const etaSeconds =
      throughput && remainingRows !== null && throughput > 0 ? remainingRows / throughput : null;

    return {
      percent,
      etaSeconds,
    };
  }, [activeImportJob]);

  const importedProductCount = useMemo(
    () => productPageData?.importedCount ?? 0,
    [productPageData?.importedCount],
  );

  const isSaving =
    createMutation.isPending ||
    updateMutation.isPending ||
    updateTranslationMutation.isPending;
  const totalProducts = productPageData?.totalCount ?? 0;
  const totalPages = productPageData?.totalPages ?? 1;
  const visibleStart =
    totalProducts === 0 ? 0 : (currentPage - 1) * PRODUCTS_PAGE_SIZE + 1;
  const visibleEnd = Math.min(currentPage * PRODUCTS_PAGE_SIZE, totalProducts);
  const handleGoToPage = () => {
    const parsed = Number(goToPageValue);
    if (!Number.isInteger(parsed)) {
      toast.error("Geçerli bir sayfa numarası girin.");
      return;
    }

    const nextPage = Math.min(Math.max(parsed, 1), totalPages);
    setCurrentPage(nextPage);
    setGoToPageValue(String(nextPage));
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setDebouncedSearchTerm("");
    setSelectedCategoryFilter("__all__");
    setSelectedBrandFilter("__all__");
    setOemSearchTerm("");
    setDebouncedOemSearchTerm("");
    setSortBy("updated_desc");
    setCurrentPage(1);
    setGoToPageValue("");
  };

  const handleDeleteImportedProducts = async () => {
    if (importedProductCount === 0) {
      toast.message("Silinecek içe aktarılmış ürün bulunmuyor.");
      return;
    }

    const approved = window.confirm(
      `${importedProductCount} adet içe aktarılmış ürünü toplu silmek istiyor musunuz? Bu işlem geri alınamaz.`,
    );
    if (!approved) return;

    try {
      const result = await deleteImportedMutation.mutateAsync();
      await Promise.all([refetch(), refetchSettings()]);
      toast.success(`${result.deletedCount} içe aktarılmış ürün silindi.`);
    } catch {
      toast.error("İçe aktarılmış ürünler silinemedi.");
    }
  };

  const handleDeleteImportedProductsWithTaxonomy = async () => {
    if (importedProductCount === 0) {
      toast.message("Silinecek içe aktarılmış ürün bulunmuyor.");
      return;
    }

    const approved = window.confirm(
      `${importedProductCount} adet içe aktarılmış ürünü ve onlara ait kullanılmayan import kategorilerini silmek istiyor musunuz? Bu işlem geri alınamaz.`,
    );
    if (!approved) return;

    try {
      const result = await deleteImportedWithTaxonomyMutation.mutateAsync();
      await Promise.all([refetch(), refetchSettings()]);
      toast.success(
        `${result.deletedCount} ürün silindi · ${result.removedCategories} kategori · ${result.removedSubcategories} alt kategori temizlendi.`,
      );
    } catch {
      toast.error("İçe aktarılan ürünler ve kategoriler silinemedi.");
    }
  };

  if (isLoading && !productPageData) {
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
          <p className="text-sm text-muted-foreground">
            Toplam {totalProducts} ürün · Sayfa {currentPage}/{totalPages}
            {totalProducts > 0 ? ` · ${visibleStart}-${visibleEnd} arası gösteriliyor` : ""}
          </p>
        </div>
        {isFetching ? (
          <div className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Filtreler uygulanıyor...
          </div>
        ) : null}
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
                      : editingLanguage === "en"
                        ? "English kayıt sadece çeviri katmanını günceller."
                        : "Arapça kayıt sadece çeviri katmanını günceller."}
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
                  <Button
                    type="button"
                    size="sm"
                    variant={editingLanguage === "ar" ? "default" : "outline"}
                    onClick={() => setEditingLanguage("ar")}
                  >
                    العربية
                  </Button>
                </div>
              </div>

              {editingLanguage !== "tr" && !editingId ? (
                <p className="text-xs text-muted-foreground">
                  {editingLanguage === "ar"
                    ? "Arapça çeviri için önce ürünü Türkçe olarak oluşturun, sonra düzenle ekranından العربية sekmesine geçin."
                    : "English çeviri için önce ürünü Türkçe olarak oluşturun, sonra düzenle ekranından English sekmesine geçin."}
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
                  {editingLanguage === "en"
                    ? "Category"
                    : editingLanguage === "ar"
                      ? "الفئة"
                      : "Kategori"}
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
                            : editingLanguage === "ar"
                              ? "الفئة"
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
                    placeholder={
                      editingLanguage === "en"
                        ? "Category"
                        : editingLanguage === "ar"
                          ? "الفئة"
                          : "Kategori"
                    }
                    value={formData.category}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, category: e.target.value }))
                    }
                  />
                )}
              </div>

              <div className="space-y-1.5">
                <p className="text-sm font-medium">
                  {editingLanguage === "en"
                    ? "Subcategory"
                    : editingLanguage === "ar"
                      ? "الفئة الفرعية"
                      : "Alt Kategori"}
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
                            : editingLanguage === "ar"
                              ? "الفئة الفرعية"
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
                      editingLanguage === "en"
                        ? "Subcategory"
                        : editingLanguage === "ar"
                          ? "الفئة الفرعية"
                          : "Alt kategori"
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

              {editingLanguage !== "tr" && editingId && hasSelectedOverride ? (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleDeleteTranslationOverride}
                  disabled={deleteTranslationMutation.isPending}
                >
                  {deleteTranslationMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Çeviri Siliniyor...
                    </>
                  ) : (
                    editingLanguage === "ar" ? "Arapça Çeviriyi Sil" : "English Çeviriyi Sil"
                  )}
                </Button>
              ) : null}

              <Button
                onClick={handleSubmit}
                disabled={isSaving || (editingLanguage !== "tr" && !editingId)}
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
          <CardTitle>Tedarikci DB Import</CardTitle>
          <CardDescription>
            Firmadan gelen `urunler.db` dosyasini yukleyin. Sistem ayni kayitlari tekrar
            import ettiginizde duplike olusturmak yerine gunceller.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <input
            ref={importFileInputRef}
            type="file"
            accept=".db,.sqlite,.sqlite3,application/octet-stream"
            className="hidden"
            onChange={(event) =>
              handleSelectImportFile(event.target.files?.[0] ?? null)
            }
          />

          <div className="flex flex-col gap-3 rounded-md border p-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium">SQLite urun veri tabani secin</p>
              <p className="text-xs text-muted-foreground">
                Desteklenen uzantilar: `.db`, `.sqlite`, `.sqlite3`
              </p>
              <p className="text-sm text-muted-foreground">
                {selectedImportFile
                  ? `${selectedImportFile.name} (${Math.ceil(
                      selectedImportFile.size / 1024,
                    )} KB)`
                  : "Henuz dosya secilmedi"}
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                onClick={() => importFileInputRef.current?.click()}
                disabled={createImportJobMutation.isPending || previewImportMutation.isPending}
              >
                <Upload className="mr-2 h-4 w-4" />
                Dosya Sec
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handlePreviewImport}
                disabled={
                  !selectedImportFile ||
                  createImportJobMutation.isPending ||
                  previewImportMutation.isPending
                }
              >
                {previewImportMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analiz Ediliyor...
                  </>
                ) : (
                  "Dry Run Analizi"
                )}
              </Button>
              <Button
                type="button"
                onClick={handleImportProducts}
                disabled={!selectedImportFile || createImportJobMutation.isPending}
              >
                {createImportJobMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Kuyruga Aliniyor...
                  </>
                ) : (
                  "DB'yi Kuyruga Al"
                )}
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleDeleteImportedProducts}
                disabled={deleteImportedMutation.isPending || importedProductCount === 0}
              >
                {deleteImportedMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Siliniyor...
                  </>
                ) : (
                  "İçe Aktarılanları Sil"
                )}
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleDeleteImportedProductsWithTaxonomy}
                disabled={
                  deleteImportedWithTaxonomyMutation.isPending || importedProductCount === 0
                }
              >
                {deleteImportedWithTaxonomyMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Temizleniyor...
                  </>
                ) : (
                  "İçe Aktarılanları ve Kategorileri Sil"
                )}
              </Button>
            </div>
          </div>

          <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            İçe aktarılmış ürün sayısı: <span className="font-semibold">{importedProductCount}</span>
          </div>

          {importPreviewResult ? (
            <div className="space-y-3 rounded-md border bg-muted/20 p-4">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-medium">Dry Run Ozeti</p>
                  <p className="text-xs text-muted-foreground">
                    Dosya hash: {importPreviewResult.fileHash}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Mod: {importPreviewResult.analysisMode === "sample" ? "Hizli onizleme" : "Tam analiz"}
                    {importPreviewResult.sampleLimit
                      ? ` · Ilk ${importPreviewResult.sampleLimit} satir uzerinden`
                      : ""}
                  </p>
                </div>
                {importPreviewResult.alreadyImported ? (
                  <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                    Bu dosya daha once ice aktarilmis.
                  </div>
                ) : (
                  <div className="rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs text-emerald-900">
                    Bu hash icin onceki import kaydi bulunmadi.
                  </div>
                )}
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-md border bg-background p-3">
                  <p className="text-xs text-muted-foreground">Yeni</p>
                  <p className="text-lg font-semibold">{importPreviewResult.createdCount}</p>
                </div>
                <div className="rounded-md border bg-background p-3">
                  <p className="text-xs text-muted-foreground">Guncellenecek</p>
                  <p className="text-lg font-semibold">{importPreviewResult.updatedCount}</p>
                </div>
                <div className="rounded-md border bg-background p-3">
                  <p className="text-xs text-muted-foreground">Atlanacak</p>
                  <p className="text-lg font-semibold">{importPreviewResult.skippedRows}</p>
                </div>
              </div>

              {importPreviewResult.previousImport ? (
                <div className="rounded-md border bg-background p-3 text-sm">
                  <p className="font-medium">Son Ayni Hash Importu</p>
                  <p className="text-muted-foreground">
                    {importPreviewResult.previousImport.fileName} ·{" "}
                    {new Date(importPreviewResult.previousImport.importedAt).toLocaleString("tr-TR")}
                  </p>
                  <p className="text-muted-foreground">
                    Yeni: {importPreviewResult.previousImport.createdCount} · Guncellenen:{" "}
                    {importPreviewResult.previousImport.updatedCount}
                  </p>
                </div>
              ) : null}
            </div>
          ) : null}

          {activeImportJob ? (
            <div className="space-y-3 rounded-md border bg-muted/20 p-4">
              <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-sm font-medium">Aktif Import Isi</p>
                  <p className="text-xs text-muted-foreground">
                    {activeImportJob.fileName} · {activeImportJob.status === "queued" ? "Kuyrukta" : "Calisiyor"}
                  </p>
                </div>
                <div className="rounded-full border px-3 py-1 text-xs font-medium">
                  %{activeImportProgress?.percent ?? 0}
                </div>
              </div>

              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${activeImportProgress?.percent ?? 0}%` }}
                />
              </div>

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                <div className="rounded-md border bg-background p-3">
                  <p className="text-xs text-muted-foreground">Islenen</p>
                  <p className="text-sm font-semibold">
                    {activeImportJob.processedRows} / {activeImportJob.totalRows}
                  </p>
                </div>
                <div className="rounded-md border bg-background p-3">
                  <p className="text-xs text-muted-foreground">Yeni</p>
                  <p className="text-sm font-semibold">{activeImportJob.createdCount}</p>
                </div>
                <div className="rounded-md border bg-background p-3">
                  <p className="text-xs text-muted-foreground">Guncellenen</p>
                  <p className="text-sm font-semibold">{activeImportJob.updatedCount}</p>
                </div>
                <div className="rounded-md border bg-background p-3">
                  <p className="text-xs text-muted-foreground">Atlanan</p>
                  <p className="text-sm font-semibold">{activeImportJob.skippedCount}</p>
                </div>
                <div className="rounded-md border bg-background p-3">
                  <p className="text-xs text-muted-foreground">Tahmini Kalan Sure</p>
                  <p className="text-sm font-semibold">
                    {activeImportJob.status === "queued"
                      ? "Sirada"
                      : formatEta(activeImportProgress?.etaSeconds ?? null)}
                  </p>
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                Chunk boyutu: {activeImportJob.chunkSize} · Son anahtar:{" "}
                {activeImportJob.lastProcessedKey || "-"}
              </p>
            </div>
          ) : null}

          {latestFinishedImportJob ? (
            <div className="grid gap-3 rounded-md border bg-muted/20 p-4 md:grid-cols-2 xl:grid-cols-4">
              <div>
                <p className="text-xs text-muted-foreground">Son Is</p>
                <p className="text-sm font-medium">{latestFinishedImportJob.fileName}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Durum</p>
                <p className="text-sm font-medium">
                  {latestFinishedImportJob.status === "completed"
                    ? "Tamamlandi"
                    : latestFinishedImportJob.status === "failed"
                      ? "Basarisiz"
                      : "Iptal"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Toplam / Islenen</p>
                <p className="text-sm font-medium">
                  {latestFinishedImportJob.totalRows} / {latestFinishedImportJob.processedRows}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Yeni / Guncellenen</p>
                <p className="text-sm font-medium">
                  {latestFinishedImportJob.createdCount} / {latestFinishedImportJob.updatedCount}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Atlanan</p>
                <p className="text-sm font-medium">
                  {latestFinishedImportJob.skippedCount}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Baslangic</p>
                <p className="text-sm font-medium">
                  {latestFinishedImportJob.startedAt
                    ? new Date(latestFinishedImportJob.startedAt).toLocaleString("tr-TR")
                    : "-"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Bitis</p>
                <p className="text-sm font-medium">
                  {latestFinishedImportJob.finishedAt
                    ? new Date(latestFinishedImportJob.finishedAt).toLocaleString("tr-TR")
                    : "-"}
                </p>
              </div>
              <div className="md:col-span-2 xl:col-span-2">
                <p className="text-xs text-muted-foreground">Hata</p>
                <p className="text-sm">
                  {latestFinishedImportJob.errorMessage || "-"}
                </p>
              </div>
            </div>
          ) : null}

          {importJobs.length > 0 ? (
            <div className="space-y-2 rounded-md border p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Son Import Isleri</p>
                <Button type="button" variant="ghost" size="sm" onClick={() => void refetchImportJobs()}>
                  Yenile
                </Button>
              </div>
              <div className="space-y-2">
                {importJobs.map((job) => {
                  const percentage =
                    job.totalRows > 0 ? Math.min(100, Math.round((job.processedRows / job.totalRows) * 100)) : 0;
                  return (
                    <div
                      key={job.id}
                      className="flex flex-col gap-2 rounded-md border bg-background p-3 md:flex-row md:items-center md:justify-between"
                    >
                      <div>
                        <p className="text-sm font-medium">{job.fileName}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(job.createdAt).toLocaleString("tr-TR")} · {job.status}
                        </p>
                      </div>
                      <div className="grid gap-2 text-xs text-muted-foreground md:grid-cols-4 md:items-center">
                        <span>%{percentage}</span>
                        <span>{job.processedRows}/{job.totalRows}</span>
                        <span>Yeni {job.createdCount}</span>
                        <span>Gunc. {job.updatedCount}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Kategori & Alt Kategori Yönetimi</CardTitle>
          <CardDescription>
            Ürün kategorilerini ve alt kategorileri Türkçe, English ve Arapça olarak yönetin.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_auto] gap-2">
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
            <Input
              placeholder="الفئة AR"
              value={newCategoryAr}
              onChange={(e) => setNewCategoryAr(e.target.value)}
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
                  <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_auto] gap-2">
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
                    <Input
                      value={category.nameAr}
                      onChange={(e) =>
                        handleCategoryNameChange(
                          category.id,
                          "nameAr",
                          e.target.value,
                        )
                      }
                      placeholder="الفئة AR"
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
                        className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_auto] gap-2"
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
                        <Input
                          value={subcategory.nameAr}
                          onChange={(e) =>
                            handleSubcategoryNameChange(
                              category.id,
                              subcategory.id,
                              "nameAr",
                              e.target.value,
                            )
                          }
                          placeholder="الفئة الفرعية AR"
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

                    <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_auto] gap-2">
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
                      <Input
                        placeholder="الفئة الفرعية الجديدة AR"
                        value={subcategoryDrafts[category.id]?.nameAr || ""}
                        onChange={(e) =>
                          handleSubcategoryDraftChange(
                            category.id,
                            "nameAr",
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
        <Card>
          <CardContent className="flex flex-wrap items-end gap-3 overflow-hidden py-4">
            <Input
              className="min-w-[260px] flex-[1_1_320px]"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Ürün adı, marka, kod veya kategori ara"
            />

            <div className="min-w-[220px] flex-[1_1_220px]">
              <Select
                value={selectedCategoryFilter}
                onValueChange={setSelectedCategoryFilter}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Kategoriye göre filtrele" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Tüm Kategoriler</SelectItem>
                  {categoryOptions.map((option) => (
                    <SelectItem key={option.id} value={option.trLabel}>
                      {option.trLabel}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="min-w-[220px] flex-[1_1_220px]">
              <Select
                value={selectedBrandFilter}
                onValueChange={setSelectedBrandFilter}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Markaya göre filtrele" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Tüm Markalar</SelectItem>
                  {(productFilterOptions?.brands ?? []).map((brand) => (
                    <SelectItem key={brand} value={brand}>
                      {brand}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Input
              className="min-w-[240px] flex-[1_1_280px]"
              value={oemSearchTerm}
              onChange={(event) => setOemSearchTerm(event.target.value)}
              placeholder="OEM koduna göre ara"
            />

            <div className="min-w-[220px] flex-[1_1_220px]">
              <Select
                value={sortBy}
                onValueChange={(value) =>
                  setSortBy(value as "updated_desc" | "title_asc" | "brand_asc")
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sıralama" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="updated_desc">Son Güncellenen</SelectItem>
                  <SelectItem value="title_asc">Alfabetik</SelectItem>
                  <SelectItem value="brand_asc">Markaya Göre</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex min-w-[190px] flex-[0_1_220px] gap-2">
              <Input
                value={goToPageValue}
                onChange={(event) => setGoToPageValue(event.target.value)}
                placeholder="Sayfa no"
                inputMode="numeric"
              />
              <Button type="button" variant="outline" onClick={handleGoToPage}>
                Git
              </Button>
            </div>

            <Button
              type="button"
              variant="outline"
              className="shrink-0"
              onClick={handleClearFilters}
            >
              Filtreleri Temizle
            </Button>
          </CardContent>
        </Card>

        {products.map((product) => (
          <Card key={product.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{renderHighlightedText(product.title, debouncedSearchTerm)}</CardTitle>
                  <CardDescription>
                    {renderHighlightedText(product.category, debouncedSearchTerm)}
                    {product.subcategory ? " / " : ""}
                    {product.subcategory
                      ? renderHighlightedText(product.subcategory, debouncedSearchTerm)
                      : ""}
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
              <p className="text-sm text-muted-foreground">
                {renderHighlightedText(product.description, debouncedSearchTerm)}
              </p>
              {product.sourceCode || product.sourceBrand ? (
                <p className="mt-3 text-xs text-muted-foreground">
                  {product.sourceCode ? (
                    <>
                      Kod:{" "}
                      {debouncedOemSearchTerm
                        ? renderHighlightedText(product.sourceCode, debouncedOemSearchTerm)
                        : renderHighlightedText(product.sourceCode, debouncedSearchTerm)}
                    </>
                  ) : (
                    ""
                  )}
                  {product.sourceCode && product.sourceBrand ? " | " : ""}
                  {product.sourceBrand ? (
                    <>
                      Marka: {renderHighlightedText(product.sourceBrand, debouncedSearchTerm)}
                    </>
                  ) : (
                    ""
                  )}
                </p>
              ) : null}
              {debouncedOemSearchTerm ? (
                (() => {
                  const normalizedNeedle = normalizeOemValue(debouncedOemSearchTerm);
                  const matchedCodes = product.oemCodes.flatMap((group) =>
                    group.codes.filter((code) =>
                      normalizeOemValue(code).includes(normalizedNeedle),
                    ),
                  );
                  if (matchedCodes.length === 0) return null;
                  return (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {matchedCodes.slice(0, 6).map((code, index) => (
                        <span
                          key={`${code}-${index}`}
                          className="rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-900"
                        >
                          OEM Eşleşmesi: {renderHighlightedText(code, debouncedOemSearchTerm)}
                        </span>
                      ))}
                    </div>
                  );
                })()
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="flex flex-col gap-3 py-4 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-muted-foreground">
            Sayfa başına {PRODUCTS_PAGE_SIZE} ürün gösteriliyor.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={currentPage <= 1}
            >
              Önceki
            </Button>

            <div className="min-w-[180px]">
              <Select
                value={String(currentPage)}
                onValueChange={(value) => setCurrentPage(Number(value))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sayfa seçin" />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                    <SelectItem key={page} value={String(page)}>
                      {page}. Sayfa
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              disabled={currentPage >= totalPages}
            >
              Sonraki
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
