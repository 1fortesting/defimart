'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
    Search, 
    BarChart3, 
    Package, 
    DollarSign, 
    ExternalLink,
    Store,
    Clock
} from 'lucide-react';
import { cn, formatPrice } from '@/lib/utils';
import Link from 'next/link';
import type { VendorWithPerformance } from './page';

export default function VendorAnalyticsClient({ vendors }: { vendors: VendorWithPerformance[] }) {
    const [search, setSearch] = useState('');

    const filteredVendors = vendors.filter(v => 
        v.shop_name.toLowerCase().includes(search.toLowerCase()) ||
        v.full_name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="relative w-full sm:max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Search shops or owners..." 
                        className="pl-9 h-11 rounded-xl bg-white border-primary/10" 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-4 text-sm font-bold text-muted-foreground bg-white px-4 py-2 rounded-xl shadow-sm border border-primary/5">
                    <span className="flex items-center gap-1.5"><Store className="h-4 w-4 text-primary" /> {vendors.length} Shops</span>
                    <span className="flex items-center gap-1.5"><Package className="h-4 w-4 text-primary" /> {vendors.reduce((sum, v) => sum + v.products.length, 0)} Items</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredVendors.map(vendor => (
                    <VendorSummaryCard key={vendor.id} vendor={vendor} />
                ))}
                {filteredVendors.length === 0 && (
                    <div className="col-span-full py-20 text-center bg-white rounded-3xl border-2 border-dashed flex flex-col items-center">
                        <BarChart3 className="h-12 w-12 text-muted-foreground/20 mb-4" />
                        <p className="text-lg font-bold text-muted-foreground">No matching vendors found</p>
                    </div>
                )}
            </div>
        </div>
    );
}

function VendorSummaryCard({ vendor }: { vendor: VendorWithPerformance }) {
    return (
        <Card className="border-none shadow-sm rounded-3xl overflow-hidden hover:shadow-xl transition-all group bg-white">
            <div className="h-2 bg-primary group-hover:h-3 transition-all" />
            <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12 border-2 border-primary/10 shadow-sm">
                            <AvatarImage src={vendor.profiles?.avatar_url || undefined} />
                            <AvatarFallback className="bg-primary/5 text-primary font-black uppercase">{vendor.shop_name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <CardTitle className="text-base font-black truncate max-w-[150px] uppercase tracking-tight">{vendor.shop_name}</CardTitle>
                            <CardDescription className="text-[10px] font-bold uppercase tracking-widest">{vendor.full_name}</CardDescription>
                        </div>
                    </div>
                    <Badge variant={vendor.is_open ? 'default' : 'secondary'} className="h-5 text-[8px] font-black uppercase tracking-tighter px-2">
                        {vendor.is_open ? 'Online' : 'Offline'}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-muted/30 p-3 rounded-2xl flex flex-col justify-center">
                        <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-1">Sales (Completed)</p>
                        <p className="text-base font-black text-foreground">{formatPrice(vendor.metrics.totalRevenue)}</p>
                    </div>
                    <div className="bg-muted/30 p-3 rounded-2xl flex flex-col justify-center">
                        <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-1">Order Volume</p>
                        <p className="text-base font-black text-foreground">{vendor.metrics.totalOrders} <span className="text-[10px] font-medium text-muted-foreground">Entries</span></p>
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-tighter text-muted-foreground">
                        <span className="flex items-center gap-1"><Package className="h-3 w-3" /> Inventory</span>
                        <span>{vendor.products.length} Products</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-tighter text-muted-foreground">
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Pickup Hours</span>
                        <span>{vendor.open_time} - {vendor.close_time}</span>
                    </div>
                </div>

                <div className="flex gap-2 pt-2">
                    <Button variant="outline" className="flex-1 h-10 rounded-xl font-black text-[10px] uppercase tracking-widest group-hover:bg-primary group-hover:text-white transition-all" asChild>
                        <Link href={`/admin/central-admin/vendor-analytics/${vendor.id}`}>
                            View Performance
                        </Link>
                    </Button>
                    <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl" asChild>
                        <Link href={`/shops/${vendor.id}`}>
                            <ExternalLink className="h-4 w-4 text-primary" />
                        </Link>
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
