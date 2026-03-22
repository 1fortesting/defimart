import { createClient } from '@/lib/supabase/server';
import { Tables } from '@/types/supabase';
import InventoryClientPage from './inventory-client-page';

export default async function AdminInventoryPage() {
  const supabase = createClient();

  const { data: products } = await supabase
    .from('products')
    .select('*')
    .lte('quantity', 5)
    .order('quantity', { ascending: true })
    .returns<Tables<'products'>[]>();

  return <InventoryClientPage products={products || []} />;
}
