'use client'
import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

// Pengaman terakhir bila root layout gagal. Menggantikan root layout → WAJIB <html>/<body>,
// import CSS diabaikan → inline style saja (warna brand). Jarang terpicu, tapi lebih baik dari layar putih.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
    console.error(error)
  }, [error])

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100dvh',
          display: 'grid',
          placeItems: 'center',
          padding: 24,
          backgroundColor: '#FAF7F1',
          color: '#11231F',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        <div style={{ maxWidth: 440, textAlign: 'center' }}>
          <h1 style={{ margin: '0 0 8px', fontSize: '1.5rem', fontWeight: 800 }}>
            Something went wrong
          </h1>
          <p style={{ margin: '0 0 24px', color: '#4C5A56', lineHeight: 1.5 }}>
            An unexpected error occurred. Please reload the page.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              cursor: 'pointer',
              border: 'none',
              borderRadius: 12,
              padding: '12px 24px',
              backgroundColor: '#E0942E',
              color: '#1c1206',
              fontSize: '1rem',
              fontWeight: 700,
            }}
          >
            Reload
          </button>
        </div>
      </body>
    </html>
  )
}
