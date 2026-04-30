export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/server';
import { Tables } from '@/types/supabase';
import DiscountsClientPage from './discounts-client-page';

export default async function AdminProcurementDiscountsPage() {
  const supabase = await createClient();

  const { data: products } = await supabase
    .from('products')
    .select('*')
    .gt('discount_percentage', 0)
    .gt('discount_end_date', new Date().toISOString())
    .order('created_at', { ascending: false })
    .returns<Tables<'products'>[]>();

  return <DiscountsClientPage products={products || []} />;
}
