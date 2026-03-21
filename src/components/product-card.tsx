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
import { useState, useEffect, useTransition } from 'react';
import { useToast } from '@/hooks/use-toast';

type ProductCardProps = {
  product: Tables<'products'>;
  user: any; // Simplified user object
  isSaved: boolean;
  onUnsave?: (productId: string) => void;
};

export function ProductCard({ product, user, isSaved, onUnsave }: ProductCardProps) {
    const pathname = usePathname();
    const [timeLeft, setTimeLeft] = useState<{ hours: string; minutes: string; seconds: string; } | null>(null);
    const [isPending, startTransition] = useTransition();
    const [isSavedState, setIsSavedState] = useState(isSaved);
    const { toast } = useToast();

    useEffect(() => {
        setIsSavedState(isSaved);
    }, [isSaved]);

    const isDiscountActive = product.discount_percentage && product.discount_percentage > 0 && product.discount_end_date && new Date(product.discount_end_date) > new Date();

    const discountedPrice = isDiscountActive
        ? product.price - (product.price * (product.discount_percentage! / 100))
        : product.price;

    const handleAddToCart = () => {
        const formData = new FormData();
        formData.append('productId', product.id);
        
        toast({
            title: 'Added to Cart',
            description: `${product.name} has been added.`,
            variant: 'success',
        });

        startTransition(async () => {
            await addToCart(formData);
        });
    };

    const handleToggleSave = () => {
        const newIsSaved = !isSavedState;
        setIsSavedState(newIsSaved);
        
        if (!newIsSaved && onUnsave) {
            onUnsave(product.id);
        }
            
        toast({
            title: newIsSaved ? 'Product Saved' : 'Product Unsaved',
            description: `${product.name} has been ${newIsSaved ? 'added to' : 'removed from'} your wishlist.`,
            variant: 'success'
        });

        startTransition(async () => {
            const formData = new FormData();
            formData.append('productId', product.id);
            formData.append('pathname', pathname);
            await toggleSaveProduct(formData);
        });
    };


    useEffect(() => {
        if (!isDiscountActive || !product.discount_end_date) {
            setTimeLeft(null);
            return;
        }

        const endDate = new Date(product.discount_end_date);

        const calculateTimeLeft = () => {
            const now = new Date();
            const difference = endDate.getTime() - now.getTime();

            if (difference <= 0) {
                return null;
            }

            if (difference <= 12 * 60 * 60 * 1000) {
                const hours = Math.floor(difference / (1000 * 60 * 60));
                const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((difference % (1000 * 60)) / 1000);
                return {
                    hours: String(hours).padStart(2, '0'),
                    minutes: String(minutes).padStart(2, '0'),
                    seconds: String(seconds).padStart(2, '0'),
                };
            }
            return null;
        };
        
        setTimeLeft(calculateTimeLeft());

        const timerId = setInterval(() => {
            const newTimeLeft = calculateTimeLeft();
            setTimeLeft(newTimeLeft);
            if (newTimeLeft === null) {
                clearInterval(timerId);
            }
        }, 1000);

        return () => clearInterval(timerId);
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
            <Link href={`/products/${product.id}`}>
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
        </CardHeader>
        <CardContent className="p-3">
            <Link href={`/products/${product.id}`} className="hover:underline">
                <h3 className="font-semibold truncate text-sm">{product.name}</h3>
            </Link>
            <p className="text-sm text-muted-foreground">{product.category}</p>

            <div className="mt-2 h-5 flex items-center justify-between">
              {isDiscountActive && (
                  <Badge variant="outline" className="text-orange-500 border-orange-500 animate-heartbeat">
                      <Flame className="mr-1 h-3 w-3" />
                      Limited time
                  </Badge>
              )}
              {timeLeft && (
                <div className="text-xs font-mono text-red-500">
                    {timeLeft.hours}:{timeLeft.minutes}:{timeLeft.seconds}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between mt-2">
                <div className="flex items-baseline gap-2">
                     <span className="text-base font-bold">GHS {discountedPrice.toFixed(2)}</span>
                     {isDiscountActive && (
                        <span className="text-sm text-muted-foreground line-through">GHS {product.price.toFixed(2)}</span>
                     )}
                </div>
                <div className="flex items-center gap-1">
                    {user ? (
                        <>
                            <Button onClick={handleToggleSave} disabled={isPending} size="icon" variant="ghost" className="h-9 w-9 rounded-full" aria-label="Save for later">
                                <Heart className={cn("h-5 w-5", isSavedState && "fill-red-500 text-red-500")} />
                            </Button>
                            {product.quantity === 0 ? (
                                <Button size="icon" className="h-9 w-9" disabled>
                                    <ShoppingCart className="h-4 w-4" />
                                </Button>
                            ) : (
                                <Button onClick={handleAddToCart} disabled={isPending} size="icon" className="h-9 w-9" aria-label="Add to cart">
                                    <ShoppingCart className="h-4 w-4" />
                                </Button>
                            )}
                        </>
                    ) : (
                       <>
                            <Button asChild size="icon" variant="ghost" className="h-9 w-9 rounded-full" aria-label="Save for later">
                                <Link href="/login"><Heart className="h-5 w-5" /></Link>
                            </Button>
                            <Button asChild size="icon" className="h-9 w-9" aria-label="Add to cart">
                                <Link href="/login"><ShoppingCart className="h-4 w-4" /></Link>
                            </Button>
                        </>
                    )}
                </div>
            </div>
        </CardContent>
    </Card>
    )
}
