'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import Link from 'next/link';
import { Tables } from '@/types/supabase';
import { Badge } from '@/components/ui/badge';
import { Heart, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';
import { toggleSaveProduct } from '@/app/saved/actions';
import { addToCart } from '@/app/cart/actions';

type ProductCardProps = {
  product: Tables<'products'>;
  user: any; // Simplified user object
  isSaved: boolean;
};

export function ProductCard({ product, user, isSaved }: ProductCardProps) {
    const pathname = usePathname();

    const isDiscountActive = product.discount_percentage && product.discount_percentage > 0 && product.discount_end_date && new Date(product.discount_end_date) > new Date();

    const discountedPrice = isDiscountActive
        ? product.price - (product.price * (product.discount_percentage! / 100))
        : product.price;

    const getStockLabel = () => {
        if (product.quantity === null || product.quantity === undefined) return null;
        if (product.quantity > 5) {
            return <Badge className="border-transparent bg-green-600 text-primary-foreground hover:bg-green-700">In Stock</Badge>;
        }
        if (product.quantity > 0 && product.quantity <= 5) {
            return <Badge className="border-transparent bg-red-600 text-primary-foreground hover:bg-red-700">Few left</Badge>;
        }
        if (product.quantity === 0) {
            return <Badge variant="destructive">Out of Stock</Badge>;
        }
        return null;
    };
    
    return (
    <Card className="overflow-hidden group transition-all duration-300 ease-in-out hover:shadow-2xl hover:border-primary/50 hover:-translate-y-1">
        <CardHeader className="p-0 relative">
            <Link href="#">
                <Image
                    src={product.image_urls?.[0] || 'https://picsum.photos/seed/1/600/400'}
                    alt={product.name}
                    width={600}
                    height={400}
                    className="object-cover w-full aspect-square group-hover:scale-105 transition-transform duration-300"
                    data-ai-hint="product image"
                />
            </Link>
             {isDiscountActive && (
                <div className="absolute top-0 left-0 bg-red-600 text-white text-xs font-bold uppercase p-4 rounded-br-lg flex flex-col items-center justify-center w-16 h-16 transform -rotate-15 -translate-x-4 -translate-y-4 shadow-lg">
                    <span className="text-lg leading-none">-{product.discount_percentage}%</span>
                    <span className="leading-none">OFF</span>
                </div>
            )}
            <div className="absolute top-2 right-2 flex flex-col gap-2 items-end">
                 {user && (
                    <form action={toggleSaveProduct}>
                        <input type="hidden" name="productId" value={product.id} />
                        <input type="hidden" name="pathname" value={pathname} />
                        <Button type="submit" size="icon" variant="ghost" className="h-8 w-8 rounded-full bg-black/20 hover:bg-black/50 text-white transition-all hover:scale-110">
                            <Heart className={cn("h-4 w-4", isSaved && "fill-red-500 text-red-500")} />
                        </Button>
                    </form>
                )}
                {getStockLabel()}
            </div>
        </CardHeader>
        <CardContent className="p-3">
            <h3 className="font-semibold truncate text-sm">{product.name}</h3>
            <p className="text-sm text-muted-foreground">{product.category}</p>

            {isDiscountActive && (
                 <Badge variant="outline" className="mt-2 text-orange-500 border-orange-500">
                    <Flame className="mr-1 h-3 w-3" />
                    Limited time offer
                </Badge>
            )}

            <div className="flex items-center justify-between mt-2">
                <div className="flex items-baseline gap-2">
                     <span className="text-base font-bold">GHS {discountedPrice.toFixed(2)}</span>
                     {isDiscountActive && (
                        <span className="text-sm text-muted-foreground line-through">GHS {product.price.toFixed(2)}</span>
                     )}
                </div>
                {user ? (
                    <form action={addToCart}>
                        <input type="hidden" name="productId" value={product.id} />
                        <Button type="submit" size="sm" disabled={product.quantity === 0}>
                            {product.quantity === 0 ? 'Out of Stock' : 'Add to Cart'}
                        </Button>
                    </form>
                ) : (
                    <Button asChild size="sm">
                        <Link href="/login">Add to Cart</Link>
                    </Button>
                )}
            </div>
             {isDiscountActive && (
                 <div className="flex justify-end mt-1">
                     <Badge variant="destructive">-{product.discount_percentage}%</Badge>
                 </div>
            )}
        </CardContent>
    </Card>
    )
}
