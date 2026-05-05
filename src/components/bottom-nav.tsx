'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, LayoutGrid, ShoppingCart, Heart, User, Newspaper } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

const navItems = [
  { label: 'Home', href: '/', icon: Home },
  { label: 'Categories', href: '/categories', icon: LayoutGrid },
  { label: 'Feeds', href: '/feeds', icon: Newspaper },
  { label: 'Cart', href: '/cart', icon: ShoppingCart },
  { label: 'Wishlist', href: '/saved', icon: Heart },
  { label: 'Profile', href: '/profile', icon: User },
];

export function BottomNav() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[var(--surface)] border-t border-[var(--border)] h-[72px] z-[100] flex items-center justify-around px-1">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;

        return (
          <Link 
            key={item.href} 
            href={item.href}
            className="flex flex-col items-center justify-center gap-1 min-w-[50px] transition-transform active:scale-90"
          >
            <Icon 
              className={cn(
                "w-[20px] h-[20px] stroke-[1.5px]",
                isActive ? "text-[var(--gold)]" : "text-[var(--muted)]"
              )} 
            />
            <span 
              className={cn(
                "text-[9px] font-dm font-medium leading-none",
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
