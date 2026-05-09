export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/server';
import SearchClientPage from './search-client-page';
import { Suspense } from 'react';

export default async function SearchPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const supabase = await createClient();
  const params = await searchParams;
  const query = (params?.q as string) || '';
  
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch only platform products
  const { data: products } = await supabase.from('products').select('*');
  const { data: reviews } = await supabase.from('reviews').select('product_id, rating');
  
  const officialProducts = products || [];

  // Aggregate reviews
  const reviewsByProduct = (reviews || []).reduce((acc: Record<string, number[]>, review: any) => {
    if (!acc[review.product_id]) acc[review.product_id] = [];
    acc[review.product_id].push(review.rating);
    return acc;
  }, {} as Record<string, number[]>);

  const productsEnriched = officialProducts.map((p: any) => {
    const ratings = reviewsByProduct[p.id] || [];
    const review_count = ratings.length;
    const average_rating = review_count > 0 ? ratings.reduce((sum, r) => sum + r, 0) / review_count : 0;
    return {
        ...p,
        shop_name: 'Official Store',
        average_rating,
        review_count
    };
  });

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
          allProducts={productsEnriched as any}
          allCategories={allCategories}
          user={user}
          savedProductIds={Array.from(savedProductIds) as string[]}
        />
      </Suspense>
    </main>
  );
}
