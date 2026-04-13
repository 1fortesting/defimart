'use client';

import { Card, CardContent } from '@/components/ui/card';
import Image from 'next/image';
import Link from 'next/link';
import { Tables } from '@/types/supabase';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

type FlashSaleProductCardProps = {
  product: Tables<'products'>;
};

// Simple function to map quantity to a progress value for visual effect
const getProgressValue = (quantity: number | null) => {
    if (quantity === null) return 0;
    if (quantity > 20) return 80 + Math.min(15, quantity / 20);
    if (quantity > 10) return 50 + (quantity - 10) * 3;
    if (quantity > 5) return 25 + (quantity - 5) * 5;
    if (quantity > 0) return Math.max(5, quantity * 5);
    return 0;
};


export function FlashSaleProductCard({ product }: FlashSaleProductCardProps) {
    const [timeLeft, setTimeLeft] = useState<{ days: string, hours: string; minutes: string; seconds: string; } | null>(null);
    
    const isDiscountActive = product.discount_percentage && product.discount_percentage > 0 && product.discount_end_date && new Date(product.discount_end_date) > new Date();

    const discountedPrice = isDiscountActive
        ? product.price - (product.price * (product.discount_percentage! / 100))
        : product.price;

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
            
            const days = Math.floor(difference / (1000 * 60 * 60 * 24));
            const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
            const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((difference % (1000 * 60)) / 1000);
            return {
                days: String(days),
                hours: String(hours).padStart(2, '0'),
                minutes: String(minutes).padStart(2, '0'),
                seconds: String(seconds).padStart(2, '0'),
            };
        };
        
        setTimeLeft(calculateTimeLeft());

        const timerId = setInterval(() => {
            const newTimeLeft = calculateTimeLeft();
            if (newTimeLeft) {
                setTimeLeft(newTimeLeft);
            } else {
                clearInterval(timerId);
                setTimeLeft(null);
            }
        }, 1000);

        return () => clearInterval(timerId);
    }, [isDiscountActive, product.discount_end_date]);

    return (
    <Link href={`/products/${product.id}`} className="block w-40 md:w-48 flex-shrink-0">
        <Card className="relative overflow-hidden group transition-all duration-300 ease-in-out bg-white/60 dark:bg-slate-900/50 backdrop-blur-lg border border-white/20 dark:border-slate-800/50 shadow-lg hover:shadow-primary/20 flex flex-col h-full">
            {/* Decorative elements */}
            <div className="absolute -top-12 -left-12 w-32 h-32 bg-red-500/20 rounded-full blur-2xl transition-all duration-700 opacity-70 group-hover:opacity-100 group-hover:w-40 group-hover:h-40" />
            <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-primary/20 rounded-full blur-2xl transition-all duration-700 opacity-70 group-hover:opacity-100 group-hover:w-40 group-hover:h-40" />

            <div className="relative z-10 flex flex-col h-full">
                <div className="relative p-2">
                    <Image
                        src={product.image_urls?.[0] || 'https://picsum.photos/seed/1/200/200'}
                        alt={product.name}
                        width={200}
                        height={200}
                        className="object-cover w-full rounded-md aspect-[4/3] group-hover:scale-105 transition-transform duration-300"
                    />
                    {isDiscountActive && (
                        <Badge variant="destructive" className="absolute top-3 left-3">-{product.discount_percentage}%</Badge>
                    )}
                </div>
                <CardContent className="p-2 pt-0 flex-grow flex flex-col justify-between">
                    <div>
                        <h3 className="font-medium truncate text-sm leading-tight text-foreground">{product.name}</h3>
                        <div className="mt-1">
                            <span className="text-base font-bold">GHS {discountedPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            {isDiscountActive && (
                                <span className="text-xs text-muted-foreground line-through ml-2">GHS {product.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            )}
                        </div>
                    </div>
                    <div className="mt-2">
                        {product.quantity !== null && product.quantity > 0 && (
                            <div>
                                 <p className="text-xs text-muted-foreground">{product.quantity.toLocaleString('en-US')} items left</p>
                                 <Progress value={getProgressValue(product.quantity)} className="h-1 mt-1 bg-orange-200/20 [&>div]:bg-orange-500"/>
                            </div>
                        )}
                        {timeLeft && (
                             <div className="text-xs font-mono text-red-500 mt-2">
                                {timeLeft.days !== '0' && `${timeLeft.days}d `}{timeLeft.hours}:{timeLeft.minutes}:{timeLeft.seconds}
                            </div>
                        )}
                    </div>
                </CardContent>
            </div>
        </Card>
    </Link>
    )
}
