import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database, Tables } from '@/types/supabase';
import { subDays, startOfDay, endOfDay, eachDayOfInterval, format, isValid, parseISO } from 'date-fns';
import AnalyticsClientPage from './analytics-client-page';
import { Suspense } from 'react';

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

export default async function AnalyticsPage({ searchParams }: { searchParams?: { [key: string]: string | string[] | undefined } }) {
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

    const selectedDateStr = searchParams?.date as string;
    const selectedProductId = searchParams?.productId as string;

    const selectedDate = selectedDateStr && isValid(parseISO(selectedDateStr)) ? parseISO(selectedDateStr) : null;

    const startDate = selectedDate ? startOfDay(selectedDate) : startOfDay(subDays(new Date(), 6));
    const endDate = selectedDate ? endOfDay(selectedDate) : new Date();
    
    // --- Data Fetching ---
    
    let ordersQuery = supabaseAdmin
        .from('orders')
        .select('created_at, price_per_item, quantity, product_id')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

    let reviewsQuery = supabaseAdmin
        .from('reviews')
        .select('product_id, rating, created_at')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

    if (selectedProductId) {
        ordersQuery = ordersQuery.eq('product_id', selectedProductId);
        reviewsQuery = reviewsQuery.eq('product_id', selectedProductId);
    }

    const { data: orders, error: ordersError } = await ordersQuery;
    const { data: reviews, error: reviewsError } = await reviewsQuery;

    if (ordersError) console.error("Error fetching orders:", ordersError.message);
    if (reviewsError) console.error("Error fetching reviews:", reviewsError.message);
    
    // --- Chart Data ---
    let salesChartData;
    let salesChartTimeUnit: 'day' | 'hour' = 'day';
    let salesChartDescription;
    
    if (selectedDate) {
        salesChartTimeUnit = 'hour';
        salesChartDescription = `Hourly revenue for ${format(selectedDate, 'PPP')}.`;
        salesChartData = Array.from({ length: 24 }, (_, i) => ({
            date: `${String(i).padStart(2, '0')}:00`,
            total: 0
        }));
        orders?.forEach(order => {
            const hour = new Date(order.created_at).getHours();
            salesChartData[hour].total += order.price_per_item * order.quantity;
        });
    } else {
        salesChartDescription = 'Total revenue for the last 7 days.';
        salesChartData = eachDayOfInterval({ start: startDate, end: endDate }).map(day => {
            const dateString = format(day, 'MMM d');
            const total = orders
                ?.filter(order => format(new Date(order.created_at), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd'))
                .reduce((sum, order) => sum + (order.price_per_item * order.quantity), 0) ?? 0;
            return { date: dateString, total };
        });
    }
    
    // --- Stats Cards ---
    const totalRevenue = orders?.reduce((sum, o) => sum + (o.price_per_item * o.quantity), 0) ?? 0;
    const totalSales = orders?.reduce((sum, o) => sum + o.quantity, 0) ?? 0; // Total units sold
    const { count: totalCustomers } = await supabaseAdmin.from('profiles').select('id', { count: 'exact', head: true });
    const { count: totalProducts } = await supabaseAdmin.from('products').select('id', { count: 'exact', head: true });

    // --- Product Performance Table ---
    let productsQuery = supabaseAdmin.from('products').select('*');
    if (selectedProductId) {
        productsQuery = productsQuery.eq('id', selectedProductId);
    }
    const { data: products, error: productsError } = await productsQuery;
    if (productsError) console.error("Error fetching products:", productsError.message);

    const productsWithPerf: ProductWithSalesAndReviews[] = products?.map(p => {
        const productOrders = orders?.filter(o => o.product_id === p.id) ?? [];
        const productReviews = reviews?.filter(r => r.product_id === p.id) ?? [];

        const total_sales = productOrders.reduce((sum, o) => sum + o.quantity, 0);
        const total_revenue = productOrders.reduce((sum, o) => sum + (o.price_per_item * o.quantity), 0);
        const review_count = productReviews.length;
        const average_rating = review_count > 0 ? productReviews.reduce((sum, r) => sum + r.rating, 0) / review_count : 0;
        
        return { ...p, total_sales, total_revenue, average_rating, review_count };
    }) ?? [];

    // --- Recent Reviews Card ---
    let recentReviewsQuery = supabaseAdmin
        .from('reviews')
        .select('*, products(name), profiles(display_name)')
        .order('created_at', { ascending: false })
        .limit(5);

    if (selectedDate) {
        recentReviewsQuery = recentReviewsQuery.gte('created_at', startDate.toISOString()).lte('created_at', endDate.toISOString());
    }
    if (selectedProductId) {
        recentReviewsQuery = recentReviewsQuery.eq('product_id', selectedProductId);
    }
    const { data: recentReviews, error: recentReviewsError } = await recentReviewsQuery.returns<ReviewWithProductAndProfile[]>();
    if (recentReviewsError) console.error("Error fetching recent reviews:", recentReviewsError.message);

    // --- Data for Filters ---
    const { data: allProductsForFilter, error: allProductsError } = await supabaseAdmin.from('products').select('id, name');
    if(allProductsError) console.error("Error fetching all products for filter:", allProductsError.message);

    return (
        <div className="flex flex-col gap-6">
            <Suspense fallback={<div>Loading analytics...</div>}>
                <AnalyticsClientPage
                    stats={{
                        totalRevenue,
                        totalSales,
                        totalCustomers: totalCustomers ?? 0,
                        productCount: totalProducts ?? 0
                    }}
                    dailySales={salesChartData}
                    salesChartDescription={salesChartDescription}
                    salesChartTimeUnit={salesChartTimeUnit}
                    productsWithPerf={productsWithPerf.sort((a,b) => b.total_revenue - a.total_revenue)}
                    recentReviews={recentReviews ?? []}
                    allProducts={allProductsForFilter ?? []}
                    currentFilters={{ date: selectedDateStr, productId: selectedProductId }}
                />
            </Suspense>
        </div>
    );
}
