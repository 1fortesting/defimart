'use client';

import { Card, CardContent } from '@/components/ui/card';
import Image from 'next/image';
import Link from 'next/link';
import { Tables } from '@/types/supabase';
import { Badge } from '@/components/ui/badge';

type HorizontalProductCardProps = {
  product: Tables<'products'>;
};

export function HorizontalProductCard({ product }: HorizontalProductCardProps) {
    const isDiscountActive = product.discount_percentage && product.discount_percentage > 0 && product.discount_end_date && new Date(product.discount_end_date) > new Date();

    const discountedPrice = isDiscountActive
        ? product.price - (product.price * (product.discount_percentage! / 100))
        : product.price;

    return (
        <Link href={`/products/${product.id}`} className="block w-36 md:w-40 flex-shrink-0">
            <Card className="overflow-hidden group transition-all duration-300 ease-in-out bg-muted hover:bg-muted/80 border text-card-foreground flex flex-col shadow-md hover:shadow-lg">
                <div className="relative">
                    <Image
                        src={product.image_urls?.[0] || 'https://picsum.photos/seed/1/200/200'}
                        alt={product.name}
                        width={200}
                        height={200}
                        className="object-cover w-full aspect-square group-hover:scale-105 transition-transform duration-300 rounded-t-lg"
                    />
                    {isDiscountActive && (
                        <Badge variant="destructive" className="absolute top-2 right-2">-{product.discount_percentage}%</Badge>
                    )}
                </div>
                <CardContent className="p-2 flex-grow flex flex-col justify-between">
                    <div>
                        <h3 className="font-medium truncate text-sm leading-tight text-foreground">{product.name}</h3>
                        <div className="mt-1">
                            <span className="text-base font-bold text-foreground">GHS {discountedPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            {isDiscountActive && (
                                <span className="text-xs text-muted-foreground line-through ml-1">GHS {product.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </Link>
    )
}
