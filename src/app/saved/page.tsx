import { Header } from '@/components/header';
import { createClient } from '@/lib/supabase/server';
import { AuthPrompt } from '@/components/auth-prompt';
import { ProductCard } from '@/components/product-card';
import { Tables } from '@/types/supabase';

type SavedProductWithDetails = Tables<'saved_products'> & {
  products: Tables<'products'> | null;
};

export default async function SavedPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 p-8 flex items-center justify-center">
          <AuthPrompt />
        </main>
      </div>
    );
  }

  const { data: savedItems, error } = await supabase
    .from('saved_products')
    .select('*, products(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .returns<SavedProductWithDetails[]>();

  const savedProductIds = new Set(savedItems?.map(item => item.product_id) || []);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 p-4 md:p-8">
        <div className="container mx-auto">
          <h1 className="text-3xl font-bold mb-8">My Wishlist</h1>
          {savedItems && savedItems.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {savedItems.map((item) => 
                item.products ? (
                  <ProductCard 
                    key={item.id} 
                    product={item.products} 
                    user={user} 
                    isSaved={savedProductIds.has(item.product_id)} 
                  />
                ) : null
              )}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-16">
              <p className="text-lg">You haven't saved any items yet.</p>
              <p className="text-sm">Start browsing and click the heart icon to add items to your wishlist!</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
