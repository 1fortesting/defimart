export const dynamic = 'force-dynamic';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database, Tables } from '@/types/supabase';
import { subDays } from 'date-fns';
import CustomerMessagingClientPage from './client-page';
import type { User } from '@supabase/supabase-js';

export type CustomerWithPerformance = {
    id: string;
    display_name: string | null;
    email: string | null;
    phone_number: string | null;
    created_at: string;
    total_orders: number;
    completed_orders: number;
};

export type SmsHistoryWithSender = Tables<'sms_history'> & {
    profiles: Pick<Tables<'profiles'>, 'display_name'> | null;
};

export default async function CustomerMessagingPage() {
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

    const { data: { users }, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
    if (usersError) console.error("Error fetching users:", usersError);

    const userIds = users?.map(u => u.id) || [];

    const { data: profiles, error: profilesError } = await supabaseAdmin.from('profiles').select('*').in('id', userIds);
    if (profilesError) console.error("Error fetching profiles:", profilesError);

    const { data: orders, error: ordersError } = await supabaseAdmin.from('orders').select('buyer_id, status');
    if(ordersError) console.error("Error fetching orders:", ordersError);

    const ordersByCustomer = (orders || []).reduce((acc, order) => {
        if (!acc[order.buyer_id]) {
            acc[order.buyer_id] = { total: 0, completed: 0 };
        }
        acc[order.buyer_id].total++;
        if (order.status === 'completed') {
            acc[order.buyer_id].completed++;
        }
        return acc;
    }, {} as Record<string, { total: number, completed: number }>);
    
    const allCustomers: CustomerWithPerformance[] = (users || []).map(user => {
        const profile = profiles?.find(p => p.id === user.id);
        const performance = ordersByCustomer[user.id] || { total: 0, completed: 0 };
        return {
            id: user.id,
            display_name: profile?.display_name || user.user_metadata.display_name || null,
            email: user.email || null,
            phone_number: profile?.phone_number || user.user_metadata.phone_number || null,
            created_at: user.created_at,
            total_orders: performance.total,
            completed_orders: performance.completed,
        };
    }).sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const topCustomers = [...allCustomers].sort((a, b) => b.completed_orders - a.completed_orders).slice(0, 20);
    
    const sevenDaysAgo = subDays(new Date(), 7);
    const newSignups = allCustomers.filter(c => new Date(c.created_at) >= sevenDaysAgo);

    const { data: smsHistory, error: historyError } = await supabaseAdmin
        .from('sms_history')
        .select('*, profiles(display_name)')
        .order('created_at', { ascending: false })
        .limit(10);
    
    if (historyError) console.error('Error fetching SMS history:', historyError);

    return (
       <CustomerMessagingClientPage 
            allCustomers={allCustomers}
            topCustomers={topCustomers}
            newSignups={newSignups}
            smsHistory={smsHistory ?? []}
       />
    );
}
