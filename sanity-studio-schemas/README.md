# Booqin — Sanity Studio Schemas (deliverable Fase 2)

Folder ini berisi **skema Sanity** untuk Studio Booqin. Studio dijalankan sebagai **repo/app terpisah** (standalone) sesuai `AGENTS.md` — file di sini adalah cetak biru yang tinggal kamu pindahkan ke repo Studio.

> ⚠️ **File ini sengaja TIDAK dikompilasi oleh app Next.js.** App tidak meng-install paket `sanity`, jadi editor akan menandai `Cannot find module 'sanity'` dan `r implicitly any`. Itu **normal** — error hilang di repo Studio (yang punya `sanity`). Folder ini sudah di-exclude dari `tsconfig.json` & `biome.json` app.

## Isi

| File | Isi |
|---|---|
| `documents.ts` | `page` (title, slug, seo, pageBuilder), `siteSettings` (singleton: nav + footer) |
| `blocks.ts` | 8 blok pageBuilder: `hero`, `problem`, `aiSpotlight`, `howItWorks`, `features`, `socialProof`, `faq`, `cta` + array `pageBuilder` |
| `objects.ts` | object reusable: `seo`, `navLink`, `iconCard`, `step`, `testimonial`, `faqItem`, `chatMessage` |
| `index.ts` | `schemaTypes` (gabungan semua) |

**Penting:** `name` tiap blok = `_type` yang dipakai `components/block-renderer.tsx` di app, dan nama field = field di `lib/cms/types.ts`. Jadi GROQ `pageBuilder[]{...}` (spread) langsung cocok tanpa alias.

## Cara pakai

1. **Buat Studio standalone** (dari root repo, BUKAN di dalam app Next.js):
   ```bash
   npm create sanity@latest -- --template clean --typescript --output-path studio
   ```
2. **Salin** `documents.ts`, `blocks.ts`, `objects.ts`, `index.ts` ke `studio/schemaTypes/`.
3. **Daftarkan** di `studio/sanity.config.ts`:
   ```ts
   import { schemaTypes } from './schemaTypes'
   export default defineConfig({
     projectId: 'xxxx',
     dataset: 'production',
     schema: { types: schemaTypes },
     // siteSettings sebaiknya jadi singleton lewat Structure (deduplikasi dokumen)
   })
   ```
4. **Jalankan**: `cd studio && npm run dev` (http://localhost:3333). Tambah CORS app:
   ```bash
   npx sanity cors add http://localhost:3000 --credentials
   ```

## Sambungkan ke app (aktifkan Pola B live)

Set env app (`.env.local`) — app otomatis beralih dari fallback hardcode ke query Sanity:
```
SANITY_PROJECT_ID=...
SANITY_DATASET=production
SANITY_API_TOKEN=...        # server-only (read)
CMS_WEBHOOK_SECRET=...      # server-only
```
`lib/cms/client.ts` → `isSanityConfigured()` jadi true → `getCachedPage('home')` query `PAGE_QUERY`. Buat dokumen `page` dengan `slug = "home"`.

## Webhook revalidate (Pola B)

Di Sanity Manage → API → Webhooks:
- **URL:** `https://<domain>/api/revalidate`
- **Trigger:** on publish, filter `_type == "page"`
- **Projection:** `{ "slug": slug.current }`
- **Secret:** sama dengan `CMS_WEBHOOK_SECRET`

App memanggil `revalidateTag('page:'+slug, 'max')`. (Untuk `siteSettings`, extend route/projection sesuai kebutuhan.)

## Follow-up

- **TypeGen** menggantikan type manual di `lib/cms/types.ts`: `sanity schema extract` lalu `sanity typegen generate` terhadap `defineQuery` di `lib/cms/queries.ts`.
- **Image CMS**: blok `socialProof.photos` sudah dimodelkan `image[]` (+ alt). App saat ini render **gambar lokal** + alt; wiring `urlFor` + LQIP + `next/image` adalah follow-up kecil (juga untuk hero image).
- **Visual Editing / Presentation** (opsional): tambah `defineLive` / `<VisualEditing/>` jika nanti mau editing visual — di luar Pola B saat ini.
