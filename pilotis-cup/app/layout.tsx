import type { Metadata } from 'next'
import { Raleway, Caveat } from 'next/font/google'
import { getLocale } from '@/lib/i18n/locale'
import './globals.css'

const raleway = Raleway({
  subsets: ['latin'],
  variable: '--font-raleway',
  display: 'swap',
})

const caveat = Caveat({
  subsets: ['latin'],
  variable: '--font-caveat',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Pilotis Cup',
  description: 'Avaliação de cafés especiais',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const locale = await getLocale()

  return (
    <html
      lang={locale}
      className={`${raleway.variable} ${caveat.variable} h-full`}
    >
      <body
        className="min-h-full flex flex-col font-[family-name:var(--font-raleway)] bg-[#fbf8ec] antialiased"
      >
        {children}
      </body>
    </html>
  )
}
