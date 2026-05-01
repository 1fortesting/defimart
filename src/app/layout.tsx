import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { BottomNav } from '@/components/bottom-nav';
import { Header } from '@/components/header';
import { ThemeProvider } from '@/components/theme-provider';
import { StorefrontShell } from '@/components/storefront-shell';
import { GlobalToaster } from '@/components/global-toaster';
import { Suspense } from 'react';
import { TawkToManager } from '@/components/tawk-to-manager';
import { FCMTokenManager } from '@/components/fcm-token-manager';

export const metadata: Metadata = {
  title: 'Defimart – Student Online Store in Ghana',
  description: 'Defimart is a student-focused online store in Ghana designed for easy, fast, and reliable campus shopping. Buy what you need with simple pickup-based transactions.',
  keywords: 'Defimart, student store Ghana, campus marketplace, online shopping Ghana, university deals, pay on pickup',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Defimart',
  },
  alternates: {
    canonical: 'https://defimartonline.com',
  },
  openGraph: {
    title: 'Defimart – Student Online Store',
    description: 'A student-focused online store for easy pickup-based shopping on campus.',
    url: 'https://defimartonline.com',
    siteName: 'Defimart',
    images: [
      {
        url: 'https://defimartonline.com/logo.png',
        width: 1200,
        height: 630,
        alt: 'Defimart Logo',
      },
    ],
    locale: 'en_GH',
    type: 'website',
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon.ico', sizes: '32x32', type: 'image/x-icon' },
    ],
    apple: [
      { url: 'https://iili.io/qO5Jeou.png', sizes: '180x180', type: 'image/png' },
    ],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#F5A623',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "Defimart",
              "url": "https://defimartonline.com",
              "logo": "https://defimartonline.com/logo.png",
              "description": "Defimart is a student-focused online store in Ghana that makes campus shopping simple, fast, and accessible through pickup-based transactions."
            }),
          }}
        />
      </head>
      <body className="font-body antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          disableTransitionOnChange
        >
          <StorefrontShell header={<Header />} bottomNav={<BottomNav />}>
            {children}
          </StorefrontShell>
          <Toaster />
          <Suspense fallback={null}>
            <GlobalToaster />
          </Suspense>
          <FCMTokenManager />
        </ThemeProvider>
        <TawkToManager />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js');
                  navigator.serviceWorker.register('/firebase-messaging-sw.js');
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}