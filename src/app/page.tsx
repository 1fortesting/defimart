export const dynamic = 'force-dynamic';

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
  const supabase = await createClient() as any;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch only platform-managed products
  const { data: productsData } = await supabase.from('products').select('*');
  
  // Fetch reviews from both tables for accurate aggregation
  const { data: platformReviews } = await supabase.from('reviews').select('product_id, rating');
  const { data: vendorReviews } = await supabase.from('vendor_reviews' as any).select('vendor_product_id, rating');
  
  const { data: savedProducts } = user 
      ? await supabase.from('saved_products').select('product_id').eq('user_id', user.id) 
      : { data: null };
  const savedProductIds = (savedProducts as any[])?.map((p: any) => p.product_id) || [];

  const allProducts = productsData || [];

  // Unified review map
  const reviewsByProduct = (platformReviews || []).reduce((acc: Record<string, number[]>, review: any) => {
    if (!acc[review.product_id]) acc[review.product_id] = [];
    acc[review.product_id].push(review.rating);
    return acc;
  }, {} as Record<string, number[]>);

  const productsWithRatings = allProducts.map((p: any) => {
    const ratings = reviewsByProduct[p.id] || [];
    const review_count = ratings.length;
    const average_rating = review_count > 0 ? (ratings as number[]).reduce((sum: number, r: number) => sum + r, 0) / review_count : 0;
    return { ...p, average_rating, review_count };
  });

  const shuffledProducts = [...productsWithRatings].sort(() => 0.5 - Math.random());
  
  // Featured products filtered to official platform items
  const { data: featuredProductsData } = await supabase.from('products').select('*').eq('is_featured', true).limit(5);
  
  // Outstanding products filtered to official platform items
  const { data: outstandingProductsData } = await supabase.from('products').select('*').eq('is_outstanding', true).limit(4);

  const carouselProducts = featuredProductsData && featuredProductsData.length > 0 ? featuredProductsData : allProducts.slice(0, 5);
  let outstandingProducts = outstandingProductsData || [];

  if (outstandingProducts.length < 4) {
      const existingIds = new Set(outstandingProducts.map((p: any) => p.id));
      const otherProducts = allProducts.filter((p: any) => !existingIds.has(p.id)).sort(() => 0.5 - Math.random());
      outstandingProducts.push(...otherProducts.slice(0, 4 - outstandingProducts.length));
  }

  const productsByCategory: { [key: string]: Tables<'products'>[] } = allProducts.reduce((acc: { [key: string]: Tables<'products'>[] }, product: any) => {
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
      products: productsByCategory[category].slice(0, 10).map(p => {
          const ratings = reviewsByProduct[p.id] || [];
          return { ...p, average_rating: ratings.length > 0 ? ratings.reduce((s,r) => s+r,0)/ratings.length : 0, review_count: ratings.length };
      }),
      color: categoryColors[index % categoryColors.length]
  }));

  return (
    <main className="flex-1">
        <div className="p-4 md:hidden">
          <SearchBar products={allProducts} />
        </div>

        <div className="p-4 md:p-8">
            <div className="hidden lg:grid lg:grid-cols-[250px_1fr] lg:gap-8 lg:mb-12">
              <CategorySidebar />
              {carouselProducts.length > 0 && <ProductCarousel products={carouselProducts} />}
            </div>
            
            <div className="lg:hidden">
                {carouselProducts.length > 0 && <ProductCarousel products={carouselProducts} />}
            </div>

            <OutstandingProducts products={outstandingProducts} />

            <FlashSaleSection />
            
            <RecommendedForYouSection />
            
            <HomePageContent 
                products={shuffledProducts as any} 
                user={user} 
                savedProductIds={savedProductIds}
                categoriesData={categoriesData as any}
            />

            <section className="bg-white dark:bg-slate-900 rounded-[32px] p-8 md:p-16 my-16 shadow-2xl border-none overflow-hidden relative">
                <div className="absolute top-0 right-0 w-80 h-80 bg-primary/10 rounded-full -mr-40 -mt-40 blur-3xl" />
                <div className="absolute bottom-0 left-0 w-80 h-80 bg-orange-500/5 rounded-full -ml-40 -mb-40 blur-3xl" />
                
                <div className="max-w-5xl mx-auto relative z-10">
                    <div className="text-center space-y-6">
                        <h2 className="text-3xl md:text-5xl font-black italic uppercase tracking-tighter text-foreground">
                            The Smart Way to Shop on Campus
                        </h2>
                        <p className="text-lg md:text-xl text-muted-foreground leading-relaxed font-medium max-w-3xl mx-auto">
                            DEFIMART is a dual-tier marketplace. We bridge the gap between official campus retail and independent student entrepreneurship, offering everything from tech essentials to local student-crafted gems.
                        </p>
                    </div>

                    <div className="grid sm:grid-cols-3 gap-10 pt-16">
                        <div className="flex flex-col items-center text-center space-y-5 group">
                            <div className="bg-primary/10 p-5 rounded-[24px] transition-all duration-500 group-hover:bg-primary group-hover:text-white group-hover:-translate-y-2 shadow-xl shadow-primary/5">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                            </div>
                            <div>
                                <h3 className="font-black text-xl text-foreground uppercase tracking-tight">Market Speed</h3>
                                <p className="text-sm text-muted-foreground mt-3 font-medium leading-relaxed">Optimized for university life. Browse thousands of listings and collect your items at designated campus spots instantly.</p>
                            </div>
                        </div>
                        <div className="flex flex-col items-center text-center space-y-5 group">
                            <div className="bg-primary/10 p-5 rounded-[24px] transition-all duration-500 group-hover:bg-primary group-hover:text-white group-hover:-translate-y-2 shadow-xl shadow-primary/5">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            </div>
                            <div>
                                <h3 className="font-black text-xl text-foreground uppercase tracking-tight">Safe Protocol</h3>
                                <p className="text-sm text-muted-foreground mt-3 font-medium leading-relaxed">Risk-free commerce. No digital transfers are required upfront. Inspect your purchase physically and pay only when satisfied.</p>
                            </div>
                        </div>
                        <div className="flex flex-col items-center text-center space-y-5 group">
                            <div className="bg-primary/10 p-5 rounded-[24px] transition-all duration-500 group-hover:bg-primary group-hover:text-white group-hover:-translate-y-2 shadow-xl shadow-primary/5">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                            </div>
                            <div>
                                <h3 className="font-black text-xl text-foreground uppercase tracking-tight">Student Led</h3>
                                <p className="text-sm text-muted-foreground mt-3 font-medium leading-relaxed">Powering the campus economy. We support verified student vendors, fostering entrepreneurship within the university halls.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    </main>
  );
}
