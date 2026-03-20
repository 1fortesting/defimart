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
  Store,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from './ui/badge';
import { cn } from '@/lib/utils';

const NavLink = ({ href, icon: Icon, children, active, badgeCount }: { href: string, icon: React.ElementType, children: React.ReactNode, active?: boolean, badgeCount?: number }) => (
  <Button 
    variant={active ? 'secondary' : 'ghost'} 
    asChild 
    className={cn(
      "relative flex flex-col items-center justify-center h-auto font-sans text-xs p-2 gap-1 md:flex-row md:h-10 md:px-4 md:py-2 md:text-sm md:rounded-md",
       active ? "bg-primary text-primary-foreground hover:bg-primary/90" : "text-primary hover:bg-primary/10",
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

export function HeaderNav({ cartItemCount, isMobile: mobileProp }: { cartItemCount: number, isMobile?: boolean }) {
  const pathname = usePathname();
  isMobile = mobileProp || false;

  const desktopLinks = [
    { href: "/", icon: Home, text: "Home" },
    { href: "/categories", icon: LayoutGrid, text: "Categories" },
    { href: "/profile", icon: User, text: "Profile" },
    { href: "/orders", icon: Package, text: "Orders" },
    { href: "/messages", icon: MessageSquare, text: "Messages" },
    { href: "/saved", icon: Heart, text: "Wishlist" },
    { href: "/help", icon: HelpCircle, text: "Help" },
    { href: "/cart", icon: ShoppingCart, text: "Cart", badgeCount: cartItemCount },
  ];
  
  const mobileLinks = [
      { href: "/", icon: Home, text: "Home" },
      { href: "/categories", icon: LayoutGrid, text: "Categories" },
      { href: "/sell", icon: Store, text: "Sell" },
      { href: "/saved", icon: Heart, text: "Wishlist" },
      { href: "/profile", icon: User, text: "Account" },
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
