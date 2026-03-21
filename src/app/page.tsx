import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Filters } from '@/components/filters';
import { ProductCarousel } from '@/components/product-carousel';
import { ProductCard } from '@/components/product-card';
import { SearchBar } from '@/components/search-bar';
import { ListFilter } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tables } from '@/types/supabase';
import { CategorySidebar } from '@/components/category-sidebar';
import { FlashSaleSection } from '@/components/flash-sale-section';

export default async function Home() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: products } = await supabase.from('products').select('*');
  
  const { data: savedProducts } = user 
      ? await supabase.from('saved_products').select('product_id').eq('user_id', user.id) 
      : { data: null };
  const savedProductIds = new Set(savedProducts?.map(p => p.product_id) || []);

  const allProducts = products || [];

  // Select 5 random products for the carousel
  const shuffledProducts = [...allProducts].sort(() => 0.5 - Math.random());
  const carouselProducts = shuffledProducts.slice(0, 5);

  return (
    <main className="flex-1">
        {/* Search for mobile */}
        <div className="p-4 md:hidden">
          <SearchBar products={allProducts} />
        </div>

        <div className="p-4 md:p-8">
            {/* Desktop Hero Section */}
            <div className="hidden lg:grid lg:grid-cols-[250px_1fr] lg:gap-8 lg:mb-12">
              <CategorySidebar />
              {carouselProducts.length > 0 && <ProductCarousel products={carouselProducts} />}
            </div>
            
            {/* Mobile Hero Section */}
            <div className="lg:hidden">
                {carouselProducts.length > 0 && <ProductCarousel products={carouselProducts} />}
                <Filters />
            </div>

            <FlashSaleSection />
            
            <div className="mt-12 lg:mt-0">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Browse All</h2>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="hidden md:flex">
                      <ListFilter className="mr-2 h-4 w-4" />
                      Filter
                    </Button>
                    <Select defaultValue="default">
                        <SelectTrigger className="w-auto md:w-[180px]" >
                            <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="default">Default (Boosted)</SelectItem>
                            <SelectItem value="price-asc">Price: Low to High</SelectItem>
                            <SelectItem value="price-desc">Price: High to Low</SelectItem>
                            <SelectItem value="newest">Newest</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
              </div>
              <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {allProducts.map((product) => (
                  <ProductCard key={product.id} product={product} user={user} isSaved={savedProductIds.has(product.id)} />
                ))}
              </div>
            </div>
        </div>
      </main>
  );
}
