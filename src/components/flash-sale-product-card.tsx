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
    <Link href={`/products/${product.id}`} className="block w-36 md:w-48 flex-shrink-0">
        <Card className="relative overflow-hidden group transition-all duration-300 ease-in-out bg-gradient-to-br from-orange-500/[0.04] via-background to-blue-500/[0.03] border border-white/20 dark:border-slate-800/50 shadow-lg hover:shadow-primary/10 flex flex-col h-full">
            {/* Decorative Blue Auras */}
            <div className="absolute -top-12 -left-12 w-32 h-32 bg-blue-500/[0.05] rounded-full blur-2xl transition-all duration-700 opacity-50 group-hover:opacity-80 group-hover:w-40 group-hover:h-40 z-0" />
            <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-primary/[0.05] rounded-full blur-2xl transition-all duration-700 opacity-50 group-hover:opacity-80 group-hover:w-40 group-hover:h-40 z-0" />

            <div className="relative z-10 flex flex-col h-full">
                <div className="relative p-2">
                    <div className="relative aspect-[4/3] bg-primary/[0.03] rounded-md overflow-hidden">
                        <Image
                            src={product.image_urls?.[0] || 'https://picsum.photos/seed/1/200/200'}
                            alt={product.name}
                            fill
                            className="object-contain w-full p-1 group-hover:scale-105 transition-transform duration-300"
                        />
                    </div>
                    {isDiscountActive && (
                        <Badge variant="destructive" className="absolute top-3 left-3 shadow-lg">-{product.discount_percentage}%</Badge>
                    )}
                </div>
                <CardContent className="p-2 pt-0 flex-grow flex flex-col justify-between">
                    <div>
                        <h3 className="font-bold truncate text-sm leading-tight text-foreground group-hover:text-primary transition-colors">{product.name}</h3>
                        <div className="mt-1">
                            <span className="text-base font-black text-foreground">GHS {discountedPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            {isDiscountActive && (
                                <span className="text-xs text-red-500/70 text-muted-foreground line-through ml-2 font-medium">GHS {product.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            )}
                        </div>
                    </div>
                    <div className="mt-2">
                        {product.quantity !== null && product.quantity > 0 && (
                            <div>
                                 <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{product.quantity.toLocaleString('en-US')} units left</p>
                                 <Progress value={getProgressValue(product.quantity)} className="h-1 mt-1 bg-orange-200/10 [&>div]:bg-gradient-to-r [&>div]:from-orange-500 [&>div]:to-red-500"/>
                            </div>
                        )}
                        {timeLeft && (
                             <div className="text-[10px] font-black font-mono text-red-500 mt-2 uppercase tracking-tighter flex items-center gap-1">
                                <span className="animate-pulse">●</span> {timeLeft.days !== '0' && `${timeLeft.days}d `}{timeLeft.hours}:{timeLeft.minutes}:{timeLeft.seconds}
                            </div>
                        )}
                    </div>
                </CardContent>
            </div>
        </Card>
    </Link>
    )
}