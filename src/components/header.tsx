import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { 
  Menu,
  User as UserIcon,
  PackagePlus,
  Package,
  Heart,
  MessageSquare,
  HelpCircle,
  Phone,
  FileText,
  Shield,
  LogOut,
  LogIn,
} from 'lucide-react';
import { HeaderNav } from './header-nav';
import Image from 'next/image';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from './ui/sheet';
import { UserMenu } from './user-menu';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { ThemeToggle } from './theme-toggle';
import { logout } from '@/app/auth/actions';
import { SearchBar } from './search-bar';
import { Separator } from './ui/separator';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { RefreshButton } from './refresh-button';

export async function Header() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let cartItemCount = 0;
  if (user) {
    const { data: cartItems, error } = await supabase
      .from('cart_items')
      .select('quantity')
      .eq('user_id', user.id);

    if (cartItems) {
      cartItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    }
  }
  
  const { data: products } = await supabase.from('products').select('*');
  const allProducts = products || [];

  const MobileNavLink = ({ href, icon: Icon, children }: { href: string; icon: React.ElementType; children: React.ReactNode }) => (
    <SheetClose asChild>
        <Link href={href} className="flex items-center gap-4 rounded-xl px-3 py-3 text-lg font-medium text-primary-foreground transition-colors bg-white/10 hover:bg-white/20 border border-white/20">
            <Icon className="h-5 w-5" />
            <span>{children}</span>
        </Link>
    </SheetClose>
  );

  return (
    <header className="bg-background border-b p-4 flex flex-col gap-2">
      {/* Desktop Header */}
      <div className="hidden md:flex justify-between items-center gap-4">
        <div className="font-bold text-3xl text-primary tracking-tight">
           <Link href="/">
            <Image
                src="https://iili.io/qO5Jeou.png"
                alt="DEFIMART Logo"
                width={180}
                height={40}
                className="object-contain"
            />
          </Link>
        </div>
        <div className="flex-1 max-w-md mx-4">
            <SearchBar products={allProducts} />
        </div>
        <div className="flex items-center gap-2">
            <ThemeToggle />
            <UserMenu user={user} />
        </div>
      </div>
      
       {/* Mobile Header */}
      <div className="md:hidden flex justify-between items-center">
         <Sheet>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                    <Menu className="h-6 w-6 text-primary" />
                    <span className="sr-only">Open menu</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[85%] max-w-sm p-0 flex flex-col bg-primary">
                <SheetHeader className="p-4 border-b border-primary-foreground/20">
                    <SheetTitle>
                        {user ? (
                            <Link href="/profile" className="flex items-center gap-4">
                                <Avatar className="h-12 w-12 border-2 border-primary-foreground/50">
                                    <AvatarImage src={user.user_metadata.avatar_url ?? undefined} />
                                    <AvatarFallback>{user.user_metadata.display_name?.[0] || user.email?.[0] || 'D'}</AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col overflow-hidden text-primary-foreground">
                                    <span className="font-bold text-lg leading-tight truncate">{user.user_metadata.display_name || 'My Profile'}</span>
                                    <span className="text-xs text-primary-foreground/80 truncate">{user.email}</span>
                                </div>
                            </Link>
                        ) : (
                            <div className="flex items-center gap-4">
                                <Avatar className="h-12 w-12 border-2 border-primary-foreground/50">
                                    <AvatarFallback><UserIcon className="text-primary-foreground" /></AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col text-primary-foreground">
                                    <span className="font-bold text-lg">Welcome</span>
                                    <span className="text-xs text-primary-foreground/80">Please log in to continue</span>
                                </div>
                            </div>
                        )}
                    </SheetTitle>
                </SheetHeader>
                <div className="flex-1 overflow-y-auto">
                    <nav className="flex flex-col gap-2 p-4">
                        {user && (
                            <>
                                <MobileNavLink href="/profile" icon={UserIcon}>Profile</MobileNavLink>
                                <MobileNavLink href="/orders" icon={Package}>My Orders</MobileNavLink>
                                <MobileNavLink href="/saved" icon={Heart}>Wishlist</MobileNavLink>
                                <MobileNavLink href="/messages" icon={MessageSquare}>Messages</MobileNavLink>
                                <Separator className="my-2 bg-primary-foreground/20" />
                            </>
                        )}
                        <MobileNavLink href="/request-product" icon={PackagePlus}>Request a Product</MobileNavLink>
                        <Separator className="my-2 bg-primary-foreground/20" />
                        <MobileNavLink href="/faq" icon={HelpCircle}>FAQ</MobileNavLink>
                        <MobileNavLink href="/contact" icon={Phone}>Contact</MobileNavLink>
                        <Separator className="my-2 bg-primary-foreground/20" />
                        <MobileNavLink href="/terms" icon={FileText}>Terms of Service</MobileNavLink>
                        <MobileNavLink href="/privacy" icon={Shield}>Privacy Policy</MobileNavLink>
                    </nav>
                </div>
                <div className="p-4 mt-auto border-t border-primary-foreground/20">
                    {user ? (
                        <form action={logout}>
                             <Button className="w-full text-base py-6 bg-white/20 text-primary-foreground hover:bg-white/30 border-white/30 border">
                                <LogOut className="mr-2 h-5 w-5" /> Logout
                            </Button>
                        </form>
                    ) : (
                        <SheetClose asChild>
                             <Button asChild className="w-full text-base py-6 bg-white/20 text-primary-foreground hover:bg-white/30 border-white/30 border">
                                <Link href="/login">
                                    <LogIn className="mr-2 h-5 w-5" /> Login / Register
                                </Link>
                            </Button>
                        </SheetClose>
                    )}
                </div>
            </SheetContent>
         </Sheet>

        <Link href="/">
            <Image
                src="https://iili.io/qO5Jeou.png"
                alt="DEFIMART Logo"
                width={150}
                height={32}
                className="object-contain"
            />
        </Link>
        
        <div className="flex items-center gap-1">
            {user && <RefreshButton />}
            <ThemeToggle />
             {!user && (
                <Button asChild size="sm">
                    <Link href="/login">Login</Link>
                </Button>
            )}
        </div>
      </div>

      {/* Desktop Nav */}
      <div className="hidden md:flex justify-center">
        <HeaderNav user={user} cartItemCount={cartItemCount} />
      </div>
    </header>
  );
}
