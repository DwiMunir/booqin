'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <section className="mx-auto flex max-w-[760px] flex-col items-center px-6 py-32 text-center">
      <h1 className="font-display text-2xl font-bold text-ink">Something went wrong</h1>
      <p className="mt-3 text-muted">An unexpected error occurred. Please try again.</p>
      <button
        type="button"
        onClick={reset}
        className="mt-8 inline-flex rounded-xl bg-amber px-6 py-3 font-bold text-[#1c1206]"
      >
        Try again
      </button>
    </section>
  )
}
