import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
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

function formatDateTime(value: Date | string | null | undefined): string {
  if (!value) return "-";
  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleString("tr-TR");
}

function summarizeMetadata(metadata: unknown): string {
  if (!metadata || typeof metadata !== "object") return "-";
  try {
    const raw = JSON.stringify(metadata);
    if (raw.length <= 160) return raw;
    return `${raw.slice(0, 160)}...`;
  } catch {
    return "[unserializable]";
  }
}

export default function AdminAuditLogs() {
  const [page, setPage] = useState(1);
  const [resource, setResource] = useState("");
  const [status, setStatus] = useState<"" | "success" | "error" | "denied">("");

  const queryInput = useMemo(
    () => ({
      page,
      pageSize: 50,
      resource: resource.trim() || undefined,
      status: status || undefined,
    }),
    [page, resource, status],
  );

  const { data, isLoading, refetch } = trpc.admin.audit.list.useQuery(queryInput, {
    refetchOnWindowFocus: false,
  });

  const items = data?.items ?? [];
  const totalPages = data?.totalPages ?? 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Audit Log</CardTitle>
        <CardDescription>
          Admin işlemlerinin kim tarafından, ne zaman ve hangi sonuçla çalıştığını izleyin.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_180px_auto] gap-2">
          <Input
            placeholder="Resource filtresi (örn: products, pageContent, i18n)"
            value={resource}
            onChange={(event) => {
              setResource(event.target.value);
              setPage(1);
            }}
          />
          <select
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as "" | "success" | "error" | "denied");
              setPage(1);
            }}
          >
            <option value="">Tüm Durumlar</option>
            <option value="success">success</option>
            <option value="error">error</option>
            <option value="denied">denied</option>
          </select>
          <Button type="button" variant="outline" onClick={() => refetch()}>
            Yenile
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Audit kaydı bulunamadı.</p>
        ) : (
          <div className="overflow-auto border rounded-md">
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr className="text-left">
                  <th className="px-3 py-2">Zaman</th>
                  <th className="px-3 py-2">Kullanıcı</th>
                  <th className="px-3 py-2">Rol</th>
                  <th className="px-3 py-2">Aksiyon</th>
                  <th className="px-3 py-2">Resource</th>
                  <th className="px-3 py-2">Durum</th>
                  <th className="px-3 py-2">Meta</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-t align-top">
                    <td className="px-3 py-2 whitespace-nowrap">
                      {formatDateTime(item.createdAt)}
                    </td>
                    <td className="px-3 py-2">{item.actorUserId}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{item.actorRole}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{item.action}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{item.resource}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{item.status}</td>
                    <td className="px-3 py-2 min-w-[260px]">
                      <code className="text-xs">{summarizeMetadata(item.metadata)}</code>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Toplam kayıt: {data?.total ?? 0}
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={page <= 1}
            >
              Önceki
            </Button>
            <span className="text-sm">
              {page} / {Math.max(1, totalPages)}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPage((prev) => prev + 1)}
              disabled={totalPages > 0 ? page >= totalPages : true}
            >
              Sonraki
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
