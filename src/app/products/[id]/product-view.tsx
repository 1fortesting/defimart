'use client';

import { useState, useEffect, useTransition, useActionState, useMemo } from 'react';
import type { User } from '@supabase/supabase-js';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { StarRating } from '@/components/star-rating';
import { useToast } from '@/hooks/use-toast';
import { 
    Heart, 
    ShoppingCart, 
    Calendar, 
    Info, 
    Loader2, 
    Share2, 
    Copy, 
    Check, 
    MessageCircle, 
    Facebook, 
    Store, 
    ImageIcon, 
    Star, 
    Send,
    Zap,
    Truck,
    ShieldCheck
} from 'lucide-react';
import { cn, formatPrice } from '@/lib/utils';
import { Tables } from '@/types/supabase';
import type { ReviewWithProfile } from './page';
import { toggleSaveProduct } from '@/app/saved/actions';
import { addToCart } from '@/app/cart/actions';
import { submitReview } from './actions';
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
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';

interface ProductViewProps {
    product: Tables<'products'>;
    isSaved: boolean;
    reviews: ReviewWithProfile[];
    averageRating: number;
    user: User | null;
    userReview: ReviewWithProfile | null;
}

export default function ProductView({ product, isSaved, reviews, averageRating, user, userReview }: ProductViewProps) {
    const pathname = usePathname();
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();
    const [isCopied, setIsCopied] = useState(false);
    const [showShare, setShowShare] = useState(false);
    const [seller, setSeller] = useState<any>(null);
    const [userRating, setUserRating] = useState(userReview?.rating || 0);
    const [timeLeft, setTimeLeft] = useState<{ hours: string; minutes: string; seconds: string } | null>(null);

    const [reviewState, reviewAction, isReviewPending] = useActionState(submitReview, { success: false, message: '' });

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

    const isDiscountActive = useMemo(() => {
        return !!(product.discount_percentage && product.discount_percentage > 0 && product.discount_end_date && new Date(product.discount_end_date) > new Date());
    }, [product.discount_percentage, product.discount_end_date]);

    const discountedPrice = isDiscountActive
        ? product.price - (product.price * (product.discount_percentage! / 100))
        : product.price;

    useEffect(() => {
        if (!isDiscountActive || !product.discount_end_date) return;
        const timer = setInterval(() => {
            const now = new Date().getTime();
            const distance = new Date(product.discount_end_date!).getTime() - now;
            if (distance < 0) {
                setTimeLeft(null);
                clearInterval(timer);
                return;
            }
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);
            setTimeLeft({
                hours: hours.toString().padStart(2, '0'),
                minutes: minutes.toString().padStart(2, '0'),
                seconds: seconds.toString().padStart(2, '0')
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [isDiscountActive, product.discount_end_date]);

    const isShopOpen = () => {
        if (!seller) return true;
        if (!seller.is_open) return false;
        if (!seller.open_time || !seller.close_time) return seller.is_open;
        const now = new Date();
        const [openH, openM] = seller.open_time.split(':').map(Number);
        const [closeH, closeM] = seller.close_time.split(':').map(Number);
        const openDate = new Date(now);
        openDate.setHours(openH, openM, 0);
        const closeDate = new Date(now);
        closeDate.setHours(closeH, closeM, 0);
        return now >= openDate && now <= closeDate;
    };

    const isOpen = isShopOpen();

    const handleAddToCart = () => {
        if (!isOpen) {
            toast({ title: 'Shop Closed', description: 'This vendor is not currently accepting orders.', variant: 'destructive' });
            return;
        }
        toast({ title: 'Added to Cart', description: `${product.name} is in your bag!`, variant: 'success' });
        try {
            let cart = JSON.parse(localStorage.getItem('cart') || '[]');
            const idx = cart.findIndex((item: any) => item.product_id === product.id);
            if (idx > -1) cart[idx].quantity += 1;
            else cart.push({ id: `local-${product.id}-${Date.now()}`, user_id: user?.id, product_id: product.id, quantity: 1, created_at: new Date().toISOString(), products: { ...product } });
            localStorage.setItem('cart', JSON.stringify(cart));
            window.dispatchEvent(new Event('cart-updated'));
        } catch (e) {}
        if (user) {
            startTransition(async () => {
                const fd = new FormData();
                fd.append('productId', product.id);
                await addToCart(fd);
            });
        }
    };

    const handleCopyLink = () => {
        const url = `${window.location.origin}/products/${product.id}`;
        navigator.clipboard.writeText(url);
        setIsCopied(true);
        toast({ title: 'Link Copied' });
        setTimeout(() => setIsCopied(false), 2000);
    };

    const shareWhatsApp = () => window.open(`https://wa.me/?text=${encodeURIComponent(`Check this out on Defimart: ${product.name}\n${window.location.origin}/products/${product.id}`)}`);

    const hasImage = product.image_urls && product.image_urls.length > 0;
    const displayDescription = product.description?.replace(' (AI Enhanced)', '') || 'No additional details provided.';
    const stockPercentage = product.quantity ? Math.min(100, (product.quantity / 50) * 100) : 0;

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                
                {/* 1. Left Column: Media & Actions */}
                <div className="md:col-span-5 space-y-6">
                    <Card className="border-none shadow-sm rounded-xl bg-white overflow-hidden p-4">
                        <div className="relative aspect-square w-full flex items-center justify-center bg-white group">
                            {hasImage ? (
                                <Image
                                    src={product.image_urls![0]}
                                    alt={product.name}
                                    fill
                                    className="object-contain p-4 transition-transform duration-500 group-hover:scale-105"
                                    priority
                                />
                            ) : (
                                <ImageIcon className="w-20 h-20 text-muted/20" />
                            )}
                        </div>
                    </Card>

                    {/* Social Share Section (Jumia Style) */}
                    <div className="bg-white rounded-xl p-4 shadow-sm space-y-3">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Share this product</p>
                        <div className="flex gap-2">
                             <Button onClick={shareWhatsApp} variant="ghost" size="icon" className="h-10 w-10 rounded-full bg-green-50 text-green-600 hover:bg-green-600 hover:text-white transition-all">
                                <MessageCircle className="h-5 w-5" />
                            </Button>
                            <Button onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${window.location.href}`)} variant="ghost" size="icon" className="h-10 w-10 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all">
                                <Facebook className="h-5 w-5" />
                            </Button>
                            <Button onClick={handleCopyLink} variant="ghost" size="icon" className="h-10 w-10 rounded-full bg-muted/50 transition-all">
                                {isCopied ? <Check className="h-5 w-5 text-primary" /> : <Copy className="h-5 w-5" />}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* 2. Middle/Right Column: Main Info */}
                <div className="md:col-span-7 flex flex-col gap-4">
                    <Card className="border-none shadow-sm rounded-xl bg-white p-6 space-y-4">
                        <div className="space-y-1">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Badge className="bg-blue-600 text-[10px] font-black uppercase tracking-tighter rounded-sm h-5">Official Store</Badge>
                                    {product.is_featured && <Badge className="bg-orange-500 text-[10px] font-black uppercase tracking-tighter rounded-sm h-5">Super Deal</Badge>}
                                </div>
                                {user && (
                                    <form action={async (fd) => await toggleSaveProduct(fd)}>
                                        <input type="hidden" name="productId" value={product.id} />
                                        <input type="hidden" name="pathname" value={pathname} />
                                        <button type="submit" className="text-primary hover:scale-110 transition-transform">
                                            <Heart className={cn("h-6 w-6", isSaved && "fill-primary")} />
                                        </button>
                                    </form>
                                )}
                            </div>
                            <h1 className="text-xl md:text-2xl font-medium text-foreground leading-tight">{product.name}</h1>
                            <p className="text-xs text-muted-foreground">Brand: <span className="text-primary font-medium hover:underline cursor-pointer">{product.brand || 'Generic'}</span></p>
                        </div>

                        <Separator className="opacity-50" />

                        {/* Flash Sale Banner (Jumia Style) */}
                        {isDiscountActive && (
                            <div className="bg-red-600 rounded-md overflow-hidden">
                                <div className="flex items-center justify-between px-3 py-2 text-white">
                                    <div className="flex items-center gap-2">
                                        <Zap className="h-4 w-4 fill-current" />
                                        <span className="text-xs font-bold uppercase tracking-wider">Flash Sales</span>
                                    </div>
                                    {timeLeft && (
                                        <div className="flex items-center gap-1.5 text-xs font-bold font-mono uppercase">
                                            <span className="opacity-80">Time Left:</span>
                                            <span>{timeLeft.hours}h : {timeLeft.minutes}m : {timeLeft.seconds}s</span>
                                        </div>
                                    )}
                                </div>
                                <div className="bg-white mx-[1px] mb-[1px] p-4 space-y-3">
                                    <div className="flex items-center gap-4">
                                        <span className="text-3xl font-black text-foreground">GHS {formatPrice(discountedPrice).split(' ')[1]}</span>
                                        <div className="flex flex-col">
                                            <span className="text-sm text-muted-foreground line-through">GHS {formatPrice(product.price).split(' ')[1]}</span>
                                            <Badge variant="destructive" className="w-fit h-5 text-[10px] font-black rounded-sm">-{product.discount_percentage}%</Badge>
                                        </div>
                                    </div>
                                    {product.quantity !== null && product.quantity > 0 && (
                                        <div className="space-y-1.5">
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase">{product.quantity} items left</p>
                                            <Progress value={stockPercentage} className="h-1.5 bg-orange-100" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Standard Price Display if no flash sale */}
                        {!isDiscountActive && (
                            <div className="py-2">
                                <p className="text-3xl font-black text-foreground">GHS {formatPrice(product.price).split(' ')[1]}</p>
                                <p className="text-[10px] text-emerald-600 font-bold mt-1 uppercase tracking-widest">In Stock</p>
                            </div>
                        )}

                        <div className="space-y-1">
                            <StarRating rating={averageRating} size={14} showText={false} />
                            <p className="text-[10px] text-muted-foreground font-medium uppercase">({reviews.length} Verified Ratings)</p>
                        </div>

                        <Separator className="opacity-50" />

                        <div className="pt-2">
                            <Button 
                                onClick={handleAddToCart}
                                disabled={isPending || product.quantity === 0 || !isOpen}
                                className="w-full h-14 bg-primary hover:bg-primary/90 text-white rounded-md font-bold uppercase tracking-wider text-base shadow-lg shadow-primary/10"
                            >
                                <ShoppingCart className="mr-2 h-5 w-5" />
                                {product.quantity === 0 ? 'Out of Stock' : !isOpen ? 'Shop Closed' : 'Add to Cart'}
                            </Button>
                        </div>
                    </Card>

                    {/* Promotions & Details (Jumia Style) */}
                    <Card className="border-none shadow-sm rounded-xl bg-white p-6 space-y-4">
                        <h3 className="text-xs font-black uppercase tracking-[2px] text-muted-foreground">Promotions</h3>
                        <div className="space-y-4">
                            <div className="flex gap-4">
                                <div className="bg-orange-100 p-2 rounded-lg h-fit">
                                    <Truck className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-primary hover:underline cursor-pointer">Free Delivery on Campus</p>
                                    <p className="text-xs text-muted-foreground">Pick up your order at any of our designated campus collection points for GHS 0.</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="bg-blue-100 p-2 rounded-lg h-fit">
                                    <ShieldCheck className="h-5 w-5 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-blue-600 hover:underline cursor-pointer">Pay on Collection</p>
                                    <p className="text-xs text-muted-foreground">No upfront digital transfer required. Inspect your item and pay at the collection desk.</p>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Product Description */}
                    <Card className="border-none shadow-sm rounded-xl bg-white p-6">
                         <h3 className="text-xs font-black uppercase tracking-[2px] text-muted-foreground mb-4">Product Details</h3>
                         <div className="text-sm leading-relaxed text-muted-foreground font-medium whitespace-pre-wrap">
                            {displayDescription}
                         </div>
                    </Card>
                </div>
            </div>

            {/* 3. Reviews Section */}
            <section id="reviews" className="bg-white rounded-xl p-6 md:p-8 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                    <div>
                        <h2 className="text-xl font-bold uppercase tracking-tight">Verified Customer Feedback</h2>
                        <p className="text-xs text-muted-foreground font-medium mt-1">Check out what the campus community is saying about this product.</p>
                    </div>
                    <div className="flex items-center gap-4 bg-muted/30 px-6 py-3 rounded-xl">
                        <div className="text-center">
                            <p className="text-3xl font-black text-primary">{averageRating.toFixed(1)}/5</p>
                            <StarRating rating={averageRating} size={12} showText={false} className="justify-center mt-1" />
                        </div>
                        <div className="h-10 w-[1px] bg-border mx-2" />
                        <p className="text-xs font-bold text-muted-foreground leading-tight">{reviews.length}<br/>Ratings</p>
                    </div>
                </div>

                <div className="grid md:grid-cols-12 gap-8">
                    {/* Add Review */}
                    <div className="md:col-span-4">
                        <div className="sticky top-[200px] space-y-4">
                             <h4 className="text-sm font-bold uppercase tracking-wider">Leave a Review</h4>
                             {user ? (
                                <form action={reviewAction} className="space-y-4">
                                    <input type="hidden" name="productId" value={product.id} />
                                    <input type="hidden" name="rating" value={userRating} />
                                    <div className="flex justify-center gap-1.5 py-2">
                                        {[1, 2, 3, 4, 5].map((s) => (
                                            <button key={s} type="button" onClick={() => setUserRating(s)} className="transition-transform active:scale-90">
                                                <Star className={cn("h-7 w-7 transition-colors", s <= userRating ? "fill-primary text-primary" : "text-muted opacity-30")} />
                                            </button>
                                        ))}
                                    </div>
                                    <Textarea 
                                        name="comment" 
                                        placeholder="What did you like or dislike?" 
                                        className="rounded-lg bg-muted/20 border-none min-h-[120px]" 
                                        defaultValue={userReview?.comment || ''}
                                    />
                                    <Button type="submit" className="w-full font-bold uppercase text-xs tracking-widest h-11" disabled={isReviewPending || userRating === 0}>
                                        {isReviewPending ? <Loader2 className="animate-spin h-4 w-4" /> : 'Post Feedback'}
                                    </Button>
                                </form>
                             ) : (
                                <div className="p-6 text-center border-2 border-dashed rounded-xl bg-muted/5">
                                    <p className="text-xs font-bold text-muted-foreground mb-4">You must be signed in to post a review.</p>
                                    <Button asChild variant="outline" className="text-xs font-bold uppercase h-9"><Link href="/login">Login Now</Link></Button>
                                </div>
                             )}
                        </div>
                    </div>

                    {/* Review List */}
                    <div className="md:col-span-8 space-y-6">
                         {reviews.length > 0 ? (
                            reviews.map((rev) => (
                                <div key={rev.id} className="border-b pb-6 last:border-none">
                                    <div className="flex justify-between items-start mb-2">
                                        <StarRating rating={rev.rating} size={12} showText={false} />
                                        <span className="text-[10px] font-bold text-muted-foreground">{new Date(rev.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <p className="text-sm font-bold text-foreground mb-1">{rev.profiles?.display_name || 'Verified Customer'}</p>
                                    <p className="text-sm text-muted-foreground leading-relaxed italic">&quot;{rev.comment || "Great product, highly recommend!"}&quot;</p>
                                    <div className="flex items-center gap-2 mt-3 text-[10px] text-emerald-600 font-bold uppercase tracking-widest">
                                        <Check className="h-3 w-3" /> Verified Purchase
                                    </div>
                                </div>
                            ))
                         ) : (
                            <div className="py-20 text-center text-muted-foreground">
                                <MessageCircle className="h-10 w-10 mx-auto mb-3 opacity-20" />
                                <p className="text-xs font-bold uppercase tracking-widest">No reviews yet for this product.</p>
                            </div>
                         )}
                    </div>
                </div>
            </section>
        </div>
    )
}
