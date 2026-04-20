import { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, MailOpen, MailWarning, MessageSquareText } from "lucide-react";
import { toast } from "sonner";

function getMailStatusBadge(status: "new" | "emailed" | "email_failed") {
  if (status === "emailed") {
    return <Badge className="bg-emerald-600 hover:bg-emerald-600">Mail Gönderildi</Badge>;
  }
  if (status === "email_failed") {
    return <Badge variant="destructive">Mail Hatası</Badge>;
  }
  return <Badge variant="secondary">Yeni</Badge>;
}

function formatDateTime(value: Date | string | null | undefined): string {
  if (!value) return "-";
  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleString("tr-TR");
}

export default function AdminQuotes() {
  const utils = trpc.useUtils();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data: quotes = [], isLoading } = trpc.admin.quoteSubmissions.list.useQuery({
    limit: 100,
  });
  const markReadMutation = trpc.admin.quoteSubmissions.markRead.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.admin.quoteSubmissions.list.invalidate(),
        utils.admin.quoteSubmissions.unreadCount.invalidate(),
      ]);
    },
  });

  const selectedQuote = useMemo(
    () => quotes.find((quote) => quote.id === selectedId) ?? null,
    [quotes, selectedId],
  );

  const handleSelect = async (quoteId: string, alreadyRead: boolean) => {
    setSelectedId(quoteId);
    if (alreadyRead) return;

    try {
      await markReadMutation.mutateAsync({ id: quoteId });
    } catch {
      toast.error("Teklif okundu olarak işaretlenemedi");
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Teklifler</CardTitle>
          <CardDescription>
            Okunmamış teklifler kalın ve vurgulu görünür. Tıkladığınız anda okundu olarak işaretlenir.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {quotes.length === 0 ? (
            <p className="text-sm text-muted-foreground">Henüz teklif kaydı yok.</p>
          ) : (
            <div className="space-y-2">
              {quotes.map((quote) => {
                const unread = !quote.readAt;
                const active = selectedId === quote.id;
                return (
                  <button
                    key={quote.id}
                    type="button"
                    onClick={() => void handleSelect(quote.id, !unread)}
                    className={`w-full rounded-lg border p-4 text-left transition-colors ${
                      active
                        ? "border-primary bg-primary/5"
                        : unread
                          ? "border-orange-300 bg-orange-50/60 hover:bg-orange-50"
                          : "hover:bg-muted/40"
                    }`}
                  >
                    <div className="mb-2 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className={`truncate text-sm ${unread ? "font-bold text-foreground" : "font-medium"}`}>
                          {quote.name}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">{quote.email}</p>
                      </div>
                      <div className="shrink-0">
                        {unread ? (
                          <Badge className="bg-red-600 hover:bg-red-600">Okunmadı</Badge>
                        ) : (
                          <Badge variant="secondary">Okundu</Badge>
                        )}
                      </div>
                    </div>

                    <p className={`truncate text-sm ${unread ? "font-semibold text-foreground" : "text-foreground"}`}>
                      {quote.subject}
                    </p>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                      {quote.message}
                    </p>
                    <div className="mt-3 flex items-center justify-between gap-3 text-xs text-muted-foreground">
                      <span>{formatDateTime(quote.createdAt)}</span>
                      {unread ? (
                        <MailWarning className="h-4 w-4 text-red-600" />
                      ) : (
                        <MailOpen className="h-4 w-4" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Teklif Detayı</CardTitle>
          <CardDescription>
            Sol listeden bir teklif seçerek detayları burada görüntüleyin.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!selectedQuote ? (
            <div className="flex min-h-[420px] flex-col items-center justify-center rounded-lg border border-dashed text-center text-muted-foreground">
              <MessageSquareText className="mb-3 h-8 w-8" />
              <p className="text-sm">Detay görmek için soldan bir teklif seçin.</p>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-2">
                {!selectedQuote.readAt ? (
                  <Badge className="bg-red-600 hover:bg-red-600">Okunmadı</Badge>
                ) : (
                  <Badge variant="secondary">Okundu</Badge>
                )}
                {getMailStatusBadge(selectedQuote.status)}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border p-4">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Ad Soyad
                  </p>
                  <p className="font-medium">{selectedQuote.name}</p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    E-posta
                  </p>
                  <p className="font-medium">{selectedQuote.email}</p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Telefon
                  </p>
                  <p className="font-medium">{selectedQuote.phone || "-"}</p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Tarih
                  </p>
                  <p className="font-medium">{formatDateTime(selectedQuote.createdAt)}</p>
                </div>
              </div>

              <div className="rounded-lg border p-4">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Konu
                </p>
                <p className="font-medium">{selectedQuote.subject}</p>
              </div>

              <div className="rounded-lg border p-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Mesaj
                </p>
                <p className="whitespace-pre-wrap text-sm text-foreground">
                  {selectedQuote.message}
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border p-4">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Okunma Zamanı
                  </p>
                  <p className="font-medium">{formatDateTime(selectedQuote.readAt)}</p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Sayfa Kaynağı
                  </p>
                  {selectedQuote.pageUrl ? (
                    <a
                      href={selectedQuote.pageUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="break-all font-medium text-primary underline-offset-4 hover:underline"
                    >
                      {selectedQuote.pageUrl}
                    </a>
                  ) : (
                    <p className="font-medium">-</p>
                  )}
                </div>
              </div>

              {selectedQuote.mailError ? (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  <p className="mb-1 font-semibold">Mail Hatası</p>
                  <p>{selectedQuote.mailError}</p>
                </div>
              ) : null}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
