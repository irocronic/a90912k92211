import { type FormEvent, useMemo, useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const ROLE_OPTIONS = [
  { value: "user", label: "User" },
  { value: "content_editor", label: "Content Editor" },
  { value: "super_admin", label: "Super Admin" },
] as const;

type AssignableRole = (typeof ROLE_OPTIONS)[number]["value"];

function formatDateTime(value: Date | string | null | undefined): string {
  if (!value) return "-";
  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleString("tr-TR");
}

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeAssignableRole(role: string): AssignableRole {
  if (role === "content_editor") return "content_editor";
  if (role === "super_admin" || role === "admin") return "super_admin";
  return "user";
}

export default function AdminUsers() {
  const { data: users = [], isLoading, refetch } = trpc.admin.users.list.useQuery(
    undefined,
    { refetchOnWindowFocus: false },
  );
  const createUserMutation = trpc.admin.users.create.useMutation();
  const setRoleMutation = trpc.admin.users.setRole.useMutation();

  const [search, setSearch] = useState("");
  const [newUserForm, setNewUserForm] = useState<{
    openId: string;
    name: string;
    email: string;
    loginMethod: string;
    role: AssignableRole;
  }>({
    openId: "",
    name: "",
    email: "",
    loginMethod: "manual",
    role: "user",
  });
  const [draftRoles, setDraftRoles] = useState<Record<number, AssignableRole>>({});
  const [savingUserId, setSavingUserId] = useState<number | null>(null);

  const filteredUsers = useMemo(() => {
    const normalizedSearch = normalizeText(search);
    if (!normalizedSearch) return users;

    return users.filter((user) => {
      const haystack = normalizeText(
        [
          user.name || "",
          user.email || "",
          user.openId || "",
          user.role || "",
          user.loginMethod || "",
        ].join(" "),
      );
      return haystack.includes(normalizedSearch);
    });
  }, [users, search]);

  const getCurrentRole = (userId: number, actualRole: string): AssignableRole => {
    const draft = draftRoles[userId];
    if (draft) return draft;
    return normalizeAssignableRole(actualRole);
  };

  const handleRoleChange = (userId: number, role: AssignableRole) => {
    setDraftRoles((prev) => ({ ...prev, [userId]: role }));
  };

  const handleCreateUser = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const payload = {
      openId: newUserForm.openId.trim(),
      name: newUserForm.name.trim(),
      email: newUserForm.email.trim(),
      loginMethod: newUserForm.loginMethod.trim(),
      role: newUserForm.role,
    };

    if (!payload.openId) {
      toast.error("openId zorunludur.");
      return;
    }

    try {
      await createUserMutation.mutateAsync(payload);
      toast.success("Yeni kullanıcı oluşturuldu.");
      setNewUserForm({
        openId: "",
        name: "",
        email: "",
        loginMethod: "manual",
        role: "user",
      });
      await refetch();
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Kullanıcı oluşturulamadı";
      toast.error(message);
    }
  };

  const handleSaveRole = async (
    userId: number,
    role: AssignableRole,
    displayName: string,
  ) => {
    try {
      setSavingUserId(userId);
      await setRoleMutation.mutateAsync({ userId, role });
      toast.success(`${displayName} rolü güncellendi`);
      setDraftRoles((prev) => {
        const next = { ...prev };
        delete next[userId];
        return next;
      });
      await refetch();
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Rol güncelleme başarısız";
      toast.error(message);
    } finally {
      setSavingUserId(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5" />
          Kullanıcı Yönetimi
        </CardTitle>
        <CardDescription>
          Super admin olarak kullanıcı oluşturabilir ve rollerini yönetebilirsiniz.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form
          onSubmit={handleCreateUser}
          className="rounded-md border border-border/60 bg-muted/20 p-4 space-y-4"
        >
          <div className="space-y-1">
            <Label htmlFor="new-user-openid">openId *</Label>
            <Input
              id="new-user-openid"
              placeholder="ornek: manus:12345 veya email:ali@firma.com"
              value={newUserForm.openId}
              onChange={(event) =>
                setNewUserForm((prev) => ({ ...prev, openId: event.target.value }))
              }
              required
            />
            <p className="text-xs text-muted-foreground">
              Bu alan, OAuth/openId ile eşleşeceği için benzersiz olmalıdır.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="new-user-name">Ad Soyad</Label>
              <Input
                id="new-user-name"
                placeholder="Örn: Ayşe Yılmaz"
                value={newUserForm.name}
                onChange={(event) =>
                  setNewUserForm((prev) => ({ ...prev, name: event.target.value }))
                }
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="new-user-email">E-posta</Label>
              <Input
                id="new-user-email"
                type="email"
                placeholder="ornek@firma.com"
                value={newUserForm.email}
                onChange={(event) =>
                  setNewUserForm((prev) => ({ ...prev, email: event.target.value }))
                }
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="new-user-login-method">Giriş Yöntemi</Label>
              <Input
                id="new-user-login-method"
                placeholder="manual / google / email..."
                value={newUserForm.loginMethod}
                onChange={(event) =>
                  setNewUserForm((prev) => ({
                    ...prev,
                    loginMethod: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="new-user-role">Rol</Label>
              <select
                id="new-user-role"
                value={newUserForm.role}
                onChange={(event) =>
                  setNewUserForm((prev) => ({
                    ...prev,
                    role: event.target.value as AssignableRole,
                  }))
                }
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                {ROLE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={createUserMutation.isPending}>
              {createUserMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Oluşturuluyor...
                </>
              ) : (
                "Yeni Kullanıcı Oluştur"
              )}
            </Button>
          </div>
        </form>

        <Input
          placeholder="İsim, e-posta, openId veya role göre ara"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <p className="text-sm text-muted-foreground">Kullanıcı bulunamadı.</p>
        ) : (
          <div className="overflow-auto border rounded-md">
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr className="text-left">
                  <th className="px-3 py-2">Kullanıcı</th>
                  <th className="px-3 py-2">E-posta</th>
                  <th className="px-3 py-2">Mevcut Rol</th>
                  <th className="px-3 py-2">Yeni Rol</th>
                  <th className="px-3 py-2">Son Giriş</th>
                  <th className="px-3 py-2">Aksiyon</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => {
                  const currentRole = getCurrentRole(user.id, user.role);
                  const hasRoleChanged =
                    currentRole !== normalizeAssignableRole(user.role);
                  const displayName = user.name || user.email || `#${user.id}`;

                  return (
                    <tr key={user.id} className="border-t align-top">
                      <td className="px-3 py-2 min-w-[180px]">
                        <p className="font-medium">{displayName}</p>
                        <p className="text-xs text-muted-foreground break-all">
                          {user.openId}
                        </p>
                      </td>
                      <td className="px-3 py-2">{user.email || "-"}</td>
                      <td className="px-3 py-2">
                        <Badge variant={user.role === "super_admin" ? "default" : "secondary"}>
                          {user.role}
                        </Badge>
                      </td>
                      <td className="px-3 py-2">
                        <select
                          value={currentRole}
                          onChange={(event) =>
                            handleRoleChange(
                              user.id,
                              event.target.value as AssignableRole,
                            )
                          }
                          className="h-9 min-w-[180px] rounded-md border border-input bg-background px-3 text-sm"
                        >
                          {ROLE_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        {formatDateTime(user.lastSignedIn)}
                      </td>
                      <td className="px-3 py-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={!hasRoleChanged || savingUserId === user.id}
                          onClick={() =>
                            handleSaveRole(user.id, currentRole, displayName)
                          }
                        >
                          {savingUserId === user.id ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Kaydediliyor...
                            </>
                          ) : (
                            "Kaydet"
                          )}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
