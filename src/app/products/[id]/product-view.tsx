'use client';

import { useState, useEffect, useActionState, useTransition } from 'react';
import { useFormStatus } from 'react-dom';
import type { User } from '@supabase/supabase-js';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { StarRating } from '@/components/star-rating';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Heart, ShoppingCart, Star, Calendar, Info, MessageSquare, Loader2, Share2, Copy, Check, MessageCircle, Facebook, Store } from 'lucide-react';
import { cn, formatPrice } from '@/lib/utils';
import { Tables } from '@/types/supabase';
import type { ReviewWithProfile } from './page';
import { formatDistanceToNow } from 'date-fns';
import { submitReview } from './actions';
import { addToCart } from '@/app/cart/actions';
import { toggleSaveProduct } from '@/app/saved/actions';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface ProductViewProps {
    product: Tables<'products'>;
    isSaved: boolean;
    reviews: ReviewWithProfile[];
    averageRating: number;
    user: User | null;
    userReview: ReviewWithProfile | null;
}

function getNextPickupInfo() {
    const today = new Date();
    const currentDay = today.getDay(); // 0 = Sunday, 6 = Saturday
    let pickupDate = new Date(today);
    let pickupDayString = '';

    // Logic: Pickup on Wed for orders Sun-Wed, pickup on Sat for orders Thu-Sat.
    if (currentDay >= 0 && currentDay <= 3) { // Sunday, Monday, Tuesday, Wednesday
      const daysToAdd = (3 - currentDay + 7) % 7;
      pickupDate.setDate(today.getDate() + daysToAdd);
      pickupDayString = 'Wednesday';
    } else { // Thursday, Friday, Saturday
      const daysToAdd = (6 - currentDay + 7) % 7;
      pickupDate.setDate(today.getDate() + daysToAdd);
      pickupDayString = 'Saturday';
    }
    
    const formattedDate = pickupDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });

    return `Order now for pickup on ${pickupDayString}, ${formattedDate}.`;
}

