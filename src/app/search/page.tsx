import { createClient } from '@/lib/supabase/server';
import SearchClientPage from './search-client-page';
import { Suspense } from 'react';

export default async function SearchPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const supabase = await createClient() as any;
  const query = (searchParams?.q as string) || '';
  
  const { data: { user } } = await supabase.auth.getUser();

  const { data: products } = await supabase.from('products').select('*');
  
  const { data: savedProducts } = user 
      ? await supabase.from('saved_products').select('product_id').eq('user_id', user.id) 
      : { data: null };
  const savedProductIds = new Set((savedProducts as any[])?.map((p: any) => p.product_id) || []);

  const allProducts = products || [];
  const allCategories = [...new Set(allProducts?.map((p: any) => p.category).filter(Boolean) as string[])].sort();

  return (
    <main className="flex-1 p-4 md:p-8">
      <Suspense fallback={<div>Loading...</div>}>
        <SearchClientPage
          initialQuery={query}
          allProducts={allProducts}
          allCategories={allCategories}
          user={user}
          savedProductIds={Array.from(savedProductIds) as string[]}
        />
      </Suspense>
    </main>
  );
}
