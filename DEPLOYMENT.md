# BRAC VPS Deployment

Bu proje, mevcut `orderai` ve `runmate` akisini bozmadan ayri bir Docker Compose stack olarak calismak uzere hazirlandi.

## Hedef mimari

- BRAC stack'i: `/opt/brac`
- App container: `brac-web`
- MySQL container: `brac-db`
- Uygulama host portu: `127.0.0.1:3001`
- TLS ve public erisim: mevcut `orderai-caddy` uzerinden
- Onerilen host: `brac.204.168.196.102.sslip.io`

## Sunucuda ilk kurulum

1. Projeyi `/opt/brac` altina kopyala.
2. `.env.production.example` dosyasini `.env.production` olarak olustur.
3. En az su alanlari gercek degerlerle doldur:
   - `JWT_SECRET`
   - `ADMIN_PASSWORD`
   - `MYSQL_PASSWORD`
   - `MYSQL_ROOT_PASSWORD`
   - `DATABASE_URL`
4. Stack'i ayaga kaldir:

```bash
cd /opt/brac
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build
```

## Caddy yonlendirmesi

Mevcut Caddy dosyasi `/opt/orderai/infra/Caddyfile` icinde. Asagidaki blok eklenmeli:

```caddy
brac.204.168.196.102.sslip.io {
  encode gzip zstd

  reverse_proxy 172.17.0.1:3001 {
    header_up Host {host}
    header_up X-Forwarded-Proto {scheme}
  }
}
```

Ardindan Caddy yeniden yuklenmeli:

```bash
docker exec orderai-caddy caddy reload --config /etc/caddy/Caddyfile
```

## Kontrol komutlari

```bash
cd /opt/brac
docker compose --env-file .env.production -f docker-compose.prod.yml ps
docker compose --env-file .env.production -f docker-compose.prod.yml logs -f web
docker compose --env-file .env.production -f docker-compose.prod.yml logs -f db
curl -I http://127.0.0.1:3001/healthz
curl -I https://brac.204.168.196.102.sslip.io/healthz
```
