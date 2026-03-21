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
        <Card className="overflow-hidden group transition-all duration-300 ease-in-out hover:shadow-lg hover:border-primary/30 h-full flex flex-col">
            <div className="relative">
                <Image
                    src={product.image_urls?.[0] || 'https://picsum.photos/seed/1/200/200'}
                    alt={product.name}
                    width={200}
                    height={200}
                    className="object-cover w-full aspect-square group-hover:scale-105 transition-transform duration-300"
                />
                {isDiscountActive && (
                    <Badge variant="destructive" className="absolute top-2 left-2">-{product.discount_percentage}%</Badge>
                )}
            </div>
            <CardContent className="p-2 flex-grow flex flex-col justify-between">
                <div>
                    <h3 className="font-medium truncate text-sm leading-tight">{product.name}</h3>
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
                             <Progress value={getProgressValue(product.quantity)} className="h-1 mt-1 bg-orange-200 [&>div]:bg-orange-500"/>
                        </div>
                    )}
                    {timeLeft && (
                         <div className="text-xs font-mono text-red-600 mt-2">
                            {timeLeft.days !== '0' && `${timeLeft.days}d `}{timeLeft.hours}:{timeLeft.minutes}:{timeLeft.seconds}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    </Link>
    )
}
