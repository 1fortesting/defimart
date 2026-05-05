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
    
    // Dynamically derive top categories from the database (via products)
    const dynamicCategories = useMemo(() => {
        const counts: Record<string, number> = {};
        products.forEach(p => {
            if (p.category) {
                // Use the exact case from the DB
                counts[p.category] = (counts[p.category] || 0) + 1;
            }
        });
        // Sort by frequency and take top 5
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
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-6 my-6">
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
        <div className="container mx-auto max-w-7xl pt-6 px-4 pb-12 bg-[var(--surface-2)] min-h-screen">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="font-syne font-[700] text-[var(--dark)] text-2xl md:text-3xl">Discover Products</h1>
                <Link href="/search" className="text-[var(--gold)] text-[13px] md:text-sm font-[600] font-dm hover:underline">
                    See all →
                </Link>
            </div>

            {/* Dynamic Filter Chips */}
            <div className="flex gap-2 overflow-x-auto hide-scrollbar mb-8 -mx-1 px-1">
                {dynamicCategories.map((cat) => (
                    <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={cn(
                            "px-5 py-2.5 rounded-full text-[13px] font-dm transition-all whitespace-nowrap",
                            selectedCategory === cat 
                                ? "bg-[var(--gold)] text-white font-[600]" 
                                : "bg-[var(--surface)] text-[var(--muted)] font-[500] border border-[var(--border)]"
                        )}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Featured Section (Only for 'All') */}
            {selectedCategory === 'All' && featuredProduct && (
                <div className="mb-8">
                    <FeaturedProductCard 
                        product={featuredProduct}
                        isSaved={localSavedIds.has(featuredProduct.id)}
                        onToggleSave={handleToggleSave}
                    />
                </div>
            )}

            {/* Grid Sections with Category Rows Interleaved (Only for 'All') */}
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
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <p className="text-[var(--muted)] font-dm text-lg">No products found in {selectedCategory}</p>
                            <button 
                                onClick={() => setSelectedCategory('All')}
                                className="mt-4 text-[var(--gold)] font-bold hover:underline"
                            >
                                Clear filters
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Bottom Spacer for Nav (Mobile only) */}
            <div className="h-[80px] md:hidden" />
        </div>
    );
}
