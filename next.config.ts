import type { NextConfig } from 'next'

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
