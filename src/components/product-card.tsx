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

        const timer = setInterval(() => {
            const now = new Date();
            const difference = endDate.getTime() - now.getTime();

            if (difference > 0 && difference <= 12 * 60 * 60 * 1000) {
                setShowCountdown(true);
                const hours = Math.floor(difference / (1000 * 60 * 60));
                const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((difference % (1000 * 60)) / 1000);

                setTimeLeft({
                    hours: String(hours).padStart(2, '0'),
                    minutes: String(minutes).padStart(2, '0'),
                    seconds: String(seconds).padStart(2, '0'),
                });
            } else {
                setShowCountdown(false);
                setTimeLeft(null);
                if (difference <= 0) {
                    clearInterval(timer);
                }
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [isDiscountActive, product.discount_end_date]);

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
                 <div className="absolute top-0 left-2 w-12 h-28 animate-swing origin-top z-10">
                    <svg
                        viewBox="0 0 54 110"
                        className="w-full h-full"
                        style={{ filter: 'drop-shadow(1px 1px 1px rgba(0,0,0,0.2))' }}
                    >
                        {/* Back Tag */}
                        <path
                            d="M 14 45 L 42 45 L 54 60 L 54 105 L 2 105 L 2 60 Z"
                            fill="#991B1B" // darker red
                        />
                        {/* String */}
                        <path d="M 27 0 L 27 48" stroke="#888" strokeWidth="1.5" />

                        {/* Front Tag */}
                        <path
                            d="M 12 40 L 40 40 L 51 55 L 51 100 L 0 100 L 0 55 Z"
                            fill="#EF4444" // red-500
                        />

                        {/* Hole */}
                        <circle cx="27" cy="48" r="3.5" fill="white" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white font-bold pt-12">
                        <span className="text-[11px] leading-none">
                            -{product.discount_percentage}%
                        </span>
                        <span className="text-[7px] leading-tight">OFF</span>
                    </div>
                </div>
            )}
            <div className="absolute top-0 right-0 z-10">
                {getStockLabel("rounded-none rounded-bl-lg rounded-tr-md")}
            </div>
            {user && (
                <form action={toggleSaveProduct} className="absolute bottom-2 right-2">
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

            {showCountdown && timeLeft ? (
                <div className="flex items-center justify-between mt-2">
                    <Badge variant="outline" className="text-orange-500 border-orange-500 animate-heartbeat">
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
