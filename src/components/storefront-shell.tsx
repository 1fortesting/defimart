'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { InstallPrompt } from './install-prompt';
import { ScrollToTopButton } from './scroll-to-top-button';

export function StorefrontShell({
  header,
  bottomNav,
  children,
}: {
  header: React.ReactNode;
  bottomNav: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith('/admin');

  useEffect(() => {
    const supabase = createClient();
    
    // This function ensures that the local storage is in sync with the user's auth state.
    const syncAuthState = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        localStorage.removeItem('cart');
        localStorage.removeItem('saved');
        window.dispatchEvent(new Event('cart-updated'));
        window.dispatchEvent(new Event('saved-updated'));
      }
    };

    // Check on initial load
    syncAuthState();
    
    // And listen for subsequent changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_OUT' || event === 'SIGNED_IN') {
          // When a user signs in or out, we clear the local storage.
          // For sign-out, this prevents showing stale data.
          // For sign-in, it ensures the app relies on the database as the source of truth,
          // preventing conflicts with a previous anonymous session.
          localStorage.removeItem('cart');
          localStorage.removeItem('saved');
          window.dispatchEvent(new Event('cart-updated'));
          window.dispatchEvent(new Event('saved-updated'));
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);
  
  if (isAdminRoute) {
    return <>{children}</>;
  }

  return (
    <>
      <div className="pb-20 md:pb-0 min-h-screen flex flex-col">
        <InstallPrompt />
        {header}
        {children}
      </div>
      {bottomNav}
      <ScrollToTopButton />
    </>
  );
}
