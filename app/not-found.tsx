import Link from 'next/link'

export default function NotFound() {
  return (
    <section className="mx-auto flex max-w-[760px] flex-col items-center px-6 py-32 text-center">
      <p className="font-display text-6xl font-extrabold text-brand">404</p>
      <h1 className="mt-4 font-display text-2xl font-bold text-ink">Page not found</h1>
      <p className="mt-3 text-muted">The page you're looking for doesn't exist or has moved.</p>
      <Link
        href="/"
        className="mt-8 inline-flex rounded-xl bg-amber px-6 py-3 font-bold text-[#1c1206]"
      >
        Back home
      </Link>
    </section>
  )
}
