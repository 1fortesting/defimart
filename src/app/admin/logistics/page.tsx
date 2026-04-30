export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/server';
import { Tables } from '@/types/supabase';
import LogisticsClientPage from './logistics-client-page';

export default async function AdminLogisticsPage() {
  const supabase = await createClient();

  const { data: products } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false })
    .returns<Tables<'products'>[]>();

  return (
    <LogisticsClientPage products={products || []} />
  );
}
