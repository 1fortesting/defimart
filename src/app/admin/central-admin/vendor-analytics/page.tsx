export const dynamic = 'force-dynamic';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database, Tables } from '@/types/supabase';
import VendorAnalyticsClient from './vendor-analytics-client';

export type VendorWithPerformance = Tables<'sellers'> & {
    profiles: Pick<Tables<'profiles'>, 'avatar_url'> | null;
    products: Tables<'vendor_products'>[];
    metrics: {
        totalRevenue: number;
        totalOrders: number;
        completedOrders: number;
    }
};

export default async function VendorAnalyticsPage() {
    const cookieStore = await cookies();
    const supabaseAdmin = createServerClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          cookies: {
            get(name: string) {
              return cookieStore.get(name)?.value;
            },
          },
        }
    );

    // 1. Fetch all approved sellers
    const { data: sellersData, error: sellersError } = await supabaseAdmin
        .from('sellers' as any)
        .select('*')
        .eq('status', 'approved');

    if (sellersError || !sellersData) {
        console.error("Error fetching sellers:", sellersError?.message);
        return <div className="p-8 text-center text-muted-foreground">No approved vendors found or error loading data.</div>;
    }

    const sellers = sellersData as any[];
    const userIds = sellers.map(s => s.user_id).filter(Boolean);

    // 2. Fetch profiles for these sellers to get avatars
    const { data: profilesData } = await supabaseAdmin
        .from('profiles')
        .select('id, avatar_url')
        .in('id', userIds);

    // 3. Fetch all vendor products
    const { data: productsData } = await supabaseAdmin
        .from('vendor_products' as any)
        .select('*');

    // 4. Fetch all vendor-related orders
    const { data: ordersData } = await supabaseAdmin
        .from('orders')
        .select('*')
        .not('vendor_product_id', 'is', null);

    // 5. Aggregate data for each vendor
    const vendorsWithPerformance: VendorWithPerformance[] = sellers.map(seller => {
        const profile = (profilesData || []).find(p => p.id === seller.user_id);
        const sellerProducts = (productsData || []).filter((p: any) => p.seller_id === seller.user_id);
        const sellerOrders = (ordersData || []).filter((o: any) => o.seller_id === seller.user_id);
        
        const completedOrders = sellerOrders.filter(o => o.status === 'completed');
        const totalRevenue = completedOrders.reduce((sum, o) => sum + (o.price_per_item * o.quantity), 0);

        return {
            ...seller,
            profiles: profile ? { avatar_url: profile.avatar_url } : null,
            products: sellerProducts,
            metrics: {
                totalRevenue,
                totalOrders: sellerOrders.length,
                completedOrders: completedOrders.length
            }
        };
    });

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-black uppercase tracking-tighter italic">Independent Vendor Analytics</h1>
            <VendorAnalyticsClient vendors={vendorsWithPerformance} />
        </div>
    );
}
