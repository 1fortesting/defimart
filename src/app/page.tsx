import { createClient } from '@/lib/supabase/server';
import { Filters } from '@/components/filters';
import { ProductCarousel } from '@/components/product-carousel';
import { SearchBar } from '@/components/search-bar';
import { CategorySidebar } from '@/components/category-sidebar';
import { FlashSaleSection } from '@/components/flash-sale-section';
import { RecommendedForYouSection } from '@/components/recommended-for-you-section';
import { RequestProductSection } from '@/components/request-product-section';
import { CategoryProductRow } from '@/components/category-product-row';
import type { Tables } from '@/types/supabase';
import { HomeProductGrid } from './home-product-grid';

export default async function Home() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: products } = await supabase.from('products').select('*');
  const { data: reviews } = await supabase.from('reviews').select('product_id, rating');
  
  const { data: savedProducts } = user 
      ? await supabase.from('saved_products').select('product_id').eq('user_id', user.id) 
      : { data: null };
  const savedProductIds = new Set(savedProducts?.map(p => p.product_id) || []);

  const allProducts = products || [];

  const reviewsByProduct = (reviews || []).reduce((acc, review) => {
    if (!acc[review.product_id]) {
        acc[review.product_id] = [];
    }
    acc[review.product_id].push(review.rating);
    return acc;
  }, {} as Record<string, number[]>);

  const productsWithRatings = allProducts.map(p => {
    const ratings = reviewsByProduct[p.id] || [];
    const review_count = ratings.length;
    const average_rating = review_count > 0 ? ratings.reduce((sum, r) => sum + r, 0) / review_count : 0;
    return { ...p, average_rating, review_count };
  });

  const featuredProducts = productsWithRatings.filter(p => p.is_featured);
  const shuffledProducts = [...productsWithRatings].sort(() => 0.5 - Math.random());
  
  // Prioritize featured products for the carousel, but fall back to random if not enough.
  const carouselProducts = featuredProducts.length >= 5 
    ? featuredProducts.slice(0, 5) 
    : shuffledProducts.slice(0, 5);

  const productsByCategory: { [key: string]: Tables<'products'>[] } = allProducts.reduce((acc, product) => {
    const category = product.category || 'Other';
    if (!acc[category]) {
        acc[category] = [];
    }
    acc[category].push(product);
    return acc;
  }, {} as { [key: string]: Tables<'products'>[] });

  const categoriesToShow = Object.keys(productsByCategory)
    .sort((a, b) => productsByCategory[b].length - productsByCategory[a].length) // Sort by most products
    .slice(0, 5); // Take top 5 categories

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
            </div>

            <FlashSaleSection />
            
            {/* New Category Rows */}
            {categoriesToShow.map(category => (
                <CategoryProductRow
                    key={category}
                    title={category}
                    category={category}
                    products={productsByCategory[category].slice(0, 10)}
                />
            ))}

            <RequestProductSection />
            
            <RecommendedForYouSection user={user} allProductsWithRatings={productsWithRatings} />
            
            <HomeProductGrid products={productsWithRatings} user={user} savedProductIds={savedProductIds} />
        </div>
      </main>
  );
}
