import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['**/*.test.{ts,tsx}'],
    exclude: ['node_modules', '.next', '_landingpage'],
  },
  resolve: {
    alias: {
      // next/image butuh StaticImageData; di jsdom impor gambar jadi string -> pakai stub.
      'next/image': resolve(import.meta.dirname, 'tests/mocks/next-image.tsx'),
      '@': import.meta.dirname,
    },
  },
})
