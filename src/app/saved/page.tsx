'use client';

import { createClient } from '@/lib/supabase/client';
import { AuthPrompt } from '@/components/auth-prompt';
import { ProductCard } from '@/components/product-card';
import { Tables } from '@/types/supabase';
import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { Loader2 } from 'lucide-react';

type SavedProductWithDetails = Tables<'saved_products'> & {
  products: Tables<'products'> | null;
};

export default function SavedPage() {
  const [user, setUser] = useState<User | null>(null);
  const [savedItems, setSavedItems] = useState<SavedProductWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    const fetchUserAndSavedItems = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);

        if (user) {
            const { data, error } = await supabase
                .from('saved_products')
                .select('*, products(*)')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .returns<SavedProductWithDetails[]>();
            
            if (data) {
                setSavedItems(data);
            }
        }
        setLoading(false);
    };

    fetchUserAndSavedItems();
  }, []);
  
  const handleUnsave = (productId: string) => {
    setSavedItems(currentItems => currentItems.filter(item => item.product_id !== productId));
  };
  
  if (loading) {
    return (
        <main className="flex-1 p-8 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
    );
  }

  if (!user) {
    return (
        <main className="flex-1 p-8 flex items-center justify-center">
          <AuthPrompt />
        </main>
    );
  }
  
  const savedProductIds = new Set(savedItems.map(item => item.product_id));

  return (
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
                    onUnsave={handleUnsave}
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
  );
}
