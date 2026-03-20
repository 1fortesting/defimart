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

const NavLink = ({ href, icon: Icon, children, active, badgeCount }: { href: string, icon: React.ElementType, children: React.ReactNode, active?: boolean, badgeCount?: number }) => (
  <Button 
    variant={active ? "default" : "ghost"} 
    asChild 
    className={cn(
      "relative flex items-center gap-2",
      !active && "text-primary"
    )}
  >
    <Link href={href}>
      <Icon className="h-4 w-4" />
      <span>{children}</span>
      {badgeCount !== undefined && badgeCount > 0 && (
        <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 justify-center p-0">{badgeCount}</Badge>
      )}
    </Link>
  </Button>
);


export function HeaderNav({ cartItemCount }: { cartItemCount: number }) {
  const pathname = usePathname();

  const navLinks = [
    { href: "/", icon: Home, text: "Home" },
    { href: "/categories", icon: LayoutGrid, text: "Categories" },
    { href: "/profile", icon: User, text: "Profile" },
    { href: "/orders", icon: Package, text: "Orders" },
    { href: "/messages", icon: MessageSquare, text: "Messages" },
    { href: "/saved", icon: Heart, text: "Saved" },
    { href: "/help", icon: HelpCircle, text: "Help" },
    { href: "/cart", icon: ShoppingCart, text: "Cart", badgeCount: cartItemCount },
  ];

  return (
    <nav className="flex justify-center items-center gap-2 overflow-x-auto pb-2">
      {navLinks.map(link => (
        <NavLink key={link.href} href={link.href} icon={link.icon} active={pathname === link.href} badgeCount={link.badgeCount}>
          {link.text}
        </NavLink>
      ))}
    </nav>
  );
}
