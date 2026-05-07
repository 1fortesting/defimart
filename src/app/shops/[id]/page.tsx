import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ProductCard } from '@/components/product-card';
import { Clock, Store, Info, Package, ImageIcon, Search, Zap, Star, LayoutGrid, Heart, ShoppingBag, ArrowRight, MapPin } from 'lucide-react';
import { cn, formatPrice } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import Image from 'next/image';
import Link from 'next/link';

export default async function ShopProfilePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const supabase = await createClient();

    const { data: seller, error: sellerError } = await supabase
        .from('sellers' as any)
        .select('*')
        .eq('id', id)
        .single();

    if (sellerError || !seller) {
        notFound();
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('avatar_url, display_name')
        .eq('id', seller.user_id)
        .single();

    const { data: products } = await (supabase as any)
        .from('vendor_products')
        .select('*')
        .eq('seller_id', seller.user_id)
        .eq('is_approved', true)
        .order('created_at', { ascending: false });

    const { data: { user } } = await supabase.auth.getUser();
    
    const isShopOpen = () => {
        // Official stores are always open
        if (seller.user_id === process.env.NEXT_PUBLIC_ADMIN_ID) return true;
        
        if (!seller.is_open) return false;
        if (!seller.open_time || !seller.close_time) return seller.is_open;

        const now = new Date();
        const [openH, openM] = seller.open_time.split(':').map(Number);
        const [closeH, closeM] = seller.close_time.split(':').map(Number);

        const openDate = new Date(now);
        openDate.setHours(openH, openM, 0);

        const closeDate = new Date(now);
        closeDate.setHours(closeH, closeM, 0);

        return now >= openDate && now <= closeDate;
    };

    const isOpen = isShopOpen();

    return (
        <main className="flex-1 bg-background pb-24 md:pb-12">
            {/* 1. Immersive Hero Section */}
            <div className="relative h-[220px] md:h-[300px] w-full overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary via-orange-500 to-amber-600">
                    <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]" />
                    {/* Decorative Elements */}
                    <div className="absolute top-[-10%] right-[-5%] w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse" />
                    <div className="absolute bottom-[-20%] left-[-10%] w-80 h-80 bg-black/10 rounded-full blur-3xl" />
                </div>
                
                <div className="container mx-auto px-4 h-full flex flex-col justify-center relative z-10">
                    <div className="max-w-xl space-y-4">
                        <div className="flex items-center gap-3">
                            <Badge className="bg-white/20 backdrop-blur-md text-white border-none font-black text-[10px] uppercase tracking-widest px-3 h-6">
                                Verified Vendor
                            </Badge>
                            {isOpen && <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_#10b981]" /><span className="text-white text-[10px] font-black uppercase tracking-tighter">Live Now</span></div>}
                        </div>
                        <h1 className="text-3xl md:text-5xl font-black text-white italic uppercase tracking-tighter leading-none drop-shadow-2xl">
                            {seller.shop_name}<br/>
                            <span className="text-white/70 text-lg md:text-2xl not-italic font-medium tracking-normal">Marketplace Vendor</span>
                        </h1>
                    </div>
                </div>
            </div>

            {/* 2. Brand Identity Overlap */}
            <div className="container mx-auto px-4 -mt-10 relative z-20">
                <div className="bg-background rounded-[40px] shadow-[0_20px_60px_rgba(0,0,0,0.06)] p-6 md:p-8 flex flex-col md:flex-row md:items-start justify-between gap-8 border border-border/40">
                    <div className="flex items-center gap-4 md:gap-6">
                        <div className="relative">
                            <Avatar className="h-20 w-20 md:h-24 md:w-24 border-4 border-background shadow-xl ring-1 ring-black/5 bg-white">
                                <AvatarImage src={profile?.avatar_url || undefined} />
                                <AvatarFallback className="bg-primary/5 text-primary text-3xl font-black">
                                    {seller.shop_name.charAt(0)}
                                </AvatarFallback>
                            </Avatar>
                            <div className={cn("absolute -bottom-1 -right-1 h-6 w-6 rounded-full border-4 border-background shadow-lg", isOpen ? "bg-emerald-500" : "bg-red-500")} />
                        </div>
                        <div className="space-y-1">
                            <h2 className="text-xl md:text-2xl font-black tracking-tight">{seller.shop_name}</h2>
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1 text-xs font-bold text-muted-foreground uppercase">
                                    <Clock className="h-3.5 w-3.5 text-primary" />
                                    <span>{seller.open_time} – {seller.close_time}</span>
                                </div>
                                <Separator orientation="vertical" className="h-3" />
                                <div className="flex items-center gap-1 text-xs font-bold text-muted-foreground uppercase">
                                    <Package className="h-3.5 w-3.5 text-primary" />
                                    <span>{products?.length || 0} Listings</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 md:max-w-md">
                        {seller.description ? (
                             <div className="bg-muted/30 p-5 rounded-3xl border-2 border-dashed border-muted-foreground/10 relative">
                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-2">
                                    <FileText className="h-3 w-3 text-primary" /> About Shop
                                </p>
                                <p className="text-sm leading-relaxed text-muted-foreground font-medium italic">
                                    &ldquo;{seller.description}&rdquo;
                                </p>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-muted-foreground/40 text-xs font-bold uppercase tracking-widest md:justify-end">
                                <Info className="h-4 w-4" /> Trusted Vendor Partner
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* 3. Catalog Section */}
            <div className="container mx-auto px-4 mt-12 space-y-8">
                <div className="flex items-center justify-between px-2">
                    <h2 className="text-2xl font-black italic uppercase tracking-tighter text-foreground flex items-center gap-3">
                        Collection <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    </h2>
                    <span className="text-muted-foreground text-[10px] font-black uppercase tracking-[2px]">
                        {products?.length || 0} Total Items
                    </span>
                </div>

                {(!products || products.length === 0) ? (
                    <div className="py-32 text-center bg-muted/10 rounded-[40px] border-4 border-dashed border-muted-foreground/10 flex flex-col items-center">
                        <ShoppingBag className="h-20 w-20 text-muted-foreground/20 mb-4" />
                        <p className="text-xl font-black text-muted-foreground/40 uppercase tracking-widest italic">Catalog Empty</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-8">
                        {products.map((product: any) => (
                            <Link href={`/products/${product.id}`} key={product.id} className="group">
                                <Card className="border-none shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-[24px] overflow-hidden transition-all duration-500 h-full bg-white flex flex-col group">
                                    <div className="relative aspect-square p-4 bg-muted/20">
                                        {product.image_urls?.[0] ? (
                                            <Image 
                                                src={product.image_urls[0]} 
                                                alt={product.name} 
                                                fill 
                                                className="object-contain p-2 group-hover:scale-110 transition-transform duration-700" 
                                            />
                                        ) : (
                                            <div className="h-full w-full flex items-center justify-center text-muted-foreground/20">
                                                <ImageIcon className="h-12 w-12" />
                                            </div>
                                        )}
                                    </div>
                                    <CardContent className="p-5 space-y-2 flex flex-col flex-1">
                                        <div>
                                            <h3 className="font-black text-sm md:text-base leading-tight line-clamp-1 group-hover:text-primary transition-colors">{product.name}</h3>
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Shop Collection</p>
                                        </div>
                                        <div className="pt-2 mt-auto">
                                            <p className="text-primary font-black text-lg md:text-xl">GHS {formatPrice(product.price).split(' ')[1]}</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            {/* Floating Action Button (Mobile) */}
            <Link href="/search" className="fixed bottom-24 right-6 md:hidden z-[100]">
                <button className="h-16 w-16 rounded-full bg-primary text-white shadow-2xl shadow-primary/40 flex items-center justify-center animate-bounce">
                    <Search className="h-7 w-7" />
                </button>
            </Link>
        </main>
    );
}
