'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import Link from 'next/link';
import { Tables } from '@/types/supabase';
import { Heart, ShoppingCart, Star, Share2, Copy, Check, MessageCircle, Facebook, ImageIcon, ArrowDown } from 'lucide-react';
import { cn, formatPrice } from '@/lib/utils';
import { usePathname } from 'next/navigation';
import { toggleSaveProduct } from '@/app/saved/actions';
import { addToCart } from '@/app/cart/actions';
import { useState, useEffect, useTransition } from 'react';
import { useToast } from '@/hooks/use-toast';
import { StarRating } from './star-rating';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Badge } from './ui/badge';

type ProductCardProps = {
  product: any; // Using any to support both products and vendor_products tables
  user: any; 
  isSaved: boolean;
  isVendor?: boolean;
  onUnsave?: (productId: string) => void;
};

export function ProductCard({ product, user, isSaved, isVendor = false, onUnsave }: ProductCardProps) {
    const pathname = usePathname();
    const [isPending, startTransition] = useTransition();
    const [isSavedState, setIsSavedState] = useState(isSaved);
    const { toast } = useToast();
    const [isCopied, setIsCopied] = useState(false);
    const [showShareFallback, setShowShareFallback] = useState(false);

    useEffect(() => {
        setIsSavedState(isSaved);
    }, [isSaved]);

    const isDiscountActive = product.discount_percentage && product.discount_percentage > 0 && product.discount_end_date && new Date(product.discount_end_date) > new Date();

    const discountedPrice = isDiscountActive
        ? product.price - (product.price * (product.discount_percentage! / 100))
        : product.price;

    const productUrl = typeof window !== 'undefined' ? `${window.location.origin}/products/${product.id}` : '';
    const shareText = `Check out ${product.name} on Defimart! GHS ${discountedPrice.toLocaleString()}`;

    const handleShare = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (navigator.share) {
            try {
                await navigator.share({
                    title: product.name,
                    text: shareText,
                    url: productUrl,
                });
            } catch (error) {
                if ((error as any).name !== 'AbortError') {
                    console.error('Error sharing:', error);
                    setShowShareFallback(true);
                }
            }
        } else {
            setShowShareFallback(true);
        }
    };

    const handleAddToCart = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        // 1. Instant UI Feedback (0ms delay)
        toast({
            title: 'Added to Cart',
            description: `${product.name} added successfully!`,
            variant: 'success',
        });
        
        try {
            let cart = JSON.parse(localStorage.getItem('cart') || '[]');
            const existingItemIndex = cart.findIndex((item: any) => 
                isVendor ? item.vendor_product_id === product.id : item.product_id === product.id
            );

            if (existingItemIndex > -1) {
                cart[existingItemIndex].quantity += 1;
            } else {
                 const cartItem = {
                    id: `local-${product.id}-${Date.now()}`,
                    product_id: isVendor ? null : product.id,
                    vendor_product_id: isVendor ? product.id : null,
                    quantity: 1,
                    created_at: new Date().toISOString(),
                    products: { ...product }
                };
                cart.push(cartItem);
            }
            localStorage.setItem('cart', JSON.stringify(cart));
            window.dispatchEvent(new Event('cart-updated'));
        } catch (e) {
            console.error('Local cart update failed', e);
        }
        
        // 2. Silent Backend Sync (Non-blocking)
        if (user) {
            startTransition(async () => {
                const formData = new FormData();
                formData.append('productId', product.id);
                if (isVendor) formData.append('isVendor', 'true');
                await addToCart(formData);
            });
        }
    };

    const handleToggleSave = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!navigator.onLine) {
            toast({
                title: 'Offline',
                description: 'Please connect to the internet to save items.',
                variant: 'destructive',
            });
            return;
        }

        const newIsSaved = !isSavedState;
        setIsSavedState(newIsSaved);
        
        if (onUnsave && !newIsSaved) {
            onUnsave(product.id);
        }

        toast({
            title: newIsSaved ? 'Product Saved' : 'Product Unsaved',
            description: `${product.name} has been ${newIsSaved ? 'added to' : 'removed from'} your wishlist.`,
            variant: 'success'
        });
            
        if (user) {
            startTransition(async () => {
                const formData = new FormData();
                formData.append('productId', product.id);
                formData.append('pathname', pathname);
                await toggleSaveProduct(formData);
            });
        }
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(productUrl);
        setIsCopied(true);
        toast({ title: 'Link Copied', description: 'Product link copied to clipboard!' });
        setTimeout(() => setIsCopied(false), 2000);
    };
    
    const shareWhatsApp = () => {
        window.open(`https://wa.me/?text=${encodeURIComponent(shareText + '\n\n' + productUrl)}`, '_blank');
        setShowShareFallback(false);
    };

    const shareFacebook = () => {
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(productUrl)}`, '_blank');
        setShowShareFallback(false);
    };

    const hasImage = product.image_urls && product.image_urls.length > 0;
    const displayDescription = product.description?.replace(' (AI Enhanced)', '') || (product.category || 'General');

    return (
    <Card className="overflow-hidden group transition-all duration-300 ease-in-out bg-gradient-to-br from-primary/[0.01] via-background to-blue-500/[0.01] border border-[var(--border)] shadow-sm hover:shadow-lg hover:shadow-[var(--gold)]/5 flex flex-col relative h-full cursor-pointer" onClick={() => window.location.href = `/products/${product.id}`}>
        <div className="absolute -top-16 -left-16 w-48 h-48 bg-primary/[0.03] rounded-full blur-3xl transition-all duration-700 opacity-20 group-hover:opacity-40 group-hover:scale-125 z-0" />
        <div className="absolute -bottom-16 -right-16 w-48 h-48 bg-blue-500/[0.01] rounded-full blur-3xl transition-all duration-700 opacity-20 group-hover:opacity-40 group-hover:scale-125 z-0" />
        
        {product.is_featured && (
            <div className="absolute top-2.5 right-2.5 z-20 bg-yellow-400 text-white rounded-full p-2 shadow-md">
                <Star className="h-4.5 w-4.5 fill-current" />
            </div>
        )}

        <div className="relative z-10 flex flex-col h-full">
            <div className="p-4">
                <div className="block relative aspect-square overflow-hidden rounded-2xl bg-primary/[0.01]">
                    {hasImage ? (
                        <Image
                            src={product.image_urls![0]}
                            alt={product.name}
                            fill
                            className="object-contain p-3 group-hover:scale-110 transition-transform duration-500 drop-shadow-sm rounded-2xl"
                        />
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground/30">
                            <ImageIcon className="h-14 w-14 mb-2" />
                            <span className="text-[11px] font-black uppercase tracking-widest">No Image</span>
                        </div>
                    )}
                </div>
            </div>
            
            <div className="p-5 pt-0 flex flex-col justify-between flex-grow">
                <div>
                    <h3 className="font-syne font-bold text-[15px] md:text-lg leading-tight text-[var(--dark)] mb-1.5 group-hover:text-primary transition-colors">
                        {product.name}
                    </h3>
                     <div className="text-xs md:text-sm text-[var(--muted)] font-dm line-clamp-2 h-9 overflow-hidden mb-3">
                        {displayDescription}
                    </div>
                    <div className="flex items-center gap-2 mb-4">
                        <StarRating rating={product.average_rating || 0} size={15} showText={false} />
                        {product.review_count !== undefined && product.review_count > 0 && <span className="text-xs text-[var(--muted)]">({product.review_count})</span>}
                    </div>
                </div>
                
                <div className="flex items-center justify-between mt-auto">
                     <div className="text-left flex flex-col">
                        {isDiscountActive && (
                            <p className="text-[11px] text-red-500/70 font-bold line-through">GHS {formatPrice(product.price)}</p>
                        )}
                        <p className="font-syne font-bold text-lg md:text-xl text-[var(--dark)]">GHS {formatPrice(discountedPrice)}</p>
                    </div>
                    
                    <div className="flex items-center gap-1.5">
                        <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-9 w-9 rounded-full text-[var(--muted)] hover:text-[var(--gold)] hover:bg-[var(--gold)]/10" 
                            onClick={handleShare}
                            aria-label="Share product"
                        >
                            <Share2 className="h-4.5 w-4.5" />
                        </Button>

                        <Sheet open={showShareFallback} onOpenChange={setShowShareFallback}>
                            <SheetContent side="bottom" className="rounded-t-3xl border-t-0 p-0 overflow-hidden bg-gradient-to-b from-[var(--gold)] to-blue-500 z-[150]">
                                <div className="w-12 h-2 bg-white/30 rounded-full mx-auto mt-4 mb-2" />
                                <SheetHeader className="px-6 py-5 border-b border-white/10">
                                    <SheetTitle className="text-left text-sm font-syne font-black uppercase tracking-widest text-white">Share with friends</SheetTitle>
                                </SheetHeader>
                                <div className="p-8 grid grid-cols-3 gap-6">
                                    <button onClick={shareWhatsApp} className="flex flex-col items-center gap-3 group">
                                        <div className="h-16 w-14 bg-white/20 text-white rounded-2xl flex items-center justify-center group-hover:bg-white group-hover:text-[var(--gold)] transition-all duration-300 shadow-sm">
                                            <MessageCircle className="h-8 w-8" />
                                        </div>
                                        <span className="text-xs font-bold font-dm uppercase tracking-tighter text-white/90">WhatsApp</span>
                                    </button>
                                    <button onClick={shareFacebook} className="flex flex-col items-center gap-3 group">
                                        <div className="h-16 w-14 bg-white/20 text-white rounded-2xl flex items-center justify-center group-hover:bg-white group-hover:text-[var(--gold)] transition-all duration-300 shadow-sm">
                                            <Facebook className="h-8 w-8" />
                                        </div>
                                        <span className="text-xs font-bold font-dm uppercase tracking-tighter text-white/90">Facebook</span>
                                    </button>
                                    <button onClick={handleCopyLink} className="flex flex-col items-center gap-3 group">
                                        <div className="h-16 w-14 bg-white/20 text-white rounded-2xl flex items-center justify-center group-hover:bg-white group-hover:text-[var(--gold)] transition-all duration-300 shadow-sm">
                                            {isCopied ? <Check className="h-8 w-8" /> : <Copy className="h-8 w-8" />}
                                        </div>
                                        <span className="text-xs font-bold font-dm uppercase tracking-tighter text-white/90">{isCopied ? 'Copied!' : 'Copy Link'}</span>
                                    </button>
                                </div>
                            </SheetContent>
                        </Sheet>

                        <Button onClick={handleToggleSave} size="icon" variant="ghost" className="h-9 w-9 rounded-full text-[var(--muted)] hover:text-[var(--gold)] hover:bg-[var(--gold)]/10" aria-label="Save for later">
                            <Heart className={cn("h-4.5 w-4.5", isSavedState && "fill-[var(--gold)] text-[var(--gold)]")} />
                        </Button>
                    </div>
                </div>
                <Button 
                    onClick={handleAddToCart}
                    disabled={product.quantity === 0} 
                    className="w-full mt-5 h-12 bg-gradient-to-r from-[var(--gold)] to-orange-600 hover:from-orange-600 hover:to-red-600 text-white font-black uppercase tracking-widest transition-all duration-500 shadow-lg shadow-[var(--gold)]/20 border-none"
                >
                    <ShoppingCart className="mr-2 h-5 w-5" />
                    {product.quantity === 0 ? 'Out of Stock' : 'Add to Cart'}
                </Button>
            </div>
        </div>
    </Card>
    )
}
