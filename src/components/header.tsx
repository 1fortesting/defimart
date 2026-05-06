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
  X,
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
    { title: "Request a Product", description: "Tell us what you want to see", href: "/request-product", icon: PackagePlus },
  ];

  const sellerLinks = isSeller ? [
    { title: "My Shop", description: "Manage products & shop status", href: "/seller/dashboard", icon: Store },
  ] : [];

  const generalLinks = [
    { title: "About Us", description: "Learn more about DEFIMART", href: "/about", icon: Info },
    { title: "FAQ", description: "Find answers to common questions", href: "/faq", icon: HelpCircle },
    { title: "Terms of Service", description: "Legal terms and conditions", href: "/terms", icon: FileText },
    { title: "Privacy Policy", description: "Our commitment to your privacy", href: "/privacy", icon: Shield },
  ];

  const MobileNavLink = ({ href, icon: Icon, title, description }: { href: string; icon: React.ElementType; title: string, description: string }) => (
    <SheetClose asChild>
        <Link href={href} className="flex items-center gap-4 p-4 rounded-xl transition-all active:bg-muted/50">
            <div className="p-2.5 bg-muted/60 rounded-xl flex items-center justify-center">
                <Icon className="h-5 w-5 text-[var(--gold)]" />
            </div>
            <div className="flex-1">
                <p className="font-bold text-[15px] text-foreground leading-tight">{title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
            </div>
        </Link>
    </SheetClose>
  );

  return (
    <header className="relative bg-gradient-to-r from-primary/[0.05] via-background to-blue-500/[0.01] backdrop-blur-md border-b border-[var(--border)] p-4 flex flex-col gap-2 overflow-hidden">
      {/* Softened Decorative Aura for Header */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/[0.03] rounded-full blur-[80px] -mr-32 -mt-32 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/[0.01] rounded-full blur-[60px] -ml-24 -mb-24 pointer-events-none" />

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
            <SheetContent side="left" className="w-3/4 max-w-sm p-0 flex flex-col bg-background border-r-0 shadow-2xl">
                <SheetHeader className="sr-only">
                    <SheetTitle>Navigation Menu</SheetTitle>
                </SheetHeader>
                
                <div className="relative p-6 bg-[var(--gold)] text-white overflow-hidden h-[160px] flex items-center">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16" />
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full blur-2xl -ml-12 -mb-12" />
                  
                  <div className="relative z-10 flex justify-between items-center w-full mt-4">
                    <Link href="/" className="flex items-center gap-2 font-semibold">
                        <Image src="https://iili.io/qO5Jeou.png" alt="DEFIMART Logo" width={110} height={24} className="brightness-0 invert" />
                    </Link>
                    
                    <div className="flex items-center gap-2">
                        <p className="font-bold text-sm tracking-tight">
                            {user ? (user.user_metadata.display_name || 'Account') : 'User'}
                        </p>
                        <div className="h-10 w-10 rounded-full border-2 border-white/30 bg-white overflow-hidden shadow-md flex items-center justify-center">
                            {user ? (
                                user.user_metadata.avatar_url ? (
                                    <Image 
                                        src={user.user_metadata.avatar_url} 
                                        alt="Profile" 
                                        width={40} 
                                        height={40} 
                                        className="object-cover h-full w-full" 
                                    />
                                ) : (
                                    <span className="text-[var(--gold)] font-black text-lg">
                                        {user.user_metadata.display_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                                    </span>
                                )
                            ) : (
                                <span className="text-[var(--gold)] font-black text-lg">U</span>
                            )}
                        </div>
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    <nav className="flex flex-col py-4">
                        {user && (
                            <>
                                {userLinks.map(link => <MobileNavLink key={link.href} {...link} />)}
                                {sellerLinks.map(link => <MobileNavLink key={link.href} {...link} />)}
                                <Separator className="my-2 mx-6 opacity-50" />
                            </>
                        )}
                        {generalLinks.map(link => <MobileNavLink key={link.href} {...link} />)}
                    </nav>
                </div>

                <div className="p-6 mt-auto border-t bg-muted/20 space-y-4">
                    {user ? (
                        <form action={logout}>
                             <Button className="w-full h-12 text-sm font-black uppercase tracking-widest bg-[var(--gold)] hover:bg-[var(--gold)]/90 shadow-md rounded-2xl text-white">
                                <LogOut className="mr-2 h-4 w-4" /> Logout
                            </Button>
                        </form>
                    ) : (
                        <SheetClose asChild>
                             <Button asChild className="w-full h-12 text-sm font-black uppercase tracking-widest bg-[var(--gold)] hover:bg-[var(--gold)]/90 shadow-md rounded-2xl text-white">
                                <Link href="/login">
                                    <LogIn className="mr-2 h-4 w-4" /> Login / Register
                                </Link>
                            </Button>
                        </SheetClose>
                    )}
                     <p className="text-[10px] text-center font-bold text-muted-foreground uppercase tracking-widest opacity-60">
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
