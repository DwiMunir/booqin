import type { IconName } from '@/components/ui/icons'

/**
 * Konten landing di-hardcode di sini, ter-type meniru bentuk blok CMS (Fase 2).
 * Saat Sanity masuk, tiap export di bawah jadi hasil query blok yang sesuai.
 */

export type NavLink = { label: string; href: string }
export type IconCard = { icon: IconName; title: string; body: string }
export type Step = { title: string; body: string; accent: 'brand' | 'amber' }
export type Testimonial = {
  quote: string
  name: string
  org: string
  initials: string
  avatar: 'brand' | 'amber' | 'teal'
}
export type Faq = { q: string; a: string }
export type ChatMessage = { from: 'guest' | 'ai'; name?: string; text: string }

// — siteSettings (global, BUKAN pageBuilder) —
export const nav = {
  links: [
    { label: 'Features', href: '#features' },
    { label: 'How it works', href: '#how' },
    { label: 'FAQ', href: '#faq' },
  ] satisfies NavLink[],
  cta: { label: 'Join the waitlist', href: '#waitlist' },
}

export const footer = {
  tagline:
    'The AI booking assistant for venue owners. List your space, fill more dates, do less work.',
  links: [
    { label: 'Privacy', href: '#' },
    { label: 'Contact', href: '#' },
  ] satisfies NavLink[],
  cta: { label: 'Join the waitlist', href: '#waitlist' },
  copyright: '© 2026 Booqin. All rights reserved.',
}

// — heroBlock —
export const hero = {
  badge: 'Now in early access · for venue owners',
  subtitle:
    'List your space and hand the back-and-forth to Booqin. It answers inquiries instantly, qualifies leads, manages your calendar, and follows up — 24/7 — so you book more and chase less.',
  trust: 'Be first to get early access. No spam — ever.',
}

// — problemBlock —
export const problem = {
  eyebrow: 'The booking grind',
  heading: "Every missed reply is an empty date you can't get back.",
  intro:
    'Inquiries arrive at all hours. Answer late and people book elsewhere. Run it by hand and the calendar turns into guesswork.',
  cards: [
    {
      icon: 'mailOpen',
      title: 'Inquiries slip through',
      body: 'Emails, DMs, calls, form fills — they pile up across five places, and the good leads get buried before you ever see them.',
    },
    {
      icon: 'clock',
      title: 'Slow replies lose bookings',
      body: 'The venue that answers first usually wins. By the time you reply between events, your prospect has already booked somewhere else.',
    },
    {
      icon: 'calendarX',
      title: 'Double-bookings & chaos',
      body: 'Holds, deposits, reschedules across multiple spaces — one missed update and two parties show up for the same room.',
    },
  ] satisfies IconCard[],
}

// — aiSpotlightBlock —
export const aiSpotlight = {
  eyebrow: 'Meet your AI assistant',
  heading: 'It answers, qualifies, and books — while you run the room.',
  intro:
    'Watch a real inquiry turn into a held date in seconds. No app to babysit, no canned auto-reply — a genuine conversation that closes.',
  chat: [
    {
      from: 'guest',
      name: 'Marcus T.',
      text: 'Hi! Is the Main Hall free for a wedding reception on Sat, Oct 18? About 120 guests.',
    },
    {
      from: 'ai',
      text: 'Hi Marcus — yes, the Main Hall is open on Saturday, Oct 18. It comfortably seats up to 150, so 120 is a great fit.',
    },
    {
      from: 'ai',
      text: 'For a Saturday evening reception (6 PM–midnight) the rate is $2,400, including setup and cleanup. Want me to hold the date for you?',
    },
    { from: 'guest', name: 'Marcus T.', text: 'Yes please, that works for us.' },
    {
      from: 'ai',
      text: "Done — I've placed a 48-hour hold on Oct 18 and emailed you the booking link and floor plan. I'll follow up tomorrow if I don't hear back.",
    },
  ] satisfies ChatMessage[],
  capabilities: [
    {
      icon: 'message',
      title: 'Instant inquiry replies',
      body: "Answers in seconds, any hour, in your venue's voice.",
    },
    {
      icon: 'user',
      title: 'Lead qualification',
      body: 'Asks date, headcount, and budget so only real bookings reach you.',
    },
    {
      icon: 'calendar',
      title: 'Calendar & availability',
      body: 'Checks live availability and proposes open slots on the spot.',
    },
    {
      icon: 'checkCircle',
      title: 'Double-booking prevention',
      body: 'Places holds the instant a date is offered — never two parties, one room.',
    },
    {
      icon: 'refresh',
      title: 'Automatic follow-ups',
      body: "Nudges undecided leads and chases deposits so you don't have to.",
    },
    {
      icon: 'help',
      title: 'Answers venue FAQs',
      body: 'Parking, capacity, AV, catering rules — handled, accurately, every time.',
    },
  ] satisfies IconCard[],
}

