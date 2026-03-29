import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'DataLab — Web Scraping Engine',
  description:
    'High-performance multi-engine web scraping interface. Powered by BS4 and Scrapy.',
  keywords: ['web scraping', 'BeautifulSoup', 'Scrapy', 'data extraction', 'DataLab'],
  authors: [{ name: 'DataLab' }],
  openGraph: {
    title: 'DataLab — Web Scraping Engine',
    description: 'Multi-engine web scraping with real-time JSON output.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}
