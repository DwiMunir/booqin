import { site } from '@/lib/seo/site'

// Escape `<` agar tidak bisa keluar dari <script> (XSS-safe JSON-LD).
function JsonLd({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD perlu raw <script> dengan escape `<`.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  )
}

export function OrganizationWebSiteJsonLd() {
  const data = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${site.url}#organization`,
        name: site.name,
        url: site.url,
        description: site.description,
      },
      {
        '@type': 'WebSite',
        '@id': `${site.url}#website`,
        name: site.name,
        url: site.url,
        publisher: { '@id': `${site.url}#organization` },
      },
    ],
  }
  return <JsonLd data={data} />
}

export function FaqPageJsonLd({ faqs }: { faqs: ReadonlyArray<{ q: string; a: string }> }) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  }
  return <JsonLd data={data} />
}
