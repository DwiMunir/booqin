import { defineArrayMember, defineField, defineType } from 'sanity'

// Blok pageBuilder. `name` = `_type` yang dipakai block-renderer (components/block-renderer.tsx).

export const hero = defineType({
  name: 'hero',
  title: 'Hero',
  type: 'object',
  fields: [
    defineField({ name: 'badge', type: 'string', title: 'Badge' }),
    defineField({ name: 'subtitle', type: 'text', rows: 3 }),
    defineField({ name: 'trust', type: 'string', title: 'Trust line' }),
  ],
  preview: { prepare: () => ({ title: 'Hero', subtitle: 'Section' }) },
})

export const problem = defineType({
  name: 'problem',
  title: 'Problem',
  type: 'object',
  fields: [
    defineField({ name: 'eyebrow', type: 'string' }),
    defineField({ name: 'heading', type: 'string' }),
    defineField({ name: 'intro', type: 'text', rows: 3 }),
    defineField({
      name: 'cards',
      type: 'array',
      of: [defineArrayMember({ type: 'iconCard' })],
      validation: (r) => r.max(3),
    }),
  ],
  preview: {
    select: { title: 'heading' },
    prepare: ({ title }) => ({ title: title || 'Problem', subtitle: 'Problem section' }),
  },
})

export const aiSpotlight = defineType({
  name: 'aiSpotlight',
  title: 'AI spotlight',
  type: 'object',
  fields: [
    defineField({ name: 'eyebrow', type: 'string' }),
    defineField({ name: 'heading', type: 'string' }),
    defineField({ name: 'intro', type: 'text', rows: 3 }),
    defineField({
      name: 'chat',
      title: 'Animated chat script',
      type: 'array',
      of: [defineArrayMember({ type: 'chatMessage' })],
    }),
    defineField({
      name: 'capabilities',
      type: 'array',
      of: [defineArrayMember({ type: 'iconCard' })],
    }),
  ],
  preview: {
    select: { title: 'heading' },
    prepare: ({ title }) => ({ title: title || 'AI spotlight', subtitle: 'AI spotlight section' }),
  },
})

export const howItWorks = defineType({
  name: 'howItWorks',
  title: 'How it works',
  type: 'object',
  fields: [
    defineField({ name: 'eyebrow', type: 'string' }),
    defineField({ name: 'heading', type: 'string' }),
    defineField({
      name: 'steps',
      type: 'array',
      of: [defineArrayMember({ type: 'step' })],
    }),
  ],
  preview: {
    select: { title: 'heading' },
    prepare: ({ title }) => ({ title: title || 'How it works', subtitle: 'How it works section' }),
  },
})

export const features = defineType({
  name: 'features',
  title: 'Features',
  type: 'object',
  fields: [
    defineField({ name: 'eyebrow', type: 'string' }),
    defineField({ name: 'heading', type: 'string' }),
    defineField({
      name: 'items',
      type: 'array',
      of: [defineArrayMember({ type: 'iconCard' })],
    }),
  ],
  preview: {
    select: { title: 'heading' },
    prepare: ({ title }) => ({ title: title || 'Features', subtitle: 'Features section' }),
  },
})

export const socialProof = defineType({
  name: 'socialProof',
  title: 'Social proof',
  type: 'object',
  fields: [
    defineField({ name: 'heading', type: 'string' }),
    defineField({ name: 'intro', type: 'text', rows: 2 }),
    defineField({
      name: 'photos',
      title: 'Photos',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'image',
          options: { hotspot: true },
          fields: [
            defineField({
              name: 'alt',
              type: 'string',
              title: 'Alt text',
              validation: (r) => r.required(),
            }),
          ],
        }),
      ],
      validation: (r) => r.max(3),
    }),
    defineField({
      name: 'testimonials',
      type: 'array',
      of: [defineArrayMember({ type: 'testimonial' })],
    }),
    defineField({
      name: 'logos',
      type: 'array',
      of: [defineArrayMember({ type: 'string' })],
    }),
  ],
  preview: {
    select: { title: 'heading' },
    prepare: ({ title }) => ({ title: title || 'Social proof', subtitle: 'Social proof section' }),
  },
})

export const faq = defineType({
  name: 'faq',
  title: 'FAQ',
  type: 'object',
  fields: [
    defineField({ name: 'eyebrow', type: 'string' }),
    defineField({ name: 'heading', type: 'string' }),
    defineField({
      name: 'items',
      type: 'array',
      of: [defineArrayMember({ type: 'faqItem' })],
    }),
  ],
  preview: {
    select: { title: 'heading' },
    prepare: ({ title }) => ({ title: title || 'FAQ', subtitle: 'FAQ section' }),
  },
})

export const cta = defineType({
  name: 'cta',
  title: 'Final CTA',
  type: 'object',
  fields: [
    defineField({ name: 'headingTop', type: 'string', title: 'Heading (line 1)' }),
    defineField({ name: 'headingBottom', type: 'string', title: 'Heading (line 2)' }),
    defineField({ name: 'body', type: 'text', rows: 3 }),
    defineField({ name: 'trust', type: 'string', title: 'Trust line' }),
  ],
  preview: { prepare: () => ({ title: 'Final CTA', subtitle: 'Section' }) },
})

export const pageBuilder = defineType({
  name: 'pageBuilder',
  title: 'Page builder',
  type: 'array',
  of: [
    defineArrayMember({ type: 'hero' }),
    defineArrayMember({ type: 'problem' }),
    defineArrayMember({ type: 'aiSpotlight' }),
    defineArrayMember({ type: 'howItWorks' }),
    defineArrayMember({ type: 'features' }),
    defineArrayMember({ type: 'socialProof' }),
    defineArrayMember({ type: 'faq' }),
    defineArrayMember({ type: 'cta' }),
  ],
})
