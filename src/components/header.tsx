import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { 
  Menu,
  User,
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
            <SheetContent side="left" className="w-3/4 p-0">
                <SheetHeader className="p-4 border-b">
                    <SheetTitle>
                      <div className="flex items-center gap-4">
                            <Avatar>
                                <AvatarImage src={user?.user_metadata.avatar_url ?? undefined} />
                                <AvatarFallback>{user?.user_metadata.display_name?.[0] || user?.email?.[0] || 'D'}</AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                                <span className="font-semibold leading-none">{user ? `Welcome, ${user.user_metadata.display_name}` : 'Menu'}</span>
                                {user && <span className="text-xs text-muted-foreground">{user.email}</span>}
                            </div>
                        </div>
                    </SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col gap-4 p-4">
                   <SheetClose asChild>
                    <Link className="font-bold text-lg" href="/profile">Profile</Link>
                   </SheetClose>
                   <SheetClose asChild>
                    <Link className="font-bold text-lg" href="/orders">Orders</Link>
                   </SheetClose>
                   <SheetClose asChild>
                    <Link className="font-bold text-lg" href="/messages">Messages</Link>
                   </SheetClose>
                   <SheetClose asChild>
                    <Link className="font-bold text-lg" href="/help">Help</Link>
                   </SheetClose>
                   <Separator className="my-2" />
                   <SheetClose asChild>
                    <Link className="font-bold text-lg" href="/contact">Contact</Link>
                   </SheetClose>
                   <SheetClose asChild>
                    <Link className="font-bold text-lg" href="/terms">Terms</Link>
                   </SheetClose>
                   <SheetClose asChild>
                    <Link className="font-bold text-lg" href="/privacy">Privacy</Link>
                   </SheetClose>
                   <Separator className="my-2" />
                   {user ? (
                     <form action={logout}>
                       <Button variant="outline" className="w-full">Logout</Button>
                     </form>
                   ) : (
                    <SheetClose asChild>
                        <Button asChild className="w-full"><Link href="/login">Login / Register</Link></Button>
                    </SheetClose>
                   )}
               </nav>
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
        
        <div className="flex items-center">
            {user ? (
                <>
                    <ThemeToggle />
                    <Button asChild variant="ghost" size="icon" className="relative">
                        <Link href="/profile">
                            <User className="h-6 w-6 text-primary"/>
                            <span className="sr-only">Profile</span>
                        </Link>
                    </Button>
                </>
            ) : (
                <Button asChild size="sm">
                    <Link href="/login">Login</Link>
                </Button>
            )}
        </div>
      </div>

      {/* Desktop Nav */}
      <div className="hidden md:flex justify-center">
        <HeaderNav cartItemCount={cartItemCount} />
      </div>
    </header>
  );
}
