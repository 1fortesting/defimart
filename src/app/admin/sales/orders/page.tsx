import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database, Tables } from '@/types/supabase';
import AdminSalesOrdersClientPage from './orders-client-page';
import { startOfToday } from 'date-fns';

type OrderWithDetails = Tables<'orders'> & {
  products: Pick<Tables<'products'>, 'name'> | null;
  profiles: Pick<Tables<'profiles'>, 'id' | 'display_name' | 'phone_number'> | null;
};

export default async function AdminSalesOrdersPage() {
    const cookieStore = cookies();

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

    const { data: orders, error } = await supabaseAdmin
        .from('orders')
        .select('*, products(name), profiles:profiles!orders_buyer_id_fkey(id, display_name, phone_number)')
        .order('created_at', { ascending: false })
        .returns<OrderWithDetails[]>();

    const { data: todaysOrders, error: todaysOrdersError } = await supabaseAdmin
        .from('orders')
        .select('price_per_item, quantity')
        .gte('created_at', startOfToday().toISOString());
        
    const { count: pendingOrdersCount, error: pendingOrdersError } = await supabaseAdmin
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

    if (error) console.error("Error fetching orders from server:", error);
    if (todaysOrdersError) console.error("Error fetching today's orders:", todaysOrdersError);
    if (pendingOrdersError) console.error("Error fetching pending orders count:", pendingOrdersError);

    const todaysRevenue = todaysOrders?.reduce((sum, order) => sum + (order.price_per_item * order.quantity), 0) ?? 0;
    
    return (
        <AdminSalesOrdersClientPage 
            initialOrders={orders || []} 
            stats={{ todaysRevenue, pendingOrdersCount: pendingOrdersCount ?? 0 }}
        />
    );
}
