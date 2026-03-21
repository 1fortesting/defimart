import { createClient } from '@/lib/supabase/server';
import { Tables } from '@/types/supabase';
import ProductsClientPage from './products-client-page';

export default async function AdminProductsPage() {
  const supabase = createClient();

  const { data: products } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false })
    .returns<Tables<'products'>[]>();

  return (
    <ProductsClientPage products={products || []} />
  );
}
