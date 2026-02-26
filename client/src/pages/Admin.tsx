import { type FormEvent, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import AdminProducts from "@/components/admin/AdminProducts";
import AdminArticles from "@/components/admin/AdminArticles";
import AdminContent from "@/components/admin/AdminContent";
import AdminSettings from "@/components/admin/AdminSettings";
import AdminLocalization from "@/components/admin/AdminLocalization";
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

export default function Admin() {
  const { user, loading, refresh } = useAuth();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("products");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Yükleniyor...</div>;
  }

  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[oklch(0.10_0.01_250)]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Admin Girişi</CardTitle>
            <CardDescription>
              Admin paneline erişmek için kullanıcı adı ve şifre girin.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="admin-username">Kullanıcı adı</Label>
                <Input
                  id="admin-username"
                  value={username}
                  onChange={event => setUsername(event.target.value)}
                  autoComplete="username"
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Kontrol Paneli</h1>
          <p className="text-muted-foreground mt-2">Vaden sitesini yönetin ve güncelleyin</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="products">Ürünler</TabsTrigger>
            <TabsTrigger value="articles">Haberler</TabsTrigger>
            <TabsTrigger value="content">İçerik</TabsTrigger>
            <TabsTrigger value="settings">Ayarlar</TabsTrigger>
            <TabsTrigger value="localization">Dil & Tema</TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="space-y-4">
            <AdminProducts />
          </TabsContent>

          <TabsContent value="articles" className="space-y-4">
            <AdminArticles />
          </TabsContent>

          <TabsContent value="content" className="space-y-4">
            <AdminContent />
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <AdminSettings />
          </TabsContent>

          <TabsContent value="localization" className="space-y-4">
            <AdminLocalization />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
