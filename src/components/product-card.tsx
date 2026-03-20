'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import Link from 'next/link';
import { Tables } from '@/types/supabase';
import { Badge } from '@/components/ui/badge';
import { Heart } from 'lucide-react';
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

    const getStockLabel = () => {
        if (product.quantity === null || product.quantity === undefined) return null;
        if (product.quantity > 5) {
            return <Badge className="border-transparent bg-green-600 text-primary-foreground hover:bg-green-700">In Stock</Badge>;
        }
        if (product.quantity > 0 && product.quantity <= 5) {
            return <Badge className="border-transparent bg-yellow-500 text-primary-foreground hover:bg-yellow-600">Few left</Badge>;
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
            <div className="absolute top-2 left-2">
                {getStockLabel()}
            </div>
            {user && (
                <form action={toggleSaveProduct} className="absolute top-2 right-2">
                    <input type="hidden" name="productId" value={product.id} />
                    <input type="hidden" name="pathname" value={pathname} />
                    <Button type="submit" size="icon" variant="ghost" className="h-8 w-8 rounded-full bg-black/20 hover:bg-black/50 text-white transition-all hover:scale-110">
                        <Heart className={cn("h-4 w-4", isSaved && "fill-red-500 text-red-500")} />
                    </Button>
                </form>
            )}
        </CardHeader>
        <CardContent className="p-3">
            <h3 className="font-semibold truncate text-sm">{product.name}</h3>
            <p className="text-sm text-muted-foreground">{product.category}</p>
            <div className="flex items-center justify-between mt-2">
                <span className="text-base font-bold">GHS {product.price.toFixed(2)}</span>
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
        </CardContent>
    </Card>
    )
}
