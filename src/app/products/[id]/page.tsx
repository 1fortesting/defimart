import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { Tables } from '@/types/supabase';
import ProductView from './product-view';
import { BackButton } from '@/components/back-button';

export type ReviewWithProfile = {
  id: string;
  created_at: string;
  user_id: string;
  rating: number;
  comment: string | null;
  profiles: {
    display_name: string | null;
    avatar_url: string | null;
  } | null;
};

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // 1. Try fetching from the primary platform products table
    let { data: product } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

    let isVendor = false;
    let reviewsTable = 'reviews';
    let reviewForeignKey = 'product_id';

    // 2. If not found in primary table, check the vendor_products table
    if (!product) {
        const { data: vendorProduct } = await (supabase as any)
            .from('vendor_products')
            .select('*')
            .eq('id', id)
            .single();
        product = vendorProduct;
        
        if (product) {
            isVendor = true;
            reviewsTable = 'vendor_reviews';
            reviewForeignKey = 'vendor_product_id';
        }
    }

    if (!product) {
        notFound();
    }
    
    // Check if the current user has saved this product
    const { data: savedProducts } = user 
      ? await supabase.from('saved_products').select('product_id').eq('user_id', user.id).eq('product_id', product.id).maybeSingle() 
      : { data: null };
    
    const isSaved = !!savedProducts;

    // Fetch reviews associated with this product ID from the correct table
    // We use a robust select that joins with profiles
    const { data: reviewsData } = await supabase
        .from(reviewsTable as any)
        .select(`
            *,
            profiles:user_id (
                display_name,
                avatar_url
            )
        `)
        .eq(reviewForeignKey, id)
        .order('created_at', { ascending: false });
    
    const reviews = (reviewsData as any[]) || [];
    const totalRating = reviews.reduce((acc: number, review: any) => acc + review.rating, 0);
    const averageRating = reviews.length > 0 ? totalRating / reviews.length : 0;
    
    let userReview = null;
    if (user && reviews) {
        userReview = reviews.find((r: any) => r.user_id === user.id) || null;
    }

    return (
        <main className="flex-1 bg-muted/40">
            <div className="container mx-auto py-4 md:py-8 px-4">
                 <div className="mb-4">
                    <BackButton />
                </div>
                <ProductView 
                    product={product as any}
                    isSaved={isSaved}
                    reviews={reviews as ReviewWithProfile[]}
                    averageRating={averageRating}
                    user={user}
                    userReview={userReview as ReviewWithProfile}
                />
            </div>
        </main>
    )
}
