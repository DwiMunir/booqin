# Booqin Fase 5 — Deploy Self-Host (Docker) — Design Spec

> Disetujui 2026-06-20. Target: **Docker** (portable: VPS/Coolify/Fly/Render/Railway). Memanfaatkan `output: 'standalone'`.

## Artefak
| File | Isi |
|---|---|
| `Dockerfile` | Multi-stage `node:22-alpine` (+`libc6-compat` utk sharp): **deps** (corepack pnpm + `pnpm install --frozen-lockfile`) → **builder** (build ARG + `pnpm build`) → **runner** (user non-root, copy `.next/standalone`+`.next/static`+`public`, `CMD ["node","server.js"]`). |
| `.dockerignore` | abaikan `node_modules`, `.next`, `.git`, `.env*`, `_landingpage`, `docs`, `sanity-studio-schemas`, dll. |
| `docker-compose.yml` | 1 service `web`, build args, `env_file: .env.production`, port 3000, `restart: unless-stopped`. |
| `DEPLOY.md` | checklist deploy lengkap. |

## Pemisahan env (kritis)
- **BUILD-time** (di-bake; `--build-arg`): `NEXT_PUBLIC_SITE_URL` (di-inline), `APP_ENV` (robots.txt/sitemap.xml di-prerender statis → harus `production` saat build supaya robots allow-all).
- **RUNTIME** (secret; `--env-file`): `SANITY_PROJECT_ID/DATASET/API_TOKEN`, `CMS_WEBHOOK_SECRET`, `RESEND_API_KEY`, `RESEND_AUDIENCE_ID`. Jangan di-bake ke layer image.
- Halaman `/` di-prerender statis saat build (konten = fallback hardcode = identik CMS sekarang); webhook menjaga fresh. *(Opsional: kirim `SANITY_*` read-only sbg build-arg bila mau prerender dari CMS.)*

## Dockerfile detail
- deps & builder install di alpine (musl) → sharp dapat binary musl yang benar, ikut ter-trace ke standalone.
- runner: `ENV HOSTNAME=0.0.0.0 PORT=3000 NODE_ENV=production`, EXPOSE 3000.
- `next start` TIDAK dipakai (incompatible dgn standalone) — entrypoint `node server.js`.

## Verifikasi (lokal, di sandbox)
1. `pnpm build` → cek `.next/standalone/server.js` ada.
2. Tiru runner: copy `.next/static` → `.next/standalone/.next/static`, `public` → `.next/standalone/public`, lalu `node .next/standalone/server.js` + curl (h1, status 200) → buktikan standalone boot & serve.
3. Bila `docker` tersedia: `docker build` (best-effort).

## DEPLOY.md — checklist
1. Set env (tabel build vs runtime).
2. Build: `docker build --build-arg NEXT_PUBLIC_SITE_URL=https://<domain> --build-arg APP_ENV=production -t booqin .`
3. Run: `docker run -p 3000:3000 --env-file .env.production booqin` (atau `docker compose up -d`).
4. Domain + HTTPS: reverse proxy (nginx/Caddy/Traefik) terminasi TLS → proxy ke `:3000`.
5. Daftarkan webhook Sanity: `https://<domain>/api/revalidate` + `CMS_WEBHOOK_SECRET` + projection `{ "slug": slug.current }`, filter `_type=="page"`.
6. CDN: bila ada CDN generik di depan, webhook harus **purge CDN** juga (revalidateTag tak mem-purge CDN).
7. Catatan: single-instance = filesystem cache (revalidateTag jalan); multi-instance → `cacheHandler` Redis (follow-up).
8. Smoke: halaman live · form → audience Resend · edit Sanity→publish→webhook→halaman update.

## Gate
`pnpm build` lulus + standalone server boot & serve 200 (h1 ada). Docker build best-effort.
