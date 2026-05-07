'use client';

import { useState, useMemo, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Store, Clock, Package, ArrowRight, Star } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { cn, formatPrice } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

interface Seller {
    id: string;
    shop_name: string;
    is_open: boolean;
    open_time: string;
    close_time: string;
    profiles?: {
        avatar_url: string | null;
    };
    approved_product_count: number;
}

export default function ShopsClientPage({ initialSellers }: { initialSellers: Seller[] }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    const isShopOpen = (seller: Seller) => {
        if (!seller.is_open) return false;
        if (!seller.open_time || !seller.close_time) return seller.is_open;

        const now = currentTime;
        const [openH, openM] = seller.open_time.split(':').map(Number);
        const [closeH, closeM] = seller.close_time.split(':').map(Number);

        const openDate = new Date(now);
        openDate.setHours(openH, openM, 0);

        const closeDate = new Date(now);
        closeDate.setHours(closeH, closeM, 0);

        return now >= openDate && now <= closeDate;
    };

    const filteredSellers = useMemo(() => {
        return initialSellers.filter(s => 
            s.shop_name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [initialSellers, searchQuery]);

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
                <div className="space-y-2">
                    <h1 className="text-4xl font-black tracking-tight text-foreground italic uppercase">VENDORS</h1>
                    <p className="text-muted-foreground font-medium text-sm md:text-base">Support our campus entrepreneurs and discover local gems.</p>
                </div>
                <div className="relative w-full md:max-w-md group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input 
                        placeholder="Search for a specific shop..." 
                        className="pl-12 h-14 bg-white border-2 border-border/50 focus-visible:ring-primary/20 focus-visible:border-primary shadow-xl rounded-2xl transition-all"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {initialSellers.length === 0 ? (
                <div className="text-center py-32 bg-white/50 backdrop-blur-sm rounded-[40px] border-4 border-dashed flex flex-col items-center">
                    <Store className="h-20 w-20 text-muted-foreground/20 mb-6" />
                    <p className="text-2xl font-black text-foreground">No vendors yet</p>
                    <p className="text-muted-foreground mt-2 font-medium">New shops are joining the campus community every week.</p>
                </div>
            ) : filteredSellers.length === 0 ? (
                <div className="text-center py-32 bg-white/50 backdrop-blur-sm rounded-[40px] border-4 border-dashed flex flex-col items-center">
                    <Search className="h-20 w-20 text-muted-foreground/20 mb-6" />
                    <p className="text-2xl font-black text-foreground">No matches found</p>
                    <p className="text-muted-foreground mt-2 font-medium">Try searching for something else or check your spelling.</p>
                    <button onClick={() => setSearchQuery('')} className="mt-6 text-primary font-black uppercase tracking-widest text-sm hover:underline">Clear Search</button>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                    {filteredSellers.map((seller) => {
                        const open = isShopOpen(seller);
                        return (
                            <Link key={seller.id} href={`/shops/${seller.id}`} className="group h-full">
                                <Card className="overflow-hidden border-none transition-all duration-500 hover:-translate-y-2 shadow-[0_10px_40px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_50px_rgba(245,166,35,0.15)] bg-background rounded-[32px] h-full flex flex-col relative">
                                    <div className="relative h-40 bg-gradient-to-br from-primary via-orange-400 to-amber-600 overflow-hidden">
                                        <div className="absolute inset-0 bg-black/10 backdrop-blur-[1px]" />
                                        <div className="absolute top-4 right-4 flex flex-col items-end gap-2">
                                            <Badge 
                                                className={cn(
                                                    "px-3 py-1 font-black text-[10px] uppercase tracking-widest shadow-xl border-none",
                                                    open ? "bg-emerald-500 text-white" : "bg-red-500 text-white"
                                                )}
                                            >
                                                {open ? 'ONLINE' : 'OFFLINE'}
                                            </Badge>
                                            {seller.approved_product_count > 0 && (
                                                <Badge className="bg-white/20 backdrop-blur-md text-white border-none font-bold text-[10px]">
                                                    <Package className="h-3 w-3 mr-1" /> {seller.approved_product_count} Items
                                                </Badge>
                                            )}
                                        </div>
                                        
                                        <div className="absolute inset-0 flex items-center justify-center opacity-10 group-hover:scale-125 transition-transform duration-1000">
                                             <Store className="h-40 w-40 text-white" />
                                        </div>
                                    </div>

                                    <CardContent className="pt-0 px-6 pb-6 flex-1 flex flex-col relative">
                                        <div className="absolute -top-12 left-6">
                                            <div className="relative">
                                                <Avatar className="h-24 w-24 border-[6px] border-background shadow-2xl bg-white ring-1 ring-black/5">
                                                    <AvatarImage src={seller.profiles?.avatar_url || undefined} />
                                                    <AvatarFallback className="bg-primary/5 text-primary font-black text-2xl">
                                                        {seller.shop_name.charAt(0)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="absolute bottom-1 right-1 h-5 w-5 rounded-full border-4 border-background bg-emerald-500" />
                                            </div>
                                        </div>

                                        <div className="mt-14 space-y-4">
                                            <div>
                                                <h3 className="font-black text-xl md:text-2xl line-clamp-1 group-hover:text-primary transition-colors italic uppercase tracking-tighter">
                                                    {seller.shop_name}
                                                </h3>
                                                <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground mt-1 uppercase tracking-widest">
                                                    <Clock className="h-3.5 w-3.5 text-primary" />
                                                    <span>{seller.open_time} – {seller.close_time}</span>
                                                </div>
                                            </div>
                                            
                                            <Separator className="opacity-50" />
                                            
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-1">
                                                    <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                                                    <span className="text-xs font-black">4.9</span>
                                                    <span className="text-[10px] font-bold text-muted-foreground">(24)</span>
                                                </div>
                                                <div className="flex items-center gap-1 text-[10px] font-black text-primary uppercase tracking-widest group-hover:translate-x-1 transition-transform">
                                                    Enter Shop <ArrowRight className="h-3 w-3" />
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}