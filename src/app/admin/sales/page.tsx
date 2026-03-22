import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database, Tables } from '@/types/supabase';
import AdminSalesClientPage from './sales-client-page';
import { startOfToday, endOfToday } from 'date-fns';

type OrderWithDetails = Tables<'orders'> & {
  products: Pick<Tables<'products'>, 'name'> | null;
  profiles: Pick<Tables<'profiles'>, 'id' | 'display_name' | 'phone_number'> | null;
};

export default async function AdminSalesPage() {
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

    if (error) {
        console.error("Error fetching orders from server:", error);
    }

    const today = new Date();
    const { data: todaysOrders, error: todaysOrdersError } = await supabaseAdmin
        .from('orders')
        .select('price_per_item, quantity, status')
        .gte('created_at', startOfToday().toISOString())
        .lte('created_at', endOfToday().toISOString());
    
    const todaysRevenue = todaysOrders?.reduce((acc, order) => {
        if(order.status === 'completed') {
            return acc + (order.price_per_item * order.quantity)
        }
        return acc;
    }, 0) ?? 0;

    const pendingOrdersCount = orders?.filter(o => o.status === 'pending').length ?? 0;
    
    return (
        <div className="flex flex-col gap-4">
            <AdminSalesClientPage 
                initialOrders={orders || []} 
                stats={{
                    todaysRevenue,
                    pendingOrdersCount
                }}
            />
        </div>
    );
}
