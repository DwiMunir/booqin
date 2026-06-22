import type { Metadata } from 'next'
import { site } from '@/lib/seo/site'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How Booqin collects, uses, and protects your data — and your rights.',
  alternates: { canonical: '/privacy' },
}

const LAST_UPDATED = '21 June 2026'
const host = site.url.replace(/^https?:\/\//, '')

const h2 = 'mt-10 mb-3 font-display text-[1.3rem] font-bold text-ink'
const p = 'text-[1.02rem] leading-relaxed text-muted-soft'
const ul = 'mt-2 list-disc space-y-1.5 pl-5 text-[1.02rem] leading-relaxed text-muted-soft'
const link = 'font-semibold text-teal underline underline-offset-2'

export default function PrivacyPage() {
  return (
    <article className="container-narrow py-[clamp(48px,7vw,88px)]">
      <h1 className="font-display text-[clamp(2rem,4vw,2.75rem)] font-extrabold tracking-[-0.02em] text-ink">
        Privacy Policy
      </h1>
      <p className="mt-2 text-sm text-muted">Last updated: {LAST_UPDATED}</p>

      <p className={`mt-6 ${p}`}>
        {site.name} operates the website at {host}. This policy explains what personal data we
        collect, why, and the choices you have. It is provided for transparency and is{' '}
        <strong className="text-ink">not legal advice</strong> — please consult a qualified
        professional for your jurisdiction (e.g. Indonesia's PDP Law, or the GDPR if you are in the
        EU).
      </p>

      <h2 className={h2}>Data we collect</h2>
      <ul className={ul}>
        <li>
          <strong className="text-ink">Email address</strong> — when you join the early-access
          waitlist.
        </li>
        <li>
          <strong className="text-ink">Consent record</strong> — that you agreed to receive emails,
          with a timestamp.
        </li>
        <li>
          <strong className="text-ink">Minimal anti-spam signals</strong> — to prevent automated
          abuse of our form (a hidden honeypot field; if rate limiting is enabled, your IP address
          may be processed transiently and not stored long-term).
        </li>
        <li>
          <strong className="text-ink">Anonymous performance metrics</strong> — aggregate page-speed
          measurements (Web Vitals) sent to our own server. These contain no personal identifiers.
        </li>
      </ul>
      <p className={`mt-3 ${p}`}>
        We practise data minimisation: for the waitlist we ask only for your email.
      </p>

      <h2 className={h2}>How we use it</h2>
      <ul className={ul}>
        <li>To notify you when early access opens and send updates you opted into.</li>
        <li>To prevent spam and abuse of our forms.</li>
        <li>To monitor and improve site performance.</li>
      </ul>

      <h2 className={h2}>Legal basis</h2>
      <p className={p}>
        We process your email on the basis of your <strong className="text-ink">consent</strong>,
        given via the checkbox when you join the waitlist. You can withdraw that consent at any
        time.
      </p>

      <h2 className={h2}>Who we share it with</h2>
      <p className={p}>
        We do <strong className="text-ink">not</strong> sell your data. We share your email only
        with the service that lets us run the waitlist:
      </p>
      <ul className={ul}>
        <li>
          <a className={link} href="https://resend.com" target="_blank" rel="noopener noreferrer">
            Resend
          </a>{' '}
          — our email provider; stores your email in our audience and delivers our emails.
        </li>
      </ul>
      <p className={`mt-3 ${p}`}>
        Our site is self-hosted; page content is managed in a separate CMS that never receives your
        email.
      </p>

      <h2 className={h2}>Cookies &amp; tracking</h2>
      <p className={p}>
        We do not use advertising or behavioural-tracking cookies, and we do not load third-party
        trackers. Because of this you should not see a cookie banner.
      </p>

      <h2 className={h2}>Data retention</h2>
      <p className={p}>
        We keep your email until you unsubscribe or ask us to delete it, or until the waitlist is no
        longer needed.
      </p>

      <h2 className={h2}>Your rights</h2>
      <p className={p}>At any time you may ask us to:</p>
      <ul className={ul}>
        <li>
          <strong className="text-ink">Access</strong> the data we hold about you,
        </li>
        <li>
          <strong className="text-ink">Delete</strong> your data,
        </li>
        <li>
          <strong className="text-ink">Withdraw consent</strong> / unsubscribe — if we email you, it
          will include an unsubscribe link, and you can always ask us to remove you.
        </li>
      </ul>
      <p className={`mt-3 ${p}`}>
        To exercise any of these, email us at{' '}
        <a className={link} href={`mailto:${site.email}`}>
          {site.email}
        </a>
        .
      </p>

      <h2 className={h2}>Contact</h2>
      <p className={p}>
        Questions about this policy or your data:{' '}
        <a className={link} href={`mailto:${site.email}`}>
          {site.email}
        </a>
        .
      </p>
    </article>
  )
}
