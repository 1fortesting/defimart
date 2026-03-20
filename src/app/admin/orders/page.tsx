import { createClient } from '@supabase/supabase-js';
import type { Database, Tables } from '@/types/supabase';
import AdminOrdersClientPage from './orders-client-page';

type OrderWithDetails = Tables<'orders'> & {
  products: Pick<Tables<'products'>, 'name'> | null;
  profiles: Pick<Tables<'profiles'>, 'display_name' | 'phone_number'> | null;
};

export default async function AdminOrdersPage() {
    const supabaseAdmin = createClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: orders, error } = await supabaseAdmin
        .from('orders')
        .select('*, products(name), profiles(display_name, phone_number)')
        .order('created_at', { ascending: false })
        .returns<OrderWithDetails[]>();

    if (error) {
        console.error("Error fetching orders from server:", error);
    }
    
    return <AdminOrdersClientPage initialOrders={orders || []} />;
}
