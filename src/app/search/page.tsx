export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/server';
import SearchClientPage from './search-client-page';
import { Suspense } from 'react';

export default async function SearchPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const supabase = await createClient() as any;
  const params = await searchParams;
  const query = (params?.q as string) || '';
  
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch only platform products. Vendor products are isolated in vendor_products table.
  const { data: products } = await supabase.from('products').select('*');
  
  const officialProducts = products || [];

  const productsEnriched = officialProducts.map((p: any) => ({
    ...p,
    shop_name: 'Official Store'
  }));

  const { data: savedProducts } = user 
      ? await supabase.from('saved_products').select('product_id').eq('user_id', user.id) 
      : { data: null };
  const savedProductIds = new Set((savedProducts as any[])?.map((p: any) => p.product_id) || []);

  const allCategories = [...new Set(productsEnriched.map((p: any) => p.category).filter(Boolean) as string[])].sort();

  return (
    <main className="flex-1 p-4 md:p-8">
      <Suspense fallback={<div>Loading...</div>}>
        <SearchClientPage
          initialQuery={query}
          allProducts={productsEnriched}
          allCategories={allCategories}
          user={user}
          savedProductIds={Array.from(savedProductIds) as string[]}
        />
      </Suspense>
    </main>
  );
}
