import { createClient } from '@/lib/supabase/server';
import { Tables } from '@/types/supabase';
import ProcurementProductsClientPage from './products-client-page';
import { ProductWithSalesAndReviews } from '@/app/admin/central-admin/product-performance/page';

export default async function AdminProcurementProductsPage() {
  const supabase = await createClient();

  const { data: productsData } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false })
    .returns<Tables<'products'>[]>();

  const products = productsData || [];

  // --- Fetch data for outstanding products card ---
  const { data: orders } = await supabase.from('orders').select('product_id, price_per_item, quantity');
  const { data: reviews } = await supabase.from('reviews').select('product_id, rating');
  
  const { data: outstandingProductsRaw } = await supabase
    .from('products')
    .select('*')
    .eq('is_outstanding', true)
    .limit(3);

  const outstandingProducts: ProductWithSalesAndReviews[] = (outstandingProductsRaw || []).map(p => {
    const productOrders = orders?.filter(o => o.product_id === p.id) ?? [];
    const productReviews = reviews?.filter(r => r.product_id === p.id) ?? [];
    const total_sales = productOrders.reduce((sum, o) => sum + o.quantity, 0);
    const total_revenue = productOrders.reduce((sum, o) => sum + (o.price_per_item * o.quantity), 0);
    const review_count = productReviews.length;
    const average_rating = review_count > 0 ? productReviews.reduce((sum, r) => sum + r.rating, 0) / review_count : 0;
    return { ...p, total_sales, total_revenue, average_rating, review_count };
  });

  return (
    <ProcurementProductsClientPage 
      products={products}
      outstandingProducts={outstandingProducts}
    />
  );
}
