'use client';

import { useState, useEffect, useActionState } from 'react';
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
import { Heart, ShoppingCart, Star, Calendar, Info, MessageSquare, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tables } from '@/types/supabase';
import type { ReviewWithProfile } from './page';
import { formatDistanceToNow } from 'date-fns';
import { submitReview } from './actions';
import { addToCart } from '@/app/cart/actions';
import { toggleSaveProduct } from '@/app/saved/actions';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

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

function SubmitReviewButton({ userReview, rating }: { userReview: ReviewWithProfile | null, rating: number }) {
    const { pending } = useFormStatus();

    return (
        <Button type="submit" disabled={pending || rating === 0}>
            {pending ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {userReview ? 'Updating Review...' : 'Submitting Review...'}
                </>
            ) : (
                userReview ? 'Update Review' : 'Submit Review'
            )}
        </Button>
    );
}

function ReviewForm({ productId, userReview }: { productId: string, userReview: ReviewWithProfile | null }) {
    const { toast } = useToast();
    const initialState = { message: null, errors: {}, success: false };
    const [state, dispatch] = useActionState(submitReview, initialState);
    const [rating, setRating] = useState(userReview?.rating || 0);
    const [hoverRating, setHoverRating] = useState(0);

    useEffect(() => {
        if(state.success) {
            toast({ title: 'Success', description: state.message });
        } else if (state.message) {
            toast({ variant: 'destructive', title: 'Error', description: state.message });
        }
    }, [state, toast]);

    return (
        <form action={dispatch}>
             <input type="hidden" name="productId" value={productId} />
             <div className="grid gap-4">
                <div>
                    <Label htmlFor="rating" className="mb-2 block">Your Rating</Label>
                    <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                             <Star
                                key={star}
                                className={cn("cursor-pointer transition-colors", (hoverRating >= star || rating >= star) ? 'text-primary fill-primary' : 'text-gray-300')}
                                onClick={() => setRating(star)}
                                onMouseEnter={() => setHoverRating(star)}
                                onMouseLeave={() => setHoverRating(0)}
                            />
                        ))}
                    </div>
                    <input type="hidden" name="rating" value={rating} />
                    {state.errors?.rating && <p className="text-sm text-red-500 mt-1">{state.errors.rating[0]}</p>}
                </div>
                <div>
                    <Label htmlFor="comment">Your Review</Label>
                    <Textarea id="comment" name="comment" placeholder="Share your thoughts on the product..." defaultValue={userReview?.comment || ''} />
                </div>
                <SubmitReviewButton userReview={userReview} rating={rating} />
            </div>
        </form>
    )
}

export default function ProductView({ product, isSaved, reviews, averageRating, user, userReview }: ProductViewProps) {
    const [quantity, setQuantity] = useState(1);
    const pathname = usePathname();

    const isDiscountActive = product.discount_percentage && product.discount_percentage > 0 && product.discount_end_date && new Date(product.discount_end_date) > new Date();
    const discountedPrice = isDiscountActive
        ? product.price - (product.price * (product.discount_percentage! / 100))
        : product.price;

    const stockStatus = product.quantity === 0 
        ? <Badge variant="destructive">Out of Stock</Badge> 
        : product.quantity !== null && product.quantity <= 5
        ? <Badge variant="secondary" className="bg-red-100 text-red-700">Only {product.quantity} left!</Badge>
        : <Badge variant="secondary" className="bg-green-100 text-green-700">In Stock</Badge>


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
                    <h1 className="text-3xl lg:text-4xl font-bold">{product.name}</h1>
                     <div className="flex items-center gap-4">
                        <StarRating rating={averageRating} showText={false} />
                        <a href="#reviews" className="text-sm text-muted-foreground hover:underline">({reviews.length} reviews)</a>
                    </div>
                </div>

                <div className="flex items-baseline gap-2">
                     <span className="text-3xl font-bold">GHS {discountedPrice.toFixed(2)}</span>
                     {isDiscountActive && (
                        <span className="text-xl text-muted-foreground line-through">GHS {product.price.toFixed(2)}</span>
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
                     <form action={addToCart} className="flex items-center gap-4">
                        <input type="hidden" name="productId" value={product.id} />
                        <input type="hidden" name="pathname" value={pathname} />
                        {product.quantity === 0 ? (
                            <Button size="lg" disabled>Out of Stock</Button>
                        ) : (
                            <Button type="submit" size="lg">
                                <ShoppingCart className="mr-2 h-5 w-5" />
                                Add to Cart
                            </Button>
                        )}
                    </form>
                    {user ? (
                        <form action={toggleSaveProduct}>
                            <input type="hidden" name="productId" value={product.id} />
                            <input type="hidden" name="pathname" value={pathname} />
                            <Button type="submit" variant="outline" size="lg">
                                <Heart className={cn("mr-2 h-5 w-5", isSaved && "fill-red-500 text-red-500")} />
                                {isSaved ? 'Saved' : 'Save'}
                            </Button>
                        </form>
                    ) : (
                        <Button asChild variant="outline" size="lg">
                            <Link href="/login">
                                 <Heart className="mr-2 h-5 w-5" />
                                 Save
                            </Link>
                        </Button>
                    )}
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
                
                 <Separator />

                <div id="reviews" className="space-y-8">
                    <Card>
                         <CardHeader>
                            <CardTitle>Customer Reviews</CardTitle>
                            <CardDescription>See what others are saying about this product.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {user && (
                                <>
                                    <h3 className="font-semibold text-lg">{userReview ? 'Update Your Review' : 'Leave a Review'}</h3>
                                    <ReviewForm productId={product.id} userReview={userReview} />
                                    <Separator />
                                </>
                            )}
                            {!user && (
                                <Alert>
                                    <MessageSquare className="h-4 w-4" />
                                    <AlertDescription>
                                        <Link href="/login" className="font-semibold underline">Sign in</Link> to leave a review.
                                    </AlertDescription>
                                </Alert>
                            )}
                            
                             {reviews.length > 0 ? (
                                <div className="space-y-6">
                                {reviews.map(review => (
                                    <div key={review.id} className="flex gap-4">
                                        <Avatar>
                                            <AvatarImage src={review.profiles?.avatar_url || undefined} />
                                            <AvatarFallback>{review.profiles?.display_name?.charAt(0) || 'U'}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between">
                                                <span className="font-semibold">{review.profiles?.display_name || 'Anonymous'}</span>
                                                 <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}</span>
                                            </div>
                                            <StarRating rating={review.rating} size={16} showText={false} className="my-1" />
                                            <p className="text-sm text-muted-foreground">{review.comment}</p>
                                        </div>
                                    </div>
                                ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground text-center">No reviews yet.</p>
                            )}

                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
