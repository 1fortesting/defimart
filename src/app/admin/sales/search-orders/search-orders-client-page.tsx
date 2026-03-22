'use client';

import { useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableHeader, TableRow, TableHead } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Calendar as CalendarIcon, Download, Search as SearchIcon, Eye } from 'lucide-react';
import type { OrderWithDetails } from './page';
import { useToast } from '@/hooks/use-toast';

export default function SearchOrdersClientPage({ orders, currentDate }: { orders: OrderWithDetails[], currentDate?: string }) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { toast } = useToast();

    const [selectedDate, setSelectedDate] = useState<Date | undefined>(
        currentDate ? new Date(`${currentDate}T12:00:00`) : undefined
    );
    
    const handleSearch = () => {
        if (selectedDate) {
            router.push(`${pathname}?date=${format(selectedDate, 'yyyy-MM-dd')}`);
        }
    };

    const downloadCSV = (data: OrderWithDetails[], filename: string) => {
        if (data.length === 0) {
            toast({ variant: 'destructive', title: 'No Data', description: 'There are no orders for the selected date to export.'});
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

    const handleDownloadReport = () => {
        if (currentDate) {
            downloadCSV(orders, `defimart_orders_${currentDate}`);
        } else {
             toast({ variant: 'destructive', title: 'No Date Selected', description: 'Please select a date to download a report.'});
        }
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <h1 className="text-lg font-semibold md:text-2xl">Search Orders by Date</h1>
                {currentDate && orders.length > 0 && (
                    <Button onClick={handleDownloadReport}>
                        <Download className="mr-2 h-4 w-4" />
                        Download Report (.csv)
                    </Button>
                )}
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Select a Date</CardTitle>
                    <CardDescription>Choose a specific date to view all orders placed on that day.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col sm:flex-row items-center gap-4">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                            variant={"outline"}
                            className={cn(
                                "w-full sm:w-[280px] justify-start text-left font-normal",
                                !selectedDate && "text-muted-foreground"
                            )}
                            >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar
                                mode="single"
                                selected={selectedDate}
                                onSelect={setSelectedDate}
                                initialFocus
                                disabled={(date) => date > new Date()}
                            />
                        </PopoverContent>
                    </Popover>
                    <Button onClick={handleSearch} disabled={!selectedDate}>
                        <SearchIcon className="mr-2 h-4 w-4" />
                        Search
                    </Button>
                </CardContent>
            </Card>

            {currentDate && (
                 <Card>
                    <CardHeader>
                        <CardTitle>Search Results</CardTitle>
                        <CardDescription>
                            Showing {orders.length} {orders.length === 1 ? 'order' : 'orders'} for {format(new Date(`${currentDate}T12:00:00`), 'PPP')}.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Product</TableHead>
                                    <TableHead>Total Price</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Time</TableHead>
                                    <TableHead><span className="sr-only">View</span></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {orders.map(order => (
                                    <TableRow key={order.id}>
                                        <TableCell>
                                            <div className="font-medium">{order.profiles?.display_name || 'N/A'}</div>
                                            <div className="text-sm text-muted-foreground">{order.profiles?.phone_number || 'No phone'}</div>
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
                                        <TableCell>GHS {(order.price_per_item * order.quantity).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                                        <TableCell><Badge variant={order.status === 'completed' ? 'default' : order.status === 'ready' ? 'secondary' : 'outline'}>{order.status}</Badge></TableCell>
                                        <TableCell>{format(new Date(order.created_at), 'p')}</TableCell>
                                        <TableCell>
                                             <Button asChild size="icon" variant="outline">
                                                <Link href={`/admin/sales/${order.id}`}>
                                                    <Eye className="h-4 w-4" />
                                                    <span className="sr-only">View Details</span>
                                                </Link>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {orders.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center h-24">No orders found for this date.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
