
export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/server';
import ShopsClientPage from './shops-client-page';

export default async function ShopsPage() {
    const supabase = await createClient();

    // 1. Fetch approved sellers and their profile info for avatars
    // We remove the direct join to 'products' here because Supabase requires an 
    // explicit foreign key between 'sellers' and 'products' to join them in one select.
    // Instead, we join sellers to profiles (via user_id).
    const { data: sellersData, error: sellersError } = await (supabase
        .from('sellers' as any)
        .select(`
            *,
            profiles:user_id (
                avatar_url
            )
        `)
        .eq('status', 'approved')
        .order('shop_name', { ascending: true }) as any);

    if (sellersError) {
        // Log the message property to see the actual database error (e.g., RLS policy issues)
        console.error("Error fetching sellers:", sellersError.message || sellersError);
    }

    // 2. Fetch approved products to calculate counts in memory
    // This is safer and more reliable than a complex join if relationships are between auth UIDs
    const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('id, seller_id, is_approved');
    
    if (productsError) {
        console.error("Error fetching products for counts:", productsError.message || productsError);
    }

    // 3. Process data to include approved product counts
    // We map sellers to their products based on the seller's user_id matching products.seller_id
    const processedSellers = (sellersData || []).map((seller: any) => {
        // If your products table has 'is_approved', we count only those. 
        // If not, we count all products belonging to this seller.
        const approvedProducts = (productsData || []).filter((p: any) => 
            p.seller_id === seller.user_id && (p.is_approved === true || p.is_approved === undefined || p.is_approved === null)
        );

        return {
            ...seller,
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
