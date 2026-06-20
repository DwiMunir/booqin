// Logo Booqin (SVG hasil recolor teal). AGENTS: pakai <img> untuk SVG, BUKAN next/image.
// Header: wordmark gelap; Footer (bg gelap): varian wordmark putih.
export function Logo({ variant = 'header' }: { variant?: 'header' | 'footer' }) {
  const footer = variant === 'footer'
  return (
    <img
      src={footer ? '/booqin-logo-light.svg' : '/booqin-logo-primary.svg'}
      alt="Booqin"
      width={1662}
      height={320}
      className={footer ? 'h-7 w-auto' : 'h-[30px] w-auto'}
    />
  )
}
