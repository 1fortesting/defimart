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
        <section className="my-12 md:my-16">
            <h2 className="text-2xl font-bold text-center mb-6">Outstanding Finds</h2>
            <div className="flex justify-center gap-4 md:gap-8">
                {products.map((product) => (
                    <Link key={product.id} href={`/products/${product.id}`} className="group text-center w-20 md:w-28">
                        <div className="relative w-full aspect-square">
                            <Image
                                src={product.image_urls?.[0] || 'https://picsum.photos/seed/1/200/200'}
                                alt={product.name}
                                fill
                                className="object-cover rounded-full border-4 border-transparent group-hover:border-primary transition-all duration-300 group-hover:scale-105"
                                sizes="(max-width: 768px) 25vw, 10vw"
                            />
                        </div>
                        <h3 className="mt-2 font-semibold text-xs md:text-sm text-foreground truncate group-hover:text-primary transition-colors">
                            {product.name}
                        </h3>
                    </Link>
                ))}
            </div>
        </section>
    );
}
