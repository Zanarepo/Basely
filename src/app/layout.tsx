import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { ThemeProvider } from '@/components/ThemeProvider'
import { Toaster } from 'sonner'
import { cookies } from 'next/headers'
import { ImpersonationBanner } from '@/components/backoffice/ImpersonationBanner'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Basely | Project Controls',
  description: 'Project management platform for project controllers',
}

const themeInitScript = `
(function() {
  try {
    var t = localStorage.getItem('display_mode');
    document.documentElement.classList.add(t === 'light' ? 'light' : 'dark');
  } catch (e) {
    document.documentElement.classList.add('dark');
  }
})();
`

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  let impersonationData = null
  try {
    const cookieStore = await cookies()
    const impCookie = cookieStore.get('zn_impersonation')
    if (impCookie) {
      impersonationData = JSON.parse(Buffer.from(impCookie.value, 'base64').toString('utf-8'))
    }
  } catch(e) {}

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full flex flex-col bg-app-bg text-app-fg">
        {impersonationData && (
          <ImpersonationBanner 
            staffRole={impersonationData.staffRole} 
            targetUserId={impersonationData.targetUserId} 
            targetUserName={impersonationData.targetUserName || 'Unknown User'}
          />
        )}
        <ThemeProvider>{children}</ThemeProvider>
        <Toaster position="top-center" richColors />
      </body>
    </html>
  )
}
