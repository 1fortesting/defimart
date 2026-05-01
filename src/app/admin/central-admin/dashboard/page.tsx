export const dynamic = 'force-dynamic';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database, Tables } from '@/types/supabase';
import { FullPageLoading } from '@/components/loading-spinner';
import CentralAdminDashboardClientPage from './dashboard-client-page';

type OrderWithProductAndBuyer = Tables<'orders'> & {
  products: Pick<Tables<'products'>, 'name'> | null;
  profiles: Pick<Tables<'profiles'>, 'display_name'> | null;
};

export default async function CentralAdminDashboardPage() {
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

    // Fetch counts using service role to bypass RLS
    const { count: productCount } = await supabaseAdmin.from('products').select('id', { count: 'exact', head: true });
    const { count: userCount } = await supabaseAdmin.from('profiles').select('id', { count: 'exact', head: true });
    const { count: orderCount } = await supabaseAdmin.from('orders').select('id', { count: 'exact', head: true });

    // Fetch recent orders
    const { data: ordersData, error: ordersError } = await supabaseAdmin
        .from('orders')
        .select('*, products(name), profiles:profiles!orders_buyer_id_fkey(display_name)')
        .order('created_at', { ascending: false })
        .limit(5)
        .returns<OrderWithDetails[]>();

    if (ordersError) {
        console.error("Error fetching recent orders:", ordersError.message);
    }

    const stats = {
        productCount: productCount ?? 0,
        userCount: userCount ?? 0,
        orderCount: orderCount ?? 0,
    };

    return <CentralAdminDashboardClientPage stats={stats} recentOrders={ordersData || []} />;
}
