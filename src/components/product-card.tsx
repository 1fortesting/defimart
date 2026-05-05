'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import Link from 'next/link';
import { Tables } from '@/types/supabase';
import { Heart, ShoppingCart, Star, Share2, Copy, Check, MessageCircle, Facebook } from 'lucide-react';
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

type ProductCardProps = {
  product: Tables<'products'> & { average_rating?: number; review_count?: number };
  user: any; 
  isSaved: boolean;
  onUnsave?: (productId: string) => void;
};

export function ProductCard({ product, user, isSaved, onUnsave }: ProductCardProps) {
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

    const handleAddToCart = () => {
        if (!navigator.onLine) {
            toast({
                title: 'Offline',
                description: 'Please connect to the internet to add items to your cart.',
                variant: 'destructive',
            });
            return;
        }

        toast({
            title: 'Added to Cart',
            description: `${product.name} has been added.`,
            variant: 'success',
        });
        
        try {
            let cart = JSON.parse(localStorage.getItem('cart') || '[]');
            const existingItemIndex = cart.findIndex((item: any) => item.product_id === product.id);

            if (existingItemIndex > -1) {
                cart[existingItemIndex].quantity += 1;
            } else {
                 const cartItem = {
                    id: `local-${product.id}-${Date.now()}`,
                    user_id: user?.id,
                    product_id: product.id,
                    quantity: 1,
                    created_at: new Date().toISOString(),
                    products: { ...product }
                };
                cart.push(cartItem);
            }
            localStorage.setItem('cart', JSON.stringify(cart));
        } catch (e) {
            console.error('Failed to update cart in local storage', e);
        }

        window.dispatchEvent(new Event('cart-updated'));
        
        if (user) {
            startTransition(async () => {
                const formData = new FormData();
                formData.append('productId', product.id);
                const result = await addToCart(formData);
                if (result.error) {
                    toast({ variant: 'destructive', title: 'Error', description: result.error });
                }
            });
        }
    };


    const handleToggleSave = () => {
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
    
    return (
    <Card className="overflow-hidden group transition-all duration-300 ease-in-out bg-[var(--surface)] border border-[var(--border)] shadow-sm hover:shadow-lg hover:shadow-[var(--gold)]/10 flex flex-col relative h-full">
        {/* Decorative elements */}
        <div className="absolute -top-16 -left-16 w-48 h-48 bg-[var(--gold)]/20 rounded-full blur-3xl transition-all duration-700 opacity-60 group-hover:opacity-100 group-hover:scale-125" />
        <div className="absolute -bottom-16 -right-16 w-48 h-48 bg-primary/20 rounded-full blur-3xl transition-all duration-700 opacity-60 group-hover:opacity-100 group-hover:scale-125" />
        
        {/* Featured Badge */}
        {product.is_featured && (
            <div className="absolute top-2 right-2 z-20 bg-yellow-400 text-white rounded-full p-1.5 shadow-md">
                <Star className="h-4 w-4 fill-current" />
            </div>
        )}

        <div className="relative z-10 flex flex-col h-full">
            {/* Image Section */}
            <div className="p-3">
                <Link href={`/products/${product.id}`} className="block relative aspect-square overflow-hidden rounded-2xl bg-[var(--surface-2)]">
                    <Image
                        src={product.image_urls?.[0] || 'https://picsum.photos/seed/1/400/400'}
                        alt={product.name}
                        fill
                        className="object-contain p-2 group-hover:scale-110 transition-transform duration-500 drop-shadow-sm rounded-2xl"
                    />
                </Link>
            </div>
            
            {/* Content Section */}
            <div className="p-4 pt-0 flex flex-col justify-between flex-grow">
                <div>
                    <h3 className="font-syne font-bold text-sm md:text-base leading-tight text-[var(--dark)] mb-1">
                        {product.name}
                    </h3>
                     <div className="text-[11px] md:text-xs text-[var(--muted)] font-dm line-clamp-2 h-8 overflow-hidden mb-2">
                        {product.description || (product.category || 'General')}
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                        <StarRating rating={product.average_rating || 0} size={14} showText={false} />
                        {product.review_count !== undefined && product.review_count > 0 && <span className="text-[10px] text-[var(--muted)]">({product.review_count})</span>}
                    </div>
                </div>
                
                <div className="flex items-center justify-between mt-auto">
                     <div className="text-left flex flex-col">
                        {isDiscountActive && (
                            <p className="text-[10px] text-[var(--muted)] line-through">GHS {formatPrice(product.price)}</p>
                        )}
                        <p className="font-syne font-bold text-base md:text-lg text-[var(--dark)]">GHS {formatPrice(discountedPrice)}</p>
                    </div>
                    
                    <div className="flex items-center gap-1">
                        {/* Share Logic */}
                        <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-8 w-8 rounded-full text-[var(--muted)] hover:text-[var(--gold)] hover:bg-[var(--gold)]/10" 
                            onClick={handleShare}
                            aria-label="Share product"
                        >
                            <Share2 className="h-4 w-4" />
                        </Button>

                        {/* Fallback Share Menu */}
                        <Sheet open={showShareFallback} onOpenChange={setShowShareFallback}>
                            <SheetContent side="bottom" className="rounded-t-3xl border-t-0 p-0 overflow-hidden bg-[var(--gold)] z-[150]">
                                <div className="w-12 h-1.5 bg-white/30 rounded-full mx-auto mt-3 mb-1" />
                                <SheetHeader className="px-6 py-4 border-b border-white/10">
                                    <SheetTitle className="text-left text-sm font-syne font-black uppercase tracking-widest text-white">Share with friends</SheetTitle>
                                </SheetHeader>
                                <div className="p-6 grid grid-cols-3 gap-4">
                                    <button 
                                        onClick={shareWhatsApp}
                                        className="flex flex-col items-center gap-2 group"
                                    >
                                        <div className="h-14 w-14 bg-white/20 text-white rounded-2xl flex items-center justify-center group-hover:bg-white group-hover:text-[var(--gold)] transition-all duration-300 shadow-sm">
                                            <MessageCircle className="h-7 w-7" />
                                        </div>
                                        <span className="text-[10px] font-bold font-dm uppercase tracking-tighter text-white/90">WhatsApp</span>
                                    </button>
                                    
                                    <button 
                                        onClick={shareFacebook}
                                        className="flex flex-col items-center gap-2 group"
                                    >
                                        <div className="h-14 w-14 bg-white/20 text-white rounded-2xl flex items-center justify-center group-hover:bg-white group-hover:text-[var(--gold)] transition-all duration-300 shadow-sm">
                                            <Facebook className="h-7 w-7" />
                                        </div>
                                        <span className="text-[10px] font-bold font-dm uppercase tracking-tighter text-white/90">Facebook</span>
                                    </button>

                                    <button 
                                        onClick={handleCopyLink}
                                        className="flex flex-col items-center gap-2 group"
                                    >
                                        <div className="h-14 w-14 bg-white/20 text-white rounded-2xl flex items-center justify-center group-hover:bg-white group-hover:text-[var(--gold)] transition-all duration-300 shadow-sm">
                                            {isCopied ? <Check className="h-7 w-7" /> : <Copy className="h-7 w-7" />}
                                        </div>
                                        <span className="text-[10px] font-bold font-dm uppercase tracking-tighter text-white/90">{isCopied ? 'Copied' : 'Copy Link'}</span>
                                    </button>
                                </div>
                            </SheetContent>
                        </Sheet>

                        <Button onClick={handleToggleSave} disabled={isPending} size="icon" variant="ghost" className="h-8 w-8 rounded-full text-[var(--muted)] hover:text-[var(--gold)] hover:bg-[var(--gold)]/10" aria-label="Save for later">
                            <Heart className={cn("h-4 w-4", isSavedState && "fill-[var(--gold)] text-[var(--gold)]")} />
                        </Button>
                    </div>
                </div>
                <Button 
                    onClick={handleAddToCart}
                    disabled={isPending || product.quantity === 0} 
                    className="w-full mt-3 bg-[var(--gold)] hover:bg-[var(--dark)] text-white transition-all duration-300 shadow-lg shadow-[var(--gold)]/20"
                >
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    {product.quantity === 0 ? 'Out of Stock' : 'Add to Cart'}
                </Button>
            </div>
        </div>
    </Card>
    )
}
