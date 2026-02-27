import { useEffect, useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PUBLIC_SETTING_PREFIX } from "@shared/const";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

const DEFAULT_SETTINGS = [
  { key: "site_title", label: "Site Başlığı", type: "string" as const },
  { key: "site_description", label: "Site Açıklaması", type: "string" as const },
  { key: "contact_email", label: "İletişim E-postası", type: "string" as const },
  { key: "contact_phone", label: "İletişim Telefonu", type: "string" as const },
  { key: "social_twitter", label: "Twitter URL", type: "string" as const },
  { key: "social_linkedin", label: "LinkedIn URL", type: "string" as const },
  { key: "social_facebook", label: "Facebook URL", type: "string" as const },
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
      return next;
    });
  }, [settings]);

  const settingDefinitions = useMemo(() => {
    const map = new Map<string, { key: string; label: string; type: "string" | "number" | "boolean" | "json" }>();
    DEFAULT_SETTINGS.forEach((item) => map.set(item.key, item));
    settings.forEach((item) => {
      if (!map.has(item.key)) {
        map.set(item.key, {
          key: item.key,
          label: item.key,
          type: item.type,
        });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.key.localeCompare(b.key, "tr"));
  }, [settings]);

  const handleChange = (key: string, value: string) => {
    setSettingsData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async (key: string, type: "string" | "number" | "boolean" | "json" = "string") => {
    try {
      await setMutation.mutateAsync({
        key,
        value: settingsData[key] || "",
        type,
      });
      toast.success("Ayar kaydedildi");
      await refetch();
    } catch (error) {
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

          {settingDefinitions.map((setting) => (
            <div key={setting.key} className="flex gap-2 items-end">
              <div className="flex-1">
                <label className="text-sm font-medium block mb-1">{setting.label}</label>
                <Input
                  value={settingsData[setting.key] || ""}
                  onChange={(e) => handleChange(setting.key, e.target.value)}
                  placeholder={`${setting.key} değeri`}
                />
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
