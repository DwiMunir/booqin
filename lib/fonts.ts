import { Bricolage_Grotesque, Manrope } from 'next/font/google'

// Self-host via next/font (BUKAN <link>/@import). Variable, subset latin, expose CSS var.
export const fontDisplay = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-bricolage',
  display: 'swap',
})

export const fontSans = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  display: 'swap',
})
