import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { ImageResponse } from 'next/og'

// OG branded statis (1200×630). Next auto-wire ke metadata OG + Twitter site-wide.
export const alt = 'Booqin — The AI booking assistant for venue owners'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

// Logo asli (teal) di-embed sebagai data URI; dibaca saat generate (build/runtime).
const logoSrc = `data:image/png;base64,${readFileSync(
  join(process.cwd(), 'public/booqin-logo-primary.png'),
).toString('base64')}`

export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: 80,
        backgroundImage: 'linear-gradient(135deg, #FAF7F1 0%, #EAF2F0 100%)',
      }}
    >
      {/* biome-ignore lint/a11y/useAltText: <img> di Satori/og tak butuh alt (di-render jadi PNG). */}
      <img src={logoSrc} width={430} height={83} />

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div
          style={{
            fontSize: 78,
            fontWeight: 800,
            color: '#11231F',
            lineHeight: 1.05,
            letterSpacing: '-0.03em',
          }}
        >
          Fill more dates. Let AI do the booking.
        </div>
        <div style={{ fontSize: 34, color: '#4C5A56', marginTop: 24 }}>
          The AI booking assistant for venue owners.
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
        <div style={{ width: 60, height: 8, borderRadius: 999, backgroundColor: '#E0942E' }} />
        <div style={{ fontSize: 26, fontWeight: 600, color: '#15786E' }}>Now in early access</div>
      </div>
    </div>,
    size,
  )
}
