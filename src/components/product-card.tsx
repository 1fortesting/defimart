'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import Link from 'next/link';
import { Tables } from '@/types/supabase';
import { Badge } from '@/components/ui/badge';
import { Heart, Flame, ShoppingCart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';
import { toggleSaveProduct } from '@/app/saved/actions';
import { addToCart } from '@/app/cart/actions';
import { useState, useEffect } from 'react';

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

    const [timeLeft, setTimeLeft] = useState<{ hours: string; minutes: string; seconds: string } | null>(null);
    const [showCountdown, setShowCountdown] = useState(false);

    useEffect(() => {
        if (!isDiscountActive || !product.discount_end_date) return;

        const endDate = new Date(product.discount_end_date);
        
        // This effect should only run on the client
        const timer = setInterval(() => {
            const now = new Date();
            const difference = endDate.getTime() - now.getTime();

            if (difference > 0 && difference <= 12 * 60 * 60 * 1000) {
                if (!showCountdown) setShowCountdown(true);
                const hours = Math.floor(difference / (1000 * 60 * 60));
                const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((difference % (1000 * 60)) / 1000);

                setTimeLeft({
                    hours: String(hours).padStart(2, '0'),
                    minutes: String(minutes).padStart(2, '0'),
                    seconds: String(seconds).padStart(2, '0'),
                });
            } else {
                if (showCountdown) setShowCountdown(false);
                if (timeLeft) setTimeLeft(null);
                if (difference <= 0) {
                    clearInterval(timer);
                }
            }
        }, 1000);


        return () => clearInterval(timer);
    }, [isDiscountActive, product.discount_end_date, showCountdown, timeLeft]);

    const getStockLabel = (className?: string) => {
        if (product.quantity === null || product.quantity === undefined) return null;
        if (product.quantity > 5) {
            return <Badge className={cn("border-transparent bg-green-600 text-white hover:bg-green-700", className)}>In Stock</Badge>;
        }
        if (product.quantity > 0 && product.quantity <= 5) {
            return <Badge className={cn("border-transparent bg-red-600 text-white hover:bg-red-700", className)}>Few left</Badge>;
        }
        if (product.quantity === 0) {
            return <Badge variant="destructive" className={cn(className)}>Out of Stock</Badge>;
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
                 <div className="absolute top-0 left-0 w-16 h-28 animate-swing origin-top z-10 -translate-x-2 -translate-y-2">
                    <svg
                        viewBox="0 0 64 120"
                        className="w-full h-full"
                        style={{ filter: 'drop-shadow(1px 1px 1px rgba(0,0,0,0.2))' }}
                    >
                        <path
                            d="M 14 55 L 50 55 L 62 70 L 62 115 L 2 115 L 2 70 Z"
                            fill="#991B1B" // darker red
                        />
                        <path d="M 32 0 L 32 58" stroke="#888" strokeWidth="1.5" />
                        <path
                            d="M 12 50 L 48 50 L 59 65 L 59 110 L 0 110 L 0 65 Z"
                            fill="#EF4444" // red-500
                        />
                        <circle cx="32" cy="58" r="3.5" fill="white" />
                    </svg>
                     <div className="absolute inset-0 flex flex-col items-center justify-center text-white font-bold pt-16">
                        <span className="text-sm leading-none">
                            -{product.discount_percentage}%
                        </span>
                        <span className="text-[10px] leading-tight">OFF</span>
                    </div>
                </div>
            )}
            <div className="absolute top-0 right-0 z-10">
                {getStockLabel("rounded-none rounded-bl-lg rounded-tr-md")}
            </div>
            {user ? (
                <form action={toggleSaveProduct} className="absolute bottom-2 right-2 z-10">
                    <input type="hidden" name="productId" value={product.id} />
                    <input type="hidden" name="pathname" value={pathname} />
                    <Button type="submit" size="icon" variant="ghost" className="h-8 w-8 rounded-full bg-black/20 hover:bg-black/50 text-white transition-all hover:scale-110">
                        <Heart className={cn("h-4 w-4", isSaved && "fill-red-500 text-red-500")} />
                    </Button>
                </form>
            ) : (
                 <Button asChild size="icon" variant="ghost" className="absolute bottom-2 right-2 z-10 h-8 w-8 rounded-full bg-black/20 hover:bg-black/50 text-white transition-all hover:scale-110">
                    <Link href="/login">
                        <Heart className="h-4 w-4" />
                    </Link>
                </Button>
            )}
        </CardHeader>
        <CardContent className="p-3">
            <h3 className="font-semibold truncate text-sm">{product.name}</h3>
            <p className="text-sm text-muted-foreground">{product.category}</p>

            {showCountdown && timeLeft ? (
                <div className="flex items-center justify-between mt-2">
                    <Badge variant="outline" className="text-orange-500 border-orange-500 animate-pulse">
                        <Flame className="mr-1 h-3 w-3" />
                        Limited time
                    </Badge>
                    <span className="text-sm font-mono font-medium text-red-500 tabular-nums">
                        {timeLeft.hours}:{timeLeft.minutes}:{timeLeft.seconds}
                    </span>
                </div>
            ) : isDiscountActive && (
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
                        {product.quantity === 0 ? (
                            <Button size="sm" disabled>Out of Stock</Button>
                        ) : (
                            <Button type="submit" size="icon" className="h-9 w-9" aria-label="Add to cart">
                                <ShoppingCart className="h-4 w-4" />
                            </Button>
                        )}
                    </form>
                ) : (
                    <Button asChild size="icon" className="h-9 w-9" aria-label="Add to cart">
                        <Link href="/login"><ShoppingCart className="h-4 w-4" /></Link>
                    </Button>
                )}
            </div>
        </CardContent>
    </Card>
    )
}
