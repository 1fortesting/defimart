export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/server';
import type { Tables } from '@/types/supabase';
import { startOfDay, endOfDay, format, isValid, parseISO, startOfToday, endOfToday, subDays } from 'date-fns';
import ProfitClientPage from './profit-client-page';

export type ProductWithProfit = Tables<'products'> & {
    total_sales: number;
    total_revenue: number;
    total_profit: number;
    average_rating: number;
    review_count: number;
};

export default async function ProfitPage({ searchParams }: { searchParams?: { [key: string]: string | string[] | undefined } }) {
    const supabaseAdmin = await createClient();

    const params = await searchParams;
    const selectedDateStr = params?.date as string;
    const selectedProductId = params?.productId as string;

    const selectedDate = selectedDateStr && isValid(parseISO(selectedDateStr)) ? parseISO(selectedDateStr) : null;

    // Default to last 30 days for a better profit overview
    const startDate = selectedDate ? startOfDay(selectedDate) : startOfDay(subDays(new Date(), 29));
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

    const { data: ordersData, error: ordersError } = await ordersQuery;
    const { data: reviewsData, error: reviewsError } = await reviewsQuery;

    if (ordersError) console.error("Error fetching orders:", ordersError.message);
    if (reviewsError) console.error("Error fetching reviews:", reviewsError.message);
    
    const orders = ordersData || [];
    const reviews = reviewsData || [];

    // --- Chart Data ---
    let profitChartData;
    let chartTimeUnit: 'day' | 'hour' = 'hour';
    let chartDescription;
    
    if (selectedDate) {
        chartTimeUnit = 'hour';
        chartDescription = `Hourly profit for ${format(selectedDate, 'PPP')}.`;
        profitChartData = Array.from({ length: 24 }, (_, i) => ({
            date: `${String(i).padStart(2, '0')}:00`,
            total: 0
        }));
        orders.forEach(order => {
            const hour = new Date(order.created_at).getHours();
            const profit = (order.price_per_item - (order.cost_price_per_item ?? 0)) * order.quantity;
            profitChartData[hour].total += profit;
        });
    } else { 
        chartTimeUnit = 'day';
        chartDescription = 'Daily profit for the selected period.';
        // Simplified daily chart for multi-day view
        const dayMap: Record<string, number> = {};
        orders.forEach(order => {
            const day = format(new Date(order.created_at), 'MMM d');
            const profit = (order.price_per_item - (order.cost_price_per_item ?? 0)) * order.quantity;
            dayMap[day] = (dayMap[day] || 0) + profit;
        });
        profitChartData = Object.entries(dayMap).map(([date, total]) => ({ date, total }));
    }
    
    // --- Stats Cards ---
    const totalRevenue = orders.reduce((sum, o) => sum + (o.price_per_item * o.quantity), 0);
    const totalCost = orders.reduce((sum, o) => sum + ((o.cost_price_per_item ?? 0) * o.quantity), 0);
    const totalProfit = totalRevenue - totalCost;
    const totalSales = orders.reduce((sum, o) => sum + o.quantity, 0); 
    const { count: totalProducts } = await supabaseAdmin.from('products').select('id', { count: 'exact', head: true });

    const { data: allOrders } = await supabaseAdmin
        .from('orders')
        .select('price_per_item, cost_price_per_item, quantity')
        .eq('status', 'completed');

    const allTimeTotalRevenue = allOrders?.reduce((sum, o) => sum + (o.price_per_item * o.quantity), 0) ?? 0;
    const allTimeTotalCost = allOrders?.reduce((sum, o) => sum + ((o.cost_price_per_item ?? 0) * o.quantity), 0) ?? 0;
    const allTimeTotalProfit = allTimeTotalRevenue - allTimeTotalCost;

    // --- Product Performance Table ---
    let productsQuery = supabaseAdmin.from('products').select('*');
    if (selectedProductId) {
        productsQuery = productsQuery.eq('id', selectedProductId);
    }
    const { data: products } = await productsQuery;

    const productsWithPerf: ProductWithProfit[] = products?.map(p => {
        const productOrders = orders.filter(o => o.product_id === p.id);
        const productReviews = reviews.filter(r => r.product_id === p.id);

        const total_sales = productOrders.reduce((sum, o) => sum + o.quantity, 0);
        const total_revenue = productOrders.reduce((sum, o) => sum + (o.price_per_item * o.quantity), 0);
        const total_cost = productOrders.reduce((sum, o) => sum + ((o.cost_price_per_item ?? 0) * o.quantity), 0);
        const total_profit = total_revenue - total_cost;
        const review_count = productReviews.length;
        const average_rating = review_count > 0 ? productReviews.reduce((sum, r) => sum + r.rating, 0) / review_count : 0;
        
        return { ...p, total_sales, total_revenue, total_profit, average_rating, review_count };
    }) ?? [];

    const { data: allProductsForFilter } = await supabaseAdmin.from('products').select('id, name');

    return (
        <div className="flex flex-col gap-6">
            <ProfitClientPage
                stats={{
                    totalRevenue,
                    totalProfit,
                    totalSales,
                    productCount: totalProducts ?? 0,
                    allTimeTotalProfit,
                }}
                dailyProfit={profitChartData}
                chartDescription={chartDescription}
                chartTimeUnit={chartTimeUnit}
                productsWithPerf={productsWithPerf.sort((a,b) => b.total_profit - a.total_profit)}
                allProducts={allProductsForFilter ?? []}
                currentFilters={{ date: selectedDateStr, productId: selectedProductId }}
            />
        </div>
    );
}
