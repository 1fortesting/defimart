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
    
    const syncAuthState = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        localStorage.removeItem('cart');
        localStorage.removeItem('saved');
        window.dispatchEvent(new Event('cart-updated'));
        window.dispatchEvent(new Event('saved-updated'));
      }
    };

    syncAuthState();
    
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_OUT' || event === 'SIGNED_IN') {
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
      <div className="pb-20 md:pb-0 min-h-screen flex flex-col relative overflow-x-hidden">
        {/* Decorative Background Auroras */}
        <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-[-1] overflow-hidden">
            <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '8s' }} />
            <div className="absolute bottom-[10%] left-[-5%] w-[40%] h-[40%] bg-orange-400/5 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '12s' }} />
        </div>
        
        <InstallPrompt />
        {header}
        <div className="relative z-10 flex-1 flex flex-col">
          {children}
        </div>
      </div>
      {bottomNav}
      <ScrollToTopButton />
    </>
  );
}