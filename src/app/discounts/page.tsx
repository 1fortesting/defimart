import { createClient } from '@/lib/supabase/server';
import { Tables } from '@/types/supabase';
import { ProductCard } from '@/components/product-card';
import { BackButton } from '@/components/back-button';

export default async function DiscountsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { data: discountedProducts } = await supabase
        .from('products')
        .select('*')
        .gt('discount_percentage', 0)
        .gt('discount_end_date', new Date().toISOString())
        .order('created_at', { ascending: false })
        .returns<Tables<'products'>[]>();

    const { data: savedProducts } = user 
      ? await supabase.from('saved_products').select('product_id').eq('user_id', user.id) 
      : { data: null };
    const savedProductIds = new Set(savedProducts?.map(p => p.product_id) || []);

    return (
        <main className="flex-1 p-4 md:p-8">
            <div className="container mx-auto">
                <div className="mb-4">
                    <BackButton />
                </div>
                <h1 className="text-3xl font-bold mb-8">Discounted Products</h1>
                {discountedProducts && discountedProducts.length > 0 ? (
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 md:gap-6 lg:gap-8">
                        {discountedProducts.map((product) => (
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
