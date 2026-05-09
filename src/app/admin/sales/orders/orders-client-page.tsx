'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHeader, TableRow, TableHead } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tables, Database } from '@/types/supabase';
import { Button } from '@/components/ui/button';
import { updateOrderStatus } from '../actions';
import { useState, useTransition, useEffect, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { ArrowDown, Eye, Loader2, RefreshCw, DollarSign, Package, AlertCircle, Calendar as CalendarIcon, Download, FilterX, Search, ChevronRight, TrendingUp, Phone, MapPin, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent, DropdownMenuPortal } from "@/components/ui/dropdown-menu"
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import Image from 'next/image';

export type OrderWithDetails = Tables<'orders'> & {
  products: Pick<Tables<'products'>, 'name' | 'image_urls'> | null;
  profiles: Pick<Tables<'profiles'>, 'id' | 'display_name' | 'phone_number'> | null;
};

const StatCard = ({ title, value, icon: Icon }: { title: string, value: string | number, icon: React.ElementType }) => (
    <Card className="bg-white border-none shadow-sm rounded-2xl p-5 group hover:shadow-md transition-all">
        <div className="flex justify-between items-start">
            <div className="space-y-1">
                <p className="text-[11px] font-black uppercase tracking-[2px] text-muted-foreground font-poppins">{title}</p>
                <h3 className="text-2xl font-black text-foreground font-montserrat tracking-tight">{value}</h3>
            </div>
            <div className="bg-primary/10 p-2.5 rounded-xl text-primary group-hover:scale-110 transition-transform">
                <Icon className="h-5 w-5" />
            </div>
        </div>
    </Card>
);

function StatusSelector({ orderId, currentStatus, onUpdate, isPending }: { 
    orderId: string, 
    currentStatus: Database['public']['Enums']['order_status'],
    onUpdate: (formData: FormData) => void,
    isPending: boolean
}) {
    const [status, setStatus] = useState(currentStatus);

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        formData.set('status', status);
        onUpdate(formData);
    }

    return (
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <Select name="status" defaultValue={currentStatus} onValueChange={(value) => setStatus(value as any)}>
                <SelectTrigger className="w-[140px] h-10 border-2 rounded-xl text-xs font-bold uppercase tracking-widest font-poppins">
                    <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="rounded-xl font-poppins">
                    <SelectItem value="pending" className="text-xs uppercase font-bold">Pending</SelectItem>
                    <SelectItem value="ready" className="text-xs uppercase font-bold">Ready</SelectItem>
                    <SelectItem value="completed" className="text-xs uppercase font-bold">Completed</SelectItem>
                    <SelectItem value="cancelled" className="text-xs uppercase font-bold">Cancelled</SelectItem>
                </SelectContent>
            </Select>
            <input type="hidden" name="orderId" value={orderId} />
            <Button size="sm" type="submit" disabled={isPending} className="h-10 px-5 rounded-xl font-black text-[11px] uppercase tracking-widest shadow-md">
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
            </Button>
        </form>
    );
}

