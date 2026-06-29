import type { Metadata } from 'next'
import { site } from '@/lib/seo/site'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'The terms that govern your use of Booqin and our website.',
  alternates: { canonical: '/terms' },
}

const LAST_UPDATED = '29 June 2026'
const host = site.url.replace(/^https?:\/\//, '')

const h2 = 'mt-10 mb-3 font-display text-[1.3rem] font-bold text-ink'
const p = 'text-[1.02rem] leading-relaxed text-muted-soft'
const ul = 'mt-2 list-disc space-y-1.5 pl-5 text-[1.02rem] leading-relaxed text-muted-soft'
const link = 'font-semibold text-teal underline underline-offset-2'

export default function TermsPage() {
  return (
    <article className="container-narrow py-[clamp(48px,7vw,88px)]">
      <h1 className="font-display text-[clamp(2rem,4vw,2.75rem)] font-extrabold tracking-[-0.02em] text-ink">
        Terms of Service
      </h1>
      <p className="mt-2 text-sm text-muted">Last updated: {LAST_UPDATED}</p>

      <p className={`mt-6 ${p}`}>
        These terms govern your use of {site.name} and the website at {host}. By using the site or
        joining our waitlist you agree to them. They are provided for transparency and are{' '}
        <strong className="text-ink">not legal advice</strong> — please consult a qualified
        professional for your jurisdiction.
      </p>

      <h2 className={h2}>The service</h2>
      <p className={p}>
        {site.name} is an AI booking assistant for venue owners. The website currently offers
        information about the product and an early-access waitlist. Features described here may be in
        development and can change before general availability.
      </p>

      <h2 className={h2}>Acceptable use</h2>
      <p className={p}>When using our site you agree not to:</p>
      <ul className={ul}>
        <li>Submit false information or someone else&apos;s details to our forms.</li>
        <li>Attempt to disrupt, abuse, or gain unauthorised access to the service.</li>
        <li>Use the site for any unlawful purpose.</li>
      </ul>

      <h2 className={h2}>Intellectual property</h2>
      <p className={p}>
        The {site.name} name, logo, content, and design are owned by us or our licensors. You may not
        copy or reuse them without permission, except as allowed by law.
      </p>

      <h2 className={h2}>No warranty</h2>
      <p className={p}>
        The site is provided <strong className="text-ink">&ldquo;as is&rdquo;</strong> without
        warranties of any kind. We do not guarantee that it will be uninterrupted, error-free, or
        that the product will ship on any particular date.
      </p>

      <h2 className={h2}>Limitation of liability</h2>
      <p className={p}>
        To the extent permitted by law, {site.name} is not liable for any indirect or consequential
        loss arising from your use of the site or waitlist.
      </p>

      <h2 className={h2}>Changes</h2>
      <p className={p}>
        We may update these terms as the product evolves. The &ldquo;last updated&rdquo; date above
        reflects the current version.
      </p>

      <h2 className={h2}>Contact</h2>
      <p className={p}>
        Questions about these terms:{' '}
        <a className={link} href={`mailto:${site.email}`}>
          {site.email}
        </a>
        .
      </p>
    </article>
  )
}
