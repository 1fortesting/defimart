'use client';

import { 
    ArrowLeft, 
    Package, 
    ShoppingBag, 
    DollarSign, 
    Clock, 
    Phone, 
    Store, 
    BarChart3,
    TrendingUp,
    ChevronRight,
    MapPin,
    Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatPrice } from '@/lib/utils';
import { format } from 'date-fns';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { 
    Breadcrumb, 
    BreadcrumbItem, 
    BreadcrumbLink, 
    BreadcrumbList, 
    BreadcrumbPage, 
    BreadcrumbSeparator 
} from '@/components/ui/breadcrumb';
import type { VendorFullPerformance } from './page';

export default function VendorDetailsClient({ vendor }: { vendor: VendorFullPerformance }) {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredProducts = useMemo(() => {
        if (!searchQuery) return vendor.products;
        return vendor.products.filter(p => 
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.category?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [vendor.products, searchQuery]);

    const StatCard = ({ title, value, icon: Icon, subText }: { title: string, value: string | number, icon: any, subText?: string }) => (
        <Card className="bg-white border-none shadow-sm rounded-3xl p-6 relative overflow-hidden group hover:shadow-md transition-all">
            <div className="flex justify-between items-start">
                <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{title}</p>
                    <h3 className="text-2xl font-black text-foreground">{value}</h3>
                </div>
                <div className="bg-primary/10 p-3 rounded-2xl text-primary group-hover:scale-110 transition-transform">
                    <Icon className="h-5 w-5" />
                </div>
            </div>
            {subText && (
                <p className="text-xs font-bold text-muted-foreground mt-4 flex items-center gap-1.5 uppercase tracking-tighter">
                    <TrendingUp className="h-3 w-3 text-emerald-500" /> {subText}
                </p>
            )}
        </Card>
    );

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
            
            {/* Header Section */}
            <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <div className="space-y-2">
                        <Breadcrumb>
                            <BreadcrumbList>
                                <BreadcrumbItem>
                                    <BreadcrumbLink href="/admin/central-admin/dashboard">Admin</BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator />
                                <BreadcrumbItem>
                                    <BreadcrumbLink href="/admin/central-admin/vendor-analytics">Vendors</BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator />
                                <BreadcrumbItem>
                                    <BreadcrumbPage>{vendor.shop_name}</BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                        <h1 className="text-3xl font-black italic uppercase tracking-tighter text-foreground flex items-center gap-3">
                            <Store className="h-8 w-8 text-primary" /> Vendor Insights
                        </h1>
                    </div>
                    <Button variant="outline" size="sm" className="rounded-xl h-10 border-2 font-bold" asChild>
                        <Link href="/admin/central-admin/vendor-analytics">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Registry
                        </Link>
                    </Button>
                </div>

                {/* Profile Banner */}
                <Card className="border-none shadow-xl rounded-[40px] overflow-hidden bg-white">
                    <div className="h-32 bg-gradient-to-r from-primary via-orange-500 to-amber-600 relative overflow-hidden">
                        <div className="absolute inset-0 bg-black/10 backdrop-blur-[2px]" />
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32" />
                    </div>
                    <CardContent className="px-8 pb-8 -mt-12 relative">
                        <div className="flex flex-col md:flex-row items-end gap-6 justify-between">
                            <div className="flex items-end gap-6">
                                <Avatar className="h-32 w-24 rounded-[32px] border-[6px] border-white shadow-2xl ring-1 ring-black/5">
                                    <AvatarImage src={vendor.profiles?.avatar_url || undefined} className="object-cover" />
                                    <AvatarFallback className="bg-primary/5 text-primary text-4xl font-black">{vendor.shop_name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="mb-2 space-y-1">
                                    <div className="flex items-center gap-3">
                                        <h2 className="text-2xl font-black uppercase tracking-tight">{vendor.shop_name}</h2>
                                        <Badge variant={vendor.is_open ? 'default' : 'secondary'} className="h-6 font-black uppercase text-[9px] tracking-widest px-3">
                                            {vendor.is_open ? 'Online' : 'Offline'}
                                        </Badge>
                                    </div>
                                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-[3px]">{vendor.full_name}</p>
                                </div>
                            </div>
                            <div className="flex gap-3 mb-2">
                                <Button variant="ghost" size="icon" className="h-11 w-11 rounded-2xl bg-muted/50 text-primary hover:bg-primary hover:text-white transition-all" asChild>
                                    <a href={`tel:${vendor.phone_number}`}><Phone className="h-5 w-5" /></a>
                                </Button>
                                <Button className="h-11 px-6 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20" asChild>
                                    <Link href={`/shops/${vendor.id}`}>View Public Shop</Link>
                                </Button>
                            </div>
                        </div>

                        <Separator className="my-8 opacity-50" />

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="space-y-4">
                                <h3 className="text-[10px] font-black uppercase tracking-[3px] text-muted-foreground flex items-center gap-2">
                                    <Store className="h-3.5 w-3.5 text-primary" /> Store Bio
                                </h3>
                                <p className="text-sm font-medium italic text-muted-foreground leading-relaxed">&ldquo;{vendor.description || "No description provided for this campus shop."}&rdquo;</p>
                            </div>
                            <div className="space-y-4">
                                <h3 className="text-[10px] font-black uppercase tracking-[3px] text-muted-foreground flex items-center gap-2">
                                    <Clock className="h-3.5 w-3.5 text-primary" /> Pickup Hours
                                </h3>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="font-bold text-muted-foreground">Opens</span>
                                        <span className="font-black text-foreground">{vendor.open_time}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="font-bold text-muted-foreground">Closes</span>
                                        <span className="font-black text-foreground">{vendor.close_time}</span>
                                    </div>
                                </div>
                            </div>
                             <div className="space-y-4">
                                <h3 className="text-[10px] font-black uppercase tracking-[3px] text-muted-foreground flex items-center gap-2">
                                    <BarChart3 className="h-3.5 w-3.5 text-primary" /> Quick Stats
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-muted/30 p-3 rounded-2xl">
                                        <p className="text-[9px] font-black text-muted-foreground uppercase mb-1">Items</p>
                                        <p className="text-lg font-black">{vendor.products.length}</p>
                                    </div>
                                    <div className="bg-muted/30 p-3 rounded-2xl">
                                        <p className="text-[9px] font-black text-muted-foreground uppercase mb-1">Orders</p>
                                        <p className="text-lg font-black">{vendor.metrics.totalOrders}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Metrics Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard title="Vendor Revenue" value={formatPrice(vendor.metrics.totalRevenue)} icon={DollarSign} subText="Completed Transactions" />
                <StatCard title="Growth Index" value={`+${vendor.metrics.completedOrders} pts`} icon={TrendingUp} subText="Market reputation score" />
                <StatCard title="Order Efficiency" value={`${vendor.metrics.totalOrders > 0 ? Math.round((vendor.metrics.completedOrders / vendor.metrics.totalOrders) * 100) : 0}%`} icon={Clock} subText="Completion rate" />
            </div>

            {/* Tabs for Data Tables */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Inventory Overview */}
                <div className="lg:col-span-8 space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <h2 className="text-xl font-black italic uppercase tracking-tighter">Product Registry</h2>
                        <div className="relative w-48">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                            <Input 
                                placeholder="Filter catalog..." 
                                className="pl-8 h-8 text-[10px] rounded-lg bg-white border-none shadow-sm"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                    <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
                        <Table>
                            <TableHeader className="bg-muted/10">
                                <TableRow>
                                    <TableHead className="text-[9px] font-black uppercase px-6 h-10">Commodity</TableHead>
                                    <TableHead className="text-[9px] font-black uppercase h-10">Valuation</TableHead>
                                    <TableHead className="text-[9px] font-black uppercase h-10">Inventory</TableHead>
                                    <TableHead className="text-[9px] font-black uppercase text-right px-6 h-10">Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredProducts.map(product => (
                                    <TableRow key={product.id} className="hover:bg-muted/5 transition-colors">
                                        <TableCell className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="relative h-10 w-10 rounded-xl overflow-hidden bg-muted border flex-shrink-0">
                                                    {product.image_urls?.[0] ? <Image src={product.image_urls[0]} alt="" fill className="object-cover" /> : <Package className="p-2 opacity-10" />}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-black truncate max-w-[200px]">{product.name}</p>
                                                    <p className="text-[9px] font-bold text-muted-foreground uppercase">{product.category}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm font-black text-foreground">{formatPrice(product.price)}</TableCell>
                                        <TableCell className="text-sm font-bold text-muted-foreground">{product.quantity || 0} Units</TableCell>
                                        <TableCell className="text-right px-6 py-4">
                                            <Badge className="text-[7px] font-black uppercase h-4 px-2" variant={(product.quantity || 0) > 0 ? 'secondary' : 'destructive'}>
                                                {(product.quantity || 0) > 0 ? 'In Stock' : 'Empty'}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {filteredProducts.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-20 text-muted-foreground italic text-sm">No commodities found.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </Card>
                </div>

                {/* Recent Orders List */}
                <div className="lg:col-span-4 space-y-4">
                    <h2 className="text-xl font-black italic uppercase tracking-tighter px-2">Market Activity</h2>
                    <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white h-fit">
                        <div className="p-6 space-y-6">
                            {vendor.orders.length === 0 ? (
                                <div className="text-center py-10 opacity-30 flex flex-col items-center">
                                    <ShoppingBag className="h-10 w-10 mb-2" />
                                    <p className="text-[10px] font-black uppercase tracking-widest">No Activity</p>
                                </div>
                            ) : (
                                <div className="space-y-5">
                                    {vendor.orders.slice(0, 8).map(order => (
                                        <div key={order.id} className="flex gap-4 items-start group">
                                            <div className={cn(
                                                "h-9 w-9 rounded-2xl flex items-center justify-center flex-shrink-0 transition-colors",
                                                order.status === 'completed' ? "bg-emerald-50 text-emerald-600" : "bg-primary/5 text-primary"
                                            )}>
                                                <DollarSign className="h-4 w-4" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start">
                                                    <p className="text-xs font-black truncate pr-2">{order.profiles?.display_name || 'Anonymous'}</p>
                                                    <span className="text-[9px] font-bold text-muted-foreground whitespace-nowrap">{format(new Date(order.created_at), 'MMM d')}</span>
                                                </div>
                                                <div className="mt-1 flex items-center justify-between">
                                                    <p className="text-[10px] font-bold text-muted-foreground">{formatPrice(order.price_per_item * order.quantity)}</p>
                                                    <Badge className="text-[6px] h-3.5 px-1.5 uppercase font-black" variant={order.status === 'completed' ? 'default' : 'outline'}>{order.status}</Badge>
                                                </div>
                                                {order.delivery_location && (
                                                    <p className="mt-1.5 text-[8px] font-black text-primary uppercase tracking-tighter flex items-center gap-1">
                                                        <MapPin className="h-2.5 w-2.5" /> {order.delivery_location}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        {vendor.orders.length > 8 && (
                            <div className="p-4 bg-muted/5 border-t text-center">
                                <Button variant="link" className="text-[10px] font-black uppercase tracking-widest text-primary h-auto p-0">View Full Transaction Log <ChevronRight className="ml-1 h-3 w-3" /></Button>
                            </div>
                        )}
                    </Card>
                </div>

            </div>
        </div>
    );
}
