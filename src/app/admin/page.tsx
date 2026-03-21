import { createClient } from '@/lib/supabase/server';
import { Tables } from '@/types/supabase';
import DashboardClientPage from './dashboard-client-page';

type OrderWithProductAndBuyer = Tables<'orders'> & {
  products: Pick<Tables<'products'>, 'name'> | null;
  profiles: Pick<Tables<'profiles'>, 'display_name'> | null;
};


export default async function AdminDashboardPage() {
    const supabase = createClient();

    const { count: productCount } = await supabase.from('products').select('*', { count: 'exact', head: true });
    const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
    const { count: orderCount } = await supabase.from('orders').select('*', { count: 'exact', head: true });
    
    const { data: recentOrders, error } = await supabase
        .from('orders')
        .select('*, products(name), profiles(display_name)')
        .order('created_at', { ascending: false })
        .limit(5)
        .returns<OrderWithProductAndBuyer[]>();

    return (
        <DashboardClientPage 
            stats={{
                productCount: productCount ?? 0,
                userCount: userCount ?? 0,
                orderCount: orderCount ?? 0
            }}
            recentOrders={recentOrders ?? []}
        />
    );
}
