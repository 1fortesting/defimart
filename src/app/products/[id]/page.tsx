import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { Tables } from '@/types/supabase';
import ProductView from './product-view';
import { BackButton } from '@/components/back-button';

export type ReviewWithProfile = Tables<'reviews'> & {
  profiles: Pick<Tables<'profiles'>, 'display_name' | 'avatar_url'> | null;
};

export default async function ProductPage({ params }: { params: { id: string } }) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { data: product } = await supabase
        .from('products')
        .select('*')
        .eq('id', params.id)
        .single();

    if (!product) {
        notFound();
    }
    
    const { data: savedProducts } = user 
      ? await supabase.from('saved_products').select('product_id').eq('user_id', user.id).eq('product_id', product.id).single() 
      : { data: null };
    
    const isSaved = !!savedProducts;

    const { data: reviews, error: reviewsError } = await supabase
        .from('reviews')
        .select('*, profiles(display_name, avatar_url)')
        .eq('product_id', params.id)
        .order('created_at', { ascending: false })
        .returns<ReviewWithProfile[]>();

    if (reviewsError) {
        console.error('Error fetching reviews:', reviewsError);
    }
    
    const totalRating = reviews?.reduce((acc, review) => acc + review.rating, 0) ?? 0;
    const averageRating = reviews && reviews.length > 0 ? totalRating / reviews.length : 0;
    
    let userReview = null;
    if (user && reviews) {
        userReview = reviews.find(r => r.user_id === user.id) || null;
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
                    reviews={reviews || []}
                    averageRating={averageRating}
                    user={user}
                    userReview={userReview}
                />
            </div>
        </main>
    )
}
