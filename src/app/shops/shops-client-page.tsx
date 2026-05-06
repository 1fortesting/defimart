'use client';

import { useState, useMemo, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Store, Clock, Package } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

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

    // Update current time every minute to keep shop status accurate
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
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-foreground italic uppercase">VENDORS</h1>
                    <p className="text-muted-foreground text-sm">Discover and shop from your favorite campus vendors.</p>
                </div>
                <div className="relative w-full md:max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Search shops by name..." 
                        className="pl-10 h-12 bg-background border-2 focus-visible:ring-primary shadow-sm rounded-xl"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {initialSellers.length === 0 ? (
                <div className="text-center py-20 bg-background/50 rounded-3xl border-2 border-dashed">
                    <Store className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                    <p className="text-lg font-bold">No shops available</p>
                    <p className="text-sm text-muted-foreground">Check back later for new campus vendors.</p>
                </div>
            ) : filteredSellers.length === 0 ? (
                <div className="text-center py-20 bg-background/50 rounded-3xl border-2 border-dashed">
                    <Search className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                    <p className="text-lg font-bold">No matching shops</p>
                    <p className="text-sm text-muted-foreground">Try a different search term.</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                    {filteredSellers.map((seller) => {
                        const open = isShopOpen(seller);
                        return (
                            <Link key={seller.id} href={`/shops/${seller.id}`} className="group">
                                <Card className="overflow-hidden border-2 border-transparent hover:border-primary/50 transition-all duration-300 hover:-translate-y-1 shadow-sm hover:shadow-xl bg-background rounded-2xl h-full flex flex-col">
                                    <div className="relative h-24 bg-gradient-to-br from-primary/10 via-primary/5 to-background">
                                        <div className="absolute -bottom-6 left-4">
                                            <Avatar className="h-16 w-16 border-4 border-background shadow-md">
                                                <AvatarImage src={seller.profiles?.avatar_url || undefined} />
                                                <AvatarFallback className="bg-primary text-white font-bold text-xl">
                                                    {seller.shop_name.charAt(0)}
                                                </AvatarFallback>
                                            </Avatar>
                                        </div>
                                        <Badge 
                                            className={cn(
                                                "absolute top-3 right-3 px-3 py-1 font-bold border-none shadow-sm",
                                                open ? "bg-emerald-500 text-white hover:bg-emerald-600" : "bg-red-500 text-white hover:bg-red-600"
                                            )}
                                        >
                                            {open ? 'OPEN' : 'CLOSED'}
                                        </Badge>
                                    </div>
                                    <CardContent className="pt-8 pb-4 px-4 flex-1 flex flex-col justify-between">
                                        <div>
                                            <h3 className="font-bold text-base md:text-lg line-clamp-1 group-hover:text-primary transition-colors">
                                                {seller.shop_name}
                                            </h3>
                                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                                                <Clock className="h-3 w-3" />
                                                <span>{seller.open_time} - {seller.close_time}</span>
                                            </div>
                                        </div>
                                        
                                        <div className="mt-4 pt-4 border-t flex items-center justify-between">
                                            <div className="flex items-center gap-1.5">
                                                <Package className="h-3.5 w-3.5 text-primary" />
                                                <span className="text-xs font-bold">{seller.approved_product_count} Products</span>
                                            </div>
                                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Store className="h-4 w-4 text-primary" />
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
