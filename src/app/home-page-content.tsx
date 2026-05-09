'use client';

import { useState, useMemo } from 'react';
import { Tables } from '@/types/supabase';
import type { User } from '@supabase/supabase-js';
import { ProductCard } from '@/components/product-card';
import { FeaturedProductCard } from '@/components/featured-product-card';
import { CategoryProductRow } from '@/components/category-product-row';
import Link from 'next/link';
import { cn } from '@/lib/utils';

type ProductWithRating = Tables<'products'> & { average_rating: number, review_count: number };

interface CategoryData {
    title: string;
    category: string;
    products: Tables<'products'>[];
    color?: string;
}

interface HomePageContentProps {
    products: ProductWithRating[];
    user: User | null;
    savedProductIds: string[];
    categoriesData: CategoryData[];
}

export function HomePageContent({ products, user, savedProductIds, categoriesData }: HomePageContentProps) {
    const [selectedCategory, setSelectedCategory] = useState('All');
    
    const dynamicCategories = useMemo(() => {
        const counts: Record<string, number> = {};
        products.forEach(p => {
            if (p.category) {
                counts[p.category] = (counts[p.category] || 0) + 1;
            }
        });
        const sorted = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
        return ['All', ...sorted.slice(0, 5)];
    }, [products]);

    const filteredProducts = useMemo(() => {
        if (selectedCategory === 'All') return products;
        return products.filter(p => 
            p.category === selectedCategory
        );
    }, [products, selectedCategory]);

    const featuredProduct = products[0]; 
    const gridProducts = selectedCategory === 'All' ? filteredProducts.slice(1) : filteredProducts;

    const [localSavedIds, setLocalSavedIds] = useState(new Set(savedProductIds));
    const handleToggleSave = (productId: string) => {
        setLocalSavedIds(prev => {
            const next = new Set(prev);
            if (next.has(productId)) next.delete(productId);
            else next.add(productId);
            return next;
        });
    };

    const productsPerSection = 12;
    const section1 = gridProducts.slice(0, productsPerSection);
    const section2 = gridProducts.slice(productsPerSection, productsPerSection * 2);
    const section3 = gridProducts.slice(productsPerSection * 2);

    const renderGrid = (items: ProductWithRating[]) => (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6 my-6">
            {items.map((product) => (
                <ProductCard 
                    key={product.id} 
                    product={product}
                    user={user}
                    isSaved={localSavedIds.has(product.id)}
                    onUnsave={(id) => handleToggleSave(id)}
                />
            ))}
        </div>
    );

    return (
        <div className="container mx-auto max-w-7xl pt-6 px-4 pb-12 bg-transparent min-h-screen">
            <div className="flex justify-between items-center mb-6">
                <h1 className="font-montserrat font-black text-foreground text-2xl md:text-3xl uppercase tracking-tighter italic">Discover Commodities</h1>
                <Link href="/search" className="text-primary text-xs md:text-sm font-black uppercase tracking-widest hover:underline font-poppins">
                    See all items →
                </Link>
            </div>

            <div className="flex gap-2 overflow-x-auto hide-scrollbar mb-8 -mx-1 px-1">
                {dynamicCategories.map((cat) => (
                    <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={cn(
                            "px-6 py-2.5 rounded-full text-[12px] font-poppins transition-all whitespace-nowrap shadow-sm border-2 uppercase tracking-widest font-black",
                            selectedCategory === cat 
                                ? "bg-primary text-white border-primary" 
                                : "bg-white text-muted-foreground border-border hover:border-primary/30"
                        )}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {selectedCategory === 'All' && featuredProduct && (
                <div className="mb-10">
                    <FeaturedProductCard 
                        product={featuredProduct}
                        isSaved={localSavedIds.has(featuredProduct.id)}
                        onToggleSave={handleToggleSave}
                    />
                </div>
            )}

            {selectedCategory === 'All' ? (
                <>
                    {renderGrid(section1)}
                    {categoriesData[0] && <CategoryProductRow {...categoriesData[0]} />}
                    {renderGrid(section2)}
                    {categoriesData[1] && <CategoryProductRow {...categoriesData[1]} />}
                    {renderGrid(section3)}
                    {categoriesData[2] && <CategoryProductRow {...categoriesData[2]} />}
                </>
            ) : (
                <div className="min-h-[50vh]">
                    {gridProducts.length > 0 ? (
                        renderGrid(gridProducts)
                    ) : (
                        <div className="flex flex-col items-center justify-center py-24 text-center bg-white/50 rounded-[40px] border-4 border-dashed">
                            <p className="text-muted-foreground font-poppins font-bold uppercase tracking-widest">No listings in {selectedCategory}</p>
                            <button 
                                onClick={() => setSelectedCategory('All')}
                                className="mt-4 text-primary font-black uppercase tracking-widest text-xs hover:underline"
                            >
                                Reset protocol
                            </button>
                        </div>
                    )}
                </div>
            )}

            <div className="h-[80px] md:hidden" />
        </div>
    );
}