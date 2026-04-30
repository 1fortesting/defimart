export const dynamic = 'force-dynamic';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database, Tables } from '@/types/supabase';
import { notFound } from 'next/navigation';
import CustomerDetailsClientPage from './customer-details-client-page';

// Define types for joined data
export type OrderWithProduct = Tables<'orders'> & {
    products: Pick<Tables<'products'>, 'name'> | null;
};

export type ReviewWithProduct = Tables<'reviews'> & {
    products: Pick<Tables<'products'>, 'name'> | null;
};

export default async function CustomerDetailsPage({ params }: { params: Promise<{ id: string }> }) {
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

    const { id } = await params;

    // 1. Fetch user and profile data
    const { data: { user }, error: userError } = await supabaseAdmin.auth.admin.getUserById(id);
    const { data: profile, error: profileError } = await supabaseAdmin.from('profiles').select('*').eq('id', id).single();

    if (userError || !user || profileError || !profile) {
        notFound();
    }
    
    const userWithProfile = { ...user, ...profile, ...user.user_metadata };

    // 2. Fetch user's orders
    const { data: orders, error: ordersError } = await supabaseAdmin
        .from('orders')
        .select('*, products(name)')
        .eq('buyer_id', id)
        .order('created_at', { ascending: false })
        .returns<OrderWithProduct[]>();

    // 3. Fetch user's reviews
    const { data: reviews, error: reviewsError } = await supabaseAdmin
        .from('reviews')
        .select('*, products(name)')
        .eq('user_id', id)
        .order('created_at', { ascending: false })
        .returns<ReviewWithProduct[]>();

    if (ordersError) console.error("Error fetching customer orders:", ordersError.message);
    if (reviewsError) console.error("Error fetching customer reviews:", reviewsError.message);

    // 4. Calculate stats
    const totalSpent = orders?.reduce((sum, order) => sum + (order.price_per_item * order.quantity), 0) ?? 0;
    const totalOrders = orders?.length ?? 0;
    const totalReviews = reviews?.length ?? 0;
    const avgRating = totalReviews > 0 ? (reviews?.reduce((sum, r) => sum + r.rating, 0) ?? 0) / totalReviews : 0;

    const stats = {
        totalSpent,
        totalOrders,
        totalReviews,
        avgRating,
    };

    return (
        <CustomerDetailsClientPage
            customer={userWithProfile}
            stats={stats}
            orders={orders ?? []}
            reviews={reviews ?? []}
        />
    );
}
