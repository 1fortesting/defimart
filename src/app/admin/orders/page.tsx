import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database, Tables } from '@/types/supabase';
import AdminOrdersClientPage from './orders-client-page';

type OrderWithDetails = Tables<'orders'> & {
  products: Pick<Tables<'products'>, 'name'> | null;
  profiles: Pick<Tables<'profiles'>, 'display_name' | 'phone_number'> | null;
};

export default async function AdminOrdersPage() {
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
        .select('*, products(name), profiles:profiles!orders_buyer_id_fkey(display_name, phone_number)')
        .order('created_at', { ascending: false })
        .returns<OrderWithDetails[]>();

    if (error) {
        console.error("Error fetching orders from server:", error);
    }
    
    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center">
                <h1 className="text-lg font-semibold md:text-2xl">Orders</h1>
            </div>
            <AdminOrdersClientPage initialOrders={orders || []} />
        </div>
    );
}

    