// — howItWorksBlock —
export const howItWorks = {
  eyebrow: 'How it works',
  heading: 'Up and running in an afternoon.',
  steps: [
    {
      title: 'List your venue',
      body: 'Add your spaces, rates, capacity, and house rules. Booqin learns your tone and turns it into a smart, on-brand booking assistant.',
      accent: 'brand',
    },
    {
      title: 'The AI handles inquiries',
      body: 'Every message gets an instant, accurate reply. Booqin qualifies the lead, checks the calendar, and holds the date — around the clock.',
      accent: 'brand',
    },
    {
      title: 'You get confirmed bookings',
      body: 'Wake up to held dates, collected deposits, and a clean calendar. You step in only to approve — the busywork is already done.',
      accent: 'amber',
    },
  ] satisfies Step[],
}

// — featuresBlock —
export const features = {
  eyebrow: 'Everything in one place',
  heading: 'A full booking back office, run by AI.',
  items: [
    {
      icon: 'calendarCheck',
      title: 'Booking & calendar',
      body: 'One live calendar for every space, with holds, deposits, and confirmations tracked end to end.',
    },
    {
      icon: 'card',
      title: 'Payments & deposits',
      body: 'Collect deposits and balances automatically, with secure links sent the moment a booking is confirmed.',
    },
    {
      icon: 'refresh',
      title: 'Availability sync',
      body: 'Two-way sync with Google and Outlook keeps every channel current, so a date can only be sold once.',
    },
    {
      icon: 'chart',
      title: 'Insights & analytics',
      body: "See response times, conversion, peak demand, and revenue per space — and where you're leaving money on the table.",
    },
    {
      icon: 'buildings',
      title: 'Multi-venue support',
      body: 'Run several halls, courts, or studios from one dashboard — each with its own rates, rules, and assistant.',
    },
    {
      icon: 'bell',
      title: 'Smart notifications',
      body: 'Get pinged only when it matters — a new confirmed booking, a deposit paid, or a decision that needs you.',
    },
  ] satisfies IconCard[],
}

// — socialProofBlock —
export const socialProof = {
  heading: 'Join hundreds of venue owners on the waitlist.',
  intro: 'From rooftop bars to basketball courts — early members are already lined up.',
  // alt text untuk 3 foto venue (gambar lokal di-import di komponen; Fase 2 = URL + LQIP dari Sanity).
  photos: [
    'An event hall set for a celebration',
    'A bar venue set up for the evening',
    'A bright studio space, ready to book',
  ],
  testimonials: [
    {
      quote:
        "Booqin replies to inquiries faster than I ever could. We've cut our empty weekends nearly in half since joining.",
      name: 'Priya Anand',
      org: 'The Maple Room · Austin',
      initials: 'PA',
      avatar: 'brand',
    },
    {
      quote:
        "I stopped losing bookings to slow replies. A lead messages at 11pm, gets an answer, and it's held by morning.",
      name: 'Devon Cole',
      org: 'Northside Courts · Denver',
      initials: 'DC',
      avatar: 'amber',
    },
    {
      quote:
        "Three studios used to mean three inboxes and constant double-bookings. Now it's one calendar I actually trust.",
      name: 'Lena Brooks',
      org: 'Atelier Studios · Chicago',
      initials: 'LB',
      avatar: 'teal',
    },
  ] satisfies Testimonial[],
  logos: ['Lumen Hall', 'Coastline Pavilion', 'The Foundry', 'Sky Courts Co.', 'Verde Studios'],
}

// — faqBlock —
export const faq = {
  eyebrow: 'Questions',
  heading: 'Good to know before you join.',
  items: [
    {
      q: 'When does early access open?',
      a: "We're rolling out in waves through 2026. Join the waitlist and we'll email you the moment your spot is ready — early members get priority onboarding and founder pricing.",
    },
    {
      q: 'How much will Booqin cost?',
      a: "Pricing isn't locked yet, but waitlist members lock in founder rates. There will be a free tier to list a single venue, with paid plans for multi-venue owners and higher inquiry volume.",
    },
    {
      q: 'Does the AI assistant work for any kind of venue?',
      a: 'Yes — event halls, studios, sports courts, meeting rooms, rooftops, anywhere people book by the hour or the day. You tell Booqin your spaces, rates, and rules, and it takes it from there.',
    },
    {
      q: 'Will the assistant sound like my business?',
      a: "It learns your venue's tone, policies, and FAQs, so replies feel like they came from your team — just faster. You can review and adjust anything before it goes live.",
    },
    {
      q: "What happens to inquiries when I'm offline?",
      a: "That's the whole point. Booqin answers instantly, day or night, qualifies the lead, and holds the date — then hands you a confirmed, ready-to-pay booking in the morning.",
    },
  ] satisfies Faq[],
}

// — ctaBlock —
export const finalCta = {
  headingTop: 'Stop chasing inquiries.',
  headingBottom: 'Start filling your calendar.',
  body: 'Join the waitlist for early access and founder pricing. Be among the first venues to put booking on autopilot.',
  trust: 'Be first to get early access. No spam — ever.',
}
