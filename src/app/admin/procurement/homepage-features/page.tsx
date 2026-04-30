export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/server';
import HomepageFeaturesClientPage from './client-page';
import type { Tables } from '@/types/supabase';

export default async function HomepageFeaturesPage() {
  const supabase = await createClient();

  const { data: products } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false })
    .returns<Tables<'products'>[]>();

  return <HomepageFeaturesClientPage products={products || []} />;
}
