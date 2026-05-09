'use client';

import { Card } from '@/components/ui/card';
import Image from 'next/image';
import Link from 'next/link';
import { Share2, Heart, ShoppingCart } from 'lucide-react';
import { cn, formatPrice } from '@/lib/utils';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface DefimartCardProps {
  product: any;
  isSaved?: boolean;
  onToggleSave?: (id: string) => void;
  onAddToCart?: (product: any) => void;
}

export function DefimartCard({ product, isSaved, onToggleSave, onAddToCart }: DefimartCardProps) {
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

  // Sanitize description for UI
  const displayDescription = product.description?.replace(' (AI Enhanced)', '') || 'No description available.';

  return (
    <Link href={`/products/${product.id}`} className="group h-full">
      <Card className="bg-gradient-to-br from-primary/[0.01] via-background to-blue-500/[0.01] border-[1.5px] border-[var(--border)] rounded-[20px] overflow-hidden transition-all duration-300 hover:-translate-y-[4px] hover:shadow-[0_16px_32px_rgba(245,166,35,0.08)] h-full flex flex-col relative group">
        {/* Subtle Decorative Blue Auras */}
        <div className="absolute -top-16 -left-16 w-48 h-48 bg-[var(--gold)]/5 rounded-full blur-3xl transition-all duration-700 opacity-20 group-hover:opacity-40 group-hover:scale-125 z-0" />
        <div className="absolute -bottom-16 -right-16 w-48 h-48 bg-blue-500/[0.02] rounded-full blur-3xl transition-all duration-700 opacity-20 group-hover:opacity-40 group-hover:scale-125 z-0" />
        
        <div className="relative z-10 flex flex-col h-full">
          {/* Image Area */}
          <div className="h-[150px] md:h-[200px] bg-primary/[0.01] relative flex items-center justify-center overflow-hidden">
            <div className="relative w-[110px] h-[110px] md:w-[140px] md:h-[140px] transition-transform duration-300 group-hover:scale-[1.1] drop-shadow-[0_10px_20px_rgba(0,0,0,0.06)]">
              <Image
                src={product.image_urls?.[0] || 'https://picsum.photos/seed/1/200/200'}
                alt={product.name}
                fill
                className="object-contain"
              />
            </div>
            
            {/* Overlays */}
            <div className="absolute top-3 right-3 flex flex-col gap-2.5">
              <button 
                onClick={handleShare}
                className="w-[34px] h-[34px] rounded-full bg-white/95 shadow-md flex items-center justify-center transition-all hover:bg-[#e0f0ff] hover:scale-[1.1]"
              >
                <Share2 className="w-[16px] h-[16px] text-[#4A90D9] stroke-[2.5px]" />
              </button>
              <button 
                onClick={handleSave}
                className="w-[34px] h-[34px] rounded-full bg-white/95 shadow-md flex items-center justify-center transition-all hover:bg-[#ffe0e0] hover:scale-[1.1]"
              >
                <Heart className={cn("w-[16px] h-[16px] stroke-[2.5px] text-[var(--gold)]", saved && "fill-[var(--gold)]")} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 flex-grow flex flex-col justify-between">
            <div>
              <span className="text-[var(--gold)] text-xs font-black uppercase tracking-[1px] block mb-1.5">
                {product.category || 'General'}
              </span>
              <h3 className="font-syne font-bold text-base md:text-lg leading-tight mb-2 group-hover:text-primary transition-colors text-[var(--dark)]">
                {product.name}
              </h3>
              <p className="text-[var(--muted)] text-xs md:text-sm leading-relaxed line-clamp-2 font-medium">
                {displayDescription}
              </p>
            </div>

            <div className="mt-4 flex items-end justify-between">
              <div className="flex flex-col">
                <span className="text-[var(--muted)] text-xs font-bold mb-[-1px]">GHS</span>
                <span className="font-syne font-black text-[var(--dark)] text-[18px] md:text-[22px] tracking-tighter">
                  {formatPrice(product.price).replace('GHS ', '')}
                </span>
              </div>
              <button 
                onClick={handleAddToCart}
                className="bg-gradient-to-r from-[var(--gold)] to-orange-600 text-white w-[60px] h-[32px] md:w-[72px] md:h-[36px] rounded-xl flex items-center justify-center gap-1.5 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-orange-500/20"
              >
                <ShoppingCart className="w-[14px] h-[14px] md:w-[16px] md:h-[16px] stroke-[3px]" />
                <span className="text-xs md:text-sm font-black uppercase tracking-tighter">Buy</span>
              </button>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
