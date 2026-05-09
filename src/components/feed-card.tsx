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
            <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4">
                    <Avatar className="h-10 w-10 ring-2 ring-primary/10">
                        <AvatarImage src={feed.profiles?.avatar_url || undefined} />
                        <AvatarFallback className="bg-primary/5 text-primary text-sm font-bold">
                            {feed.profiles?.display_name?.[0] || 'D'}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                        <span className="text-[15px] font-black leading-tight">
                            {feed.profiles?.display_name || 'DEFIMART Team'}
                        </span>
                        <span className="text-xs text-muted-foreground mt-0.5">
                            {formatDistanceToNow(new Date(feed.created_at))} ago
                        </span>
                    </div>
                </div>
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
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
                                <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-md text-white text-[11px] font-black px-2.5 py-1 rounded-full z-10">
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
                                                current === i + 1 ? "bg-white w-5" : "bg-white/40"
                                            )}
                                        />
                                    ))}
                                </div>
                            )}
                        </Carousel>
                    )
                ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center">
                        <span className="text-primary/20 font-black text-5xl italic select-none">DEFIMART</span>
                    </div>
                )}

                {/* Tagged Product Overlay */}
                {feed.products && (
                    <Link 
                        href={`/products/${feed.products.id}`}
                        className="absolute bottom-4 left-4 right-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-4 rounded-xl flex items-center justify-between shadow-2xl border border-white/20 transform translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 md:translate-y-0 md:opacity-100 z-20"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center gap-4">
                            <div className="bg-primary/10 p-2.5 rounded-xl">
                                <ShoppingBag className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-black leading-none">Market Item</span>
                                <span className="text-sm font-black truncate max-w-[180px] mt-1.5">{feed.products.name}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] font-black text-primary uppercase bg-primary/5 px-3 py-1.5 rounded-lg">
                            Shop
                            <ArrowRight className="h-3.5 w-3.5" />
                        </div>
                    </Link>
                )}
            </div>

            {/* Interaction Bar */}
            <div className="p-4 pb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-5">
                        <button onClick={handleLike} className={cn("hover:opacity-70 transition-all scale-100 active:scale-125", isLiked && "text-red-500")}>
                            <Heart className={cn("h-7 w-7", isLiked && "fill-current")} />
                        </button>
                        
                        <Sheet open={showComments} onOpenChange={setShowComments}>
                            <SheetTrigger asChild>
                                <button className="hover:text-primary transition-colors scale-100 active:scale-125">
                                    <MessageCircle className="h-7 w-7" />
                                </button>
                            </SheetTrigger>
                            <SheetContent side="bottom" className="h-[85vh] rounded-t-[40px] p-0 overflow-hidden border-t-0 bg-background shadow-2xl">
                                <div className="w-16 h-2 bg-muted rounded-full mx-auto mt-4 mb-2" />
                                <SheetHeader className="px-8 py-5 border-b">
                                    <SheetTitle className="text-center text-sm font-black uppercase tracking-[2px]">Store Conversation</SheetTitle>
                                </SheetHeader>
                                <div className="flex flex-col h-full">
                                    <div className="flex-1 overflow-y-auto px-8">
                                        <div className="py-8 space-y-8">
                                            {comments.length === 0 ? (
                                                <div className="text-center py-24 text-muted-foreground">
                                                    <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                                        <MessageCircle className="h-8 w-8 opacity-40" />
                                                    </div>
                                                    <p className="font-black uppercase text-xs tracking-widest">No discussions yet</p>
                                                    <p className="text-xs mt-1">Be the first to share your feedback!</p>
                                                </div>
                                            ) : (
                                                comments.map((comment: any) => (
                                                    <div key={comment.id} className="flex gap-4 group/comment">
                                                        <Avatar className="h-9 w-9 mt-0.5 shadow-sm border border-muted">
                                                            <AvatarImage src={comment.profiles?.avatar_url || undefined} />
                                                            <AvatarFallback className="text-xs font-bold">{comment.profiles?.display_name?.[0] || 'U'}</AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-3">
                                                                <span className="text-sm font-black leading-none">{comment.profiles?.display_name}</span>
                                                                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">
                                                                    {formatDistanceToNow(new Date(comment.created_at))}
                                                                </span>
                                                            </div>
                                                            <p className="text-sm mt-1.5 leading-relaxed text-foreground/80">{comment.content}</p>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                    
                                    {/* Add Comment Input inside Drawer */}
                                    <div className="p-6 bg-background border-t pb-12 shadow-[0_-10px_30px_rgba(0,0,0,0.03)]">
                                        <form onSubmit={handleAddComment} className="flex items-center gap-3 bg-muted/30 rounded-2xl px-5 py-2 border-2 border-muted/50 focus-within:border-primary/30 transition-all">
                                            <Input 
                                                value={newComment}
                                                onChange={(e) => setNewComment(e.target.value)}
                                                placeholder="Write a comment..."
                                                className="border-none bg-transparent focus-visible:ring-0 text-sm h-10 px-0"
                                            />
                                            <Button 
                                                type="submit" 
                                                size="icon" 
                                                variant="ghost" 
                                                className="text-primary hover:bg-transparent h-10 w-10"
                                                disabled={isSubmitting || !newComment.trim()}
                                            >
                                                <Send className="h-5.5 w-5.5" />
                                            </Button>
                                        </form>
                                    </div>
                                </div>
                            </SheetContent>
                        </Sheet>

                        <button onClick={handleShare} className="hover:text-primary transition-colors scale-100 active:scale-125">
                            <Share2 className="h-7 w-7" />
                        </button>
                    </div>
                    
                    <button onClick={handleSave} className={cn("transition-all scale-100 active:scale-125", isSaved && "text-primary")}>
                        <Bookmark className={cn("h-7 w-7", isSaved && "fill-current")} />
                    </button>
                </div>
                
                {/* Likes Count */}
                <div className="mt-4">
                    <p className="text-[15px] font-black tracking-tight">{likeCount.toLocaleString()} people like this</p>
                </div>
                
                {/* Post Caption */}
                <div className="mt-2.5 text-sm md:text-base leading-relaxed">
                    <span className="font-black mr-2 text-foreground">{feed.profiles?.display_name || 'DEFIMART'}</span>
                    <span className="text-muted-foreground font-medium">{feed.content}</span>
                </div>
                
                {/* Tags */}
                {feed.tags && feed.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2.5">
                        {feed.tags.map((tag: string) => (
                            <span key={tag} className="text-xs font-black text-primary/80 hover:text-primary transition-all bg-primary/5 px-2 py-0.5 rounded-md border border-primary/10 cursor-pointer">
                                #{tag}
                            </span>
                        ))}
                    </div>
                )}
                
                {/* Comment Summary */}
                {comments.length > 0 && (
                    <button 
                        onClick={() => setShowComments(true)}
                        className="mt-3 text-xs md:text-sm text-muted-foreground font-bold hover:text-foreground transition-colors uppercase tracking-widest"
                    >
                        Read all {comments.length} comments
                    </button>
                )}
            </div>

            <Separator className="mt-3 bg-primary/5" />
        </div>
    );
}
