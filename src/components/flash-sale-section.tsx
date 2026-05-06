
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Tables } from '@/types/supabase';
import { Zap, ChevronRight } from 'lucide-react';
import { FlashSaleProductCard } from './flash-sale-product-card';

export async function FlashSaleSection({ excludedSellerIds = [] }: { excludedSellerIds?: string[] }) {
    const supabase = await createClient();

    let query = supabase
        .from('products')
        .select('*')
        .gt('discount_percentage', 0)
        .gt('discount_end_date', new Date().toISOString())
        .order('created_at', { ascending: false });

    // Exclude independent vendor products from flash sales if requested
    if (excludedSellerIds.length > 0) {
        query = query.not('seller_id', 'in', `(${excludedSellerIds.join(',')})`);
    }

    const { data: discountedProducts } = await query.limit(10).returns<Tables<'products'>[]>();

    if (!discountedProducts || discountedProducts.length === 0) {
        return (
            <div className="bg-card rounded-lg my-12 md:my-16">
                <div className="bg-red-600 text-white p-3 flex justify-between items-center rounded-t-lg">
                    <div className="flex items-center gap-2">
                        <Zap className="h-6 w-6" />
                        <h2 className="text-xl font-bold">Flash Sales</h2>
                    </div>
                </div>
                <div className="p-4">
                    <div className="text-center text-muted-foreground py-8 flex flex-col items-center gap-4">
                        <Zap className="h-12 w-12 text-muted-foreground/50" />
                        <div>
                            <h3 className="text-lg font-semibold text-foreground">STAY TUNED!</h3>
                            <p>Flash sales are coming soon.</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
    
    const shuffledProducts = [...discountedProducts].sort(() => 0.5 - Math.random());

    return (
        <div className="bg-card rounded-lg mb-12 mt-4">
            <Link href="/discounts">
                <div className="bg-red-600 text-white p-3 flex justify-between items-center rounded-t-lg hover:bg-red-700 transition-colors cursor-pointer">
                    <div className="flex items-center gap-2">
                        <Zap className="h-6 w-6" />
                        <h2 className="text-xl font-bold">Flash Sales</h2>
                    </div>
                    <div className="flex items-center text-sm font-semibold">
                        See All <ChevronRight className="h-4 w-4" />
                    </div>
                </div>
            </Link>
            <div className="p-4">
                <div className="flex gap-4 overflow-x-auto pb-2 -mb-2 animate-peek-a-boo hover:animate-none">
                    {shuffledProducts.map(product => (
                        <FlashSaleProductCard key={product.id} product={product} />
                    ))}
                </div>
            </div>
        </div>
    )
}
