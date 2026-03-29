import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { BottomNav } from '@/components/bottom-nav';
import { Header } from '@/components/header';
import { ThemeProvider } from '@/components/theme-provider';
import { StorefrontShell } from '@/components/storefront-shell';
import { GlobalToaster } from '@/components/global-toaster';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: 'DEFIMART',
  description: 'A student marketplace for pickup-based transactions.',
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
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="https://iili.io/qO5Jeou.png"></link>
        <meta name="theme-color" content="#facc15" />
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
        </ThemeProvider>
        <script
          type="text/javascript"
          dangerouslySetInnerHTML={{
            __html: `var Tawk_API=Tawk_API||{}; if(window.innerWidth < 768){Tawk_API.customStyle={visibility:{mobile:{position:'br',yOffset:90}}}};var Tawk_LoadStart=new Date();(function(){var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];s1.async=true;s1.src='https://embed.tawk.to/69bf2d332273861c39a78f91/1jk9ch58q';s1.charset='UTF-8';s1.setAttribute('crossorigin','*');s0.parentNode.insertBefore(s1,s0);})();`,
          }}
        />
      </body>
    </html>
  );
}
