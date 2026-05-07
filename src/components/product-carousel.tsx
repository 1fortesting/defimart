'use client';

import * as React from 'react';
import Autoplay from 'embla-carousel-autoplay';
import { Card } from '@/components/ui/card';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from '@/components/ui/carousel';
import Image from 'next/image';
import { Tables } from '@/types/supabase';
import { cn } from '@/lib/utils';

type ProductCarouselProps = {
    products: Tables<'products'>[];
}

export function ProductCarousel({ products }: ProductCarouselProps) {
  const [api, setApi] = React.useState<CarouselApi>();
  const [current, setCurrent] = React.useState(0);
  const [count, setCount] = React.useState(0);

  const plugin = React.useRef(
    Autoplay({ delay: 4000, stopOnInteraction: true })
  );

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
    <div className="relative">
      <Carousel 
        setApi={setApi} 
        className="w-full" 
        opts={{ loop: true }}
        plugins={[plugin.current]}
        onMouseEnter={plugin.current.stop}
        onMouseLeave={plugin.current.reset}
      >
        <CarouselContent>
          {products.map((product) => (
            <CarouselItem key={product.id}>
              <Card className="overflow-hidden relative bg-background rounded-2xl border-none shadow-none">
                <div className="relative aspect-[21/9] md:aspect-[3/1] w-full">
                  <Image
                    src={product.image_urls?.[0] || 'https://picsum.photos/seed/carousel/1200/500'}
                    alt={product.name}
                    fill
                    className="object-cover"
                    data-ai-hint="hero product"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/20 to-transparent" />
                <div className="absolute inset-0 flex flex-col justify-center items-start p-6 md:p-12 text-foreground">
                    <h2 className="text-2xl md:text-5xl font-black max-w-lg leading-tight text-white drop-shadow-lg italic uppercase tracking-tighter">
                      {product.name}
                    </h2>
                    <p className="mt-3 text-base md:text-lg max-w-md hidden md:block text-white/70 font-medium leading-snug">
                      {product.description}
                    </p>
                </div>
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      {/* Liquid Glass Dot Indicators */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex justify-center items-center gap-2 bg-white/20 backdrop-blur-xl px-4 py-2 rounded-full border border-white/30 shadow-[0_8px_32px_rgba(0,0,0,0.3)] z-20">
        {Array.from({ length: count }).map((_, index) => (
          <button
            key={index}
            onClick={() => handleDotClick(index)}
            className={cn(
              "h-1.5 rounded-full transition-all duration-500",
              index === current - 1 
                ? "bg-white w-6 shadow-[0_0_10px_rgba(255,255,255,0.8)]" 
                : "bg-white/40 w-1.5 hover:bg-white/60"
            )}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
