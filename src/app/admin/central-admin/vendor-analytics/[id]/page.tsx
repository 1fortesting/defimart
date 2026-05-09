export const dynamic = 'force-dynamic';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database, Tables } from '@/types/supabase';
import { notFound } from 'next/navigation';
import VendorDetailsClient from './vendor-details-client';

export type VendorFullPerformance = Tables<'sellers'> & {
    profiles: Pick<Tables<'profiles'>, 'avatar_url' | 'display_name'> | null;
    products: Tables<'vendor_products'>[];
    orders: (Tables<'orders'> & { 
        profiles: Pick<Tables<'profiles'>, 'display_name'> | null 
    })[];
    metrics: {
        totalRevenue: number;
        totalOrders: number;
        completedOrders: number;
    }
};

export default async function VendorPerformancePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
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

    // 1. Fetch the seller
    const { data: seller, error: sellerError } = await supabaseAdmin
        .from('sellers' as any)
        .select('*')
        .eq('id', id)
        .single();

    if (sellerError || !seller) {
        notFound();
    }

    // 2. Fetch profile
    const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('avatar_url, display_name')
        .eq('id', seller.user_id)
        .single();

    // 3. Fetch products
    const { data: products } = await supabaseAdmin
        .from('vendor_products' as any)
        .select('*')
        .eq('seller_id', seller.user_id);

    // 4. Fetch orders with buyer names
    const { data: orders } = await supabaseAdmin
        .from('orders')
        .select('*, profiles:buyer_id(display_name)')
        .eq('seller_id', seller.user_id)
        .order('created_at', { ascending: false });

    const vendorOrders = (orders || []) as any[];
    const completedOrders = vendorOrders.filter(o => o.status === 'completed');
    const totalRevenue = completedOrders.reduce((sum, o) => sum + (o.price_per_item * o.quantity), 0);

    const vendorData: VendorFullPerformance = {
        ...seller,
        profiles: profile,
        products: products || [],
        orders: vendorOrders,
        metrics: {
            totalRevenue,
            totalOrders: vendorOrders.length,
            completedOrders: completedOrders.length
        }
    };

    return (
        <div className="space-y-6">
            <VendorDetailsClient vendor={vendorData} />
        </div>
    );
}
