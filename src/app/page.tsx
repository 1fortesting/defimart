import { createClient } from '@/lib/supabase/server';
import { ProductCarousel } from '@/components/product-carousel';
import { SearchBar } from '@/components/search-bar';
import { CategorySidebar } from '@/components/category-sidebar';
import { FlashSaleSection } from '@/components/flash-sale-section';
import { RecommendedForYouSection } from '@/components/recommended-for-you-section';
import type { Tables } from '@/types/supabase';
import { HomePageContent } from './home-page-content';
import { OutstandingProducts } from '@/components/outstanding-products';

export default async function Home() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: productsData } = await supabase.from('products').select('*');
  const { data: reviews } = await supabase.from('reviews').select('product_id, rating');
  
  const { data: savedProducts } = user 
      ? await supabase.from('saved_products').select('product_id').eq('user_id', user.id) 
      : { data: null };
  const savedProductIds = savedProducts?.map(p => p.product_id) || [];

  const allProducts = productsData || [];

  // --- Outstanding Products Logic ---
  const { data: ordersData } = await supabase.from('orders').select('product_id, quantity');
  const orders = ordersData || [];

  const salesByProduct: { [key: string]: number } = orders.reduce((acc, order) => {
    if (!acc[order.product_id]) {
      acc[order.product_id] = 0;
    }
    acc[order.product_id] += order.quantity;
    return acc;
  }, {} as { [key: string]: number });

  const productsWithSales = allProducts
    .map(p => ({ ...p, total_sales: salesByProduct[p.id] || 0 }))
    .sort((a, b) => b.total_sales - a.total_sales);

  const topSellers = productsWithSales.slice(0, 10);
  const shuffledTopSellers = topSellers.sort(() => 0.5 - Math.random());

  let outstandingProducts = shuffledTopSellers.slice(0, 4);

  if (outstandingProducts.length < 4) {
      const existingIds = new Set(outstandingProducts.map(p => p.id));
      const otherProducts = allProducts.filter(p => !existingIds.has(p.id)).sort(() => 0.5 - Math.random());
      outstandingProducts.push(...otherProducts.slice(0, 4 - outstandingProducts.length));
  }
  // --- End Outstanding Products ---

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
    .sort((a, b) => productsByCategory[b].length - productsByCategory[a].length)
    .slice(0, 3);
  
  const categoryColors = [
    'bg-slate-800 text-white',
    'bg-cyan-700 text-white',
    'bg-emerald-600 text-white',
  ];

  const categoriesData = categoriesToShow.map((category, index) => ({
      title: category,
      category: category,
      products: productsByCategory[category].slice(0, 10),
      color: categoryColors[index % categoryColors.length]
  }));

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

            <OutstandingProducts products={outstandingProducts} />

            <FlashSaleSection />
            
            <RecommendedForYouSection user={user} allProductsWithRatings={productsWithRatings} />
            
            <HomePageContent 
                products={shuffledProducts} 
                user={user} 
                savedProductIds={savedProductIds}
                categoriesData={categoriesData}
            />
        </div>
      </main>
  );
}
