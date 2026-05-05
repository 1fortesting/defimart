export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/server';
import ShopsClientPage from './shops-client-page';

export default async function ShopsPage() {
    const supabase = await createClient();

    // Fetch approved sellers and their profile info for avatars
    // Also fetch product counts for approved products
    const { data: sellersData, error } = await supabase
        .from('sellers' as any)
        .select(`
            *,
            profiles:user_id (
                avatar_url
            ),
            products (
                id,
                is_approved
            )
        `)
        .eq('status', 'approved')
        .order('shop_name', { ascending: true });

    if (error) {
        console.error("Error fetching shops:", error);
    }

    // Process data to include approved product counts
    const processedSellers = (sellersData || []).map((seller: any) => ({
        ...seller,
        approved_product_count: seller.products?.filter((p: any) => p.is_approved).length || 0
    }));

    return (
        <main className="flex-1 bg-muted/20 pb-20 md:pb-8">
            <div className="container mx-auto px-4 py-8">
                <ShopsClientPage initialSellers={processedSellers} />
            </div>
        </main>
    );
}
