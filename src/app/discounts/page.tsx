import { createClient } from '@/lib/supabase/server';
import { Tables } from '@/types/supabase';
import { ProductCard } from '@/components/product-card';
import { BackButton } from '@/components/back-button';

export default async function DiscountsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Fetch only platform-managed discounted products
    const { data: productsData } = await supabase
        .from('products')
        .select('*')
        .gt('discount_percentage', 0)
        .gt('discount_end_date', new Date().toISOString())
        .order('created_at', { ascending: false });

    const rawProducts = productsData || [];
    
    // Fetch and aggregate reviews
    const productIds = rawProducts.map(p => p.id);
    const { data: reviews } = productIds.length > 0 
        ? await supabase.from('reviews').select('product_id, rating').in('product_id', productIds)
        : { data: [] };

    const reviewsByProduct = (reviews || []).reduce((acc: Record<string, number[]>, review: any) => {
        if (!acc[review.product_id]) acc[review.product_id] = [];
        acc[review.product_id].push(review.rating);
        return acc;
    }, {} as Record<string, number[]>);

    const discountedProducts = rawProducts.map((p: any) => {
        const ratings = reviewsByProduct[p.id] || [];
        const review_count = ratings.length;
        const average_rating = review_count > 0 ? ratings.reduce((sum, r) => sum + r, 0) / review_count : 0;
        return { ...p, average_rating, review_count };
    });

    const { data: savedProducts } = user 
      ? await supabase.from('saved_products').select('product_id').eq('user_id', user.id) 
      : { data: null };
    const savedProductIds = new Set((savedProducts as any[])?.map((p: any) => p.product_id) || []);

    return (
        <main className="flex-1 p-4 md:p-8">
            <div className="container mx-auto">
                <div className="mb-4">
                    <BackButton />
                </div>
                <h1 className="text-3xl font-bold mb-8">Discounted Products</h1>
                {discountedProducts && discountedProducts.length > 0 ? (
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 md:gap-6 lg:gap-8">
                        {discountedProducts.map((product: any) => (
                            <ProductCard 
                                key={product.id} 
                                product={product} 
                                user={user} 
                                isSaved={savedProductIds.has(product.id)} 
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center text-muted-foreground py-16">
                        <p className="text-lg">No discounted products available at the moment.</p>
                        <p className="text-sm">Check back later for great deals!</p>
                    </div>
                )}
            </div>
        </main>
    );
}
