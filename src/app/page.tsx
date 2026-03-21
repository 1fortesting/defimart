import { createClient } from '@/lib/supabase/server';
import { Filters } from '@/components/filters';
import { ProductCarousel } from '@/components/product-carousel';
import { SearchBar } from '@/components/search-bar';
import { CategorySidebar } from '@/components/category-sidebar';
import { FlashSaleSection } from '@/components/flash-sale-section';
import { HomeProductGrid } from './home-product-grid';

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
              <HomeProductGrid 
                products={allProducts}
                user={user}
                savedProductIds={savedProductIds}
              />
            </div>
        </div>
      </main>
  );
}
