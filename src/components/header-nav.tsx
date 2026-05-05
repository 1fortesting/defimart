
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  User,
  Package,
  Heart,
  ShoppingCart,
  LayoutGrid,
  Newspaper,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from './ui/badge';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

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
        console.error("Failed to parse cart from local storage", error);
        return 0;
    }
    return 0;
};

interface NavLinkProps {
    href: string;
    icon: React.ElementType;
    children: React.ReactNode;
    active?: boolean;
    badgeCount?: number;
    isMobile?: boolean;
}

const NavLink = ({ href, icon: Icon, children, active, badgeCount, isMobile }: NavLinkProps) => {
  const IconComponent = typeof Icon === 'function' ? Icon : null;
  
  return (
    <Button 
        variant={active ? 'secondary' : 'ghost'} 
        asChild 
        className={cn(
        "relative flex flex-col items-center justify-center h-auto font-sans text-xs p-2 gap-1 md:flex-row md:h-10 md:px-4 md:py-2 md:text-sm md:rounded-md transition-all duration-200",
        active ? "bg-primary text-primary-foreground hover:bg-primary/90" : "text-primary hover:bg-primary/10",
        isMobile && "w-full flex-1"
        )}
    >
        <Link href={href}>
        {IconComponent ? <IconComponent /> : <Icon className="h-5 w-5 md:h-4 md:w-4" />}
        <span className="truncate">{children}</span>
        {badgeCount !== undefined && badgeCount > 0 && (
            <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px] border-2 border-background animate-in zoom-in duration-300">
                {badgeCount > 99 ? '99+' : badgeCount}
            </Badge>
        )}
        </Link>
    </Button>
  );
}

export function HeaderNav({ user, cartItemCount: initialCartCount, isMobile = false }: { user: SupabaseUser | null, cartItemCount: number, isMobile?: boolean }) {
  const pathname = usePathname();
  const [cartCount, setCartCount] = useState(initialCartCount);

  useEffect(() => {
    // Immediate sync on client mount
    const localCount = getCartCount();
    
    if (!user) {
        // Logged out: rely entirely on local storage
        setCartCount(localCount);
    } else {
        // Logged in: DB is authoritative but respect immediate local additions
        if (localCount > initialCartCount) {
            setCartCount(localCount);
        } else {
            setCartCount(initialCartCount);
        }
    }

    const handleCartUpdate = () => {
        setCartCount(getCartCount());
    };
    
    window.addEventListener('cart-updated', handleCartUpdate);
    window.addEventListener('storage', handleCartUpdate);

    return () => {
        window.removeEventListener('cart-updated', handleCartUpdate);
        window.removeEventListener('storage', handleCartUpdate);
    };
  }, [user, initialCartCount]);

  const desktopLinks = [
    { href: "/", icon: Home, text: "Home" },
    { href: "/feeds", icon: Newspaper, text: "Feeds" },
    { href: "/orders", icon: Package, text: "Orders" },
    { href: "/saved", icon: Heart, text: "Wishlist" },
    { href: "/cart", icon: ShoppingCart, text: "Cart", badgeCount: cartCount },
  ];
  
  const mobileLinks = [
      { href: "/", icon: Home, text: "Home" },
      { href: "/feeds", icon: Newspaper, text: "Feeds" },
      { href: "/categories", icon: LayoutGrid, text: "Categories" },
      { href: "/cart", icon: ShoppingCart, text: "Cart", badgeCount: cartCount },
      { href: "/saved", icon: Heart, text: "Wishlist" },
      { href: "/profile", icon: user ? () => (
          <Avatar className="h-6 w-6">
              <AvatarImage src={user.user_metadata.avatar_url ?? undefined} />
              <AvatarFallback className="text-[10px]">{user.user_metadata.display_name?.[0] || user.email?.[0]}</AvatarFallback>
          </Avatar>
      ) : User, text: "Profile" },
  ];

  const navLinks = isMobile ? mobileLinks : desktopLinks;

  return (
    <nav className={cn(
        "flex items-center gap-1",
        isMobile ? "w-full justify-between" : "justify-center"
    )}>
      {navLinks.map(link => (
        <NavLink 
          key={link.href} 
          href={link.href} 
          icon={link.icon} 
          active={pathname === link.href} 
          badgeCount={(link as any).badgeCount}
          isMobile={isMobile}
        >
          {link.text}
        </NavLink>
      ))}
    </nav>
  );
}
