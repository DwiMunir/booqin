import type { NextConfig } from 'next'

const isDev = process.env.NODE_ENV === 'development'

// CSP STATIS (bukan nonce — nonce memaksa rendering dinamis & merusak static-first/CDN).
// Rollout Report-Only DULU: amati pelanggaran (DevTools console / prod), lalu set `cspReportOnly = false`
// untuk menegakkan. Selama report-only, X-Frame-Options DENY tetap menutup clickjacking.
const cspReportOnly = true

const csp = [
  "default-src 'self'",
  // Tanpa nonce, 'unsafe-inline' wajib (Next inject inline script/style). 'unsafe-eval' HANYA dev (HMR).
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  // Gambar lokal + blur data URI (next/image) + CDN Sanity (remotePatterns).
  "img-src 'self' data: https://cdn.sanity.io",
  "font-src 'self'",
  // /api/vitals & Server Action = self. Sanity fetch terjadi server-side (tak kena CSP browser).
  // Saat menambah Turnstile/analytics nanti, tambahkan origin-nya di connect-src/script-src.
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  ...(isDev ? [] : ['upgrade-insecure-requests']),
].join('; ')

const securityHeaders = [
  {
    key: cspReportOnly ? 'Content-Security-Policy-Report-Only' : 'Content-Security-Policy',
    value: csp,
  },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Legacy fallback; `frame-ancestors 'none'` lebih utama saat CSP ditegakkan.
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
  // HSTS hanya produksi (diabaikan browser di http localhost). Tanpa `preload` — domain di bawah parent bersama.
  ...(isDev
    ? []
    : [{ key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' }]),
]

const nextConfig: NextConfig = {
  // Pin workspace root ke folder proyek (ada lockfile lain di home dir yang membingungkan deteksi root).
  turbopack: { root: import.meta.dirname },
  // Cache Components (Next 16): pages prerender static; dynamic holes opt-in via Suspense / 'use cache'.
  cacheComponents: true,
  typedRoutes: true,
  // React 19.2 + React Compiler (wajib per AGENTS.md).
  reactCompiler: true,
  // Self-host: image Docker ramping.
  output: 'standalone',
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }]
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    qualities: [50, 75, 90],
    // 30 hari.
    minimumCacheTTL: 60 * 60 * 24 * 30,
    remotePatterns: [{ protocol: 'https', hostname: 'cdn.sanity.io' }],
  },
  allowedDevOrigins: ['unfelt-natasha-nonmythically.ngrok-free.dev', 'booqin.moonir.dev'],
}

export default nextConfig
