'use client';

import Link from 'next/link';
import { Tables } from '@/types/supabase';
import { ChevronRight } from 'lucide-react';
import { HorizontalProductCard } from './horizontal-product-card';

type CategoryProductRowProps = {
  title: string;
  products: Tables<'products'>[];
  category: string;
};

export function CategoryProductRow({ title, products, category }: CategoryProductRowProps) {
    if (!products || products.length === 0) {
        return null;
    }

    return (
        <div className="my-10">
            <div className="bg-primary text-primary-foreground p-3 flex justify-between items-center rounded-t-lg">
                <h2 className="text-xl font-bold">{title}</h2>
                <Link href={`/search?category=${encodeURIComponent(category)}`}>
                    <div className="flex items-center text-sm font-semibold hover:underline">
                        See All <ChevronRight className="h-4 w-4" />
                    </div>
                </Link>
            </div>
            <div className="p-4 bg-card rounded-b-lg shadow-sm">
                <div className="flex gap-4 overflow-x-auto pb-2 -mb-2">
                    {products.map(product => (
                        <HorizontalProductCard key={product.id} product={product} />
                    ))}
                </div>
            </div>
        </div>
    )
}
