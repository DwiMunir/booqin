# Deploy — Booqin (self-host, Docker)

App Next.js 16 `output: 'standalone'`. Entrypoint produksi: **`node server.js`** (BUKAN `next start`).

## 1. Env: build-time vs runtime (PENTING)

| Kapan | Variabel | Cara set | Catatan |
|---|---|---|---|
| **BUILD-time** (di-bake) | `NEXT_PUBLIC_SITE_URL` | `--build-arg` | di-inline ke bundle + `metadataBase`/canonical/OG |
| **BUILD-time** | `APP_ENV` | `--build-arg` | `robots.txt` & `sitemap.xml` di-prerender statis saat build → **harus `production`** agar robots allow-all |
| **RUNTIME** (secret) | `SANITY_PROJECT_ID`, `SANITY_DATASET`, `SANITY_API_TOKEN` | `--env-file` | dipakai untuk revalidasi (webhook) + sitemap |
| **RUNTIME** | `CMS_WEBHOOK_SECRET` | `--env-file` | verifikasi webhook |
| **RUNTIME** | `RESEND_API_KEY` (Full access), `RESEND_AUDIENCE_ID` | `--env-file` | server action form |

> Jangan bake secret ke layer image. `SANITY_API_TOKEN` cukup **read-only** untuk app (write token hanya untuk seeding lokal).
> Halaman `/` di-prerender statis saat build (konten = fallback hardcode, identik isi CMS). Webhook menjaga konten fresh setelah publish. (Opsional: kirim `SANITY_*` read-only sebagai build-arg bila ingin prerender langsung dari CMS.)

Buat `.env.production` (runtime, JANGAN commit):
```
SANITY_PROJECT_ID=qan9kcj2
SANITY_DATASET=production
SANITY_API_TOKEN=<read-only token>
CMS_WEBHOOK_SECRET=<secret webhook>
RESEND_API_KEY=<full-access key>
RESEND_AUDIENCE_ID=5cb827d6-75b4-426e-9349-a01dd44fd19f
APP_ENV=production
NEXT_PUBLIC_SITE_URL=https://<domain-produksi>
```

## 2. Build & run

**Docker langsung:**
```bash
docker build \
  --build-arg NEXT_PUBLIC_SITE_URL=https://<domain-produksi> \
  --build-arg APP_ENV=production \
  -t booqin .

docker run -d --name booqin -p 3000:3000 --env-file .env.production booqin
```

**Atau docker compose** (`NEXT_PUBLIC_SITE_URL`/`APP_ENV` dari shell/.env saat build):
```bash
NEXT_PUBLIC_SITE_URL=https://<domain> APP_ENV=production docker compose build
docker compose up -d
```

Cek: `curl -I http://localhost:3000` → 200.

## 3. Domain + HTTPS

Taruh reverse proxy di depan (terminasi TLS) → proxy ke `:3000`. Contoh **Caddy** (auto-HTTPS):
```
<domain-produksi> {
  reverse_proxy localhost:3000
}
```
Atau nginx + certbot, atau Traefik. Pastikan header `Host`/`X-Forwarded-*` diteruskan.

## 4. Webhook revalidate (Pola B)

Sanity Manage → API → Webhooks → Create:
- **URL:** `https://<domain-produksi>/api/revalidate`
- **Trigger:** on publish (Create/Update/Delete), filter `_type == "page"`
- **Projection:** `{ "slug": slug.current }`
- **HTTP method:** `POST`
- **Secret:** sama dengan `CMS_WEBHOOK_SECRET`

> Edit `siteSettings` (nav/footer) belum ter-cover route webhook saat ini (hanya `page`). Bisa di-extend bila perlu.

## 5. CDN (kalau ada)

Bila ada CDN generik (mis. Cloudflare) di depan, `revalidateTag` **tidak** mem-purge cache CDN. Tambahkan langkah purge CDN di alur publish (atau set cache CDN bypass untuk HTML).

## 6. Scaling

Single-instance: default **filesystem cache** → `revalidateTag` jalan. Multi-instance/replika: butuh `cacheHandler` kustom (mis. Redis) agar cache shared — follow-up bila scaling.

## 7. Smoke test (setelah live)

- [ ] `https://<domain>` tampil (200), 1× `<h1>`, gambar termuat (AVIF/WebP).
- [ ] `https://<domain>/robots.txt` → allow-all + `Sitemap:` (karena `APP_ENV=production`).
- [ ] `https://<domain>/sitemap.xml` → memuat URL domain produksi.
- [ ] Submit form waitlist (email + consent) → muncul di Resend → Audiences → *General*.
- [ ] Edit konten di Sanity Studio → Publish → (webhook) reload halaman → konten ter-update.
