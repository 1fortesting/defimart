
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ProductCard } from '@/components/product-card';
import { Clock, Store, Info, Package, ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

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

    // Fetch exclusively from vendor_products table for this vendor
    const { data: products } = await (supabase as any)
        .from('vendor_products')
        .select('*')
        .eq('seller_id', seller.user_id)
        .eq('is_approved', true)
        .order('created_at', { ascending: false });

    const { data: { user } } = await supabase.auth.getUser();
    
    const isShopOpen = () => {
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
        <main className="flex-1 bg-muted/20 pb-20">
            <div className="relative h-48 md:h-64 bg-gradient-to-r from-primary via-orange-500 to-amber-600">
                <div className="absolute inset-0 bg-black/10 backdrop-blur-[2px]" />
            </div>

            <div className="container mx-auto px-4 -mt-16 relative z-10">
                <div className="flex flex-col md:flex-row gap-6 items-start">
                    <div className="w-full md:w-80 space-y-6">
                        <Card className="overflow-hidden border-none shadow-xl bg-background rounded-3xl">
                            <CardContent className="p-6">
                                <div className="flex flex-col items-center text-center">
                                    <Avatar className="h-24 w-24 border-4 border-background shadow-lg -mt-16">
                                        <AvatarImage src={profile?.avatar_url || undefined} />
                                        <AvatarFallback className="bg-primary text-white text-3xl font-bold">
                                            {seller.shop_name.charAt(0)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <h1 className="mt-4 text-2xl font-black tracking-tight">{seller.shop_name}</h1>
                                    <Badge 
                                        className={cn(
                                            "mt-2 px-4 py-1 font-bold",
                                            isOpen ? "bg-emerald-500 hover:bg-emerald-600" : "bg-destructive hover:bg-destructive/90"
                                        )}
                                    >
                                        {isOpen ? 'OPEN FOR ORDERS' : 'SHOP CLOSED'}
                                    </Badge>
                                    
                                    <div className="mt-6 w-full space-y-4">
                                        <div className="flex items-center gap-3 text-sm text-muted-foreground p-3 bg-muted/30 rounded-xl">
                                            <Clock className="h-4 w-4 text-primary" />
                                            <div className="text-left">
                                                <p className="font-bold text-foreground">Hours</p>
                                                <p>{seller.open_time} - {seller.close_time}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 text-sm text-muted-foreground p-3 bg-muted/30 rounded-xl">
                                            <Store className="h-4 w-4 text-primary" />
                                            <div className="text-left">
                                                <p className="font-bold text-foreground">Vendor</p>
                                                <p>{seller.full_name}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-lg bg-primary text-primary-foreground rounded-3xl overflow-hidden">
                            <CardContent className="p-6 space-y-4">
                                <div className="flex items-center gap-2">
                                    <Info className="h-5 w-5" />
                                    <h3 className="font-bold">Vendor Info</h3>
                                </div>
                                <p className="text-sm opacity-90 italic">
                                    "Verified campus entrepreneur. Support student businesses!"
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="flex-1 space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold uppercase tracking-widest text-muted-foreground">Catalog</h2>
                            <span className="text-sm font-bold bg-muted px-3 py-1 rounded-full">{products?.length || 0} Items</span>
                        </div>

                        {(!products || products.length === 0) ? (
                            <div className="py-20 text-center bg-background rounded-3xl border-2 border-dashed">
                                <Package className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
                                <p className="text-lg font-bold">Empty catalog</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {products.map((product: any) => (
                                    <ProductCard 
                                        key={product.id} 
                                        product={product} 
                                        user={user} 
                                        isSaved={false} 
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}
