import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database, Tables } from '@/types/supabase';
import { subDays, startOfDay, endOfDay, format, isValid, parseISO } from 'date-fns';
import ProductPerformanceClientPage from './product-performance-client-page';

export type ProductWithSalesAndReviews = Tables<'products'> & {
    total_sales: number;
    total_revenue: number;
    average_rating: number;
    review_count: number;
};

export default async function ProductPerformancePage({ searchParams }: { searchParams?: { [key: string]: string | string[] | undefined } }) {
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

    const startDate = selectedDate ? startOfDay(selectedDate) : startOfDay(subDays(new Date(), 29)); // Default to last 30 days
    const endDate = selectedDate ? endOfDay(selectedDate) : new Date();
    
    // --- Data Fetching for Performance ---
    
    let ordersQuery = supabaseAdmin
        .from('orders')
        .select('price_per_item, quantity, product_id')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

    let reviewsQuery = supabaseAdmin
        .from('reviews')
        .select('product_id, rating')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

    if (selectedProductId) {
        ordersQuery = ordersQuery.eq('product_id', selectedProductId);
        reviewsQuery = reviewsQuery.eq('product_id', selectedProductId);
    }

    const { data: orders, error: ordersError } = await ordersQuery;
    const { data: reviews, error: reviewsError } = await reviewsQuery;

    if (ordersError) console.error("Error fetching orders for performance:", ordersError.message);
    if (reviewsError) console.error("Error fetching reviews for performance:", reviewsError.message);
    
    let productsQuery = supabaseAdmin.from('products').select('*');
    if (selectedProductId) {
        productsQuery = productsQuery.eq('id', selectedProductId);
    }
    const { data: products, error: productsError } = await productsQuery;
    if (productsError) console.error("Error fetching products for performance:", productsError.message);

    const productsWithPerf: ProductWithSalesAndReviews[] = products?.map(p => {
        const productOrders = orders?.filter(o => o.product_id === p.id) ?? [];
        const productReviews = reviews?.filter(r => r.product_id === p.id) ?? [];

        const total_sales = productOrders.reduce((sum, o) => sum + o.quantity, 0);
        const total_revenue = productOrders.reduce((sum, o) => sum + (o.price_per_item * o.quantity), 0);
        const review_count = productReviews.length;
        const average_rating = review_count > 0 ? productReviews.reduce((sum, r) => sum + r.rating, 0) / review_count : 0;
        
        return { ...p, total_sales, total_revenue, average_rating, review_count };
    }) ?? [];

    const { data: allProductsForFilter, error: allProductsError } = await supabaseAdmin.from('products').select('id, name');
    if(allProductsError) console.error("Error fetching all products for filter:", allProductsError.message);

    return (
        <div className="flex flex-col gap-6">
            <ProductPerformanceClientPage
                productsWithPerf={productsWithPerf.sort((a,b) => b.total_revenue - a.total_revenue)}
                allProducts={allProductsForFilter ?? []}
                currentFilters={{ date: selectedDateStr, productId: selectedProductId }}
            />
        </div>
    );
}
