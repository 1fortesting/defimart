'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
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
  product: any;
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

    return (
    <Card className="overflow-hidden group transition-all duration-300 ease-in-out bg-white border border-border shadow-sm hover:shadow-xl hover:shadow-primary/5 flex flex-col relative h-full cursor-pointer rounded-2xl" onClick={() => window.location.href = `/products/${product.id}`}>
        <div className="absolute -top-16 -left-16 w-48 h-48 bg-primary/5 rounded-full blur-3xl transition-all duration-700 opacity-20 group-hover:opacity-40 group-hover:scale-125 z-0" />
        
        {product.is_featured && (
            <div className="absolute top-3 right-3 z-20 bg-primary text-white rounded-full p-2 shadow-lg scale-90 group-hover:scale-100 transition-transform">
                <Star className="h-4 w-4 fill-current" />
            </div>
        )}

        <div className="relative z-10 flex flex-col h-full">
            <div className="p-3">
                <div className="block relative aspect-square overflow-hidden rounded-xl bg-muted/30">
                    {hasImage ? (
                        <Image
                            src={product.image_urls![0]}
                            alt={product.name}
                            fill
                            className="object-contain p-4 group-hover:scale-110 transition-transform duration-700 drop-shadow-md rounded-xl"
                        />
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground/30">
                            <ImageIcon className="h-12 w-12 mb-2" />
                            <span className="text-[11px] font-black uppercase tracking-widest font-poppins">No Image</span>
                        </div>
                    )}
                </div>
            </div>
            
            <div className="p-4 pt-0 flex flex-col justify-between flex-grow">
                <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5">
                        <Badge variant="outline" className="text-[10px] font-black uppercase tracking-tighter h-5 px-2 bg-muted/50 border-muted">
                            {isVendor ? 'Vendor' : 'Official'}
                        </Badge>
                        {isDiscountActive && <Badge className="text-[10px] font-black h-5 px-2 bg-red-500 text-white border-none animate-pulse">-{product.discount_percentage}%</Badge>}
                    </div>
                    <h3 className="font-montserrat font-bold text-[15px] leading-tight text-foreground group-hover:text-primary transition-colors line-clamp-2 min-h-[40px]">
                        {product.name}
                    </h3>
                    <div className="flex items-center gap-2 mb-2">
                        <StarRating rating={product.average_rating || 0} size={13} showText={false} />
                        {product.review_count !== undefined && product.review_count > 0 && <span className="text-[11px] font-bold text-muted-foreground font-roboto">({product.review_count})</span>}
                    </div>
                </div>
                
                <div className="flex items-center justify-between mt-auto">
                     <div className="text-left flex flex-col">
                        {isDiscountActive && (
                            <p className="text-[11px] text-muted-foreground/60 font-bold line-through font-roboto leading-none mb-1">GHS {formatPrice(product.price).replace('GHS ', '')}</p>
                        )}
                        <p className="font-montserrat font-black text-xl text-foreground tracking-tighter leading-none">
                            <span className="text-[11px] font-bold mr-0.5">GHS</span>{formatPrice(discountedPrice).replace('GHS ', '')}
                        </p>
                    </div>
                    
                    <div className="flex items-center gap-1">
                        <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-9 w-9 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10" 
                            onClick={handleShare}
                        >
                            <Share2 className="h-4.5 w-4.5" />
                        </Button>

                        <Sheet open={showShareFallback} onOpenChange={setShowShareFallback}>
                            <SheetContent side="bottom" className="rounded-t-[32px] border-none p-0 overflow-hidden bg-background shadow-2xl z-[250]">
                                <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mt-4 mb-2" />
                                <div className="p-8 grid grid-cols-3 gap-6">
                                    <button onClick={shareWhatsApp} className="flex flex-col items-center gap-3 group">
                                        <div className="h-14 w-14 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center group-hover:bg-green-600 group-hover:text-white transition-all shadow-sm">
                                            <MessageCircle className="h-6 w-6" />
                                        </div>
                                        <span className="text-[11px] font-black font-poppins uppercase tracking-widest">WhatsApp</span>
                                    </button>
                                    <button onClick={shareFacebook} className="flex flex-col items-center gap-3 group">
                                        <div className="h-14 w-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                                            <Facebook className="h-6 w-6" />
                                        </div>
                                        <span className="text-[11px] font-black font-poppins uppercase tracking-widest">Facebook</span>
                                    </button>
                                    <button onClick={handleCopyLink} className="flex flex-col items-center gap-3 group">
                                        <div className="h-14 w-14 bg-muted text-foreground rounded-2xl flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                                            {isCopied ? <Check className="h-6 w-6" /> : <Copy className="h-6 w-6" />}
                                        </div>
                                        <span className="text-[11px] font-black font-poppins uppercase tracking-widest">{isCopied ? 'Copied' : 'Link'}</span>
                                    </button>
                                </div>
                            </SheetContent>
                        </Sheet>

                        <Button onClick={handleToggleSave} size="icon" variant="ghost" className="h-9 w-9 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10">
                            <Heart className={cn("h-4.5 w-4.5 transition-all", isSavedState && "fill-primary text-primary")} />
                        </Button>
                    </div>
                </div>
                <Button 
                    onClick={handleAddToCart}
                    disabled={product.quantity === 0} 
                    className="w-full mt-4 h-12 bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest text-[12px] rounded-xl shadow-lg shadow-primary/20 border-none font-poppins"
                >
                    <ShoppingCart className="mr-2 h-5 w-5" />
                    {product.quantity === 0 ? 'Out of Stock' : 'Add to Bag'}
                </Button>
            </div>
        </div>
    </Card>
    )
}