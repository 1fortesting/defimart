
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { Tables } from '@/types/supabase';
import ProductView from './product-view';
import { BackButton } from '@/components/back-button';

export type ReviewWithProfile = Tables<'reviews'> & {
  profiles: Pick<Tables<'profiles'>, 'display_name' | 'avatar_url'> | null;
};

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Try fetching from platform products first
    let { data: product } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

    // If not found, try fetching from vendor_products
    if (!product) {
        const { data: vendorProduct } = await supabase
            .from('vendor_products' as any)
            .select('*')
            .eq('id', id)
            .single();
        product = vendorProduct as any;
    }

    if (!product) {
        notFound();
    }
    
    const { data: savedProducts } = user 
      ? await supabase.from('saved_products').select('product_id').eq('user_id', user.id).eq('product_id', product.id).single() 
      : { data: null };
    
    const isSaved = !!savedProducts;

    const { data: reviews } = await supabase
        .from('reviews')
        .select('*, profiles(display_name, avatar_url)')
        .eq('product_id', id)
        .order('created_at', { ascending: false });
    
    const totalRating = (reviews as any[])?.reduce((acc: number, review: any) => acc + review.rating, 0) ?? 0;
    const averageRating = reviews && reviews.length > 0 ? totalRating / reviews.length : 0;
    
    let userReview = null;
    if (user && reviews) {
        userReview = (reviews as any[]).find((r: any) => r.user_id === user.id) || null;
    }

    return (
        <main className="flex-1 bg-muted/40">
            <div className="container mx-auto py-4 md:py-8">
                 <div className="mb-4">
                    <BackButton />
                </div>
                <ProductView 
                    product={product}
                    isSaved={isSaved}
                    reviews={(reviews as any[]) || []}
                    averageRating={averageRating}
                    user={user}
                    userReview={userReview}
                />
            </div>
        </main>
    )
}
