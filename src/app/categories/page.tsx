export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/server';
import { Tables } from '@/types/supabase';
import CategoriesClientPage from './categories-client-page';
import { Suspense } from 'react';

export default async function CategoriesPage() {
    const supabase = await createClient() as any;

    const { data: products } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

    const { data: { user } } = await supabase.auth.getUser();

    const { data: savedProducts } = user 
      ? await supabase.from('saved_products').select('product_id').eq('user_id', user.id) 
      : { data: null };
    const savedProductIds = new Set((savedProducts as any[])?.map((p: any) => p.product_id) || []);

    const categories = [...new Set((products as any[])?.map((p: any) => p.category).filter(Boolean) as string[])].sort();
    const brands = [...new Set((products as any[])?.map((p: any) => p.brand).filter(Boolean) as string[])].sort();

    return (
        <Suspense fallback={<div>Loading...</div>}>
            <CategoriesClientPage 
                allProducts={products || []}
                allCategories={categories}
                allBrands={brands}
                user={user}
                savedProductIds={Array.from(savedProductIds)}
            />
        </Suspense>
    );
}
