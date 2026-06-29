import type { Metadata } from 'next'
import { site } from '@/lib/seo/site'

export const metadata: Metadata = {
  title: 'Data Deletion Instructions',
  description: 'How to request deletion of the personal data Booqin holds about you.',
  alternates: { canonical: '/data-deletion' },
}

const LAST_UPDATED = '29 June 2026'

const h2 = 'mt-10 mb-3 font-display text-[1.3rem] font-bold text-ink'
const p = 'text-[1.02rem] leading-relaxed text-muted-soft'
const ol = 'mt-2 list-decimal space-y-1.5 pl-5 text-[1.02rem] leading-relaxed text-muted-soft'
const link = 'font-semibold text-teal underline underline-offset-2'

export default function DataDeletionPage() {
  return (
    <article className="container-narrow py-[clamp(48px,7vw,88px)]">
      <h1 className="font-display text-[clamp(2rem,4vw,2.75rem)] font-extrabold tracking-[-0.02em] text-ink">
        Data Deletion Instructions
      </h1>
      <p className="mt-2 text-sm text-muted">Last updated: {LAST_UPDATED}</p>

      <p className={`mt-6 ${p}`}>
        You can ask {site.name} to delete the personal data we hold about you at any time. That is
        your email address (from the waitlist, with a timestamped consent record) and your WhatsApp
        number if you have messaged us on WhatsApp. See our{' '}
        <a className={link} href="/privacy">
          Privacy Policy
        </a>{' '}
        for the full picture.
      </p>

      <h2 className={h2}>How to request deletion</h2>
      <ol className={ol}>
        <li>
          Email us at{' '}
          <a className={link} href={`mailto:${site.email}?subject=Data%20deletion%20request`}>
            {site.email}
          </a>{' '}
          with the subject &ldquo;Data deletion request&rdquo;.
        </li>
        <li>Send it from the email address you want removed (or tell us which address to delete).</li>
        <li>We will confirm and delete your data within 30 days.</li>
      </ol>

      <p className={`mt-6 ${p}`}>
        If we ever email you, every message also includes a one-click{' '}
        <strong className="text-ink">unsubscribe</strong> link, which removes you from our list.
      </p>

      <h2 className={h2}>What gets deleted</h2>
      <p className={p}>
        Your email address, consent record, and any WhatsApp number and chat history are permanently
        removed from our systems and from our email provider. We do not sell your data or share it
        for advertising.
      </p>

      <h2 className={h2}>Contact</h2>
      <p className={p}>
        Questions about deleting your data:{' '}
        <a className={link} href={`mailto:${site.email}`}>
          {site.email}
        </a>
        .
      </p>
    </article>
  )
}
