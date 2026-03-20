import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Home, 
  LayoutGrid, 
  User, 
  Package, 
  MessageSquare, 
  Heart, 
  HelpCircle, 
  ShoppingCart,
  Search,
} from 'lucide-react';
import { logout } from '@/app/auth/actions';
import { Badge } from './ui/badge';

const NavLink = ({ href, icon: Icon, children, active, badgeCount }: { href: string, icon: React.ElementType, children: React.ReactNode, active?: boolean, badgeCount?: number }) => (
  <Button variant={active ? "secondary" : "ghost"} asChild className={`relative flex items-center gap-2 ${active ? 'bg-accent' : ''}`}>
    <Link href={href}>
      <Icon className="h-4 w-4" />
      <span>{children}</span>
      {badgeCount !== undefined && badgeCount > 0 && (
        <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 justify-center p-0">{badgeCount}</Badge>
      )}
    </Link>
  </Button>
);

export async function Header() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let cartItemCount = 0;
  if (user) {
    const { count } = await supabase
      .from('cart_items')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);
    cartItemCount = count ?? 0;
  }

  const navLinks = [
    { href: "/", icon: Home, text: "Home", active: true },
    { href: "/categories", icon: LayoutGrid, text: "Categories" },
    { href: "/profile", icon: User, text: "Profile" },
    { href: "/orders", icon: Package, text: "Orders" },
    { href: "/messages", icon: MessageSquare, text: "Messages" },
    { href: "/saved", icon: Heart, text: "Saved" },
    { href: "/help", icon: HelpCircle, text: "Help" },
    { href: "/cart", icon: ShoppingCart, text: "Cart", badgeCount: cartItemCount },
  ];

  return (
    <header className="bg-card border-b p-4 flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <div className="font-bold text-lg text-primary">
          <Link href="/">DEFIMART</Link>
        </div>
        <div className="flex-1 max-w-md mx-4">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search..." className="pl-10" />
            </div>
        </div>
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <span className="text-sm text-muted-foreground hidden md:inline">
                Welcome, {user.user_metadata?.display_name || user.email}
              </span>
              <form action={logout}>
                <Button variant="outline" size="sm">
                  Logout
                </Button>
              </form>
            </>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link href="/login">Login</Link>
              </Button>
              <Button asChild>
                <Link href="/signup">Sign Up</Link>
              </Button>
            </>
          )}
        </div>
      </div>
      <nav className="flex justify-center items-center gap-2 overflow-x-auto pb-2">
         {navLinks.map(link => (
          <NavLink key={link.href} href={link.href} icon={link.icon} active={link.active} badgeCount={link.badgeCount}>
            {link.text}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}
