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

  return (
    <Link href={`/products/${product.id}`} className="group h-full">
      <Card className="bg-white border-[1.5px] border-[var(--border)] rounded-[16px] overflow-hidden transition-all duration-300 hover:-translate-y-[3px] hover:shadow-[0_12px_24px_rgba(0,0,0,0.05)] h-full flex flex-col relative group">
        {/* Decorative Background Elements (Spanning Whole Card) */}
        <div className="absolute -top-16 -left-16 w-48 h-48 bg-[var(--gold)]/10 rounded-full blur-3xl transition-all duration-700 opacity-60 group-hover:opacity-100 group-hover:scale-125 z-0" />
        <div className="absolute -bottom-16 -right-16 w-48 h-48 bg-[var(--gold)]/5 rounded-full blur-3xl transition-all duration-700 opacity-60 group-hover:opacity-100 group-hover:scale-125 z-0" />
        
        <div className="relative z-10 flex flex-col h-full">
          {/* Image Area */}
          <div className="h-[140px] md:h-[180px] bg-transparent relative flex items-center justify-center overflow-hidden">
            <div className="relative w-[100px] h-[100px] md:w-[130px] md:h-[130px] transition-transform duration-300 group-hover:scale-[1.1] drop-shadow-[0_8px_16px_rgba(0,0,0,0.08)]">
              <Image
                src={product.image_urls?.[0] || 'https://picsum.photos/seed/1/200/200'}
                alt={product.name}
                fill
                className="object-contain"
              />
            </div>
            
            {/* Overlays */}
            <div className="absolute top-2 right-2 flex flex-col gap-2">
              <button 
                onClick={handleShare}
                className="w-[30px] h-[30px] rounded-full bg-white/92 shadow-sm flex items-center justify-center transition-all hover:bg-[#e0f0ff] hover:scale-[1.1]"
              >
                <Share2 className="w-[14px] h-[14px] text-[#4A90D9] stroke-[2px]" />
              </button>
              <button 
                onClick={handleSave}
                className="w-[30px] h-[30px] rounded-full bg-white/92 shadow-sm flex items-center justify-center transition-all hover:bg-[#ffe0e0] hover:scale-[1.1]"
              >
                <Heart className={cn("w-[14px] h-[14px] stroke-[2px] text-[var(--gold)]", saved && "fill-[var(--gold)]")} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-3 flex-grow flex flex-col justify-between">
            <div>
              <span className="text-[var(--gold)] text-[10px] font-[600] uppercase tracking-[0.5px] block mb-1">
                {product.category || 'General'}
              </span>
              <h3 className="font-syne font-[700] text-[var(--dark)] text-[14px] md:text-[15px] leading-tight mb-1">
                {product.name}
              </h3>
              <p className="text-[var(--muted)] text-[11px] leading-relaxed line-clamp-2">
                {product.description || 'No description available.'}
              </p>
            </div>

            <div className="mt-3 flex items-end justify-between">
              <div className="flex flex-col">
                <span className="text-[var(--muted)] text-[11px] font-medium mb-[-2px]">GHS</span>
                <span className="font-syne font-[700] text-[var(--dark)] text-[16px] md:text-[18px]">
                  {formatPrice(product.price).replace('GHS ', '')}
                </span>
              </div>
              <button 
                onClick={handleAddToCart}
                className="bg-[var(--gold)] text-white w-[54px] h-[28px] md:w-[64px] md:h-[32px] rounded-[10px] flex items-center justify-center gap-1 transition-colors hover:bg-[var(--dark)]"
              >
                <ShoppingCart className="w-[12px] h-[12px] md:w-[14px] md:h-[14px] stroke-[2.5px]" />
                <span className="text-[12px] md:text-[13px] font-[600]">Add</span>
              </button>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
