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
import { NetworkStatus } from '@/components/network-status';

export const metadata: Metadata = {
  title: 'Defimart – Student Online Store in Ghana',
  description: 'Defimart is a student-focused online store in Ghana designed for easy, fast, and reliable campus shopping. Buy what you need with simple pickup-based transactions.',
  keywords: 'Defimart, student store Ghana, campus marketplace, online shopping Ghana, university deals, pay on pickup',
  manifest: '/manifest.json',
  applicationName: 'Defimart',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Defimart',
  },
  alternates: {
    canonical: 'https://www.defimartonline.com',
  },
  openGraph: {
    title: 'Defimart – Student Online Store',
    description: 'A student-focused online store for easy pickup-based shopping on campus.',
    url: 'https://www.defimartonline.com',
    siteName: 'Defimart',
    images: [
      {
        url: 'https://www.defimartonline.com/logo.png',
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
      { url: '/icons/icon-96x96.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/icon-72x72.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/icon-192x192.png' },
      { url: '/icons/icon-152x152.png', sizes: '152x152' },
      { url: '/icons/icon-192x192.png', sizes: '192x192' },
      { url: '/icons/icon-512x512.png', sizes: '512x512' },
    ],
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'msapplication-TileColor': '#F5A623',
    'msapplication-TileImage': '/icons/icon-144x144.png',
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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          disableTransitionOnChange
        >
          <StorefrontShell header={<Header />} bottomNav={<BottomNav />}>
            <NetworkStatus />
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
                  // Register PWA service worker
                  navigator.serviceWorker.register('/sw.js').catch(console.error);
                    
                  // Register Firebase messaging service worker
                  const config = {
                    apiKey: "${process.env.NEXT_PUBLIC_FIREBASE_API_KEY || ''}",
                    authDomain: "${process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || ''}",
                    projectId: "${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || ''}",
                    storageBucket: "${process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || ''}",
                    messagingSenderId: "${process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || ''}",
                    appId: "${process.env.NEXT_PUBLIC_FIREBASE_APP_ID || ''}"
                  };
                  const params = new URLSearchParams(config).toString();
                  navigator.serviceWorker.register('/firebase-messaging-sw.js?' + params).catch(console.error);
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
