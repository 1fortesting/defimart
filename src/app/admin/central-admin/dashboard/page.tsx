'use client';

import { createClient } from '@/lib/supabase/client';
import { Tables } from '@/types/supabase';
import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { FullPageLoading } from '@/components/loading-spinner';
import CentralAdminDashboardClientPage from './dashboard-client-page';

type OrderWithProductAndBuyer = Tables<'orders'> & {
  products: Pick<Tables<'products'>, 'name'> | null;
  profiles: Pick<Tables<'profiles'>, 'display_name'> | null;
};

export default function CentralAdminDashboardPage() {
    const [stats, setStats] = useState<{ productCount: number, userCount: number, orderCount: number } | null>(null);
    const [recentOrders, setRecentOrders] = useState<OrderWithProductAndBuyer[] | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            const supabase = createClient();
            
            const { count: productCount } = await supabase.from('products').select('id', { count: 'exact', head: true });
            const { count: userCount } = await supabase.from('profiles').select('id', { count: 'exact', head: true });
            const { count: orderCount } = await supabase.from('orders').select('id', { count: 'exact', head: true });

            const { data: ordersData } = await supabase
                .from('orders')
                .select('*, products(name), profiles:profiles!orders_buyer_id_fkey(display_name)')
                .order('created_at', { ascending: false })
                .limit(5)
                .returns<OrderWithProductAndBuyer[]>();

            setStats({
                productCount: productCount ?? 0,
                userCount: userCount ?? 0,
                orderCount: orderCount ?? 0,
            });
            setRecentOrders(ordersData);
            setLoading(false);
        }
        fetchData();
    }, []);

    if (loading || !stats || !recentOrders) {
        return <FullPageLoading text="Loading dashboard..." />;
    }

    return <CentralAdminDashboardClientPage stats={stats} recentOrders={recentOrders} />;
}
