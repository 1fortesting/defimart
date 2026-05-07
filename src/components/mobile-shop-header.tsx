'use client';

import { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
    Menu, 
    Home, 
    RefreshCw, 
    LogOut, 
    User as UserIcon, 
    ShoppingBag, 
    Heart, 
    Package, 
    PackagePlus, 
    Info, 
    HelpCircle, 
    Store 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { ThemeToggle } from '@/components/theme-toggle';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { logout } from '@/app/auth/actions';

export function MobileShopHeader() {
    const pathname = usePathname();
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [user, setUser] = useState<any>(null);
    const [seller, setSeller] = useState<any>(null);
    const [title, setTitle] = useState('Vendors');

    useEffect(() => {
        const supabase = createClient();
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);

            if (user) {
                const { data } = await supabase.from('sellers' as any).select('shop_name, status').eq('user_id', user.id).maybeSingle();
                setSeller(data);
            }

            // Determine Title
            if (pathname === '/shops') {
                setTitle('Marketplace');
            } else if (pathname.startsWith('/shops/')) {
                setTitle('Shop Profile');
            } else if (pathname === '/seller/dashboard') {
                setTitle('Vendor Console');
            }
        };
        init();
    }, [pathname]);

    const handleSync = () => {
        startTransition(() => {
            router.refresh();
        });
    };

    const userLinks = [
        { title: "Profile", description: "Account details", href: "/profile", icon: UserIcon },
        { title: "My Orders", description: "Transactions", href: "/orders", icon: ShoppingBag },
        { title: "Wishlist", description: "Saved items", href: "/saved", icon: Heart },
    ];

    const generalLinks = [
        { title: "Home", description: "Main site", href: "/", icon: Home },
        { title: "Vendors", description: "All shops", href: "/shops", icon: Store },
        { title: "FAQ", description: "Help center", href: "/faq", icon: HelpCircle },
    ];

    return (
        <header className="md:hidden bg-background/80 backdrop-blur-xl border-b sticky top-0 z-50 px-3 h-12 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-0.5">
                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-primary hover:bg-primary/10 transition-colors">
                            <Menu className="h-5 w-5" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-[85%] max-w-sm p-0 flex flex-col bg-background border-r-0 shadow-2xl">
                        <SheetHeader className="sr-only">
                            <SheetTitle>Menu</SheetTitle>
                        </SheetHeader>
                        
                        <div className="relative p-6 bg-gradient-to-br from-primary via-orange-500 to-amber-600 text-white h-[140px] flex items-center overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16" />
                            <div className="relative z-10 flex items-center gap-3">
                                <Avatar className="h-12 w-12 border-2 border-white/30 bg-white">
                                    <AvatarImage src={user?.user_metadata?.avatar_url} />
                                    <AvatarFallback className="text-primary font-black text-xl">
                                        {user?.user_metadata?.display_name?.[0] || 'U'}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                    <p className="font-black text-base truncate">{user?.user_metadata?.display_name || 'Customer'}</p>
                                    <p className="text-[10px] text-white/80 font-bold uppercase tracking-widest">{user?.email}</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto py-2">
                            <nav className="flex flex-col">
                                {generalLinks.map(link => (
                                    <SheetClose asChild key={link.href}>
                                        <Link href={link.href} className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors">
                                            <div className="p-2 bg-muted rounded-xl"><link.icon className="h-5 w-5 text-primary" /></div>
                                            <div><p className="font-bold text-sm">{link.title}</p><p className="text-[10px] text-muted-foreground">{link.description}</p></div>
                                        </Link>
                                    </SheetClose>
                                ))}
                                <Separator className="my-2 mx-6 opacity-30" />
                                {user && userLinks.map(link => (
                                    <SheetClose asChild key={link.href}>
                                        <Link href={link.href} className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors">
                                            <div className="p-2 bg-muted rounded-xl"><link.icon className="h-5 w-5 text-primary" /></div>
                                            <div><p className="font-bold text-sm">{link.title}</p><p className="text-[10px] text-muted-foreground">{link.description}</p></div>
                                        </Link>
                                    </SheetClose>
                                ))}
                                {seller?.status === 'approved' && (
                                     <SheetClose asChild>
                                        <Link href="/seller/dashboard" className="flex items-center gap-4 p-4 hover:bg-primary/5 transition-colors border-l-4 border-primary mt-2">
                                            <div className="p-2 bg-primary/10 rounded-xl"><Store className="h-5 w-5 text-primary" /></div>
                                            <div><p className="font-black text-sm text-primary uppercase tracking-tighter">Vendor Console</p><p className="text-[10px] text-muted-foreground">Store operations</p></div>
                                        </Link>
                                    </SheetClose>
                                )}
                            </nav>
                        </div>

                        <div className="p-6 mt-auto border-t">
                            {user ? (
                                <form action={logout}>
                                    <Button className="w-full h-12 font-black uppercase tracking-[2px] rounded-2xl bg-primary text-white shadow-lg shadow-primary/20">
                                        <LogOut className="mr-2 h-4 w-4" /> Logout
                                    </Button>
                                </form>
                            ) : (
                                <Button asChild className="w-full h-12 font-black uppercase tracking-[2px] rounded-2xl">
                                    <Link href="/login">Sign In</Link>
                                </Button>
                            )}
                        </div>
                    </SheetContent>
                </Sheet>
                <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground" asChild>
                    <Link href="/"><Home className="h-4 w-4" /></Link>
                </Button>
            </div>
            
            <div className="flex-1 text-center px-1">
                <h1 className="text-[9px] font-black uppercase tracking-[3px] truncate text-muted-foreground/60">{title}</h1>
            </div>

            <div className="flex items-center gap-0.5">
                <Button variant="ghost" size="icon" className="h-9 w-9 text-primary" onClick={handleSync} disabled={isPending}>
                    <RefreshCw className={cn("h-4 w-4", isPending && "animate-spin")} />
                </Button>
                <ThemeToggle />
            </div>
        </header>
    );
}
