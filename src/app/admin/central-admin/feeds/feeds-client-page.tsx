'use client';

import { useState, useActionState, useEffect, useMemo } from 'react';
import { createFeed, deleteFeed } from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Plus, Trash2, Image as ImageIcon, Loader2, Tag as TagIcon, Search, Check, ChevronsUpDown, X, Images } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { cn, formatPrice } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Feed {
    id: string;
    title: string;
    content: string;
    image_urls: string[];
    created_at: string;
    tags: string[];
    product_id?: string | null;
}

interface Product {
    id: string;
    name: string;
    image_urls?: string[] | null;
    price: number;
}

export default function AdminFeedsPage({ initialFeeds, products }: { initialFeeds: Feed[], products: Product[] }) {
    const { toast } = useToast();
    const [feeds, setFeeds] = useState(initialFeeds);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [selectedProduct, setSelectedProduct] = useState<string | undefined>(undefined);
    
    // Combobox state
    const [open, setOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const filteredProducts = useMemo(() => {
        return products.filter(p => 
            p.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [products, searchQuery]);

    const selectedProductData = products.find(p => p.id === selectedProduct);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length > 0) {
            const newPreviews: string[] = [];
            files.forEach(file => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    newPreviews.push(reader.result as string);
                    if (newPreviews.length === files.length) {
                        setImagePreviews(prev => [...prev, ...newPreviews]);
                    }
                };
                reader.readAsDataURL(file);
            });
        }
    };

    const removePreview = (index: number) => {
        setImagePreviews(prev => prev.filter((_, i) => i !== index));
        // Reset file input if all cleared
        if (imagePreviews.length === 1) {
            const input = document.getElementById('images') as HTMLInputElement;
            if (input) input.value = '';
        }
    };

    const initialState = { error: null, success: false };
    const [state, formAction, isPending] = useActionState(createFeed as any, initialState as any);

    useEffect(() => {
        if (state?.success) {
            setImagePreviews([]);
            setSelectedProduct(undefined);
            setSearchQuery('');
            const input = document.getElementById('images') as HTMLInputElement;
            if (input) input.value = '';
            toast({ title: 'Success', description: state.message || 'Post published successfully!' });
            // Refresh feeds list
            setTimeout(() => {
                window.location.reload(); 
            }, 1500);
        }
    }, [state, toast]);

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this post?')) return;
        setIsDeleting(id);
        const result = await deleteFeed(id);
        if (result.success) {
            setFeeds(feeds.filter(f => f.id !== id));
            toast({ title: 'Success', description: 'Post deleted successfully' });
        } else {
            toast({ title: 'Error', description: result.error, variant: 'destructive' });
        }
        setIsDeleting(null);
    };

    return (
        <div className="space-y-8 max-w-5xl mx-auto p-4 md:p-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-black tracking-tight text-foreground">Platform Feeds</h1>
                <p className="text-muted-foreground">Create immersive carousel posts with multi-image support.</p>
            </div>

            <Card className="border-2 border-primary/10 shadow-lg overflow-hidden">
                <CardHeader className="bg-primary/5">
                    <CardTitle className="flex items-center gap-2">
                        <Plus className="h-5 w-5" /> Create New Post
                    </CardTitle>
                    <CardDescription>Tag products and upload multiple photos to create a swipeable carousel.</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                    <form action={formAction} className="space-y-6">
                        {/* Hidden input for selected product ID */}
                        <input type="hidden" name="productId" value={selectedProduct || ''} />

                        <div className="space-y-2">
                            <Label htmlFor="title">Title</Label>
                            <Input id="title" name="title" placeholder="What's happening?" className="font-bold" required />
                            {(state as any)?.error?.title && <p className="text-sm text-destructive">{(state as any).error.title[0]}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="content">Content</Label>
                            <Textarea id="content" name="content" placeholder="Share the details..." className="min-h-[100px] resize-none" required />
                            {(state as any)?.error?.content && <p className="text-sm text-destructive">{(state as any).error.content[0]}</p>}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="tags">Tags (comma separated)</Label>
                                <Input id="tags" name="tags" placeholder="e.g. news, sale, tips" />
                            </div>

                            <div className="space-y-2">
                                <Label>Tag a Product (Optional)</Label>
                                <Popover open={open} onOpenChange={setOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={open}
                                            className="w-full justify-between h-11 border-2 hover:border-primary/50 transition-all"
                                        >
                                            {selectedProductData ? (
                                                <div className="flex items-center gap-2 truncate">
                                                    <div className="relative h-6 w-6 rounded overflow-hidden flex-shrink-0">
                                                        <Image 
                                                            src={selectedProductData.image_urls?.[0] || 'https://picsum.photos/seed/1/100/100'} 
                                                            alt="" 
                                                            fill 
                                                            className="object-cover"
                                                        />
                                                    </div>
                                                    <span className="truncate font-medium">{selectedProductData.name}</span>
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground">Select a product to link...</span>
                                            )}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[300px] p-0 shadow-2xl rounded-xl border-2 border-primary/5" align="start">
                                        <div className="p-3 border-b flex items-center gap-2">
                                            <Search className="h-4 w-4 text-muted-foreground" />
                                            <Input 
                                                placeholder="Search products..." 
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="h-8 border-none focus-visible:ring-0 p-0"
                                            />
                                        </div>
                                        <ScrollArea className="h-[250px]">
                                            <div className="p-2">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedProduct(undefined);
                                                        setOpen(false);
                                                    }}
                                                    className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-muted text-sm text-left transition-colors"
                                                >
                                                    <div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
                                                        <X className="h-4 w-4 text-muted-foreground" />
                                                    </div>
                                                    <span className="font-medium">None / Remove Tag</span>
                                                    {!selectedProduct && <Check className="ml-auto h-4 w-4 text-primary" />}
                                                </button>
                                                
                                                {filteredProducts.map((p) => (
                                                    <button
                                                        key={p.id}
                                                        type="button"
                                                        onClick={() => {
                                                            setSelectedProduct(p.id);
                                                            setOpen(false);
                                                        }}
                                                        className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-primary/5 text-sm text-left transition-colors mt-1"
                                                    >
                                                        <div className="relative h-10 w-10 rounded overflow-hidden flex-shrink-0 border">
                                                            <Image 
                                                                src={p.image_urls?.[0] || 'https://picsum.photos/seed/1/100/100'} 
                                                                alt="" 
                                                                fill 
                                                                className="object-cover"
                                                            />
                                                        </div>
                                                        <div className="flex flex-col truncate">
                                                            <span className="font-bold truncate">{p.name}</span>
                                                            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">GHS {formatPrice(p.price)}</span>
                                                        </div>
                                                        {selectedProduct === p.id && <Check className="ml-auto h-4 w-4 text-primary" />}
                                                    </button>
                                                ))}
                                            </div>
                                        </ScrollArea>
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="images">Post Images (Select one or more)</Label>
                                {imagePreviews.length > 0 && (
                                    <span className="text-xs text-primary font-bold">{imagePreviews.length} photos selected</span>
                                )}
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <label className="relative aspect-square rounded-xl border-2 border-dashed border-primary/20 hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer flex flex-col items-center justify-center gap-2">
                                    <Images className="h-6 w-6 text-primary/40" />
                                    <span className="text-[10px] font-bold text-primary/60 uppercase">Add Photo</span>
                                    <input 
                                        id="images" 
                                        name="images" 
                                        type="file" 
                                        accept="image/*" 
                                        multiple 
                                        className="hidden" 
                                        onChange={handleImageChange}
                                    />
                                </label>
                                {imagePreviews.map((preview, index) => (
                                    <div key={index} className="relative aspect-square rounded-xl overflow-hidden group">
                                        <Image src={preview} alt="Preview" fill className="object-cover" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <Button 
                                                type="button" 
                                                variant="destructive" 
                                                size="icon" 
                                                className="h-8 w-8 rounded-full"
                                                onClick={() => removePreview(index)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <Button type="submit" className="w-full h-12 text-lg font-bold shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all" disabled={isPending}>
                            {isPending ? (
                                <div className="flex items-center gap-2">
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    <span>Publishing...</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <Plus className="h-5 w-5" />
                                    <span>Publish Post</span>
                                </div>
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <div className="space-y-6">
                <h2 className="text-2xl font-black tracking-tight flex items-center gap-2">
                    <TagIcon className="h-6 w-6 text-primary" /> Active Feed Posts
                </h2>
                <div className="grid grid-cols-1 gap-6">
                    {feeds.length === 0 ? (
                        <div className="text-center py-20 bg-muted/30 rounded-3xl border-4 border-dashed flex flex-col items-center justify-center space-y-4">
                            <ImageIcon className="h-12 w-12 text-muted-foreground" />
                            <p className="text-xl font-bold">No posts live yet</p>
                        </div>
                    ) : (
                        feeds.map(feed => (
                            <Card key={feed.id} className="overflow-hidden transition-all hover:shadow-xl border-none shadow-lg bg-card/50 backdrop-blur-sm group">
                                <div className="flex flex-col md:flex-row">
                                    {((feed.image_urls && feed.image_urls.length > 0) || feed.image_url) ? (
                                        <div className="relative w-full md:w-64 h-64 md:h-auto overflow-hidden">
                                            <Image 
                                                src={feed.image_urls && feed.image_urls.length > 0 ? feed.image_urls[0] : feed.image_url} 
                                                alt={feed.title} 
                                                fill 
                                                className="object-cover group-hover:scale-105 transition-transform duration-500" 
                                            />
                                            {feed.image_urls && feed.image_urls.length > 1 && (
                                                <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded-md flex items-center gap-1">
                                                    <Images className="h-3 w-3" />
                                                    1 / {feed.image_urls.length}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="w-full md:w-64 bg-primary/5 flex items-center justify-center p-8">
                                            <span className="text-primary/10 font-black text-4xl italic">DEFI</span>
                                        </div>
                                    )}
                                    <div className="flex-1 p-6 flex flex-col justify-between">
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-start">
                                                <div className="space-y-2">
                                                    <h3 className="text-2xl font-black tracking-tight">{feed.title}</h3>
                                                    {feed.product_id && (
                                                        <span className="text-[10px] bg-green-500/10 text-green-500 px-3 py-1 rounded-full font-black uppercase tracking-widest flex items-center gap-1">
                                                            <TagIcon className="h-2.5 w-2.5" />
                                                            Shoppable
                                                        </span>
                                                    )}
                                                </div>
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="text-muted-foreground hover:text-destructive rounded-full"
                                                    onClick={() => handleDelete(feed.id)}
                                                    disabled={isDeleting === feed.id}
                                                >
                                                    {isDeleting === feed.id ? <Loader2 className="h-5 w-5 animate-spin" /> : <Trash2 className="h-5 w-5" />}
                                                </Button>
                                            </div>
                                            <p className="text-muted-foreground line-clamp-3 font-medium">{feed.content}</p>
                                        </div>
                                        <p className="text-[10px] font-black text-muted-foreground mt-8 uppercase tracking-widest">
                                            Published {new Date(feed.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            </Card>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
