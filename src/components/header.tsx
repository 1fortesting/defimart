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

const NavLink = ({ href, icon: Icon, children, active }: { href: string, icon: React.ElementType, children: React.ReactNode, active?: boolean }) => (
  <Button variant={active ? "secondary" : "ghost"} asChild className={`flex items-center gap-2 ${active ? 'bg-accent' : ''}`}>
    <Link href={href}>
      <Icon className="h-4 w-4" />
      <span>{children}</span>
    </Link>
  </Button>
);

export async function Header() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const navLinks = [
    { href: "/", icon: Home, text: "Home", active: true },
    { href: "/categories", icon: LayoutGrid, text: "Categories" },
    { href: "/profile", icon: User, text: "Profile" },
    { href: "/orders", icon: Package, text: "Orders" },
    { href: "/messages", icon: MessageSquare, text: "Messages" },
    { href: "/saved", icon: Heart, text: "Saved" },
    { href: "/help", icon: HelpCircle, text: "Help" },
    { href: "/cart", icon: ShoppingCart, text: "Cart" },
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
          <NavLink key={link.href} href={link.href} icon={link.icon} active={link.active}>
            {link.text}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}
