'use client';

import { Card } from '@/components/ui/card';
import Image from 'next/image';
import Link from 'next/link';
import { Share2, Heart, ShoppingCart, Star } from 'lucide-react';
import { cn, formatPrice } from '@/lib/utils';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface FeaturedProductCardProps {
  product: any;
  isSaved?: boolean;
  onToggleSave?: (id: string) => void;
  onAddToCart?: (product: any) => void;
}

export function FeaturedProductCard({ product, isSaved, onToggleSave, onAddToCart }: FeaturedProductCardProps) {
  const { toast } = useToast();
  const [saved, setSaved] = useState(isSaved);

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/products/${product.id}`;
    navigator.clipboard.writeText(url);
    toast({ title: 'Link Copied', description: 'Product link copied to clipboard!' });
  };

  const handleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSaved(!saved);
    if (onToggleSave) onToggleSave(product.id);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onAddToCart) onAddToCart(product);
  };

  return (
    <Link href={`/products/${product.id}`} className="block w-full h-full">
      <Card className="bg-[var(--brand-dark)] rounded-[16px] overflow-hidden p-4 md:p-6 relative shadow-[0_8px_32px_rgba(0,0,0,0.2)] border-none h-full flex flex-col justify-between">
        {/* Top Badges */}
        <div className="absolute top-3 left-3 bg-[var(--gold)] rounded-full px-3 py-1 flex items-center gap-1 z-20">
          <Star className="w-[10px] h-[10px] fill-white text-white" />
          <span className="text-white text-[10px] font-bold uppercase tracking-wider">Featured</span>
        </div>

        <div className="flex gap-4 md:gap-6 relative z-10 flex-col sm:flex-row">
          {/* Image Area */}
          <div className="w-[110px] h-[110px] md:w-[150px] md:h-[150px] flex-shrink-0 flex items-center justify-center relative mx-auto sm:mx-0">
             <div className="w-[100px] h-[100px] md:w-[140px] md:h-[140px] relative drop-shadow-[0_10px_20px_rgba(0,0,0,0.3)]">
                <Image
                  src={product.image_urls?.[0] || 'https://picsum.photos/seed/featured/200/200'}
                  alt={product.name}
                  fill
                  className="object-contain"
                />
             </div>
          </div>

          {/* Info Area */}
          <div className="flex-1 flex flex-col justify-center pt-1 text-center sm:text-left">
             <div className="flex justify-between items-start">
                <div className="flex flex-col w-full sm:w-auto">
                  <span className="text-[var(--gold)] text-[11px] md:text-[12px] font-[600] uppercase tracking-[0.6px] mb-1">
                    {product.category || 'Special'}
                  </span>
                  <h2 className="font-syne font-[700] text-white text-[20px] md:text-[28px] leading-tight">
                    {product.name}
                  </h2>
                </div>
                
                {/* Overlay Buttons */}
                <div className="hidden sm:flex flex-col gap-2">
                  <button 
                    onClick={handleShare}
                    className="w-[30px] h-[30px] md:w-[36px] md:h-[36px] rounded-full bg-white/15 flex items-center justify-center transition-all hover:bg-white/25"
                  >
                    <Share2 className="w-[14px] h-[14px] md:w-[16px] md:h-[16px] text-white stroke-[2px]" />
                  </button>
                  <button 
                    onClick={handleSave}
                    className="w-[30px] h-[30px] md:w-[36px] md:h-[36px] rounded-full bg-white/15 flex items-center justify-center transition-all hover:bg-white/25"
                  >
                    <Heart className={cn("w-[14px] h-[14px] md:w-[16px] md:h-[16px] stroke-[2px] text-[var(--gold)]", saved && "fill-[var(--gold)]")} />
                  </button>
                </div>
             </div>
             
             <p className="text-white/55 text-[12px] md:text-[14px] leading-normal mt-2 mb-4 line-clamp-2 sm:pr-8">
                {product.description || 'Exclusive item selected for the community.'}
             </p>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4">
           <span className="font-syne font-[700] text-[var(--gold-light)] text-[22px] md:text-[32px]">
              {formatPrice(product.price)}
           </span>
           <button 
              onClick={handleAddToCart}
              className="bg-[var(--gold)] text-[var(--dark)] px-6 py-2 md:py-3 rounded-xl flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-gold/20"
           >
              <ShoppingCart className="w-[16px] h-[16px] md:w-[20px] md:h-[20px] stroke-[2.5px]" />
              <span className="text-[14px] md:text-[16px] font-[700] font-dm">Add to Cart</span>
           </button>
        </div>
      </Card>
    </Link>
  );
}
