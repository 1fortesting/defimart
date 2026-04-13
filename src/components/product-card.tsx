'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import Link from 'next/link';
import { Tables } from '@/types/supabase';
import { Badge } from '@/components/ui/badge';
import { Heart, Flame, ShoppingCart, Star as StarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';
import { toggleSaveProduct } from '@/app/saved/actions';
import { addToCart } from '@/app/cart/actions';
import { useState, useEffect, useTransition } from 'react';
import { useToast } from '@/hooks/use-toast';
import { StarRating } from './star-rating';

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

    const handleAddToCart = () => {
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
        } catch (e) { console.error('Failed to update cart in local storage', e); }

        window.dispatchEvent(new Event('cart-updated'));
        
        if (user) {
            startTransition(async () => {
                const formData = new FormData();
                formData.append('productId', product.id);
                await addToCart(formData);
            });
        }
    };


    const handleToggleSave = () => {
        const newIsSaved = !isSavedState;
        setIsSavedState(newIsSaved);
        
        if (onUnsave && !newIsSaved) onUnsave(product.id);

        toast({
            title: newIsSaved ? 'Product Saved' : 'Product Unsaved',
            description: `${product.name} has been ${newIsSaved ? 'added to' : 'removed from'} your wishlist.`,
            variant: 'success'
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
            startTransition(async () => {
                const formData = new FormData();
                formData.append('productId', product.id);
                formData.append('pathname', pathname);
                await toggleSaveProduct(formData);
            });
        }
    };

    const colorVariant = parseInt(product.id.replace(/[^0-9]/g, '').slice(-2) || '0', 10) % 3;
    const glowColors = [
        'from-primary/20 via-accent/20 to-transparent', // Defimart Theme
        'from-blue-500/20 via-purple-500/20 to-transparent', // Cool Tone
        'from-orange-500/20 via-red-500/20 to-transparent' // Warm Tone
    ];
    
    return (
    <Card className="overflow-hidden group transition-all duration-300 ease-in-out bg-slate-900 border-slate-800 hover:border-primary/50 text-white flex flex-col shadow-lg hover:shadow-primary/20">
        {/* Image Section */}
        <div className="relative overflow-hidden bg-slate-800">
            <div className={cn("absolute inset-0 bg-gradient-to-t blur-2xl", glowColors[colorVariant])} />
            <div className="absolute top-2 right-2 bg-black/50 text-white text-xs font-bold px-2 py-1 rounded-full z-10">GHS {discountedPrice.toLocaleString()}</div>
            <div className="absolute -bottom-4 -left-4 w-12 h-12 border-2 border-white/10 rounded-full" />
            <div className="absolute -top-2 -right-6 w-16 h-16 border-2 border-white/10 rounded-full rotate-45" />

            <Link href={`/products/${product.id}`} className="block p-4">
                <Image
                    src={product.image_urls?.[0] || 'https://picsum.photos/seed/1/600/400'}
                    alt={product.name}
                    width={400}
                    height={400}
                    className="object-contain w-full aspect-square group-hover:scale-105 transition-transform duration-300"
                    data-ai-hint="product image"
                />
            </Link>
        </div>
        
        {/* Content Section */}
        <div className="p-4 bg-slate-900/80 backdrop-blur-sm flex flex-col justify-between flex-grow">
            <div>
                <h3 className="font-bold text-base leading-tight truncate text-white">{product.name}</h3>
                 <p className="text-xs text-slate-400 mt-1 h-8 overflow-hidden">
                    {product.description ? `${product.description.substring(0, 50)}...` : (product.category || '')}
                </p>
                <div className="flex items-center gap-2 mt-2">
                    <StarRating rating={product.average_rating || 0} size={16} showText={false} />
                    {product.review_count !== undefined && product.review_count > 0 && <span className="text-xs text-slate-400">({product.review_count})</span>}
                </div>
            </div>
            
            <div className="flex items-center justify-between mt-4">
                 <Button 
                    onClick={handleAddToCart}
                    disabled={isPending || product.quantity === 0} 
                    className="bg-primary/90 hover:bg-primary text-primary-foreground font-bold text-xs rounded-full h-8 px-4 w-full"
                >
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    {product.quantity === 0 ? 'Out of Stock' : 'Add to Cart'}
                </Button>
                 <Button onClick={handleToggleSave} disabled={isPending} size="icon" variant="ghost" className="h-8 w-8 rounded-full text-slate-400 hover:text-white" aria-label="Save for later">
                    <Heart className={cn("h-5 w-5", isSavedState && "fill-red-500 text-red-500")} />
                </Button>
            </div>
        </div>
    </Card>
    )
}
