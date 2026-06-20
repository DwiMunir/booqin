'use client'

import { useReportWebVitals } from 'next/web-vitals'

// Leaf RUM kecil: kirim Core Web Vitals ke /api/vitals (sendBeacon, non-blocking).
export function WebVitals() {
  useReportWebVitals((metric) => {
    const body = JSON.stringify({
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      id: metric.id,
    })
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      navigator.sendBeacon('/api/vitals', body)
    } else {
      void fetch('/api/vitals', { method: 'POST', body, keepalive: true })
    }
  })
  return null
}
