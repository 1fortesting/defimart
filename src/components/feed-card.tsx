'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Heart, MessageCircle, Share2, MoreHorizontal, Bookmark, Send, Trash2, ShoppingBag, ArrowRight, Images as ImagesIcon } from 'lucide-react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { toggleLike, addComment, toggleSave, deleteComment } from '@/app/feeds/actions';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";

interface FeedCardProps {
    feed: any;
    currentUser: any;
    initialLikes: number;
    isLikedInitial: boolean;
    isSavedInitial: boolean;
    commentsInitial: any[];
    onUnsave?: (feedId: string) => void;
}

export function FeedCard({ feed, currentUser, initialLikes, isLikedInitial, isSavedInitial, commentsInitial, onUnsave }: FeedCardProps) {
    const { toast } = useToast();
    const [isLiked, setIsLiked] = useState(isLikedInitial);
    const [likeCount, setLikeCount] = useState(initialLikes);
    const [isSaved, setIsSaved] = useState(isSavedInitial);
    const [showComments, setShowComments] = useState(false);
    const [comments, setComments] = useState(commentsInitial);
    const [newComment, setNewComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Carousel state
    const [api, setApi] = useState<CarouselApi>();
    const [current, setCurrent] = useState(0);
    const [count, setCount] = useState(0);

    useEffect(() => {
        if (!api) return;
        setCount(api.scrollSnapList().length);
        setCurrent(api.selectedScrollSnap() + 1);
        api.on("select", () => {
            setCurrent(api.selectedScrollSnap() + 1);
        });
    }, [api]);

    // Combine images: Product image first if tagged, then uploaded images
    // Robust fallback for both image_url and image_urls
    const productImg = feed.products?.image_urls?.[0] || feed.products?.image_url;
    const feedImages = Array.isArray(feed.image_urls) && feed.image_urls.length > 0 
        ? feed.image_urls 
        : (feed.image_url ? [feed.image_url] : []);

    const allImages = [
        ...(productImg ? [productImg] : []),
        ...feedImages
    ];

    const handleLike = async () => {
        if (!currentUser) {
            toast({ title: 'Sign In', description: 'Please sign in to like posts.' });
            return;
        }
        setIsLiked(!isLiked);
        setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
        try {
            await toggleLike(feed.id);
        } catch (error) {
            setIsLiked(!isLiked);
            setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
            toast({ title: 'Error', description: 'Failed to update like', variant: 'destructive' });
        }
    };

    const handleSave = async () => {
        if (!currentUser) {
            toast({ title: 'Sign In', description: 'Please sign in to save posts.' });
            return;
        }
        setIsSaved(!isSaved);
        try {
            await toggleSave(feed.id);
            if (onUnsave && isSaved) {
                onUnsave(feed.id);
            }
            toast({ title: isSaved ? 'Removed' : 'Saved', description: isSaved ? 'Post removed from saves' : 'Post saved successfully' });
        } catch (error) {
            setIsSaved(!isSaved);
            toast({ title: 'Error', description: 'Failed to save post', variant: 'destructive' });
        }
    };

    const handleAddComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser || !newComment.trim()) return;
        setIsSubmitting(true);
        try {
            await addComment(feed.id, newComment);
            const mockComment = {
                id: Math.random().toString(),
                content: newComment,
                created_at: new Date().toISOString(),
                profiles: {
                    display_name: currentUser.user_metadata.display_name || currentUser.email,
                    avatar_url: currentUser.user_metadata.avatar_url
                }
            };
            setComments([mockComment, ...comments]);
            setNewComment('');
            setShowComments(true);
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to add comment', variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleShare = () => {
        const url = `${window.location.origin}/feeds/${feed.id}`;
        navigator.clipboard.writeText(url);
        toast({ title: 'Link Copied', description: 'Post link copied to clipboard!' });
    };

    return (
        <div className="bg-background md:border md:rounded-xl overflow-hidden shadow-sm group">
            {/* Post Header */}
            <div className="flex items-center justify-between p-3">
                <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9 ring-2 ring-primary/10">
                        <AvatarImage src={feed.profiles?.avatar_url || undefined} />
                        <AvatarFallback className="bg-primary/5 text-primary text-xs font-bold">
                            {feed.profiles?.display_name?.[0] || 'D'}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                        <span className="text-sm font-bold leading-tight">
                            {feed.profiles?.display_name || 'DEFIMART Team'}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                            {formatDistanceToNow(new Date(feed.created_at))} ago
                        </span>
                    </div>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                    <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
                </Button>
            </div>

            {/* Main Image / Carousel */}
            <div className="relative aspect-square w-full bg-muted overflow-hidden">
                {allImages.length > 0 ? (
                    allImages.length === 1 ? (
                        <div className="relative w-full h-full cursor-pointer" onDoubleClick={handleLike}>
                            <Image 
                                src={allImages[0]} 
                                alt={feed.title} 
                                fill 
                                className="object-cover"
                                priority
                            />
                        </div>
                    ) : (
                        <Carousel setApi={setApi} className="w-full h-full">
                            <CarouselContent className="h-full ml-0">
                                {allImages.map((img, index) => (
                                    <CarouselItem key={index} className="pl-0 h-full">
                                        <div className="relative w-full h-full cursor-pointer" onDoubleClick={handleLike}>
                                            <Image 
                                                src={img} 
                                                alt={`${feed.title} - image ${index + 1}`} 
                                                fill 
                                                className="object-cover"
                                                priority={index === 0}
                                            />
                                        </div>
                                    </CarouselItem>
                                ))}
                            </CarouselContent>
                            
                            {/* Slide Indicator */}
                            {count > 1 && (
                                <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded-full z-10">
                                    {current} / {count}
                                </div>
                            )}

                            {/* Dot Indicators */}
                            {count > 1 && (
                                <div className="absolute bottom-20 left-0 right-0 flex justify-center gap-1.5 z-10">
                                    {Array.from({ length: count }).map((_, i) => (
                                        <div 
                                            key={i} 
                                            className={cn(
                                                "h-1.5 w-1.5 rounded-full transition-all duration-300",
                                                current === i + 1 ? "bg-white w-4" : "bg-white/40"
                                            )}
                                        />
                                    ))}
                                </div>
                            )}
                        </Carousel>
                    )
                ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center">
                        <span className="text-primary/20 font-black text-4xl italic select-none">DEFIMART</span>
                    </div>
                )}

                {/* Tagged Product Overlay */}
                {feed.products && (
                    <Link 
                        href={`/products/${feed.products.id}`}
                        className="absolute bottom-4 left-4 right-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-3 rounded-xl flex items-center justify-between shadow-2xl border border-white/20 transform translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 md:translate-y-0 md:opacity-100 z-20"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center gap-3">
                            <div className="bg-primary/10 p-2 rounded-lg">
                                <ShoppingBag className="h-4 w-4 text-primary" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] uppercase tracking-tighter text-muted-foreground font-bold leading-none">Tagged Product</span>
                                <span className="text-xs font-black truncate max-w-[150px] mt-1">{feed.products.name}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] font-black text-primary uppercase bg-primary/5 px-2 py-1 rounded-md">
                            View
                            <ArrowRight className="h-3 w-3" />
                        </div>
                    </Link>
                )}
            </div>

            {/* Interaction Bar */}
            <div className="p-3 pb-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={handleLike} className={cn("hover:opacity-70 transition-all", isLiked && "text-red-500")}>
                            <Heart className={cn("h-6 w-6 md:h-7 md:w-7", isLiked && "fill-current")} />
                        </button>
                        
                        <Sheet open={showComments} onOpenChange={setShowComments}>
                            <SheetTrigger asChild>
                                <button className="hover:text-primary transition-colors">
                                    <MessageCircle className="h-6 w-6 md:h-7 md:w-7" />
                                </button>
                            </SheetTrigger>
                            <SheetContent side="bottom" className="h-[80vh] rounded-t-[32px] p-0 overflow-hidden border-t-0 bg-background/95 backdrop-blur-xl">
                                <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mt-3 mb-1" />
                                <SheetHeader className="px-6 py-4 border-b">
                                    <SheetTitle className="text-center text-sm font-black uppercase tracking-widest">Comments</SheetTitle>
                                </SheetHeader>
                                <div className="flex flex-col h-full">
                                    <div className="flex-1 overflow-y-auto px-6">
                                        <div className="py-6 space-y-6">
                                            {comments.length === 0 ? (
                                                <div className="text-center py-20 text-muted-foreground">
                                                    <p className="font-bold">No comments yet</p>
                                                    <p className="text-xs">Be the first to share your thoughts!</p>
                                                </div>
                                            ) : (
                                                comments.map((comment: any) => (
                                                    <div key={comment.id} className="flex gap-3 group/comment">
                                                        <Avatar className="h-8 w-8 mt-0.5">
                                                            <AvatarImage src={comment.profiles?.avatar_url || undefined} />
                                                            <AvatarFallback className="text-[10px]">{comment.profiles?.display_name?.[0] || 'U'}</AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-xs font-black">{comment.profiles?.display_name}</span>
                                                                <span className="text-[10px] text-muted-foreground">
                                                                    {formatDistanceToNow(new Date(comment.created_at))} ago
                                                                </span>
                                                            </div>
                                                            <p className="text-sm mt-1 leading-relaxed">{comment.content}</p>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                    
                                    {/* Add Comment Input inside Drawer */}
                                    <div className="p-4 bg-background border-t pb-10">
                                        <form onSubmit={handleAddComment} className="flex items-center gap-2 bg-muted/50 rounded-full px-4 py-1.5 border">
                                            <Input 
                                                value={newComment}
                                                onChange={(e) => setNewComment(e.target.value)}
                                                placeholder="Add a comment..."
                                                className="border-none bg-transparent focus-visible:ring-0 text-sm h-9"
                                            />
                                            <Button 
                                                type="submit" 
                                                size="icon" 
                                                variant="ghost" 
                                                className="text-primary hover:bg-transparent"
                                                disabled={isSubmitting || !newComment.trim()}
                                            >
                                                <Send className="h-5 w-5" />
                                            </Button>
                                        </form>
                                    </div>
                                </div>
                            </SheetContent>
                        </Sheet>

                        <button onClick={handleShare} className="hover:text-primary transition-colors">
                            <Share2 className="h-6 w-6 md:h-7 md:w-7" />
                        </button>
                    </div>
                    
                    <button onClick={handleSave} className={cn("transition-all", isSaved && "text-primary")}>
                        <Bookmark className={cn("h-6 w-6 md:h-7 md:w-7", isSaved && "fill-current")} />
                    </button>
                </div>
                
                {/* Likes Count */}
                <div className="mt-3">
                    <p className="text-sm font-black tracking-tight">{likeCount.toLocaleString()} likes</p>
                </div>
                
                {/* Post Caption */}
                <div className="mt-2 text-sm leading-relaxed">
                    <span className="font-black mr-2">{feed.profiles?.display_name || 'DEFIMART'}</span>
                    <span className="text-muted-foreground">{feed.content}</span>
                </div>
                
                {/* Tags */}
                {feed.tags && feed.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                        {feed.tags.map((tag: string) => (
                            <span key={tag} className="text-xs font-bold text-primary/70 hover:text-primary transition-colors cursor-pointer">
                                #{tag}
                            </span>
                        ))}
                    </div>
                )}
                
                {/* Comment Summary */}
                {comments.length > 0 && (
                    <button 
                        onClick={() => setShowComments(true)}
                        className="mt-2 text-xs text-muted-foreground font-bold hover:text-foreground transition-colors"
                    >
                        View all {comments.length} comments
                    </button>
                )}
            </div>

            <Separator className="mt-2 bg-primary/5" />
        </div>
    );
}