export default function ProductView({ product, isSaved, reviews, averageRating, user, userReview }: ProductViewProps) {
    const pathname = usePathname();
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();
    const [isCopied, setIsCopied] = useState(false);
    const [showShare, setShowShare] = useState(false);
    const [seller, setSeller] = useState<any>(null);

    useEffect(() => {
        const fetchSeller = async () => {
            const supabase = createClient();
            const { data } = await supabase
                .from('sellers' as any)
                .select('*')
                .eq('user_id', product.seller_id)
                .maybeSingle();
            setSeller(data);
        };
        fetchSeller();
    }, [product.seller_id]);

    const isDiscountActive = product.discount_percentage && product.discount_percentage > 0 && product.discount_end_date && new Date(product.discount_end_date) > new Date();
    const discountedPrice = isDiscountActive
        ? product.price - (product.price * (product.discount_percentage! / 100))
        : product.price;

    const stockStatus = product.quantity === 0 
        ? <Badge variant="destructive">Out of Stock</Badge> 
        : product.quantity !== null && product.quantity <= 5
        ? <Badge variant="secondary" className="bg-red-100 text-red-700">Only {product.quantity} left!</Badge>
        : <Badge variant="secondary" className="bg-green-100 text-green-700">In Stock</Badge>

    const handleAddToCart = () => {
        if (seller && !seller.is_open) {
            toast({
                title: 'Shop Closed',
                description: `This vendor (${seller.shop_name}) is not accepting orders right now.`,
                variant: 'destructive'
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
                await addToCart(formData);
            });
        }
    };

    const handleCopyLink = () => {
        const url = typeof window !== 'undefined' ? `${window.location.origin}/products/${product.id}` : '';
        navigator.clipboard.writeText(url);
        setIsCopied(true);
        toast({ title: 'Link Copied', description: 'Product link copied to clipboard!' });
        setTimeout(() => setIsCopied(false), 2000);
    };

    const productUrl = typeof window !== 'undefined' ? `${window.location.origin}/products/${product.id}` : '';
    const shareText = `Check out ${product.name} on Defimart! GHS ${formatPrice(discountedPrice)}\n\n${productUrl}`;
    
    return (
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
            <div>
                 <Card className="overflow-hidden">
                    <Image
                        src={product.image_urls?.[0] || 'https://picsum.photos/seed/1/600/600'}
                        alt={product.name}
                        width={600}
                        height={600}
                        className="object-cover w-full aspect-square"
                    />
                 </Card>
            </div>
            <div className="space-y-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-primary font-semibold text-sm">
                        <Store className="h-4 w-4" />
                        <span>{seller?.shop_name || 'Generic Seller'}</span>
                        {!seller?.is_open && (
                            <Badge variant="destructive" className="ml-2 py-0 h-5">Closed</Badge>
                        )}
                    </div>
                    <h1 className="text-3xl lg:text-4xl font-bold">{product.name}</h1>
                     <div className="flex items-center gap-4">
                        <StarRating rating={averageRating} showText={false} />
                        <a href="#reviews" className="text-sm text-muted-foreground hover:underline">({reviews.length} reviews)</a>
                    </div>
                </div>

                <div className="flex items-baseline gap-2">
                     <span className="text-3xl font-bold">GHS {formatPrice(discountedPrice)}</span>
                     {isDiscountActive && (
                        <span className="text-xl text-muted-foreground line-through">GHS {formatPrice(product.price)}</span>
                     )}
                     {isDiscountActive && (
                         <Badge variant="destructive">-{product.discount_percentage}%</Badge>
                     )}
                </div>

                <div>
                    {stockStatus}
                </div>

                <p className="text-muted-foreground">{product.description || 'No description available.'}</p>
                
                <Separator />
                
                <div className="space-y-4">
                    <div className="flex items-center gap-4">
                        {product.quantity === 0 || (seller && !seller.is_open) ? (
                            <Button size="lg" disabled className="w-full md:w-auto">
                                {product.quantity === 0 ? 'Out of Stock' : 'Shop Closed'}
                            </Button>
                        ) : (
                            <Button onClick={handleAddToCart} size="lg" disabled={isPending} className="w-full md:w-auto">
                                <ShoppingCart className="mr-2 h-5 w-5" />
                                Add to Cart
                            </Button>
                        )}
                        
                        <div className="flex gap-2">
                            <Sheet open={showShare} onOpenChange={setShowShare}>
                                <SheetTrigger asChild>
                                    <Button variant="outline" size="lg" className="h-11 w-11 rounded-full p-0">
                                        <Share2 className="h-5 w-5 text-muted-foreground" />
                                    </Button>
                                </SheetTrigger>
                                <SheetContent side="bottom" className="rounded-t-3xl">
                                    <SheetHeader>
                                        <SheetTitle>Share with friends</SheetTitle>
                                    </SheetHeader>
                                    <div className="p-6 grid grid-cols-3 gap-4">
                                        <button onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`)} className="flex flex-col items-center gap-2">
                                            <div className="h-12 w-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                                                <MessageCircle className="h-6 w-6" />
                                            </div>
                                            <span className="text-xs font-medium">WhatsApp</span>
                                        </button>
                                        <button onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(productUrl)}`)} className="flex flex-col items-center gap-2">
                                            <div className="h-12 w-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                                                <Facebook className="h-6 w-6" />
                                            </div>
                                            <span className="text-xs font-medium">Facebook</span>
                                        </button>
                                        <button onClick={handleCopyLink} className="flex flex-col items-center gap-2">
                                            <div className="h-12 w-12 bg-muted text-foreground rounded-full flex items-center justify-center">
                                                {isCopied ? <Check className="h-6 w-6 text-green-500" /> : <Copy className="h-6 w-6" />}
                                            </div>
                                            <span className="text-xs font-medium">{isCopied ? 'Copied!' : 'Copy Link'}</span>
                                        </button>
                                    </div>
                                </SheetContent>
                            </Sheet>

                            {user ? (
                                <form action={async (formData) => { await toggleSaveProduct(formData); }}>
                                    <input type="hidden" name="productId" value={product.id} />
                                    <input type="hidden" name="pathname" value={pathname} />
                                    <Button type="submit" variant="outline" size="lg" className="h-11 w-11 rounded-full p-0">
                                        <Heart className={cn("h-5 w-5", isSaved && "fill-red-500 text-red-500")} />
                                    </Button>
                                </form>
                            ) : (
                                <Button asChild variant="outline" size="lg" className="h-11 w-11 rounded-full p-0">
                                    <Link href="/login">
                                         <Heart className="h-5 w-5" />
                                    </Link>
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                <Separator />

                <div className="grid gap-4">
                    <Alert>
                        <Calendar className="h-4 w-4" />
                        <AlertTitle>Pickup Information</AlertTitle>
                        <AlertDescription>{getNextPickupInfo()}</AlertDescription>
                    </Alert>
                    <Alert variant="default">
                        <Info className="h-4 w-4" />
                        <AlertTitle>Payment on Pickup</AlertTitle>
                        <AlertDescription>
                            No online payment is required. You will pay in person when you collect your order.
                        </AlertDescription>
                    </Alert>
                </div>
            </div>
        </div>
    )
}
