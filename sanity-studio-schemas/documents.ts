import { defineArrayMember, defineField, defineType } from 'sanity'

export const page = defineType({
  name: 'page',
  title: 'Page',
  type: 'document',
  fields: [
    defineField({ name: 'title', type: 'string', validation: (r) => r.required() }),
    defineField({
      name: 'slug',
      type: 'slug',
      options: { source: 'title' },
      validation: (r) => r.required(),
    }),
    defineField({ name: 'seo', type: 'seo' }),
    defineField({ name: 'pageBuilder', type: 'pageBuilder' }),
  ],
  preview: { select: { title: 'title', subtitle: 'slug.current' } },
})

// Singleton — kelola lewat Studio Structure dengan id tetap (mis. 'siteSettings').
export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Site settings',
  type: 'document',
  fields: [
    defineField({
      name: 'nav',
      title: 'Navigation',
      type: 'object',
      fields: [
        defineField({
          name: 'links',
          type: 'array',
          of: [defineArrayMember({ type: 'navLink' })],
        }),
        defineField({ name: 'cta', type: 'navLink', title: 'CTA button' }),
      ],
    }),
    defineField({
      name: 'footer',
      title: 'Footer',
      type: 'object',
      fields: [
        defineField({ name: 'tagline', type: 'text', rows: 2 }),
        defineField({
          name: 'links',
          type: 'array',
          of: [defineArrayMember({ type: 'navLink' })],
        }),
        defineField({ name: 'cta', type: 'navLink', title: 'CTA link' }),
        defineField({ name: 'copyright', type: 'string' }),
      ],
    }),
  ],
  preview: { prepare: () => ({ title: 'Site settings' }) },
})
