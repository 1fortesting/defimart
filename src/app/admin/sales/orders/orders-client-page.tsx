'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHeader, TableRow, TableHead } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tables, Database } from '@/types/supabase';
import { Button } from '@/components/ui/button';
import { updateOrderStatus } from '../actions';
import { useState, useTransition, useEffect, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { ArrowDown, Eye, Loader2, RefreshCw, DollarSign, Package, AlertCircle, Calendar as CalendarIcon, Download, FilterX, Search, ChevronRight } from 'lucide-react';
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
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
        </CardContent>
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
                <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="ready">Ready</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
            </Select>
            <input type="hidden" name="orderId" value={orderId} />
            <Button size="sm" type="submit" disabled={isPending} className="w-[60px]">
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
            </Button>
        </form>
    );
}

const OrderDailyGroup = ({ date, orders, handleStatusUpdate, pendingOrderId }: { date: string, orders: OrderWithDetails[], handleStatusUpdate: (fd: FormData) => void, pendingOrderId: string | null }) => {
    const totalSales = orders.reduce((sum, order) => sum + (order.price_per_item * order.quantity), 0);
    return (
        <AccordionItem value={date}>
            <AccordionTrigger className="hover:bg-muted/50 px-4 rounded-md">
                <div className="flex justify-between items-center w-full">
                    <span className="font-semibold text-lg">{format(new Date(date), 'PPP')}</span>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{orders.length} {orders.length === 1 ? 'Order' : 'Orders'}</span>
                        <span className="hidden sm:inline">Total: GHS {totalSales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                </div>
            </AccordionTrigger>
            <AccordionContent>
                 <div className="hidden md:block">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Customer</TableHead>
                                <TableHead>Product</TableHead>
                                <TableHead className="hidden sm:table-cell">Pricing</TableHead>
                                <TableHead className="hidden lg:table-cell">Time</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Actions</TableHead>
                                <TableHead><span className="sr-only">View</span></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {orders.map((order) => {
                                const wasDiscounted = order.original_price_per_item > order.price_per_item;
                                const finalTotal = order.price_per_item * order.quantity;
                                return (
                                    <TableRow key={order.id}>
                                        <TableCell>
                                            <Link href={`/admin/sales/customers/${order.profiles?.id}`} className="hover:underline font-medium">{order.profiles?.display_name || 'N/A'}</Link>
                                            <div className="text-sm text-muted-foreground hidden lg:block">{order.profiles?.phone_number || 'No phone'}</div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Image src={order.products?.image_urls?.[0] || 'https://picsum.photos/seed/1/40/40'} alt={order.products?.name || 'Product'} width={40} height={40} className="rounded-md object-cover hidden sm:block" />
                                                <div>
                                                    <div>{order.products?.name || 'N/A'}</div>
                                                    <div className="text-sm text-muted-foreground">Qty: {order.quantity}</div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="hidden sm:table-cell">
                                            {wasDiscounted ? (
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-base">GHS {finalTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                                    <Badge variant="destructive" className="flex items-center gap-1"><ArrowDown className="h-3 w-3" /></Badge>
                                                </div>
                                            ) : (
                                                <span className="font-bold">GHS {finalTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="hidden lg:table-cell">{new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</TableCell>
                                        <TableCell><Badge variant={order.status === 'completed' ? 'default' : order.status === 'ready' ? 'secondary' : 'outline'}>{order.status}</Badge></TableCell>
                                        <TableCell>
                                            <StatusSelector orderId={order.id} currentStatus={order.status} onUpdate={handleStatusUpdate} isPending={pendingOrderId === order.id} />
                                        </TableCell>
                                        <TableCell>
                                            <Button asChild size="icon" variant="outline"><Link href={`/admin/sales/${order.id}`}><Eye className="h-4 w-4" /><span className="sr-only">View</span></Link></Button>
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
    const finalTotal = order.price_per_item * order.quantity;
    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-base">{order.products?.name || 'N/A'}</CardTitle>
                        <CardDescription>
                            by <Link href={`/admin/sales/customers/${order.profiles?.id}`} className="hover:underline font-medium">{order.profiles?.display_name || 'N/A'}</Link> &bull; Qty: {order.quantity}
                        </CardDescription>
                    </div>
                     <Badge variant={order.status === 'completed' ? 'default' : order.status === 'ready' ? 'secondary' : 'outline'}>{order.status}</Badge>
                </div>
            </CardHeader>
            <CardContent>
                <div className="flex justify-between items-center">
                    <div className="font-bold">GHS {finalTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleString()}</p>
                </div>
            </CardContent>
            <CardFooter className="flex-col items-stretch gap-2">
                 <StatusSelector 
                    orderId={order.id} 
                    currentStatus={order.status}
                    onUpdate={handleStatusUpdate}
                    isPending={pendingOrderId === order.id}
                  />
                  <Button asChild variant="outline">
                        <Link href={`/admin/sales/${order.id}`}><Eye className="mr-2 h-4 w-4" />View Details</Link>
                  </Button>
            </CardFooter>
        </Card>
    )
}

export default function AdminSalesOrdersClientPage({ initialOrders, stats }: { 
    initialOrders: OrderWithDetails[], 
    stats: { todaysRevenue: number, pendingOrdersCount: number, readyForPickupCount: number, totalOrdersCount: number } 
}) {
    const [isRefreshing, startRefreshTransition] = useTransition();
    const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);
    const { toast } = useToast();
    const router = useRouter();

    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortOrder, setSortOrder] = useState('newest-first');
    const [downloadDate, setDownloadDate] = useState<Date|undefined>();

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
                toast({ title: "Success", description: "Order status updated." });
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

        const headers = ['Order ID', 'Date', 'Customer Name', 'Customer Phone', 'Product Name', 'Quantity', 'Price Per Item', 'Total Price', 'Status', 'Notes'];
        const csvContent = [
            headers.join(','),
            ...data.map(order => [
                `"${order.id}"`,
                `"${format(new Date(order.created_at), 'yyyy-MM-dd HH:mm:ss')}"`,
                `"${order.profiles?.display_name || 'N/A'}"`,
                `"${order.profiles?.phone_number || 'N/A'}"`,
                `"${order.products?.name || 'N/A'}"`,
                order.quantity,
                order.price_per_item,
                (order.price_per_item * order.quantity),
                order.status,
                `"${(order.notes || '').replace(/"/g, '""')}"`,
            ].join(','))
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
    <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold md:text-2xl">Sales Dashboard</h1>
            <div className="flex items-center gap-2">
                 <Button onClick={handleRefresh} disabled={isRefreshing} variant="outline" size="sm">
                    <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button><Download className="mr-2 h-4 w-4" />Download Reports</Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Export Orders</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onSelect={handleDownloadAllFiltered}>Download Filtered Orders (.csv)</DropdownMenuItem>
                         <DropdownMenuSub>
                            <DropdownMenuSubTrigger>Download by Date</DropdownMenuSubTrigger>
                            <DropdownMenuPortal>
                                <DropdownMenuSubContent>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="ghost" className="w-full justify-start font-normal">
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {downloadDate ? format(downloadDate, 'PPP') : 'Select a date'}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0">
                                            <Calendar mode="single" selected={downloadDate} onSelect={setDownloadDate} disabled={(date) => date > new Date()} />
                                        </PopoverContent>
                                    </Popover>
                                     <Button disabled={!downloadDate} onClick={() => handleDownloadForDate(downloadDate)} className="w-full mt-2">Download for Selected Date</Button>
                                </DropdownMenuSubContent>
                            </DropdownMenuPortal>
                        </DropdownMenuSub>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Today's Revenue" value={`GHS ${stats.todaysRevenue.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`} icon={DollarSign} />
            <StatCard title="Pending Orders" value={stats.pendingOrdersCount} icon={AlertCircle} />
            <StatCard title="Ready for Pickup" value={stats.readyForPickupCount} icon={Package} />
            <StatCard title="Total Orders" value={stats.totalOrdersCount} icon={Package} />
        </div>
         <Card>
            <CardHeader>
                <CardTitle>Filter & Sort Orders</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row flex-wrap items-center gap-4">
                <div className="relative w-full sm:w-auto sm:flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search by product, customer..." className="pl-10" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                </div>
                 <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                        <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="ready">Ready</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={sortOrder} onValueChange={setSortOrder}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                        <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="newest-first">Newest First</SelectItem>
                        <SelectItem value="oldest-first">Oldest First</SelectItem>
                        <SelectItem value="price-high-low">Price: High to Low</SelectItem>
                        <SelectItem value="price-low-high">Price: Low to High</SelectItem>
                    </SelectContent>
                </Select>
                 {hasActiveFilters && (
                    <Button variant="ghost" onClick={handleClearFilters}><FilterX className="mr-2 h-4 w-4" />Clear</Button>
                )}
            </CardContent>
        </Card>
        <Tabs defaultValue="all">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="all">All Orders ({filteredOrders.length})</TabsTrigger>
                <TabsTrigger value="unattended">Unattended ({unattendedOrders.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="all">
                <Accordion type="multiple" className="space-y-2" defaultValue={Object.keys(groupedAllOrders).slice(0, 1)}>
                    {Object.entries(groupedAllOrders).map(([date, orders]) => <OrderDailyGroup key={date} date={date} orders={orders} handleStatusUpdate={handleStatusUpdate} pendingOrderId={pendingOrderId} />)}
                    {Object.keys(groupedAllOrders).length === 0 && <p className="text-center text-muted-foreground py-16">No orders match the current filters.</p>}
                </Accordion>
            </TabsContent>
            <TabsContent value="unattended">
                 <Accordion type="multiple" className="space-y-2" defaultValue={Object.keys(groupedUnattendedOrders)}>
                    {Object.entries(groupedUnattendedOrders).map(([date, orders]) => <OrderDailyGroup key={date} date={date} orders={orders} handleStatusUpdate={handleStatusUpdate} pendingOrderId={pendingOrderId} />)}
                    {Object.keys(groupedUnattendedOrders).length === 0 && <p className="text-center text-muted-foreground py-16">No unattended orders match the current filters.</p>}
                </Accordion>
            </TabsContent>
        </Tabs>
    </div>
  );
}
