import { type FormEvent, type ReactNode, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import AdminProducts from "@/components/admin/AdminProducts";
import AdminArticles from "@/components/admin/AdminArticles";
import AdminContent from "@/components/admin/AdminContent";
import AdminQuotes from "@/components/admin/AdminQuotes";
import AdminSettings from "@/components/admin/AdminSettings";
import AdminLocalization from "@/components/admin/AdminLocalization";
import AdminAuditLogs from "@/components/admin/AdminAuditLogs";
import AdminUsers from "@/components/admin/AdminUsers";
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
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  hasAdminPermission,
  isAdminRole,
  isSuperAdminRole,
} from "@shared/adminRoles";

export default function Admin() {
  const { user, loading, refresh } = useAuth();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("products");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordChangeError, setPasswordChangeError] = useState<string | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const canManageQuotes = Boolean(
    user && !user.passwordResetRequired && hasAdminPermission(user.role, "settings:write"),
  );
  const { data: unreadQuoteCount = 0 } = trpc.admin.quoteSubmissions.unreadCount.useQuery(
    undefined,
    { enabled: canManageQuotes },
  );

  const availableTabs = useMemo(() => {
    if (!user || !isAdminRole(user.role)) return [];

    const role = user.role;
    const tabs: Array<{ key: string; label: ReactNode }> = [];

    if (hasAdminPermission(role, "products:write")) {
      tabs.push({ key: "products", label: "Ürünler" });
    }
    if (hasAdminPermission(role, "articles:write")) {
      tabs.push({ key: "articles", label: "Haberler" });
    }
    if (hasAdminPermission(role, "content:write")) {
      tabs.push({ key: "content", label: "İçerik" });
    }
    if (hasAdminPermission(role, "settings:write")) {
      tabs.push({
        key: "quotes",
        label: (
          <span className="inline-flex items-center gap-2">
            <span>Teklifler</span>
            {unreadQuoteCount > 0 ? (
              <Badge className="bg-red-600 px-1.5 py-0 text-[10px] leading-4 hover:bg-red-600">
                {unreadQuoteCount}
              </Badge>
            ) : null}
          </span>
        ),
      });
    }
    if (hasAdminPermission(role, "settings:write")) {
      tabs.push({ key: "settings", label: "Ayarlar" });
    }
    if (hasAdminPermission(role, "localization:write")) {
      tabs.push({ key: "localization", label: "Dil & Tema" });
    }
    if (isSuperAdminRole(role)) {
      tabs.push({ key: "users", label: "Kullanıcılar" });
      tabs.push({ key: "audit", label: "Audit Log" });
    }

    return tabs;
  }, [unreadQuoteCount, user]);
  const hasTab = (key: string) => availableTabs.some((tab) => tab.key === key);

  useEffect(() => {
    if (availableTabs.length === 0) return;
    const hasActive = availableTabs.some((tab) => tab.key === activeTab);
    if (!hasActive) {
      setActiveTab(availableTabs[0].key);
    }
  }, [availableTabs, activeTab]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(min-width: 768px)").matches) return;

    const activeTrigger = document.getElementById(`admin-tab-trigger-${activeTab}`);
    activeTrigger?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [activeTab]);

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setLoginError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ username, password }),
      });

      const result = await response
        .json()
        .catch(() => ({ error: "Giriş sırasında bir hata oluştu." }));

      if (!response.ok) {
        setLoginError(
          typeof result.error === "string"
            ? result.error
            : "Giriş sırasında bir hata oluştu."
        );
        return;
      }

      await refresh();
      navigate("/admin");
    } catch (error) {
      setLoginError("Giriş sırasında bir hata oluştu.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForcedPasswordChange = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPasswordChangeError(null);

    if (newPassword !== confirmNewPassword) {
      setPasswordChangeError("Yeni sifre ve tekrar sifresi ayni olmalidir.");
      return;
    }

    setIsChangingPassword(true);
    try {
      const response = await fetch("/api/admin/password/change", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          newPassword,
        }),
      });

      const result = await response
        .json()
        .catch(() => ({ error: "Sifre guncellenemedi." }));

      if (!response.ok) {
        setPasswordChangeError(
          typeof result.error === "string" ? result.error : "Sifre guncellenemedi.",
        );
        return;
      }

      setNewPassword("");
      setConfirmNewPassword("");
      await refresh();
      navigate("/admin");
    } catch (error) {
      setPasswordChangeError("Sifre guncellenemedi.");
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Yükleniyor...</div>;
  }

  if (!user || !isAdminRole(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[oklch(0.10_0.01_250)]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Admin Girişi</CardTitle>
            <CardDescription>
              Admin paneline erişmek için kullanıcı adı / e-posta ve şifre girin.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="admin-username">Kullanıcı adı / E-posta</Label>
                <Input
                  id="admin-username"
                  value={username}
                  onChange={event => setUsername(event.target.value)}
                  autoComplete="username"
                  placeholder="admin veya kullanici@firma.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="admin-password">Şifre</Label>
                <Input
                  id="admin-password"
                  type="password"
                  value={password}
                  onChange={event => setPassword(event.target.value)}
                  autoComplete="current-password"
                  required
                />
              </div>

              {loginError ? (
                <p className="text-sm text-destructive">{loginError}</p>
              ) : null}

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Giriş yapılıyor..." : "Giriş Yap"}
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => navigate("/")}
              >
                Ana sayfaya dön
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (user.passwordResetRequired) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[oklch(0.10_0.01_250)]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Yeni Şifre Belirleyin</CardTitle>
            <CardDescription>
              Geçici şifre ile giriş yaptınız. Devam etmek için yeni bir şifre oluşturmanız gerekiyor.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleForcedPasswordChange} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">Yeni Şifre</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-new-password">Yeni Şifre Tekrar</Label>
                <Input
                  id="confirm-new-password"
                  type="password"
                  value={confirmNewPassword}
                  onChange={(event) => setConfirmNewPassword(event.target.value)}
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              </div>

              {passwordChangeError ? (
                <p className="text-sm text-destructive">{passwordChangeError}</p>
              ) : null}

              <Button type="submit" className="w-full" disabled={isChangingPassword}>
                {isChangingPassword ? "Sifre guncelleniyor..." : "Sifreyi Guncelle"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Kontrol Paneli</h1>
          <p className="text-muted-foreground mt-2">BRAC sitesini yönetin ve güncelleyin</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-1 left-0 z-10 w-6 bg-gradient-to-r from-background to-transparent md:hidden" />
            <div className="pointer-events-none absolute inset-y-1 right-0 z-10 w-6 bg-gradient-to-l from-background to-transparent md:hidden" />
            <div className="overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              <TabsList
                className="h-auto w-max min-w-full justify-start gap-1 rounded-xl p-1 md:grid md:w-full md:justify-center"
                style={{
                  gridTemplateColumns: `repeat(${Math.max(1, availableTabs.length)}, minmax(0, 1fr))`,
                }}
              >
                {availableTabs.map((tab) => (
                  <TabsTrigger
                    key={tab.key}
                    id={`admin-tab-trigger-${tab.key}`}
                    value={tab.key}
                    className="h-auto min-h-10 flex-none px-3 py-2 text-[13px] md:flex-1 md:px-2 md:text-sm"
                  >
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
          </div>

          {hasTab("products") ? (
            <TabsContent value="products" className="space-y-4">
              <AdminProducts />
            </TabsContent>
          ) : null}

          {hasTab("articles") ? (
            <TabsContent value="articles" className="space-y-4">
              <AdminArticles />
            </TabsContent>
          ) : null}

          {hasTab("content") ? (
            <TabsContent value="content" className="space-y-4">
              <AdminContent />
            </TabsContent>
          ) : null}

          {hasTab("quotes") ? (
            <TabsContent value="quotes" className="space-y-4">
              <AdminQuotes />
            </TabsContent>
          ) : null}

          {hasTab("settings") ? (
            <TabsContent value="settings" className="space-y-4">
              <AdminSettings />
            </TabsContent>
          ) : null}

          {hasTab("localization") ? (
            <TabsContent value="localization" className="space-y-4">
              <AdminLocalization />
            </TabsContent>
          ) : null}

          {hasTab("users") ? (
            <TabsContent value="users" className="space-y-4">
              <AdminUsers />
            </TabsContent>
          ) : null}

          {hasTab("audit") ? (
            <TabsContent value="audit" className="space-y-4">
              <AdminAuditLogs />
            </TabsContent>
          ) : null}
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
