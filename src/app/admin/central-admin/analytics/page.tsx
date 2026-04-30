export const dynamic = 'force-dynamic';

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database, Tables } from '@/types/supabase';
import { subDays, startOfDay, endOfDay, eachDayOfInterval, format, isValid, parseISO, startOfToday, endOfToday } from 'date-fns';
import AnalyticsClientPage from './analytics-client-page';
import { Suspense } from 'react';

export type ProductWithSalesAndReviews = Tables<'products'> & {
    total_sales: number;
    total_revenue: number;
    total_profit: number;
    average_rating: number;
    review_count: number;
};

export type ReviewWithProductAndProfile = Tables<'reviews'> & {
    products: Pick<Tables<'products'>, 'name'> | null;
    profiles: Pick<Tables<'profiles'>, 'display_name'> | null;
};

export default async function AnalyticsPage({ searchParams }: { searchParams?: { [key: string]: string | string[] | undefined } }) {
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

    const params = await searchParams;
    const selectedDateStr = params?.date as string;
    const selectedProductId = params?.productId as string;

    const selectedDate = selectedDateStr && isValid(parseISO(selectedDateStr)) ? parseISO(selectedDateStr) : null;

    const startDate = selectedDate ? startOfDay(selectedDate) : startOfToday();
    const endDate = selectedDate ? endOfDay(selectedDate) : endOfToday();
    
    // --- Data Fetching ---
    
    let ordersQuery = supabaseAdmin
        .from('orders')
        .select('created_at, price_per_item, cost_price_per_item, quantity, product_id')
        .eq('status', 'completed')
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
    } else { // Default view (today)
        salesChartTimeUnit = 'hour';
        salesChartDescription = 'Total revenue for today.';
        salesChartData = Array.from({ length: 24 }, (_, i) => ({
            date: `${String(i).padStart(2, '0')}:00`,
            total: 0
        }));
        orders?.forEach(order => {
            const hour = new Date(order.created_at).getHours();
            salesChartData[hour].total += order.price_per_item * order.quantity;
        });
    }
    
    // --- Stats Cards ---
    const totalRevenue = orders?.reduce((sum, o) => sum + (o.price_per_item * o.quantity), 0) ?? 0;
    const totalCost = orders?.reduce((sum, o) => sum + ((o.cost_price_per_item ?? 0) * o.quantity), 0) ?? 0;
    const totalProfit = totalRevenue - totalCost;
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
        const total_cost = productOrders.reduce((sum, o) => sum + ((o.cost_price_per_item ?? 0) * o.quantity), 0);
        const total_profit = total_revenue - total_cost;
        const review_count = productReviews.length;
        const average_rating = review_count > 0 ? productReviews.reduce((sum, r) => sum + r.rating, 0) / review_count : 0;
        
        return { ...p, total_sales, total_revenue, total_profit, average_rating, review_count };
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
            <AnalyticsClientPage
                stats={{
                    totalRevenue,
                    totalProfit,
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
        </div>
    );
}