const OrderDailyGroup = ({ date, orders, handleStatusUpdate, pendingOrderId }: { date: string, orders: OrderWithDetails[], handleStatusUpdate: (fd: FormData) => void, pendingOrderId: string | null }) => {
    const router = useRouter();
    const totalSales = orders.reduce((sum, order) => sum + (order.price_per_item * order.quantity), 0);
    return (
        <AccordionItem value={date} className="border-none mb-4">
            <AccordionTrigger className="hover:bg-muted/50 px-6 h-16 rounded-[20px] bg-white border-2 border-transparent data-[state=open]:border-primary/20 data-[state=open]:rounded-b-none transition-all shadow-sm">
                <div className="flex justify-between items-center w-full pr-4">
                    <span className="font-montserrat font-black text-base uppercase tracking-tighter italic">{format(new Date(date), 'PPP')}</span>
                    <div className="flex items-center gap-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest font-poppins">
                        <span>{orders.length} Units</span>
                        <span className="hidden sm:inline bg-primary/5 text-primary px-3 py-1 rounded-full border border-primary/10">Total: GHS {totalSales.toLocaleString()}</span>
                    </div>
                </div>
            </AccordionTrigger>
            <AccordionContent className="bg-white rounded-b-[20px] border-2 border-t-0 border-primary/20 p-4 md:p-6 shadow-sm">
                 <div className="hidden md:block">
                    <Table>
                        <TableHeader className="bg-muted/10">
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="text-[11px] font-black uppercase font-poppins h-10">Buyer</TableHead>
                                <TableHead className="text-[11px] font-black uppercase font-poppins h-10">Commodity</TableHead>
                                <TableHead className="text-[11px] font-black uppercase font-poppins h-10">Pricing</TableHead>
                                <TableHead className="text-[11px] font-black uppercase font-poppins h-10 text-right">Processing</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {orders.map((order) => {
                                const wasDiscounted = order.original_price_per_item > order.price_per_item;
                                const finalTotal = order.price_per_item * order.quantity;
                                return (
                                    <TableRow key={order.id} onClick={() => router.push(`/admin/sales/${order.id}`)} className="cursor-pointer hover:bg-muted/5 border-muted/20">
                                        <TableCell className="py-4">
                                            <Link href={`/admin/sales/customers/${order.profiles?.id}`} className="hover:underline font-black text-[13px] font-montserrat uppercase tracking-tight" onClick={(e) => e.stopPropagation()}>{order.profiles?.display_name || 'N/A'}</Link>
                                            <div className="text-[11px] font-bold text-muted-foreground mt-1 font-roboto uppercase">{order.profiles?.phone_number || 'No contact'}</div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Image src={order.products?.image_urls?.[0] || 'https://picsum.photos/seed/1/40/40'} alt={order.products?.name || 'Product'} width={44} height={44} className="rounded-lg object-cover hidden sm:block border shadow-sm" />
                                                <div className="min-w-0">
                                                    <div className="text-[13px] font-bold truncate max-w-[150px] font-inter">{order.products?.name || 'N/A'}</div>
                                                    <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-0.5 font-poppins">Qty: {order.quantity}</div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-black text-[14px] text-foreground font-roboto">GHS {finalTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                                {wasDiscounted && <Badge variant="destructive" className="w-fit h-4 px-1 text-[8px] font-black uppercase mt-1">Sale</Badge>}
                                            </div>
                                        </TableCell>
                                        <TableCell onClick={(e) => e.stopPropagation()} className="text-right">
                                            <div className="flex justify-end">
                                                <StatusSelector orderId={order.id} currentStatus={order.status} onUpdate={handleStatusUpdate} isPending={pendingOrderId === order.id} />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>
                 <div className="grid gap-4 md:hidden">
                    {orders.map(order => <OrderCard key={order.id} order={order} handleStatusUpdate={handleStatusUpdate} pendingOrderId={pendingOrderId} />)}
                 </div>
            </AccordionContent>
        </AccordionItem>
    );
};

const OrderCard = ({ order, handleStatusUpdate, pendingOrderId }: { order: OrderWithDetails, handleStatusUpdate: (fd: FormData) => void, pendingOrderId: string | null }) => {
    const router = useRouter();
    const finalTotal = order.price_per_item * order.quantity;
    return (
        <Card onClick={() => router.push(`/admin/sales/${order.id}`)} className="cursor-pointer border-none shadow-sm rounded-2xl bg-muted/20 overflow-hidden hover:bg-muted/30 transition-all">
            <div className="p-4 space-y-4">
                <div className="flex justify-between items-start gap-4">
                    <div className="min-w-0 flex-1">
                        <Badge className="text-[9px] font-black h-5 uppercase tracking-widest mb-2" variant={order.status === 'completed' ? 'default' : order.status === 'ready' ? 'secondary' : order.status === 'cancelled' ? 'destructive' : 'outline'}>
                            {order.status}
                        </Badge>
                        <h3 className="text-[14px] font-black uppercase tracking-tight font-montserrat truncate">{order.products?.name || 'Item Information Unavailable'}</h3>
                        <div className="flex items-center gap-2 mt-1 text-[11px] font-bold text-muted-foreground uppercase font-poppins">
                            <User className="h-3 w-3" /> {order.profiles?.display_name || 'Anonymous'}
                        </div>
                    </div>
                    <div className="text-right">
                         <p className="text-[15px] font-black text-primary font-roboto leading-none mt-1">GHS {finalTotal.toLocaleString()}</p>
                         <p className="text-[10px] font-bold text-muted-foreground mt-2 uppercase font-poppins">Qty: {order.quantity}</p>
                    </div>
                </div>
                
                {order.delivery_location && (
                    <div className="bg-primary/5 p-3 rounded-xl flex items-center gap-3 border border-primary/10">
                        <MapPin className="h-4 w-4 text-primary shrink-0" />
                        <span className="text-[10px] font-black uppercase tracking-tighter text-primary font-poppins truncate">{order.delivery_location}</span>
                    </div>
                )}

                <div onClick={(e) => e.stopPropagation()} className="pt-2 border-t border-muted-foreground/10">
                     <StatusSelector 
                        orderId={order.id} 
                        currentStatus={order.status}
                        onUpdate={handleStatusUpdate}
                        isPending={pendingOrderId === order.id}
                      />
                </div>
            </div>
        </Card>
    )
}

export default function AdminSalesOrdersClientPage({ initialOrders, stats }: { 
    initialOrders: OrderWithDetails[], 
    stats: { todaysRevenue: number, todaysProfit: number, pendingOrdersCount: number, readyForPickupCount: number, totalOrdersCount: number } 
}) {
    const [isRefreshing, startRefreshTransition] = useTransition();
    const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);
    const { toast } = useToast();
    const router = useRouter();

    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortOrder, setSortOrder] = useState('newest-first');
    const [downloadDate, setDownloadDate] = useState<Date|undefined>();
    const [isDownloadPickerOpen, setIsDownloadPickerOpen] = useState(false);

    const filteredOrders = useMemo(() => {
        let filtered = [...initialOrders];

        if (searchQuery) {
            const lowerQuery = searchQuery.toLowerCase();
            filtered = filtered.filter(o =>
                o.products?.name?.toLowerCase().includes(lowerQuery) ||
                o.profiles?.display_name?.toLowerCase().includes(lowerQuery) ||
                o.id.toLowerCase().includes(lowerQuery)
            );
        }

        if (statusFilter !== 'all') {
            filtered = filtered.filter(o => o.status === statusFilter);
        }

        switch (sortOrder) {
            case 'oldest-first':
                filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
                break;
            case 'price-high-low':
                filtered.sort((a, b) => (b.price_per_item * b.quantity) - (a.price_per_item * a.quantity));
                break;
            case 'price-low-high':
                 filtered.sort((a, b) => (a.price_per_item * a.quantity) - (b.price_per_item * b.quantity));
                break;
            case 'newest-first':
            default:
                filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
                break;
        }

        return filtered;
    }, [initialOrders, searchQuery, statusFilter, sortOrder]);

    const groupedAllOrders = useMemo(() => {
        return filteredOrders.reduce((acc, order) => {
            const date = format(new Date(order.created_at), 'yyyy-MM-dd');
            if (!acc[date]) acc[date] = [];
            acc[date].push(order);
            return acc;
        }, {} as Record<string, OrderWithDetails[]>);
    }, [filteredOrders]);
    
    const unattendedOrders = useMemo(() => filteredOrders.filter(o => o.status === 'pending'), [filteredOrders]);

    const groupedUnattendedOrders = useMemo(() => {
        return unattendedOrders.reduce((acc, order) => {
            const date = format(new Date(order.created_at), 'yyyy-MM-dd');
            if (!acc[date]) acc[date] = [];
            acc[date].push(order);
            return acc;
        }, {} as Record<string, OrderWithDetails[]>);
    }, [unattendedOrders]);
    
    const handleStatusUpdate = (formData: FormData) => {
        const orderId = formData.get('orderId') as string;
        setPendingOrderId(orderId);
        startRefreshTransition(async () => {
            const result = await updateOrderStatus(formData);
            if (result.success) {
                toast({ variant: 'success', title: "Confirmed", description: "Status synchronized with database." });
                router.refresh();
            } else if (result.error) {
                toast({ variant: 'destructive', title: "Update Failed", description: result.error });
            }
            setPendingOrderId(null);
        });
    };
    
    const handleRefresh = () => startRefreshTransition(() => router.refresh());

    const handleClearFilters = () => {
        setSearchQuery('');
        setStatusFilter('all');
    };
    
    const downloadCSV = (data: any[], filename: string) => {
        if (data.length === 0) {
            toast({ variant: 'destructive', title: 'No Data', description: 'There is no data to export for the current selection.'});
            return;
        }

        const headers = ['Order ID', 'Date', 'Customer Name', 'Customer Phone', 'Product Name', 'Quantity', 'Price Per Item', 'Cost Per Item', 'Total Price', 'Total Cost', 'Profit', 'Status', 'Notes'];
        const csvContent = [
            headers.join(','),
            ...data.map((order: OrderWithDetails) => {
                const total_price = order.price_per_item * order.quantity;
                const total_cost = (order.cost_price_per_item ?? 0) * order.quantity;
                return [
                    `"${order.id}"`,
                    `"${format(new Date(order.created_at), 'yyyy-MM-dd HH:mm:ss')}"`,
                    `"${order.profiles?.display_name || 'N/A'}"`,
                    `="\\"${order.profiles?.phone_number || ''}\\""`,
                    `"${order.products?.name || 'N/A'}"`,
                    order.quantity,
                    order.price_per_item,
                    order.cost_price_per_item ?? 0,
                    total_price,
                    total_cost,
                    total_price - total_cost,
                    order.status,
                    `"${(order.notes || '').replace(/"/g, '""')}"`,
                ].join(',')
            })
        ].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${filename}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleDownloadAllFiltered = () => {
        downloadCSV(filteredOrders, `defimart_orders_${format(new Date(), 'yyyy-MM-dd')}`);
    };

    const handleDownloadForDate = (date: Date | undefined) => {
        if (!date) return;
        const dateString = format(date, 'yyyy-MM-dd');
        const ordersForDate = initialOrders.filter(o => format(new Date(o.created_at), 'yyyy-MM-dd') === dateString);
        downloadCSV(ordersForDate, `defimart_orders_${dateString}`);
    };
    
    const hasActiveFilters = searchQuery !== '' || statusFilter !== 'all';

  return (
    <div className="flex flex-col gap-8 pb-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
                <h1 className="text-3xl font-black italic uppercase tracking-tighter font-montserrat">Sales Desk</h1>
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-[3px] mt-2 font-poppins">Managed Platform Operations</p>
            </div>
            <div className="flex items-center gap-3">
                 <Button onClick={handleRefresh} disabled={isRefreshing} variant="outline" size="sm" className="h-11 px-6 rounded-2xl font-black text-[11px] uppercase tracking-widest border-2">
                    <RefreshCw className={cn("mr-2 h-4 w-4", isRefreshing && "animate-spin")} />
                    Sync
                </Button>
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button className="h-11 px-6 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-lg shadow-primary/20">Reports</Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[240px] rounded-2xl p-2 font-poppins">
                        <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest opacity-50 px-3">Export Protocol</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onSelect={handleDownloadAllFiltered} className="rounded-xl py-3 text-xs font-bold uppercase">Filtered History (.csv)</DropdownMenuItem>
                         <DropdownMenuSub>
                            <DropdownMenuSubTrigger className="rounded-xl py-3 text-xs font-bold uppercase">Select Date</DropdownMenuSubTrigger>
                            <DropdownMenuPortal>
                                <DropdownMenuSubContent className="p-3 rounded-2xl shadow-2xl bg-white border-none">
                                    <Popover open={isDownloadPickerOpen} onOpenChange={setIsDownloadPickerOpen}>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" className="w-full justify-start font-bold h-12 rounded-xl text-xs uppercase border-2">
                                                <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                                                {downloadDate ? format(downloadDate, 'PPP') : 'Pick Date'}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0 border-none shadow-2xl rounded-3xl overflow-hidden" align="start">
                                            <Calendar 
                                                mode="single" 
                                                selected={downloadDate} 
                                                onSelect={(date) => {
                                                    setDownloadDate(date);
                                                    setIsDownloadPickerOpen(false);
                                                }} 
                                                disabled={(date) => date > new Date()} 
                                            />
                                        </PopoverContent>
                                    </Popover>
                                     <Button disabled={!downloadDate} onClick={() => handleDownloadForDate(downloadDate)} className="w-full mt-3 h-12 rounded-xl font-black text-[10px] uppercase tracking-widest">Download .csv</Button>
                                </DropdownMenuSubContent>
                            </DropdownMenuPortal>
                        </DropdownMenuSub>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>

        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            <StatCard title="Daily Liquidity" value={`GHS ${stats.todaysRevenue.toLocaleString()}`} icon={DollarSign} />
            <StatCard title="Profit Index" value={`GHS ${stats.todaysProfit.toLocaleString()}`} icon={TrendingUp} />
            <StatCard title="Pending Review" value={stats.pendingOrdersCount} icon={AlertCircle} />
            <StatCard title="Active Pickup" value={stats.readyForPickupCount} icon={Package} />
        </div>

         <Card className="border-none shadow-sm rounded-[32px] overflow-hidden bg-white">
            <CardHeader className="bg-muted/5 border-b p-6 md:p-8">
                <CardTitle className="text-[11px] font-black uppercase tracking-[3px] text-muted-foreground font-poppins">Registry Filters</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row flex-wrap items-center gap-4 p-6 md:p-8">
                <div className="relative w-full sm:w-auto sm:flex-1 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input placeholder="Search records..." className="pl-11 h-12 border-2 rounded-2xl bg-muted/20 text-sm font-medium focus:border-primary/40 transition-all font-inter" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                </div>
                 <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-[180px] h-12 border-2 rounded-2xl text-xs font-black uppercase tracking-widest bg-muted/20 font-poppins">
                        <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl font-poppins">
                        <SelectItem value="all" className="text-xs uppercase font-bold">Show All</SelectItem>
                        <SelectItem value="pending" className="text-xs uppercase font-bold">New Only</SelectItem>
                        <SelectItem value="ready" className="text-xs uppercase font-bold">Processing</SelectItem>
                        <SelectItem value="completed" className="text-xs uppercase font-bold">Finished</SelectItem>
                        <SelectItem value="cancelled" className="text-xs uppercase font-bold">Archived</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={sortOrder} onValueChange={setSortOrder}>
                    <SelectTrigger className="w-full sm:w-[180px] h-12 border-2 rounded-2xl text-xs font-black uppercase tracking-widest bg-muted/20 font-poppins">
                        <SelectValue placeholder="Sort" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl font-poppins">
                        <SelectItem value="newest-first" className="text-xs uppercase font-bold">Most Recent</SelectItem>
                        <SelectItem value="oldest-first" className="text-xs uppercase font-bold">Historical</SelectItem>
                        <SelectItem value="price-high-low" className="text-xs uppercase font-bold">Highest Value</SelectItem>
                        <SelectItem value="price-low-high" className="text-xs uppercase font-bold">Lowest Value</SelectItem>
                    </SelectContent>
                </Select>
                 {hasActiveFilters && (
                    <Button variant="ghost" onClick={handleClearFilters} className="h-12 rounded-2xl font-black text-[11px] uppercase text-destructive font-poppins"><FilterX className="mr-2 h-4 w-4" />Clear</Button>
                )}
            </CardContent>
        </Card>

        <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-muted/40 p-1.5 rounded-[24px] h-16 shadow-inner font-poppins">
                <TabsTrigger value="all" className="rounded-[18px] h-full text-xs font-black uppercase tracking-widest data-[state=active]:shadow-lg">All Records ({filteredOrders.length})</TabsTrigger>
                <TabsTrigger value="unattended" className="rounded-[18px] h-full text-xs font-black uppercase tracking-widest data-[state=active]:shadow-lg relative">
                    Action Required ({unattendedOrders.length})
                    {unattendedOrders.length > 0 && <span className="absolute top-2 right-4 w-2 h-2 bg-red-500 rounded-full animate-ping" />}
                </TabsTrigger>
            </TabsList>
            <TabsContent value="all" className="mt-8">
                <Accordion type="multiple" className="space-y-4" defaultValue={Object.keys(groupedAllOrders).slice(0, 1)}>
                    {Object.entries(groupedAllOrders).map(([date, orders]) => <OrderDailyGroup key={date} date={date} orders={orders} handleStatusUpdate={handleStatusUpdate} pendingOrderId={pendingOrderId} />)}
                    {Object.keys(groupedAllOrders).length === 0 && (
                         <div className="text-center py-40 bg-white rounded-[40px] border-4 border-dashed border-muted-foreground/10 flex flex-col items-center">
                            <Package className="h-16 w-16 text-muted-foreground/20 mb-4" />
                            <p className="text-sm font-black uppercase tracking-[3px] text-muted-foreground font-poppins italic">Logbook is currently clear</p>
                        </div>
                    )}
                </Accordion>
            </TabsContent>
            <TabsContent value="unattended" className="mt-8">
                 <Accordion type="multiple" className="space-y-4" defaultValue={Object.keys(groupedUnattendedOrders)}>
                    {Object.entries(groupedUnattendedOrders).map(([date, orders]) => <OrderDailyGroup key={date} date={date} orders={orders} handleStatusUpdate={handleStatusUpdate} pendingOrderId={pendingOrderId} />)}
                    {Object.keys(groupedUnattendedOrders).length === 0 && (
                         <div className="text-center py-40 bg-white rounded-[40px] border-4 border-dashed border-muted-foreground/10 flex flex-col items-center">
                            <Check className="h-16 w-16 text-emerald-500/20 mb-4" />
                            <p className="text-sm font-black uppercase tracking-[3px] text-muted-foreground font-poppins italic">Zero pending actions</p>
                        </div>
                    )}
                </Accordion>
            </TabsContent>
        </Tabs>
    </div>
  );
}
