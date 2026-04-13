import type { Metadata } from 'next'
import './globals.css'
import Menu from '@/components/Menu'
import AuthGuard from '@/components/AuthGuard'

export const metadata: Metadata = {
  title: 'Ergotex Log',
  description: 'Sistema interno Ergotex Log'
}

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR">
      <body>
        <AuthGuard>
          <Menu />
          {children}
        </AuthGuard>
      </body>
    </html>
  )
}