import { useEffect, useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  PUBLIC_SETTING_PREFIX,
  QUOTE_MAIL_API_KEY_SETTING_KEY,
  QUOTE_MAIL_ENABLED_SETTING_KEY,
  QUOTE_MAIL_FROM_EMAIL_SETTING_KEY,
  QUOTE_MAIL_FROM_NAME_SETTING_KEY,
  QUOTE_MAIL_SUBJECT_PREFIX_SETTING_KEY,
  QUOTE_MAIL_TO_EMAIL_SETTING_KEY,
} from "@shared/const";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

type SettingType = "string" | "number" | "boolean" | "json";
type SettingDefinition = {
  key: string;
  label: string;
  type: SettingType;
  group: "general" | "mail";
  description?: string;
  inputMode?: "text" | "email" | "password" | "url" | "tel";
};

const DEFAULT_SETTINGS: SettingDefinition[] = [
  { key: "site_title", label: "Site Başlığı", type: "string", group: "general" },
  { key: "site_description", label: "Site Açıklaması", type: "string", group: "general" },
  { key: "contact_email", label: "İletişim E-postası", type: "string", group: "general", inputMode: "email" },
  { key: "contact_phone", label: "İletişim Telefonu", type: "string", group: "general", inputMode: "tel" },
  { key: "social_twitter", label: "Twitter URL", type: "string", group: "general", inputMode: "url" },
  { key: "social_linkedin", label: "LinkedIn URL", type: "string", group: "general", inputMode: "url" },
  { key: "social_facebook", label: "Facebook URL", type: "string", group: "general", inputMode: "url" },
  {
    key: QUOTE_MAIL_ENABLED_SETTING_KEY,
    label: "Teklif Mail Gönderimi Aktif",
    type: "boolean",
    group: "mail",
    description: "Aktif olduğunda teklif formu Resend üzerinden gerçek e-posta gönderir.",
  },
  {
    key: QUOTE_MAIL_API_KEY_SETTING_KEY,
    label: "Resend API Anahtarı",
    type: "string",
    group: "mail",
    inputMode: "password",
    description: "Resend panelinden aldığınız `re_...` anahtarı.",
  },
  {
    key: QUOTE_MAIL_FROM_EMAIL_SETTING_KEY,
    label: "Gönderici E-posta",
    type: "string",
    group: "mail",
    inputMode: "email",
    description: "Doğrulanmış alan adınıza bağlı gönderici adresi. Örn: teklif@alanadiniz.com",
  },
  {
    key: QUOTE_MAIL_FROM_NAME_SETTING_KEY,
    label: "Gönderici Adı",
    type: "string",
    group: "mail",
    description: "Alıcıya görünen marka adı. Örn: BRAC Teklif Formu",
  },
  {
    key: QUOTE_MAIL_TO_EMAIL_SETTING_KEY,
    label: "Tekliflerin Gideceği E-posta",
    type: "string",
    group: "mail",
    inputMode: "email",
    description: "Form gönderimlerinin düşeceği işletme e-posta adresi.",
  },
  {
    key: QUOTE_MAIL_SUBJECT_PREFIX_SETTING_KEY,
    label: "Mail Konu Ön Eki",
    type: "string",
    group: "mail",
    description: "Örn: [BRAC Teklif]",
  },
];

