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
    const { data: sellers } = await supabaseAdmin
        .from('sellers' as any)
        .select('*, profiles:user_id(avatar_url)')
        .eq('status', 'approved');

    if (!sellers) return <div>No approved vendors found.</div>;

    // 2. Fetch all vendor products
    const { data: products } = await supabaseAdmin
        .from('vendor_products' as any)
        .select('*');

    // 3. Fetch all completed vendor orders
    const { data: orders } = await supabaseAdmin
        .from('orders')
        .select('*')
        .not('vendor_product_id', 'is', null);

    // 4. Aggregate data for each vendor
    const vendorsWithPerformance: VendorWithPerformance[] = (sellers as any[]).map(seller => {
        const sellerProducts = (products || []).filter((p: any) => p.seller_id === seller.user_id);
        const sellerOrders = (orders || []).filter((o: any) => o.seller_id === seller.user_id);
        
        const completedOrders = sellerOrders.filter(o => o.status === 'completed');
        const totalRevenue = completedOrders.reduce((sum, o) => sum + (o.price_per_item * o.quantity), 0);

        return {
            ...seller,
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
