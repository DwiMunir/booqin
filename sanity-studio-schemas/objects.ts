import { defineField, defineType } from 'sanity'

// Object reusable. Nama field SENGAJA sama dengan type app (lib/cms/types.ts) agar
// GROQ `pageBuilder[]{...}` (spread) langsung cocok tanpa alias.

export const seo = defineType({
  name: 'seo',
  title: 'SEO',
  type: 'object',
  fields: [
    defineField({ name: 'title', type: 'string', title: 'Title (override)' }),
    defineField({ name: 'description', type: 'text', rows: 3, title: 'Meta description' }),
    defineField({
      name: 'noindex',
      type: 'boolean',
      title: 'Hide from search engines (noindex)',
      initialValue: false,
    }),
  ],
})

export const navLink = defineType({
  name: 'navLink',
  title: 'Link',
  type: 'object',
  fields: [
    defineField({ name: 'label', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'href', type: 'string', validation: (r) => r.required() }),
  ],
  preview: { select: { title: 'label', subtitle: 'href' } },
})

// Harus sama dengan IconName di components/ui/icons.tsx.
const ICON_OPTIONS = [
  'message',
  'user',
  'calendar',
  'checkCircle',
  'refresh',
  'help',
  'mailOpen',
  'clock',
  'calendarX',
  'calendarCheck',
  'card',
  'chart',
  'buildings',
  'bell',
]

export const iconCard = defineType({
  name: 'iconCard',
  title: 'Icon card',
  type: 'object',
  fields: [
    defineField({
      name: 'icon',
      type: 'string',
      options: { list: ICON_OPTIONS },
      validation: (r) => r.required(),
    }),
    defineField({ name: 'title', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'body', type: 'text', rows: 3, validation: (r) => r.required() }),
  ],
  preview: { select: { title: 'title', subtitle: 'icon' } },
})

export const step = defineType({
  name: 'step',
  title: 'Step',
  type: 'object',
  fields: [
    defineField({ name: 'title', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'body', type: 'text', rows: 3, validation: (r) => r.required() }),
    defineField({
      name: 'accent',
      type: 'string',
      options: { list: ['brand', 'amber'], layout: 'radio' },
      initialValue: 'brand',
    }),
  ],
  preview: { select: { title: 'title' } },
})

export const testimonial = defineType({
  name: 'testimonial',
  title: 'Testimonial',
  type: 'object',
  fields: [
    defineField({ name: 'quote', type: 'text', rows: 3, validation: (r) => r.required() }),
    defineField({ name: 'name', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'org', type: 'string', title: 'Organisation / location' }),
    defineField({ name: 'initials', type: 'string', validation: (r) => r.max(3) }),
    defineField({
      name: 'avatar',
      type: 'string',
      title: 'Avatar colour',
      options: { list: ['brand', 'amber', 'teal'], layout: 'radio' },
      initialValue: 'brand',
    }),
  ],
  preview: { select: { title: 'name', subtitle: 'org' } },
})

export const faqItem = defineType({
  name: 'faqItem',
  title: 'FAQ item',
  type: 'object',
  fields: [
    defineField({ name: 'q', title: 'Question', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'a', title: 'Answer', type: 'text', rows: 4, validation: (r) => r.required() }),
  ],
  preview: { select: { title: 'q' } },
})

export const chatMessage = defineType({
  name: 'chatMessage',
  title: 'Chat message',
  type: 'object',
  fields: [
    defineField({
      name: 'from',
      type: 'string',
      options: { list: ['guest', 'ai'], layout: 'radio' },
      validation: (r) => r.required(),
    }),
    defineField({ name: 'name', type: 'string', title: 'Guest name' }),
    defineField({ name: 'text', type: 'text', rows: 3, validation: (r) => r.required() }),
  ],
  preview: { select: { title: 'text', subtitle: 'from' } },
})
