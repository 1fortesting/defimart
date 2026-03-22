import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database, Tables } from '@/types/supabase';
import { startOfDay, endOfDay, isValid, parseISO } from 'date-fns';
import SearchOrdersClientPage from './search-orders-client-page';
import { Suspense } from 'react';

export type OrderWithDetails = Tables<'orders'> & {
  products: Pick<Tables<'products'>, 'name' | 'image_urls'> | null;
  profiles: Pick<Tables<'profiles'>, 'id' | 'display_name' | 'phone_number'> | null;
};

export default async function SearchOrdersPage({ searchParams }: { searchParams?: { [key: string]: string | string[] | undefined } }) {
    const cookieStore = cookies();
    const supabaseAdmin = createServerClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          cookies: { get(name: string) { return cookieStore.get(name)?.value; } },
        }
    );

    const selectedDateStr = searchParams?.date as string;
    const selectedDate = selectedDateStr && isValid(parseISO(selectedDateStr)) ? parseISO(selectedDateStr) : null;
    
    let orders: OrderWithDetails[] = [];

    if (selectedDate) {
        const { data, error } = await supabaseAdmin
            .from('orders')
            .select('*, products(name, image_urls), profiles:profiles!orders_buyer_id_fkey(id, display_name, phone_number)')
            .gte('created_at', startOfDay(selectedDate).toISOString())
            .lte('created_at', endOfDay(selectedDate).toISOString())
            .order('created_at', { ascending: false })
            .returns<OrderWithDetails[]>();
        
        if (error) console.error("Error fetching orders:", error.message);
        if (data) orders = data;
    }

    return (
        <Suspense fallback={<div>Loading search...</div>}>
            <SearchOrdersClientPage 
                orders={orders}
                currentDate={selectedDateStr}
            />
        </Suspense>
    );
}
