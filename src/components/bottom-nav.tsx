'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ShoppingCart, Heart, User, Newspaper, Store } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import type { User as SupabaseUser } from '@supabase/supabase-js';

const getCartCount = () => {
    if (typeof window === 'undefined') return 0;
    try {
        const cart = localStorage.getItem('cart');
        if (!cart) return 0;
        const cartItems = JSON.parse(cart);
        if (Array.isArray(cartItems)) {
            return cartItems.reduce((total: number, item: any) => total + (item.quantity || 0), 0);
        }
    } catch (error) {
        return 0;
    }
    return 0;
};

export function BottomNav() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [isSeller, setIsSeller] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    setMounted(true);
    setCartCount(getCartCount());
    
    const initData = async () => {
        const supabase = createClient();
        const { data: { user: authUser } } = await supabase.auth.getUser();
        setUser(authUser);

        if (authUser) {
            const { data: seller } = await supabase
                .from('sellers' as any)
                .select('status')
                .eq('user_id', authUser.id)
                .eq('status', 'approved')
                .maybeSingle();
            
            setIsSeller(!!seller);
        }
    };

    initData();

    // Listen for events
    const handleCartUpdate = () => setCartCount(getCartCount());
    window.addEventListener('cart-updated', handleCartUpdate);
    window.addEventListener('storage', handleCartUpdate);

    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null);
    });

    return () => {
        subscription.unsubscribe();
        window.removeEventListener('cart-updated', handleCartUpdate);
        window.removeEventListener('storage', handleCartUpdate);
    };
  }, []);

  if (!mounted) return null;

  const navItems = [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Shops', href: '/shops', icon: Store },
    { label: 'Feeds', href: '/feeds', icon: Newspaper },
    { label: 'Cart', href: '/cart', icon: ShoppingCart, badge: cartCount },
    { label: 'Wishlist', href: '/saved', icon: Heart },
  ];

  if (isSeller) {
      navItems.push({ label: 'My Shop', href: '/seller/dashboard', icon: Store });
  }

  navItems.push({ label: 'Profile', href: '/profile', icon: User });

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-primary/10 h-[72px] z-[100] flex items-center justify-around px-1 overflow-x-auto no-scrollbar shadow-[0_-8px_30px_rgba(0,0,0,0.15)]">
      <div className="absolute inset-0 bg-gradient-to-t from-primary/[0.05] via-transparent to-blue-500/[0.01] pointer-events-none" />
      
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        const isProfile = item.label === 'Profile';
        const isCart = item.label === 'Cart';
        const Icon = item.icon;

        return (
          <Link 
            key={item.href} 
            href={item.href}
            className="flex flex-col items-center justify-center gap-1 min-w-[60px] relative z-10"
          >
            <div className={cn(
              "p-1.5 rounded-xl transition-all duration-300 flex items-center justify-center relative",
              isActive ? "bg-primary/10 scale-110" : "bg-transparent"
            )}>
              {isProfile ? (
                 <Avatar className={cn(
                    "h-6 w-6 border-2 transition-all",
                    isActive ? "border-[var(--gold)]" : "border-transparent"
                )}>
                    {user ? (
                        <>
                            <AvatarImage src={user.user_metadata.avatar_url || undefined} />
                            <AvatarFallback className="text-[10px] bg-primary/5 text-primary font-bold">
                                {user.user_metadata.display_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                            </AvatarFallback>
                        </>
                    ) : (
                        <AvatarFallback className="text-[10px] bg-muted text-muted-foreground font-bold uppercase">
                            U
                        </AvatarFallback>
                    )}
                </Avatar>
              ) : (
                <>
                  <Icon 
                      className={cn(
                      "w-[20px] h-[20px] stroke-[2px]",
                      isActive ? "text-[var(--gold)]" : "text-[var(--muted)]"
                      )} 
                  />
                  {isCart && cartCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-4 min-w-4 flex items-center justify-center p-0 text-[8px] bg-red-600 text-white font-black border-2 border-background animate-in zoom-in duration-300">
                      {cartCount}
                    </Badge>
                  )}
                </>
              )}
            </div>
            <span 
              className={cn(
                "text-[9px] font-dm font-bold leading-none uppercase tracking-tighter",
                isActive ? "text-[var(--gold)]" : "text-[var(--muted)]"
              )}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
