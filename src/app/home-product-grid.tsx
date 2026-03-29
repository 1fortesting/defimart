'use client';

import { useState, useMemo } from 'react';
import { Tables } from '@/types/supabase';
import type { User } from '@supabase/supabase-js';
import { ProductCard } from '@/components/product-card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface HomeProductGridProps {
    products: (Tables<'products'> & { average_rating: number, review_count: number })[];
    user: User | null;
    savedProductIds: Set<string>;
}

export function HomeProductGrid({ products, user, savedProductIds: initialSavedProductIds }: HomeProductGridProps) {
    const [sortBy, setSortBy] = useState('default');

    const sortedProducts = useMemo(() => {
        let sorted = [...products];
        switch (sortBy) {
            case 'price-asc':
                sorted.sort((a, b) => {
                    const priceA = a.discount_percentage && a.discount_end_date && new Date(a.discount_end_date) > new Date() ? a.price - (a.price * a.discount_percentage / 100) : a.price;
                    const priceB = b.discount_percentage && b.discount_end_date && new Date(b.discount_end_date) > new Date() ? b.price - (b.price * b.discount_percentage / 100) : b.price;
                    return priceA - priceB;
                });
                break;
            case 'price-desc':
                sorted.sort((a, b) => {
                    const priceA = a.discount_percentage && a.discount_end_date && new Date(a.discount_end_date) > new Date() ? a.price - (a.price * a.discount_percentage / 100) : a.price;
                    const priceB = b.discount_percentage && b.discount_end_date && new Date(b.discount_end_date) > new Date() ? b.price - (b.price * b.discount_percentage / 100) : b.price;
                    return priceB - priceA;
                });
                break;
            case 'newest':
                sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
                break;
            default:
                // "default" will use the original order from the server.
                break;
        }
        return sorted;
    }, [products, sortBy]);
    
    const [localSavedIds, setLocalSavedIds] = useState(initialSavedProductIds);
    const handleUnsave = (productId: string) => {
        setLocalSavedIds(currentIds => {
            const newIds = new Set(currentIds);
            newIds.delete(productId);
            return newIds;
        });
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Browse All</h2>
                <div className="flex items-center gap-2">
                    <Select value={sortBy} onValueChange={setSortBy}>
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
                {sortedProducts.map((product) => (
                    <ProductCard 
                        key={product.id} 
                        product={product} 
                        user={user} 
                        isSaved={localSavedIds.has(product.id)}
                        onUnsave={handleUnsave}
                    />
                ))}
            </div>
        </div>
    );
}
