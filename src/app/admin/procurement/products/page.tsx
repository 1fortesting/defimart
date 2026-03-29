import { createClient } from '@/lib/supabase/server';
import { Tables } from '@/types/supabase';
import ProcurementProductsClientPage from './products-client-page';
import { ProductWithSalesAndReviews } from '@/app/admin/central-admin/product-performance/page';

function calculateOutstandingScore(product: ProductWithSalesAndReviews, maxValues: { maxRevenue: number, maxSales: number, maxReviews: number }): number {
    if (maxValues.maxRevenue === 0 && maxValues.maxSales === 0 && maxValues.maxReviews === 0) return 0;
    
    const normalizedRevenue = maxValues.maxRevenue > 0 ? product.total_revenue / maxValues.maxRevenue : 0;
    const normalizedSales = maxValues.maxSales > 0 ? product.total_sales / maxValues.maxSales : 0;
    const normalizedReviewCount = maxValues.maxReviews > 0 ? product.review_count / maxValues.maxReviews : 0;
    const normalizedRating = product.average_rating / 5.0;

    const score = (normalizedRevenue * 0.4) + (normalizedSales * 0.2) + (normalizedReviewCount * 0.2) + (normalizedRating * 0.2);
    
    return score;
}

export default async function AdminProcurementProductsPage() {
  const supabase = createClient();

  const { data: productsData } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false })
    .returns<Tables<'products'>[]>();

  const products = productsData || [];

  // --- Fetch performance data ---
  const { data: orders } = await supabase.from('orders').select('price_per_item, quantity, product_id');
  const { data: reviews } = await supabase.from('reviews').select('product_id, rating');

  const productsWithPerf: ProductWithSalesAndReviews[] = products.map(p => {
    const productOrders = orders?.filter(o => o.product_id === p.id) ?? [];
    const productReviews = reviews?.filter(r => r.product_id === p.id) ?? [];

    const total_sales = productOrders.reduce((sum, o) => sum + o.quantity, 0);
    const total_revenue = productOrders.reduce((sum, o) => sum + (o.price_per_item * o.quantity), 0);
    const review_count = productReviews.length;
    const average_rating = review_count > 0 ? productReviews.reduce((sum, r) => sum + r.rating, 0) / review_count : 0;
    
    return { ...p, total_sales, total_revenue, average_rating, review_count };
  });

  // --- Scoring for Outstanding Products ---
  const maxRevenue = Math.max(...productsWithPerf.map(p => p.total_revenue), 0);
  const maxSales = Math.max(...productsWithPerf.map(p => p.total_sales), 0);
  const maxReviews = Math.max(...productsWithPerf.map(p => p.review_count), 0);

  const outstandingProducts = productsWithPerf
    .map(p => ({ ...p, score: calculateOutstandingScore(p, { maxRevenue, maxSales, maxReviews }) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  return (
    <ProcurementProductsClientPage 
      products={products}
      outstandingProducts={outstandingProducts}
    />
  );
}
