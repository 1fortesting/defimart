export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/server';
import { Tables } from '@/types/supabase';
import CategoriesClientPage from './categories-client-page';
import { Suspense } from 'react';

export default async function CategoriesPage() {
    const supabase = await createClient();

    // Fetch platform products
    const { data: productsData } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

    // Fetch reviews from both tables for full coverage
    const { data: platformReviews } = await supabase.from('reviews').select('product_id, rating');
    const { data: vendorReviews } = await supabase.from('vendor_reviews' as any).select('vendor_product_id, rating');

    const rawProducts = productsData || [];

    // Unified review map
    const reviewsByProduct = (platformReviews || []).reduce((acc: Record<string, number[]>, review: any) => {
        if (!acc[review.product_id]) acc[review.product_id] = [];
        acc[review.product_id].push(review.rating);
        return acc;
    }, {} as Record<string, number[]>);

    const products = rawProducts.map((p: any) => {
        const ratings = reviewsByProduct[p.id] || [];
        const review_count = ratings.length;
        const average_rating = review_count > 0 ? ratings.reduce((sum, r) => sum + r, 0) / review_count : 0;
        return { ...p, average_rating, review_count };
    });

    const { data: { user } } = await supabase.auth.getUser();

    const { data: savedProducts } = user 
      ? await supabase.from('saved_products').select('product_id').eq('user_id', user.id) 
      : { data: null };
    const savedProductIds = new Set((savedProducts as any[])?.map((p: any) => p.product_id) || []);

    const categories = [...new Set(products.map((p: any) => p.category).filter(Boolean) as string[])].sort();
    const brands = [...new Set(products.map((p: any) => p.brand).filter(Boolean) as string[])].sort();

    return (
        <Suspense fallback={<div>Loading...</div>}>
            <CategoriesClientPage 
                allProducts={products as any}
                allCategories={categories}
                allBrands={brands}
                user={user}
                savedProductIds={Array.from(savedProductIds)}
            />
        </Suspense>
    );
}
