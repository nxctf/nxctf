import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

import Navbar from "@/_layouts/Navbar";
import ScrollToggle from "@/_layouts/components/ScrollToggle";
import { AppProviders } from "@/app/providers";
import { EventProvider } from "@/features/events/contexts/EventContext";
import { AuthProvider } from "@/shared/contexts/AuthContext";
import { ThemeProvider } from "@/shared/contexts/ThemeContext";
import APP from "@/config";

const ROOT_LAYOUT_STYLE: React.CSSProperties & {
  "--page-min-height-offset": string;
} = {
  "--page-min-height-offset": "60px",
};

export const metadata: Metadata = {
  metadataBase: new URL(APP.baseUrl),
  title: `${APP.shortName} - ${APP.fullName}`,
  description: APP.description,
  keywords: [
    "CTF",
    "Capture The Flag",
    "Cybersecurity",
    "Hacking Challenge",
    "CSCV",
    "InfoSec",
    "ctftime",
    "ctftime.org",
    "CTF Platform",
    "Cybersecurity Competition",
    "Ethical Hacking",
    "Vulnerability Assessment",
    "Penetration Testing",
    "Digital Forensics",
    "Malware Analysis",
    "Network Security",
    "Web Application Security",
    "Cryptography",
    "Reverse Engineering",
    "Security Training",
    "Cyber Defense",
    "Bug Bounty",
    "Red Teaming",
    "Blue Teaming",
    "Cybersecurity Community",
    "CTF Events",
    "CTF Challenges",
    "Cybersecurity Education",
    "CTF Teams",
    "Cybersecurity Awareness",
    "Capture The Flag Events",
    "CTF Challenges Platform",
    "Cybersecurity Skills",
    "CTF Competitions",
    "Cybersecurity Learning",
    "CTF Resources",
    "Cybersecurity Tools",
    "CTF Tutorials",
    "Cybersecurity Labs",
    "CTF Write-ups",
    "Cybersecurity News",
    "CTF Strategies",
    "Cybersecurity Research",
    "CTF Techniques",
    "Cybersecurity Conferences",
    "CTF Workshops",
    "Cybersecurity Careers",
    "CTF Training",
    "Cybersecurity Certifications",
    "CTF Platforms",
    "Cybersecurity Innovations",
    "CTF Community",
    "Cybersecurity Trends",
    "CTF Development",
    "Cybersecurity Solutions",
  ],
  authors: [{ name: "ariafatah", url: APP.baseUrl }],
  creator: "ariafatah",
  publisher: APP.fullName,
  applicationName: APP.fullName,
  referrer: "origin-when-cross-origin",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  openGraph: {
    title: `${APP.shortName} - ${APP.fullName}`,
    description: APP.description,
    url: APP.baseUrl,
    siteName: APP.fullName,
    images: [
      {
        url: `${APP.baseUrl}/${APP.image_preview}`,
        width: 1200,
        height: 630,
        alt: `${APP.shortName} - ${APP.fullName}`,
        type: "image/png",
      },
    ],
    locale: "id_ID",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${APP.shortName} - ${APP.fullName}`,
    description: APP.description,
    images: [`${APP.baseUrl}/${APP.image_icon}`],
  },
  alternates: {
    canonical: APP.baseUrl,
  },
  other: {
    "application/ld+json": JSON.stringify({
      "@context": "https://schema.org",
      "@type": "WebSite",
      url: APP.baseUrl,
      name: `${APP.shortName} - ${APP.fullName}`,
      description: APP.description,
      image: `${APP.baseUrl}/${APP.image_icon}`,
      publisher: {
        "@type": "Organization",
        name: APP.fullName,
        logo: `${APP.baseUrl}/${APP.image_icon}`,
      },
    }),
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || "";
  const isMaintenancePage = pathname === "/maintenance";

  return (
    <html lang="id" suppressHydrationWarning>
      <body
        className="antialiased selection:bg-primary/30"
        suppressHydrationWarning
      >
        {isMaintenancePage ? (
          children
        ) : (
          <div
            className="min-h-[calc(100lvh-var(--page-min-height-offset,60px))] bg-background text-foreground"
            style={ROOT_LAYOUT_STYLE}
          >
            <ThemeProvider>
              <AuthProvider>
                <EventProvider>
                  <AppProviders>
                    <Navbar />
                    <div className="pt-14">{children}</div>
                    <ScrollToggle />
                  </AppProviders>
                </EventProvider>
              </AuthProvider>
            </ThemeProvider>
          </div>
        )}
      </body>
    </html>
  );
}
