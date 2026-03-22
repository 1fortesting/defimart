import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database, Tables } from '@/types/supabase';
import { subDays, startOfDay, endOfDay, eachDayOfInterval, format, isValid, parseISO } from 'date-fns';
import { Suspense } from 'react';
import CentralAdminClientPage from './central-admin-client-page';

export type ProductWithSalesAndReviews = Tables<'products'> & {
    total_sales: number;
    total_revenue: number;
    average_rating: number;
    review_count: number;
};

export type ReviewWithProductAndProfile = Tables<'reviews'> & {
    products: Pick<Tables<'products'>, 'name'> | null;
    profiles: Pick<Tables<'profiles'>, 'display_name' | 'avatar_url'> | null;
};

type OrderWithProductAndBuyer = Tables<'orders'> & {
  products: Pick<Tables<'products'>, 'name'> | null;
  profiles: Pick<Tables<'profiles'>, 'display_name'> | null;
};


export default async function CentralAdminPage({ searchParams }: { searchParams?: { [key: string]: string | string[] | undefined } }) {
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

    // --- Dashboard Data ---
    const { count: productCount } = await supabaseAdmin.from('products').select('*', { count: 'exact', head: true });
    const { count: orderCount } = await supabaseAdmin.from('orders').select('*', { count: 'exact', head: true });
    const { data: recentOrders, error: recentOrdersError } = await supabaseAdmin
        .from('orders')
        .select('*, products(name), profiles(display_name)')
        .order('created_at', { ascending: false })
        .limit(5)
        .returns<OrderWithProductAndBuyer[]>();

    // --- Analytics Data ---
    const selectedDateStr = searchParams?.date as string;
    const selectedProductId = searchParams?.productId as string;
    const selectedDate = selectedDateStr && isValid(parseISO(selectedDateStr)) ? parseISO(selectedDateStr) : null;

    const startDate = selectedDate ? startOfDay(selectedDate) : startOfDay(subDays(new Date(), 6));
    const endDate = selectedDate ? endOfDay(selectedDate) : new Date();
    
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
    
    const totalRevenue = orders?.reduce((sum, o) => sum + (o.price_per_item * o.quantity), 0) ?? 0;
    const totalSales = orders?.reduce((sum, o) => sum + o.quantity, 0) ?? 0; // Total units sold
    const { count: totalCustomers } = await supabaseAdmin.from('profiles').select('id', { count: 'exact', head: true });
    const { count: totalProducts } = await supabaseAdmin.from('products').select('id', { count: 'exact', head: true });

    let productsQuery = supabaseAdmin.from('products').select('*');
    if (selectedProductId) {
        productsQuery = productsQuery.eq('id', selectedProductId);
    }
    const { data: products, error: productsError } = await productsQuery;

    const productsWithPerf: ProductWithSalesAndReviews[] = products?.map(p => {
        const productOrders = orders?.filter(o => o.product_id === p.id) ?? [];
        const productReviews = reviews?.filter(r => r.product_id === p.id) ?? [];
        const total_sales = productOrders.reduce((sum, o) => sum + o.quantity, 0);
        const total_revenue = productOrders.reduce((sum, o) => sum + (o.price_per_item * o.quantity), 0);
        const review_count = productReviews.length;
        const average_rating = review_count > 0 ? productReviews.reduce((sum, r) => sum + r.rating, 0) / review_count : 0;
        return { ...p, total_sales, total_revenue, average_rating, review_count };
    }) ?? [];

    let recentReviewsQuery = supabaseAdmin
        .from('reviews')
        .select('*, products(name), profiles(display_name, avatar_url)')
        .order('created_at', { ascending: false })
        .limit(5);

    if (selectedDate) {
        recentReviewsQuery = recentReviewsQuery.gte('created_at', startDate.toISOString()).lte('created_at', endDate.toISOString());
    }
    if (selectedProductId) {
        recentReviewsQuery = recentReviewsQuery.eq('product_id', selectedProductId);
    }
    const { data: recentReviews, error: recentReviewsError } = await recentReviewsQuery.returns<ReviewWithProductAndProfile[]>();

    const { data: allProductsForFilter, error: allProductsError } = await supabaseAdmin.from('products').select('id, name');

    return (
        <div className="flex flex-col gap-6">
            <Suspense fallback={<div>Loading...</div>}>
                <CentralAdminClientPage
                    dashboardStats={{
                        productCount: productCount ?? 0,
                        userCount: totalCustomers ?? 0,
                        orderCount: orderCount ?? 0
                    }}
                    recentOrders={recentOrders ?? []}
                    analyticsStats={{ totalRevenue, totalSales, totalCustomers: totalCustomers ?? 0, productCount: totalProducts ?? 0 }}
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
