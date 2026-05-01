'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import Link from 'next/link';
import { Tables } from '@/types/supabase';
import { Heart, ShoppingCart, Star, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';
import { toggleSaveProduct } from '@/app/saved/actions';
import { addToCart } from '@/app/cart/actions';
import { useState, useEffect, useTransition } from 'react';
import { useToast } from '@/hooks/use-toast';
import { StarRating } from './star-rating';
import { addToQueue } from '@/lib/offline-db';

type ProductCardProps = {
  product: Tables<'products'> & { average_rating?: number; review_count?: number };
  user: any; // Simplified user object
  isSaved: boolean;
  onUnsave?: (productId: string) => void;
};

export function ProductCard({ product, user, isSaved, onUnsave }: ProductCardProps) {
    const pathname = usePathname();
    const [isPending, startTransition] = useTransition();
    const [isSavedState, setIsSavedState] = useState(isSaved);
    const { toast } = useToast();

    useEffect(() => {
        setIsSavedState(isSaved);
    }, [isSaved]);

    const isDiscountActive = product.discount_percentage && product.discount_percentage > 0 && product.discount_end_date && new Date(product.discount_end_date) > new Date();

    const discountedPrice = isDiscountActive
        ? product.price - (product.price * (product.discount_percentage! / 100))
        : product.price;

    const handleAddToCart = async () => {
        const offline = !navigator.onLine;

        toast({
            title: offline ? 'Saved Offline' : 'Added to Cart',
            description: offline 
                ? `${product.name} will be added once you're online.` 
                : `${product.name} has been added.`,
            variant: offline ? 'default' : 'success',
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
        } catch (e) { console.error('Failed to update cart in local storage', e); }

        window.dispatchEvent(new Event('cart-updated'));
        
        if (user) {
            if (offline) {
                await addToQueue({ type: 'ADD_TO_CART', payload: { productId: product.id } });
            } else {
                startTransition(async () => {
                    const formData = new FormData();
                    formData.append('productId', product.id);
                    await addToCart(formData);
                });
            }
        }
    };


    const handleToggleSave = async () => {
        const offline = !navigator.onLine;
        const newIsSaved = !isSavedState;
        setIsSavedState(newIsSaved);
        
        if (onUnsave && !newIsSaved) onUnsave(product.id);

        toast({
            title: offline ? 'Saved Offline' : (newIsSaved ? 'Product Saved' : 'Product Unsaved'),
            description: offline 
                ? 'Your changes will sync when you return online.'
                : `${product.name} has been ${newIsSaved ? 'added to' : 'removed from'} your wishlist.`,
            variant: offline ? 'default' : 'success'
        });

        try {
            let saved = JSON.parse(localStorage.getItem('saved') || '[]');
            if (newIsSaved) {
                if (!saved.some((item: any) => item.product_id === product.id)) saved.push({ id: `local-${product.id}`, product_id: product.id, products: product });
            } else {
                saved = saved.filter((item: any) => item.product_id !== product.id);
            }
            localStorage.setItem('saved', JSON.stringify(saved));
        } catch(e) { console.error('Failed to update saved items in local storage', e); }

        window.dispatchEvent(new Event('saved-updated'));
            
        if (user) {
            if (offline) {
                await addToQueue({ type: 'SAVE_PRODUCT', payload: { productId: product.id, pathname } });
            } else {
                startTransition(async () => {
                    const formData = new FormData();
                    formData.append('productId', product.id);
                    formData.append('pathname', pathname);
                    await toggleSaveProduct(formData);
                });
            }
        }
    };
    
    return (
    <Card className="overflow-hidden group transition-all duration-300 ease-in-out bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-white/20 dark:border-slate-800/50 shadow-lg hover:shadow-primary/20 flex flex-col relative">
        {/* Decorative elements */}
        <div className="absolute -top-16 -left-16 w-48 h-48 bg-primary/30 rounded-full blur-3xl transition-all duration-700 opacity-70 group-hover:opacity-100 group-hover:w-56 group-hover:h-56" />
        <div className="absolute -bottom-16 -right-16 w-48 h-48 bg-accent/30 rounded-full blur-3xl transition-all duration-700 opacity-70 group-hover:opacity-100 group-hover:w-56 group-hover:h-56" />
        
        {/* Featured Badge */}
        {product.is_featured && (
            <div className="absolute top-2 right-2 z-20 bg-primary/80 text-primary-foreground rounded-full p-1.5 shadow-md backdrop-blur-sm">
                <Star className="h-4 w-4" />
            </div>
        )}

        <div className="relative z-10 flex flex-col h-full">
            {/* Image Section */}
            <div className="p-4">
                <Link href={`/products/${product.id}`} className="block">
                    <Image
                        src={product.image_urls?.[0] || 'https://picsum.photos/seed/1/400/400'}
                        alt={product.name}
                        width={400}
                        height={400}
                        className="object-cover w-full aspect-square group-hover:scale-105 transition-transform duration-300 rounded-md"
                        data-ai-hint="product image"
                    />
                </Link>
            </div>
            
            {/* Content Section */}
            <div className="p-4 pt-0 flex flex-col justify-between flex-grow">
                <div>
                    <h3 className="font-bold text-base leading-tight truncate text-foreground">{product.name}</h3>
                     <div className="text-xs text-muted-foreground mt-1 h-8 overflow-hidden">
                        {product.description ? `${product.description.substring(0, 50)}...` : (product.category || '')}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                        <StarRating rating={product.average_rating || 0} size={16} showText={false} />
                        {product.review_count !== undefined && product.review_count > 0 && <span className="text-xs text-muted-foreground">({product.review_count})</span>}
                    </div>
                </div>
                
                <div className="flex items-center justify-between mt-4">
                     <div className="text-left">
                        {isDiscountActive && (
                            <p className="text-xs text-muted-foreground line-through">GHS {product.price.toLocaleString()}</p>
                        )}
                        <p className="font-bold text-lg text-foreground">GHS {discountedPrice.toLocaleString()}</p>
                    </div>
                     <Button onClick={handleToggleSave} disabled={isPending} size="icon" variant="ghost" className="h-9 w-9 rounded-full text-muted-foreground hover:text-primary" aria-label="Save for later">
                        <Heart className={cn("h-5 w-5", isSavedState && "fill-red-500 text-red-500")} />
                    </Button>
                </div>
                <Button 
                    onClick={handleAddToCart}
                    disabled={isPending || product.quantity === 0} 
                    className="w-full mt-2"
                >
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    {product.quantity === 0 ? 'Out of Stock' : 'Add to Cart'}
                </Button>
            </div>
        </div>
    </Card>
    )
}
