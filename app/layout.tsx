import type { Metadata } from 'next'
import { Outfit } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'

const outfit = Outfit({
  variable: '--font-sans',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Zestra — AI Business Desk',
  description: 'A premium, AI-first operating system for Algerian Auto Entrepreneurs.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${outfit.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
