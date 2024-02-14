import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { GoogleAnalytics } from '@next/third-parties/google'
import Header from './_components/header'
import Footer from './_components/footer'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'MysticalWizard - Wonsik Shin',
  description: 'A Personal Website: Wonsik Shin',
  keywords: 'MysticalWizard, MysticalWiz, MystWiz, Wonsik Shin, Maring, Personal Website',
  authors: [{ name: 'Wonsik Shin' }],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div id="layout" className="dark:bg-[#1e1e1e]">
          <Header/>
            <div className="min-h-screen mx-auto -mt-header pt-header max-w-7xl">
            {children}
          </div>
          <Footer/>
        </div>
      </body>
      <GoogleAnalytics gaId="G-N2VWE8DFYQ" />
    </html>
  )
}
