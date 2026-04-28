'use client';

import { useEffect, useState } from 'react';
import type { Tables } from '@/types/supabase';
import { Sparkles, Loader2 } from 'lucide-react';
import { FlashSaleProductCard } from './flash-sale-product-card';
import { getRecommendations } from '@/app/actions';

type ProductWithRating = Tables<'products'> & { average_rating: number; review_count: number };

export function RecommendedForYouSection() {
    const [data, setData] = useState<{ title: string; products: ProductWithRating[] } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getRecommendations().then(result => {
            setData(result);
            setLoading(false);
        });
    }, []);

    if (loading) {
        return (
            <div className="bg-card rounded-lg my-12 md:my-16">
                 <div className="bg-accent text-accent-foreground p-3 flex justify-center items-center rounded-t-lg">
                     <div className="flex items-center gap-2">
                        <Sparkles className="h-6 w-6" />
                        <h2 className="text-xl font-bold text-center">Finding Recommendations...</h2>
                    </div>
                </div>
                <div className="p-4 pt-0 h-64 flex items-center justify-center">
                   <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </div>
        );
    }
    
    if (!data || data.products.length === 0) return null;

    const { title, products } = data;

    return (
        <div className="bg-card rounded-lg my-12 md:my-16">
             <div className="bg-accent text-accent-foreground p-3 flex justify-center items-center rounded-t-lg">
                 <div className="flex items-center gap-2">
                    <Sparkles className="h-6 w-6" />
                    <h2 className="text-xl font-bold text-center">{title}</h2>
                </div>
            </div>
            <div className="p-4 pt-0">
                <div className="flex gap-4 overflow-x-auto pb-2 -mb-2">
                    {products.map(product => (
                         <FlashSaleProductCard key={product.id} product={product} />
                    ))}
                </div>
            </div>
        </div>
    );
}
