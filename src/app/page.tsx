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

  const { data: productsData } = await supabase.from('products').select('*');
  const { data: reviews } = await supabase.from('reviews').select('product_id, rating');
  
  const { data: savedProducts } = user 
      ? await supabase.from('saved_products').select('product_id').eq('user_id', user.id) 
      : { data: null };
  const savedProductIds = (savedProducts as any[])?.map((p: any) => p.product_id) || [];

  const allProducts = productsData || [];

  const reviewsByProduct = (reviews || []).reduce((acc: Record<string, number[]>, review: any) => {
    if (!acc[review.product_id]) {
        acc[review.product_id] = [];
    }
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
  
  const { data: featuredProductsData } = await supabase.from('products').select('*').eq('is_featured', true).limit(5);
  const featuredProducts = featuredProductsData || [];
  
  const { data: outstandingProductsData } = await supabase.from('products').select('*').eq('is_outstanding', true).limit(4);
  let outstandingProducts = outstandingProductsData || [];

  const carouselProducts = featuredProducts.length > 0 ? featuredProducts : allProducts.slice(0, 5);

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
      products: productsByCategory[category].slice(0, 10),
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
                products={shuffledProducts} 
                user={user} 
                savedProductIds={savedProductIds}
                categoriesData={categoriesData}
            />

            <section className="bg-white dark:bg-slate-900 rounded-2xl p-8 md:p-12 my-16 shadow-lg border border-border overflow-hidden relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/5 rounded-full -ml-32 -mb-32 blur-3xl" />
                
                <div className="max-w-4xl mx-auto relative z-10">
                    <div className="text-center space-y-6">
                        <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
                            Defimart: The Smart Way to Shop on Campus
                        </h2>
                        <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
                            Defimart is a student-focused online store in Ghana that makes it easy to shop for products on campus using simple pickup-based transactions. We provide a reliable marketplace for everything from the latest electronics and fashion to everyday study essentials.
                        </p>
                        <p className="text-base text-muted-foreground leading-relaxed hidden md:block">
                            Our platform is specifically designed to meet the unique needs of the university community. By bridging the gap between local student sellers and buyers, we foster a safe, convenient, and affordable commercial environment right where you live and study. Whether you're looking for textbooks, room accessories, or the newest gadgets, Defimart has you covered.
                        </p>
                    </div>

                    <div className="grid sm:grid-cols-3 gap-8 pt-12">
                        <div className="flex flex-col items-center text-center space-y-4 group">
                            <div className="bg-primary/10 p-4 rounded-2xl transition-transform group-hover:scale-110 duration-300">
                                <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                            </div>
                            <div>
                                <h3 className="font-bold text-lg text-foreground">Fast & Reliable</h3>
                                <p className="text-sm text-muted-foreground mt-2">Tailored for busy students. Order online and pick up at designated campus spots during our scheduled windows.</p>
                            </div>
                        </div>
                        <div className="flex flex-col items-center text-center space-y-4 group">
                            <div className="bg-primary/10 p-4 rounded-2xl transition-transform group-hover:scale-110 duration-300">
                                <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            </div>
                            <div>
                                <h3 className="font-bold text-lg text-foreground">Pay on Pickup</h3>
                                <p className="text-sm text-muted-foreground mt-2">Shop with confidence. No online payments required—simply pay when you collect your items in person.</p>
                            </div>
                        </div>
                        <div className="flex flex-col items-center text-center space-y-4 group">
                            <div className="bg-primary/10 p-4 rounded-2xl transition-transform group-hover:scale-110 duration-300">
                                <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                            </div>
                            <div>
                                <h3 className="font-bold text-lg text-foreground">Student Community</h3>
                                <p className="text-sm text-muted-foreground mt-2">Built for the campus economy. Supporting student sellers and buyers with a specialized, localized experience.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
      </main>
  );
}
