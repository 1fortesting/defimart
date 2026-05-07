'use client';

import { useState, useEffect, useTransition, useActionState } from 'react';
import type { User } from '@supabase/supabase-js';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { StarRating } from '@/components/star-rating';
import { useToast } from '@/hooks/use-toast';
import { Heart, ShoppingCart, Calendar, Info, Loader2, Share2, Copy, Check, MessageCircle, Facebook, Store, ImageIcon, Star, Send } from 'lucide-react';
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
    const currentDay = today.getDay();
    let pickupDate = new Date(today);
    let pickupDayString = '';

    if (currentDay >= 0 && currentDay <= 3) {
      const daysToAdd = (3 - currentDay + 7) % 7;
      pickupDate.setDate(today.getDate() + daysToAdd);
      pickupDayString = 'Wednesday';
    } else {
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
    const [userRating, setUserRating] = useState(userReview?.rating || 0);

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

    const isDiscountActive = product.discount_percentage && product.discount_percentage > 0 && product.discount_end_date && new Date(product.discount_end_date) > new Date();
    const discountedPrice = isDiscountActive
        ? product.price - (product.price * (product.discount_percentage! / 100))
        : product.price;

    const isShopOpen = () => {
        // Admin products (Generic Seller) are always open
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
            toast({
                title: 'Shop Closed',
                description: `This vendor is not accepting orders right now.`,
                variant: 'destructive'
            });
            return;
        }

        toast({ title: 'Added to Cart', description: `${product.name} has been added.`, variant: 'success' });
        
        try {
            let cart = JSON.parse(localStorage.getItem('cart') || '[]');
            const existingItemIndex = cart.findIndex((item: any) => item.product_id === product.id);
            if (existingItemIndex > -1) {
                cart[existingItemIndex].quantity += 1;
            } else {
                cart.push({
                    id: `local-${product.id}-${Date.now()}`,
                    user_id: user?.id,
                    product_id: product.id,
                    quantity: 1,
                    created_at: new Date().toISOString(),
                    products: { ...product }
                });
            }
            localStorage.setItem('cart', JSON.stringify(cart));
            window.dispatchEvent(new Event('cart-updated'));
        } catch (e) { console.error(e); }
        
        if (user) {
            startTransition(async () => {
                const formData = new FormData();
                formData.append('productId', product.id);
                addToCart(formData);
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
    const hasImage = product.image_urls && product.image_urls.length > 0;

    return (
        <div className="space-y-12">
            <div className="grid md:grid-cols-2 gap-8 lg:gap-16 items-start">
                {/* Visual Section */}
                <div className="space-y-4">
                    <Card className="overflow-hidden bg-background border-none shadow-2xl rounded-3xl flex items-center justify-center aspect-square relative group">
                        {/* Glowing Accent Aura */}
                        <div className="absolute -top-12 -left-12 w-64 h-64 bg-blue-500/5 rounded-full blur-[100px] pointer-events-none group-hover:bg-blue-500/10 transition-all duration-700" />
                        <div className="absolute -bottom-12 -right-12 w-64 h-64 bg-primary/5 rounded-full blur-[100px] pointer-events-none group-hover:bg-primary/10 transition-all duration-700" />
                        
                        {hasImage ? (
                            <Image
                                src={product.image_urls![0]}
                                alt={product.name}
                                width={800}
                                height={800}
                                className="object-contain w-full h-full p-6 transition-transform duration-700 group-hover:scale-105"
                                priority
                            />
                        ) : (
                            <div className="flex flex-col items-center justify-center text-muted-foreground/20">
                                <ImageIcon className="h-32 w-32 mb-4" />
                                <span className="text-sm font-black uppercase tracking-widest">No Visuals Available</span>
                            </div>
                        )}
                        
                        {isDiscountActive && (
                            <Badge variant="destructive" className="absolute top-6 left-6 h-10 px-4 text-sm font-black uppercase tracking-widest shadow-xl animate-pulse">
                                SAVE {product.discount_percentage}%
                            </Badge>
                        )}
                    </Card>
                </div>

                {/* Information Section */}
                <div className="flex flex-col gap-6 md:pt-4">
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-primary font-black text-xs uppercase tracking-[2px]">
                                <Store className="h-4 w-4" />
                                <span>{seller?.shop_name || 'Generic Seller'}</span>
                                <Badge 
                                    className={cn(
                                        "ml-2 font-black text-[10px] tracking-tighter uppercase px-2 py-0.5",
                                        isOpen ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-destructive/10 text-destructive border-destructive/20"
                                    )}
                                    variant="outline"
                                >
                                    {isOpen ? 'Open Now' : 'Closed'}
                                </Badge>
                            </div>
                            
                            <div className="flex gap-2">
                                <Sheet open={showShare} onOpenChange={setShowShare}>
                                    <SheetTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full bg-muted/50 hover:bg-primary/10 hover:text-primary transition-all">
                                            <Share2 className="h-5 w-5" />
                                        </Button>
                                    </SheetTrigger>
                                    <SheetContent side="bottom" className="rounded-t-[40px] border-t-0 p-0 overflow-hidden bg-background shadow-2xl">
                                        <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mt-4 mb-2" />
                                        <SheetHeader className="px-8 pt-6">
                                            <SheetTitle className="text-xl font-black uppercase tracking-widest italic">Share Product</SheetTitle>
                                        </SheetHeader>
                                        <div className="p-8 grid grid-cols-3 gap-6">
                                            <button onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`)} className="flex flex-col items-center gap-3 group">
                                                <div className="h-16 w-16 bg-green-50 text-green-600 rounded-3xl flex items-center justify-center shadow-sm group-hover:bg-green-600 group-hover:text-white transition-all duration-300">
                                                    <MessageCircle className="h-8 w-8" />
                                                </div>
                                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-foreground">WhatsApp</span>
                                            </button>
                                            <button onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(productUrl)}`)} className="flex flex-col items-center gap-3 group">
                                                <div className="h-16 w-16 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                                                    <Facebook className="h-8 w-8" />
                                                </div>
                                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-foreground">Facebook</span>
                                            </button>
                                            <button onClick={handleCopyLink} className="flex flex-col items-center gap-3 group">
                                                <div className="h-16 w-16 bg-muted/50 text-foreground rounded-3xl flex items-center justify-center shadow-sm group-hover:bg-primary group-hover:text-white transition-all duration-300">
                                                    {isCopied ? <Check className="h-8 w-8" /> : <Copy className="h-8 w-8" />}
                                                </div>
                                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-foreground">{isCopied ? 'Copied' : 'Link'}</span>
                                            </button>
                                        </div>
                                    </SheetContent>
                                </Sheet>

                                {user ? (
                                    <form action={async (formData) => { await toggleSaveProduct(formData); }}>
                                        <input type="hidden" name="productId" value={product.id} />
                                        <input type="hidden" name="pathname" value={pathname} />
                                        <Button type="submit" variant="ghost" size="icon" className="h-10 w-10 rounded-full bg-muted/50 hover:bg-red-50 hover:text-red-500 transition-all">
                                            <Heart className={cn("h-5 w-5", isSaved && "fill-red-500 text-red-500")} />
                                        </Button>
                                    </form>
                                ) : (
                                    <Button asChild variant="ghost" size="icon" className="h-10 w-10 rounded-full bg-muted/50">
                                        <Link href="/login"><Heart className="h-5 w-5" /></Link>
                                    </Button>
                                )}
                            </div>
                        </div>
                        <h1 className="text-3xl lg:text-5xl font-black tracking-tighter italic uppercase text-foreground leading-none">{product.name}</h1>
                        <div className="flex items-center gap-3">
                            <StarRating rating={averageRating} size={16} showText={false} />
                            <a href="#reviews" className="text-xs font-bold text-muted-foreground hover:text-primary transition-colors underline underline-offset-4 decoration-primary/30 uppercase tracking-widest">
                                {reviews.length} Verified Reviews
                            </a>
                        </div>
                    </div>

                    <div className="bg-muted/30 p-6 rounded-[32px] space-y-4">
                        <div className="flex items-baseline gap-3">
                             <span className="text-4xl font-black text-foreground">GHS {formatPrice(discountedPrice).split(' ')[1]}</span>
                             {isDiscountActive && (
                                <span className="text-lg text-muted-foreground line-through opacity-50">GHS {formatPrice(product.price).split(' ')[1]}</span>
                             )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                            {product.quantity === 0 ? (
                                <Badge variant="destructive" className="font-black uppercase text-[10px] tracking-widest">Out of Stock</Badge>
                            ) : product.quantity !== null && product.quantity <= 5 ? (
                                <Badge className="bg-orange-100 text-orange-600 border-orange-200 font-black uppercase text-[10px] tracking-widest">Limited Supply: {product.quantity} Left</Badge>
                            ) : (
                                <Badge className="bg-emerald-100 text-emerald-600 border-emerald-200 font-black uppercase text-[10px] tracking-widest">In Inventory</Badge>
                            )}
                        </div>
                        
                        <Button 
                            onClick={handleAddToCart} 
                            size="lg" 
                            disabled={isPending || product.quantity === 0 || !isOpen} 
                            className="w-full h-16 text-lg font-black uppercase tracking-[4px] rounded-2xl shadow-2xl shadow-primary/20 hover:shadow-primary/40 transition-all italic"
                        >
                            {product.quantity === 0 ? 'Unavailable' : !isOpen ? 'Shop Closed' : <><ShoppingCart className="mr-3 h-6 w-6 stroke-[3px]" /> Grab Now</>}
                        </Button>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground border-b pb-2">Description</h3>
                        <p className="text-base text-muted-foreground leading-relaxed font-medium">
                            {product.description || 'No detailed specifications provided for this asset.'}
                        </p>
                    </div>

                    <div className="grid gap-4">
                        <Alert className="border-none bg-blue-500/5 rounded-2xl p-4 flex items-start gap-4">
                            <Calendar className="h-6 w-6 text-blue-500 mt-1" />
                            <div className="space-y-1">
                                <AlertTitle className="text-xs font-black uppercase tracking-widest text-blue-600">Collection Window</AlertTitle>
                                <AlertDescription className="text-sm font-bold text-blue-700/80">{getNextPickupInfo()}</AlertDescription>
                            </div>
                        </Alert>
                        <Alert className="border-none bg-emerald-500/5 rounded-2xl p-4 flex items-start gap-4">
                            <Info className="h-6 w-6 text-emerald-500 mt-1" />
                            <div className="space-y-1">
                                <AlertTitle className="text-xs font-black uppercase tracking-widest text-emerald-600">Pay on Delivery</AlertTitle>
                                <AlertDescription className="text-sm font-bold text-emerald-700/80">No upfront digital transfer required. Complete payment at the collection desk.</AlertDescription>
                            </div>
                        </Alert>
                    </div>
                </div>
            </div>

            <Separator className="opacity-50" />

            {/* Reviews Section */}
            <section id="reviews" className="max-w-4xl mx-auto w-full space-y-10">
                <div className="text-center space-y-2">
                    <h2 className="text-3xl font-black uppercase tracking-tighter italic">Community Feedback</h2>
                    <p className="text-muted-foreground font-medium">Verified purchases and experiences from campus.</p>
                </div>

                <div className="grid md:grid-cols-[1fr_1.5fr] gap-12">
                    {/* Add Review Form */}
                    <Card className="border-none shadow-xl bg-background rounded-3xl h-fit overflow-hidden">
                        <div className="bg-primary p-6 text-primary-foreground">
                            <CardTitle className="text-xl font-black uppercase tracking-widest">Rate Item</CardTitle>
                            <p className="text-xs opacity-80 mt-1 font-bold">Your feedback helps the whole campus.</p>
                        </div>
                        <CardContent className="p-6">
                            {user ? (
                                <form action={reviewAction} className="space-y-6">
                                    <input type="hidden" name="productId" value={product.id} />
                                    <input type="hidden" name="rating" value={userRating} />
                                    
                                    <div className="space-y-3 text-center">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Select Rating</Label>
                                        <div className="flex justify-center gap-2">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <button
                                                    key={star}
                                                    type="button"
                                                    onClick={() => setUserRating(star)}
                                                    className="transition-transform active:scale-90"
                                                >
                                                    <Star className={cn(
                                                        "h-8 w-8 transition-colors",
                                                        star <= userRating ? "fill-primary text-primary" : "text-muted opacity-30"
                                                    )} />
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="comment" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Share Experience</Label>
                                        <Textarea 
                                            id="comment" 
                                            name="comment" 
                                            placeholder="Tell us what you think..." 
                                            className="min-h-[100px] rounded-2xl border-2 bg-muted/20 resize-none focus-visible:ring-primary/20"
                                            defaultValue={userReview?.comment || ''}
                                        />
                                    </div>

                                    <Button 
                                        type="submit" 
                                        className="w-full h-12 font-black uppercase tracking-widest rounded-xl"
                                        disabled={isReviewPending || userRating === 0}
                                    >
                                        {isReviewPending ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Send className="mr-2 h-4 w-4" />}
                                        Post Review
                                    </Button>
                                </form>
                            ) : (
                                <div className="text-center py-8 space-y-4">
                                    <div className="p-4 bg-muted rounded-full w-16 h-16 flex items-center justify-center mx-auto">
                                        <Info className="h-8 w-8 text-muted-foreground opacity-50" />
                                    </div>
                                    <p className="text-sm font-bold text-muted-foreground">Login to leave a review.</p>
                                    <Button asChild variant="outline" className="rounded-xl font-black uppercase tracking-widest text-xs h-10 border-2">
                                        <Link href="/login">Authenticate</Link>
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Reviews List */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b pb-4">
                            <h3 className="font-black uppercase tracking-widest text-sm">Recent Activity</h3>
                            <span className="text-[10px] font-black bg-muted px-2 py-1 rounded-md">{reviews.length} TOTAL</span>
                        </div>
                        
                        <div className="space-y-8">
                            {reviews.length > 0 ? (
                                reviews.map((review) => (
                                    <div key={review.id} className="flex gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                        <Avatar className="h-12 w-12 border-2 border-primary/10 shadow-sm shrink-0">
                                            <AvatarImage src={review.profiles?.avatar_url || undefined} />
                                            <AvatarFallback className="bg-primary/5 text-primary font-black text-sm uppercase">
                                                {review.profiles?.display_name?.charAt(0) || 'U'}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 space-y-1.5">
                                            <div className="flex items-center justify-between">
                                                <p className="font-black text-sm italic">{review.profiles?.display_name || 'Verified User'}</p>
                                                <span className="text-[9px] font-bold text-muted-foreground uppercase">{new Date(review.created_at).toLocaleDateString()}</span>
                                            </div>
                                            <StarRating rating={review.rating} size={12} showText={false} />
                                            <p className="text-sm text-muted-foreground leading-relaxed font-medium bg-muted/10 p-3 rounded-2xl border-l-4 border-primary/20">
                                                {review.comment || "Customer left a rating without a detailed comment."}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="py-20 text-center space-y-4 bg-muted/5 rounded-[40px] border-2 border-dashed border-muted-foreground/10">
                                    <MessageCircle className="h-12 w-12 text-muted-foreground/10 mx-auto" />
                                    <p className="text-xs font-black uppercase tracking-[4px] text-muted-foreground opacity-30">Silence is rare. Be first.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>
        </div>
    )
}
