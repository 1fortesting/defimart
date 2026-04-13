import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database, Tables } from '@/types/supabase';
import AdminSalesOrdersClientPage from './orders-client-page';
import { startOfToday } from 'date-fns';

export type OrderWithDetails = Tables<'orders'> & {
  products: Pick<Tables<'products'>, 'name' | 'image_urls'> | null;
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
        .select('*, products(name, image_urls), profiles:profiles!orders_buyer_id_fkey(id, display_name, phone_number)')
        .order('created_at', { ascending: false })
        .returns<OrderWithDetails[]>();

    if (error) console.error("Error fetching orders from server:", error);

    const allOrders = orders || [];
    
    const todaysOrders = allOrders.filter(order => new Date(order.created_at) >= startOfToday());
    
    const todaysRevenue = todaysOrders.reduce((sum, order) => sum + (order.price_per_item * order.quantity), 0);
    const todaysCost = todaysOrders.reduce((sum, order) => sum + ((order.cost_price_per_item ?? 0) * order.quantity), 0);
    const todaysProfit = todaysRevenue - todaysCost;

    const pendingOrdersCount = allOrders.filter(o => o.status === 'pending').length;
    const readyForPickupCount = allOrders.filter(o => o.status === 'ready').length;
    
    return (
        <AdminSalesOrdersClientPage 
            initialOrders={allOrders} 
            stats={{ 
                todaysRevenue,
                todaysProfit,
                pendingOrdersCount,
                readyForPickupCount,
                totalOrdersCount: allOrders.length,
             }}
        />
    );
}
