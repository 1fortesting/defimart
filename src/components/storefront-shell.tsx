'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { InstallPrompt } from './install-prompt';
import { ScrollToTopButton } from './scroll-to-top-button';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileShopHeader } from './mobile-shop-header';

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
  const isMobile = useIsMobile();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
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
        if (event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
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

  if (!mounted) return null;

  const isAdminRoute = pathname.startsWith('/admin');
  const isDashboardRoute = pathname === '/seller/dashboard';
  const isShopRoute = pathname.startsWith('/shops');

  // Removal Logic: Create more room for shops and dashboard on mobile
  // Hide main header for shops (on mobile) and dashboard (always, as it has its own)
  const hideMainHeader = isDashboardRoute || (isShopRoute && isMobile);
  
  // Replacment Logic: Show the slim replacement bar only for these specific mobile views
  // Note: Dashboard on mobile handles its own internal header to maximize room
  const showSlimMobileHeader = isMobile && isShopRoute;

  if (isAdminRoute) {
    return <>{children}</>;
  }

  return (
    <>
      <div className="pb-20 md:pb-0 min-h-screen flex flex-col relative overflow-x-hidden">
        {/* Deeper Decorative Background Auroras */}
        <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-[-1] overflow-hidden">
            <div className="absolute top-[-5%] right-[-10%] w-[60%] h-[60%] bg-primary/15 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '8s' }} />
            <div className="absolute bottom-[5%] left-[-10%] w-[50%] h-[50%] bg-orange-400/12 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '12s' }} />
            <div className="absolute top-[30%] left-[20%] w-[30%] h-[30%] bg-gold/5 rounded-full blur-[80px]" />
        </div>
        
        <InstallPrompt />
        
        {/* Replacement Header for Shops / Dashboard on Mobile */}
        {showSlimMobileHeader ? (
            <MobileShopHeader />
        ) : (
            !hideMainHeader && header
        )}

        <div className="relative z-10 flex-1 flex flex-col">
          {children}
        </div>
      </div>
      {bottomNav}
      <ScrollToTopButton />
    </>
  );
}
