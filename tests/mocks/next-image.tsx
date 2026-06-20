// Stub `next/image` untuk lingkungan test (jsdom).
// Di test, Vite me-resolve import gambar statis jadi string URL (bukan StaticImageData),
// sehingga next/image asli error soal width/blurDataURL. Stub ini cukup render <img> polos.
type Src = string | { src: string }

export default function Image({ src, alt = '' }: { src: Src; alt?: string }) {
  const url = typeof src === 'string' ? src : src.src
  return <img src={url} alt={alt} />
}
