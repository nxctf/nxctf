import type { Metadata } from 'next'
import { headers } from 'next/headers'
// @ts-ignore: side-effect CSS import without type declarations
import 'react-medium-image-zoom/dist/styles.css'
// @ts-ignore: side-effect CSS import without type declarations
import './globals.css'

import { Toaster } from "react-hot-toast"
import Navbar from '@/_layouts/Navbar'
import ScrollToggle from '@/_layouts/components/ScrollToggle'
import { AuthProvider } from '@/shared/contexts/AuthContext'
import { ThemeProvider } from '@/shared/contexts/ThemeContext'
import { CategoriesProvider } from '@/shared/contexts/CategoriesContext'
import { SystemSettingsProvider } from '@/shared/contexts/SystemSettingsContext'
import { getPageMinHeightStyle, PAGE_BG_BASE_CLASS } from '@/shared/styles/page-background'
import { THEME_PRIMARY_SELECTION_CLASS } from '@/shared/styles/theme-colors'
import APP from '@/config'
import { BASE_URL } from '@/_vars/const'
import DonationSection from '@/shared/components/DonationSection'

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: `${APP.shortName} - ${APP.fullName}`,
  description: APP.description,
  keywords: ['CTF', 'Capture The Flag', 'Cybersecurity', 'Hacking Challenge', 'CSCV', 'InfoSec', 'ctftime', 'ctftime.org', 'CTF Platform', 'Cybersecurity Competition', 'Ethical Hacking', 'Vulnerability Assessment', 'Penetration Testing', 'Digital Forensics', 'Malware Analysis', 'Network Security', 'Web Application Security', 'Cryptography', 'Reverse Engineering', 'Security Training', 'Cyber Defense', 'Bug Bounty', 'Red Teaming', 'Blue Teaming', 'Cybersecurity Community', 'CTF Events', 'CTF Challenges', 'Cybersecurity Education', 'CTF Teams', 'Cybersecurity Awareness', 'Capture The Flag Events', 'CTF Challenges Platform', 'Cybersecurity Skills', 'CTF Competitions', 'Cybersecurity Learning', 'CTF Resources', 'Cybersecurity Tools', 'CTF Tutorials', 'Cybersecurity Labs', 'CTF Write-ups', 'Cybersecurity News', 'CTF Strategies', 'Cybersecurity Research', 'CTF Techniques', 'Cybersecurity Conferences', 'CTF Workshops', 'Cybersecurity Careers', 'CTF Training', 'Cybersecurity Certifications', 'CTF Platforms', 'Cybersecurity Innovations', 'CTF Community', 'Cybersecurity Trends', 'CTF Development', 'Cybersecurity Solutions'],
  authors: [{ name: 'ariafatah', url: BASE_URL }],
  creator: 'ariafatah',
  publisher: APP.fullName,
  applicationName: APP.fullName,
  referrer: 'origin-when-cross-origin',
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  openGraph: {
    title: `${APP.shortName} - ${APP.fullName}`,
    description: APP.description,
    url: BASE_URL,
    siteName: APP.fullName,
    images: [
      {
        url: `${BASE_URL}/${APP.image_preview}`,
        width: 1200,
        height: 630,
        alt: `${APP.shortName} - ${APP.fullName}`,
        type: 'image/png',
      },
    ],
    locale: 'id_ID',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: `${APP.shortName} - ${APP.fullName}`,
    description: APP.description,
    images: [`${BASE_URL}/${APP.image_icon}`],
  },
  alternates: {
    canonical: BASE_URL,
  },
  other: {
    // Structured data biar Google bisa detect
    'application/ld+json': JSON.stringify({
      "@context": "https://schema.org",
      "@type": "WebSite",
      "url": BASE_URL,
      "name": `${APP.shortName} - ${APP.fullName}`,
      "description": APP.description,
      "image": `${BASE_URL}/${APP.image_icon}`,
      "publisher": {
        "@type": "Organization",
        "name": APP.fullName,
        "logo": `${BASE_URL}/${APP.image_icon}`
      }
    })
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const headersList = await headers()
  const pathname = headersList.get('x-pathname') || ''
  const isMaintenancePage = pathname === '/maintenance'
  const isAdminPage = pathname.startsWith('/admin')

  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var settings = JSON.parse(localStorage.getItem('nxctf_settings_v1'));
                  var theme = settings ? settings.theme : 'dark';
                  if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className={`antialiased ${THEME_PRIMARY_SELECTION_CLASS}`} suppressHydrationWarning>
        {isMaintenancePage ? (
          // Maintenance mode: no navbar, no providers, just raw content
          children
        ) : (
          // Normal mode: with navbar and providers
          <div className={PAGE_BG_BASE_CLASS} style={getPageMinHeightStyle()}>
            <ThemeProvider>
              <SystemSettingsProvider>
                <AuthProvider>
                  <CategoriesProvider>
                    <Navbar />
                    <div className="pt-14">{children}</div>
                    {!isAdminPage && <DonationSection />}
                    <Toaster position="top-right" reverseOrder={false} />
                    <ScrollToggle />
                  </CategoriesProvider>
                </AuthProvider>
              </SystemSettingsProvider>
            </ThemeProvider>
          </div>
        )}
      </body>
    </html>
  )
}
