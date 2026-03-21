'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  LayoutGrid,
  User,
  Package,
  MessageSquare,
  Heart,
  HelpCircle,
  ShoppingCart,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from './ui/badge';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

const getCartCount = () => {
    if (typeof window === 'undefined') return 0;
    try {
        const cart = localStorage.getItem('cart');
        if (!cart) return 0;
        const cartItems = JSON.parse(cart);
        // Ensure cartItems is an array and sum quantities
        if (Array.isArray(cartItems)) {
            return cartItems.reduce((total, item) => total + (item.quantity || 0), 0);
        }
    } catch (error) {
        console.error("Failed to parse cart from local storage", error);
        return 0;
    }
    return 0;
};


const NavLink = ({ href, icon: Icon, children, active, badgeCount }: { href: string, icon: React.ElementType, children: React.ReactNode, active?: boolean, badgeCount?: number }) => (
  <Button 
    variant={active ? 'secondary' : 'ghost'} 
    asChild 
    className={cn(
      "relative flex flex-col items-center justify-center h-auto font-sans text-xs p-2 gap-1 md:flex-row md:h-10 md:px-4 md:py-2 md:text-sm md:rounded-md transition-transform duration-200 transform md:hover:scale-105 active:scale-95",
       active ? "bg-yellow-400 text-black hover:bg-yellow-400/90" : "text-yellow-400 hover:bg-yellow-400/10",
       isMobile && "w-full"
    )}
  >
    <Link href={href}>
      <Icon className="h-5 w-5 md:h-4 md:w-4" />
      <span className="truncate">{children}</span>
      {badgeCount !== undefined && badgeCount > 0 && (
        <Badge variant="destructive" className="absolute top-0 right-1 h-4 w-4 justify-center p-0 text-[10px] md:-top-1 md:-right-1 md:h-5 md:w-5 md:text-xs">{badgeCount}</Badge>
      )}
    </Link>
  </Button>
);

let isMobile = false;

export function HeaderNav({ cartItemCount: initialCartCount, isMobile: mobileProp }: { cartItemCount: number, isMobile?: boolean }) {
  const pathname = usePathname();
  isMobile = mobileProp || false;
  
  const [cartCount, setCartCount] = useState(initialCartCount);

  useEffect(() => {
    // On mount, sync with local storage
    setCartCount(getCartCount());

    const handleCartUpdate = () => {
        setCartCount(getCartCount());
    };
    
    // Listen for custom event
    window.addEventListener('cart-updated', handleCartUpdate);
    // Listen for storage changes to sync across tabs
    window.addEventListener('storage', handleCartUpdate);

    return () => {
        window.removeEventListener('cart-updated', handleCartUpdate);
        window.removeEventListener('storage', handleCartUpdate);
    };
  }, []);

  const desktopLinks = [
    { href: "/", icon: Home, text: "Home" },
    { href: "/categories", icon: LayoutGrid, text: "Categories" },
    { href: "/orders", icon: Package, text: "Orders" },
    { href: "/saved", icon: Heart, text: "Wishlist" },
    { href: "/cart", icon: ShoppingCart, text: "Cart", badgeCount: cartCount },
  ];
  
  const mobileLinks = [
      { href: "/", icon: Home, text: "Home" },
      { href: "/categories", icon: LayoutGrid, text: "Categories" },
      { href: "/saved", icon: Heart, text: "Wishlist" },
      { href: "/help", icon: HelpCircle, text: "Help" },
  ];

  const navLinks = isMobile ? mobileLinks : desktopLinks;

  return (
    <nav className="flex w-full justify-around items-center md:justify-center md:gap-2 md:w-auto">
      {navLinks.map(link => (
        <NavLink 
          key={link.href} 
          href={link.href} 
          icon={link.icon} 
          active={pathname === link.href} 
          badgeCount={isMobile ? undefined : (link as any).badgeCount}
        >
          {link.text}
        </NavLink>
      ))}
    </nav>
  );
}


export function MobileCartIcon({ initialCount }: { initialCount: number }) {
    const [count, setCount] = useState(initialCount);

    useEffect(() => {
        setCount(getCartCount());

        const handleCartUpdate = () => {
            setCount(getCartCount());
        };
        
        window.addEventListener('cart-updated', handleCartUpdate);
        window.addEventListener('storage', handleCartUpdate);

        return () => {
            window.removeEventListener('cart-updated', handleCartUpdate);
            window.removeEventListener('storage', handleCartUpdate);
        };
    }, []);

    return (
        <Button asChild variant="ghost" size="icon" className="relative">
            <Link href="/cart">
                <ShoppingCart className="h-6 w-6 text-primary"/>
                <span className="sr-only">Cart</span>
                {count > 0 && (
                    <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 justify-center p-0 text-xs">{count}</Badge>
                )}
            </Link>
        </Button>
    )
}
