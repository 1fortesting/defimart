import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database, Tables } from '@/types/supabase';
import { subDays, startOfDay, endOfDay, eachDayOfInterval, format } from 'date-fns';
import AnalyticsClientPage from './analytics-client-page';

export type ProductWithSalesAndReviews = Tables<'products'> & {
    total_sales: number;
    total_revenue: number;
    average_rating: number;
    review_count: number;
};

export type ReviewWithProductAndProfile = Tables<'reviews'> & {
    products: Pick<Tables<'products'>, 'name'> | null;
    profiles: Pick<Tables<'profiles'>, 'display_name'> | null;
};

export default async function AnalyticsPage() {
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

    const now = new Date();
    const sevenDaysAgo = startOfDay(subDays(now, 6));

    // 1. Fetch sales data for the last 7 days
    const { data: orders, error: ordersError } = await supabaseAdmin
        .from('orders')
        .select('created_at, price_per_item, quantity')
        .gte('created_at', sevenDaysAgo.toISOString());
    
    if (ordersError) console.error("Error fetching orders:", ordersError.message);

    const dailySales = eachDayOfInterval({ start: sevenDaysAgo, end: now }).map(day => {
        const dateString = format(day, 'MMM d');
        const total = orders
            ?.filter(order => format(new Date(order.created_at), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd'))
            .reduce((sum, order) => sum + (order.price_per_item * order.quantity), 0) ?? 0;
        return { date: dateString, total: total };
    });

    const totalRevenue = dailySales.reduce((sum, day) => sum + day.total, 0);
    const totalSales = orders?.length ?? 0;
    
    // 2. Fetch all products with their sales and review data
    const { data: products, error: productsError } = await supabaseAdmin.from('products').select('*');
    const { data: allOrders, error: allOrdersError } = await supabaseAdmin.from('orders').select('product_id, price_per_item, quantity');
    const { data: allReviews, error: allReviewsError } = await supabaseAdmin.from('reviews').select('product_id, rating');

    if (productsError) console.error("Error fetching products:", productsError.message);
    if (allOrdersError) console.error("Error fetching all orders:", allOrdersError.message);
    if (allReviewsError) console.error("Error fetching all reviews:", allReviewsError.message);
    
    const productsWithPerf: ProductWithSalesAndReviews[] = products?.map(p => {
        const productOrders = allOrders?.filter(o => o.product_id === p.id) ?? [];
        const productReviews = allReviews?.filter(r => r.product_id === p.id) ?? [];

        const total_sales = productOrders.reduce((sum, o) => sum + o.quantity, 0);
        const total_revenue = productOrders.reduce((sum, o) => sum + (o.price_per_item * o.quantity), 0);
        const review_count = productReviews.length;
        const average_rating = review_count > 0 ? productReviews.reduce((sum, r) => sum + r.rating, 0) / review_count : 0;
        
        return {
            ...p,
            total_sales,
            total_revenue,
            average_rating,
            review_count
        };
    }) ?? [];

    const totalCustomers = (await supabaseAdmin.from('profiles').select('id', { count: 'exact', head: true })).count ?? 0;

    // 3. Fetch recent reviews
     const { data: recentReviews, error: recentReviewsError } = await supabaseAdmin
        .from('reviews')
        .select('*, products(name), profiles(display_name)')
        .order('created_at', { ascending: false })
        .limit(5)
        .returns<ReviewWithProductAndProfile[]>();
        
    if (recentReviewsError) console.error("Error fetching recent reviews:", recentReviewsError.message);

    return (
        <div className="flex flex-col gap-6">
             <div className="flex items-center">
                <h1 className="text-lg font-semibold md:text-2xl">Analytics</h1>
            </div>
            <AnalyticsClientPage
                stats={{ totalRevenue, totalSales, totalCustomers, productCount: products?.length ?? 0 }}
                dailySales={dailySales}
                productsWithPerf={productsWithPerf.sort((a,b) => b.total_revenue - a.total_revenue)}
                recentReviews={recentReviews ?? []}
            />
        </div>
    );
}
