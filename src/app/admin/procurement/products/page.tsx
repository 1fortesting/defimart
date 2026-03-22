import { createClient } from '@/lib/supabase/server';
import { Tables } from '@/types/supabase';
import ProcurementProductsClientPage from './products-client-page';

export default async function AdminProcurementProductsPage() {
  const supabase = createClient();

  const { data: products } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false })
    .returns<Tables<'products'>[]>();

  return (
    <ProcurementProductsClientPage products={products || []} />
  );
}
