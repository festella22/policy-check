import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'HR Policy Q&A',
  description: "Instant answers from your firm's HR knowledge base",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full antialiased">{children}</body>
    </html>
  )
}
