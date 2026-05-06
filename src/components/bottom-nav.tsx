'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ShoppingCart, Heart, User, Newspaper, Store } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export function BottomNav() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [isSeller, setIsSeller] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    const checkSeller = async () => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: seller } = await supabase
            .from('sellers' as any)
            .select('status')
            .eq('user_id', user.id)
            .eq('status', 'approved')
            .maybeSingle();
        
        setIsSeller(!!seller);
    };

    checkSeller();
  }, []);

  if (!mounted) return null;

  const navItems = [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Shops', href: '/shops', icon: Store },
    { label: 'Feeds', href: '/feeds', icon: Newspaper },
    { label: 'Cart', href: '/cart', icon: ShoppingCart },
    { label: 'Wishlist', href: '/saved', icon: Heart },
  ];

  if (isSeller) {
      navItems.push({ label: 'My Shop', href: '/seller/dashboard', icon: Store });
  }

  navItems.push({ label: 'Profile', href: '/profile', icon: User });

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-primary/10 h-[72px] z-[100] flex items-center justify-around px-1 overflow-x-auto no-scrollbar shadow-[0_-8px_30px_rgba(0,0,0,0.15)] opacity-100">
      {/* Subtle Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-primary/[0.05] via-transparent to-blue-500/[0.01] pointer-events-none" />
      
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;

        return (
          <Link 
            key={item.href} 
            href={item.href}
            className="flex flex-col items-center justify-center gap-1 min-w-[60px] relative z-10 transition-transform active:scale-90"
          >
            <div className={cn(
              "p-1.5 rounded-xl transition-all duration-300",
              isActive ? "bg-primary/10 scale-110" : "bg-transparent"
            )}>
              <Icon 
                className={cn(
                  "w-[20px] h-[20px] stroke-[2px]",
                  isActive ? "text-[var(--gold)]" : "text-[var(--muted)]"
                )} 
              />
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
