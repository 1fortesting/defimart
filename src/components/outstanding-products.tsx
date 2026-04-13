'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Tables } from '@/types/supabase';

type OutstandingProductsProps = {
    products: Tables<'products'>[];
};

export function OutstandingProducts({ products }: OutstandingProductsProps) {
    if (!products || products.length === 0) {
        return null;
    }

    return (
        <section className="my-8 md:my-12">
            <h2 className="text-2xl font-bold text-center mb-6">Outstanding Finds</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
                {products.map((product) => (
                    <Link key={product.id} href={`/products/${product.id}`} className="group text-center">
                        <div className="relative w-full aspect-square">
                            <Image
                                src={product.image_urls?.[0] || 'https://picsum.photos/seed/1/200/200'}
                                alt={product.name}
                                fill
                                className="object-cover rounded-full border-4 border-transparent group-hover:border-primary transition-all duration-300 group-hover:scale-105"
                                sizes="(max-width: 768px) 50vw, 25vw"
                            />
                        </div>
                        <h3 className="mt-3 font-semibold text-sm text-foreground truncate group-hover:text-primary transition-colors">
                            {product.name}
                        </h3>
                    </Link>
                ))}
            </div>
        </section>
    );
}
