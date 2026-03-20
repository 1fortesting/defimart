'use client';

import * as React from 'react';
import { Card } from '@/components/ui/card';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from '@/components/ui/carousel';
import Image from 'next/image';
import { Tables } from '@/types/supabase';

type ProductCarouselProps = {
    products: Tables<'products'>[];
}

export function ProductCarousel({ products }: ProductCarouselProps) {
  const [api, setApi] = React.useState<CarouselApi>();
  const [current, setCurrent] = React.useState(0);
  const [count, setCount] = React.useState(0);

  React.useEffect(() => {
    if (!api) {
      return;
    }

    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap() + 1);

    api.on('select', () => {
      setCurrent(api.selectedScrollSnap() + 1);
    });
  }, [api]);
  
  const handleDotClick = (index: number) => {
    api?.scrollTo(index);
  }

  return (
    <div className="mb-8 relative">
      <Carousel setApi={setApi} className="w-full" opts={{ loop: true }}>
        <CarouselContent>
          {products.map((product) => (
            <CarouselItem key={product.id}>
              <Card className="overflow-hidden relative bg-background border-none rounded-none">
                <Image
                  src={product.image_urls?.[0] || 'https://picsum.photos/seed/carousel/1200/500'}
                  alt={product.name}
                  width={1200}
                  height={500}
                  className="object-cover w-full aspect-[16/7] brightness-50"
                  data-ai-hint="hero product"
                />
                <div className="absolute inset-0 flex flex-col justify-center items-start p-8 md:p-16 text-foreground">
                    <h2 className="text-3xl md:text-5xl font-bold max-w-lg leading-tight text-white">{product.name}</h2>
                    <p className="mt-2 text-lg max-w-lg hidden md:block text-slate-300">{product.description}</p>
                </div>
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex justify-center gap-2">
        {Array.from({ length: count }).map((_, index) => (
          <button
            key={index}
            onClick={() => handleDotClick(index)}
            className={`h-2 w-2 rounded-full transition-colors ${
              index === current - 1 ? 'bg-primary' : 'bg-muted/50'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
