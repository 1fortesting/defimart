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
  Info,
  Store,
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
import { RefreshButton } from './refresh-button';

export async function Header() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let cartItemCount = 0;
  let isSeller = false;
  const isAdmin = user?.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL;

  if (user) {
    // Fetch cart count
    const { data: cartItems } = await (supabase as any)
      .from('cart_items')
      .select('quantity')
      .eq('user_id', user.id);

    if (cartItems) {
      cartItemCount = (cartItems as any[]).reduce((sum: number, item: any) => sum + item.quantity, 0);
    }

    // Check if approved seller
    const { data: seller } = await supabase
      .from('sellers' as any)
      .select('status')
      .eq('user_id', user.id)
      .eq('status', 'approved')
      .maybeSingle();
    
    isSeller = !!seller;
  }
  
  const { data: products } = await supabase.from('products').select('*');
  const allProducts = products || [];

  const userLinks = [
    { title: "Profile", description: "View and edit your profile", href: "/profile", icon: UserIcon },
    { title: "My Orders", description: "Track your past and current orders", href: "/orders", icon: Package },
    { title: "Wishlist", description: "View your saved products", href: "/saved", icon: Heart },
    { title: "Messages", description: "Your conversations with sellers", href: "/messages", icon: MessageSquare },
  ];

  const sellerLinks = isSeller ? [
    { title: "My Shop", description: "Manage products & shop status", href: "/seller/dashboard", icon: Store },
  ] : [];

  const generalLinks = isAdmin ? [
    { title: "Request a Product", description: "Tell us what you want to see", href: "/request-product", icon: PackagePlus },
  ] : [];

  const infoLinks = [
    { title: "About Us", description: "Learn more about DEFIMART", href: "/about", icon: Info },
    { title: "FAQ", description: "Find answers to common questions", href: "/faq", icon: HelpCircle },
    { title: "Contact", description: "Get in touch with our team", href: "/contact", icon: Phone },
    { title: "Terms of Service", description: "Read our terms of use", href: "/terms", icon: FileText },
    { title: "Privacy Policy", description: "How we handle your data", href: "/privacy", icon: Shield },
  ];

  const MobileNavLink = ({ href, icon: Icon, title, description }: { href: string; icon: React.ElementType; title: string, description: string }) => (
    <SheetClose asChild>
        <Link href={href} className="flex items-center gap-4 p-3 rounded-lg hover:bg-[var(--surface-2)]">
            <div className="p-2 bg-[var(--surface-2)] rounded-md">
                <Icon className="h-5 w-5 text-[var(--gold)]" />
            </div>
            <div>
                <p className="font-semibold text-[var(--dark)]">{title}</p>
                <p className="text-sm text-[var(--muted)]">{description}</p>
            </div>
        </Link>
    </SheetClose>
  );

  return (
    <header className="relative bg-gradient-to-r from-primary/10 via-background to-red-500/5 backdrop-blur-md border-b border-[var(--border)] p-4 flex flex-col gap-2 overflow-hidden">
      {/* Decorative Aura for Header */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] -mr-32 -mt-32 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-red-500/5 rounded-full blur-[60px] -ml-24 -mb-24 pointer-events-none" />

      {/* Desktop Header */}
      <div className="hidden md:flex justify-between items-center gap-4 relative z-10">
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
      <div className="md:hidden flex justify-between items-center relative z-10">
         <Sheet>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                    <Menu className="h-6 w-6 text-primary" />
                    <span className="sr-only">Open menu</span>
                </Button>
            </SheetTrigger>
                    <SheetContent side="left" className="w-[85%] max-w-sm p-0 flex flex-col bg-[var(--surface)] border-r-0">
                <div className="p-4 bg-[var(--gold)] text-white">
                  <SheetHeader>
                      <SheetTitle className="text-white">
                        <div className="flex justify-between items-center">
                          <Link href="/" className="flex items-center gap-2 font-semibold">
                              <Image src="https://iili.io/qO5Jeou.png" alt="DEFIMART Logo" width={120} height={28} className="brightness-0 invert" />
                          </Link>
                           {user && (
                              <div className="flex items-center gap-2 text-right">
                                  <div>
                                      <p className="font-semibold text-sm leading-tight truncate max-w-28">{user.user_metadata.display_name}</p>
                                  </div>
                                  <Avatar className="h-9 w-9 border-2 border-white/20">
                                      <AvatarImage src={user.user_metadata.avatar_url ?? undefined} />
                                      <AvatarFallback className="bg-white text-[var(--gold)]">
                                          {user.user_metadata.display_name?.[0] || user.email?.[0]}
                                      </AvatarFallback>
                                  </Avatar>
                              </div>
                          )}
                        </div>
                      </SheetTitle>
                  </SheetHeader>
                </div>

                <div className="flex-1 overflow-y-auto">
                    <nav className="flex flex-col gap-1 p-2">
                        {user && (
                            <>
                                {userLinks.map(link => <MobileNavLink key={link.href} {...link} />)}
                                {sellerLinks.map(link => <MobileNavLink key={link.href} {...link} />)}
                                <Separator className="my-2" />
                            </>
                        )}
                        {generalLinks.map(link => <MobileNavLink key={link.href} {...link} />)}
                        <Separator className="my-2" />
                        {infoLinks.map(link => <MobileNavLink key={link.href} {...link} />)}
                    </nav>
                </div>

                <div className="p-4 mt-auto border-t space-y-4">
                    {user ? (
                        <form action={logout}>
                             <Button className="w-full text-base py-6">
                                <LogOut className="mr-2 h-5 w-5" /> Logout
                            </Button>
                        </form>
                    ) : (
                        <SheetClose asChild>
                             <Button asChild className="w-full text-base py-6">
                                <Link href="/login">
                                    <LogIn className="mr-2 h-5 w-5" /> Login / Register
                                </Link>
                            </Button>
                        </SheetClose>
                    )}
                     <p className="text-xs text-center text-muted-foreground pt-2">
                        &copy; {new Date().getFullYear()} DEFIMART. All Rights Reserved.
                    </p>
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
      <div className="hidden md:flex justify-center relative z-10">
        <HeaderNav user={user} cartItemCount={cartItemCount} isSeller={isSeller} />
      </div>
    </header>
  );
}