export default function AdminSettings() {
  const [settingsData, setSettingsData] = useState<Record<string, string>>({});
  const [newSettingKey, setNewSettingKey] = useState("");

  const { data: settings = [], isLoading: settingsLoading, refetch } = trpc.admin.settings.list.useQuery();
  const { data: products = [] } = trpc.admin.products.list.useQuery();
  const { data: articles = [] } = trpc.admin.articles.list.useQuery();
  const setMutation = trpc.admin.settings.set.useMutation();

  useEffect(() => {
    setSettingsData((prev) => {
      const next = { ...prev };
      settings.forEach((setting) => {
        if (!(setting.key in next)) {
          next[setting.key] = setting.value;
        }
      });
      DEFAULT_SETTINGS.forEach((setting) => {
        if (!(setting.key in next) && setting.type === "boolean") {
          next[setting.key] = "false";
        }
      });
      return next;
    });
  }, [settings]);

  const settingDefinitions = useMemo(() => {
    const map = new Map<string, SettingDefinition>();
    DEFAULT_SETTINGS.forEach((item) => map.set(item.key, item));
    settings.forEach((item) => {
      if (!map.has(item.key)) {
        map.set(item.key, {
          key: item.key,
          label: item.key,
          type: item.type,
          group: "general",
        });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.key.localeCompare(b.key, "tr"));
  }, [settings]);

  const generalSettings = settingDefinitions.filter((setting) => setting.group === "general");
  const mailSettings = settingDefinitions.filter((setting) => setting.group === "mail");

  const handleChange = (key: string, value: string) => {
    setSettingsData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async (key: string, type: SettingType = "string") => {
    try {
      await setMutation.mutateAsync({
        key,
        value: settingsData[key] || "",
        type,
      });
      toast.success("Ayar kaydedildi");
      await refetch();
    } catch {
      toast.error("Ayar kaydedilemedi");
    }
  };

  const handleAddSetting = () => {
    const key = newSettingKey.trim();
    if (!key) {
      toast.error("Ayar anahtarı boş olamaz");
      return;
    }
    if (!key.startsWith(PUBLIC_SETTING_PREFIX)) {
      toast.error(`Yeni anahtarlar ${PUBLIC_SETTING_PREFIX} ile başlamalı`);
      return;
    }
    if (settingDefinitions.some((item) => item.key === key)) {
      toast.error("Bu anahtar zaten mevcut");
      return;
    }
    setSettingsData((prev) => ({ ...prev, [key]: "" }));
    setNewSettingKey("");
  };

  if (settingsLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Mail Servisi Ayarları</CardTitle>
          <CardDescription>
            Teklif formunun gerçek e-posta gönderebilmesi için Resend bilgilerini buradan yönetin.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md border border-orange-200 bg-orange-50 p-4 text-sm text-orange-900">
            DNS tarafında Resend için domain doğrulaması, SPF ve DKIM kayıtları tamamlandıktan sonra
            mail gönderimini aktifleştirin.
          </div>

          {mailSettings.map((setting) => (
            <div key={setting.key} className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="text-sm font-medium block mb-1">{setting.label}</label>
                {setting.type === "boolean" ? (
                  <div className="flex h-10 items-center">
                    <Switch
                      checked={settingsData[setting.key] === "true"}
                      onCheckedChange={(checked) =>
                        handleChange(setting.key, checked ? "true" : "false")
                      }
                    />
                  </div>
                ) : (
                  <Input
                    type={setting.inputMode ?? "text"}
                    value={settingsData[setting.key] || ""}
                    onChange={(e) => handleChange(setting.key, e.target.value)}
                    placeholder={`${setting.key} değeri`}
                  />
                )}
                {setting.description ? (
                  <p className="mt-1 text-xs text-muted-foreground">{setting.description}</p>
                ) : null}
              </div>
              <Button
                onClick={() => handleSave(setting.key, setting.type)}
                disabled={setMutation.isPending}
                size="sm"
              >
                {setMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Kaydet"}
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Site Ayarları</CardTitle>
          <CardDescription>Sitenin genel ayarlarını yönetin</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-2">
            <Input
              value={newSettingKey}
              onChange={(e) => setNewSettingKey(e.target.value)}
              placeholder={`Yeni public ayar anahtarı (ör. ${PUBLIC_SETTING_PREFIX}homepage_tagline)`}
            />
            <Button type="button" variant="outline" onClick={handleAddSetting}>
              <Plus className="w-4 h-4 mr-2" />
              Alan Ekle
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Güvenlik için yeni ayarlar yalnızca <code>{PUBLIC_SETTING_PREFIX}</code> önekiyle oluşturulur.
          </p>

          {generalSettings.map((setting) => (
            <div key={setting.key} className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="text-sm font-medium block mb-1">{setting.label}</label>
                <Input
                  type={setting.inputMode ?? "text"}
                  value={settingsData[setting.key] || ""}
                  onChange={(e) => handleChange(setting.key, e.target.value)}
                  placeholder={`${setting.key} değeri`}
                />
                {setting.description ? (
                  <p className="mt-1 text-xs text-muted-foreground">{setting.description}</p>
                ) : null}
              </div>
              <Button
                onClick={() => handleSave(setting.key, setting.type)}
                disabled={setMutation.isPending}
                size="sm"
              >
                {setMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Kaydet"}
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sistem Bilgileri</CardTitle>
          <CardDescription>Gerçek zamanlı admin metrikleri</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Toplam Ürün:</span>
            <span className="font-medium">{products.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Toplam Haber:</span>
            <span className="font-medium">{articles.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Toplam Ayar:</span>
            <span className="font-medium">{settings.length}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
