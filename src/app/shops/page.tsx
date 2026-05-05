
export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/server';
import ShopsClientPage from './shops-client-page';

export default async function ShopsPage() {
    const supabase = await createClient();

    // 1. Fetch approved sellers
    const { data: sellersData, error: sellersError } = await supabase
        .from('sellers' as any)
        .select('*')
        .eq('status', 'approved')
        .order('shop_name', { ascending: true });

    if (sellersError) {
        console.error("Error fetching sellers:", sellersError.message);
        return <main className="flex-1 p-8 text-center text-red-500">Failed to load vendors. Please try again later.</main>;
    }

    const sellers = sellersData || [];
    const userIds = sellers.map((s: any) => s.user_id).filter(Boolean);

    // 2. Fetch profiles for these sellers to get avatars
    const { data: profilesData } = userIds.length > 0 
        ? await supabase.from('profiles').select('id, avatar_url').in('id', userIds)
        : { data: [] };

    // 3. Fetch all products to calculate counts in memory
    const { data: productsData } = await supabase
        .from('products')
        .select('id, seller_id');

    // 4. Process and merge data
    const processedSellers = sellers.map((seller: any) => {
        const profile = (profilesData || []).find((p: any) => p.id === seller.user_id);
        const approvedProducts = (productsData || []).filter((p: any) => p.seller_id === seller.user_id);

        return {
            ...seller,
            profiles: profile ? { avatar_url: profile.avatar_url } : null,
            approved_product_count: approvedProducts.length
        };
    });

    return (
        <main className="flex-1 bg-muted/20 pb-20 md:pb-8">
            <div className="container mx-auto px-4 py-8">
                <ShopsClientPage initialSellers={processedSellers} />
            </div>
        </main>
    );
}
