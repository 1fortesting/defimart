'use client';

import type { User } from '@supabase/supabase-js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHeader, TableRow, TableHead } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { BackButton } from '@/components/back-button';
import { format } from 'date-fns';
import { DollarSign, Package, Star, Download, Mail, Phone, Calendar as CalendarIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { StarRating } from '@/components/star-rating';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { OrderWithProduct, ReviewWithProduct } from './page';

type UserWithProfile = User & {
    avatar_url?: string | null;
    display_name?: string | null;
    phone_number?: string | null;
}

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

export default function CustomerDetailsClientPage({
    customer,
    stats,
    orders,
    reviews
}: {
    customer: UserWithProfile,
    stats: { totalSpent: number, totalOrders: number, totalReviews: number, avgRating: number },
    orders: OrderWithProduct[],
    reviews: ReviewWithProduct[],
}) {
    const downloadCSV = (data: any[], filename: string) => {
        if (data.length === 0) return;
        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row => headers.map(header => {
                const cell = row[header];
                const stringCell = (cell === null || cell === undefined) ? '' : String(cell);
                return `"${stringCell.replace(/"/g, '""')}"`;
            }).join(','))
        ].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${filename}_${customer.id.substring(0, 8)}_${format(new Date(), 'yyyy-MM-dd')}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    
    const handleDownloadOrders = () => {
        const dataToDownload = orders.map(o => ({
            order_id: o.id,
            product_name: o.products?.name || 'N/A',
            quantity: o.quantity,
            price_per_item: o.price_per_item,
            total_price: o.price_per_item * o.quantity,
            status: o.status,
            order_date: format(new Date(o.created_at), 'yyyy-MM-dd HH:mm:ss'),
        }));
        downloadCSV(dataToDownload, 'customer_orders_report');
    }
    
    const handleDownloadReviews = () => {
         const dataToDownload = reviews.map(r => ({
            review_id: r.id,
            product_name: r.products?.name || 'N/A',
            rating: r.rating,
            comment: r.comment || '',
            review_date: format(new Date(r.created_at), 'yyyy-MM-dd HH:mm:ss'),
        }));
        downloadCSV(dataToDownload, 'customer_reviews_report');
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <BackButton />
                    <h1 className="text-lg font-semibold md:text-2xl">
                        Customer Details
                    </h1>
                </div>
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                       <Button>
                          <Download className="mr-2 h-4 w-4" />
                          Download Data
                       </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Customer Reports</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onSelect={handleDownloadOrders}>
                            Order History (.csv)
                        </DropdownMenuItem>
                         <DropdownMenuItem onSelect={handleDownloadReviews}>
                            Review History (.csv)
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>Customer Profile</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16">
                            <AvatarImage src={customer.avatar_url || undefined} />
                            <AvatarFallback>{customer.display_name?.charAt(0) || customer.email?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="text-xl font-semibold">{customer.display_name || 'Anonymous'}</p>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                                <Mail className="h-4 w-4" />
                                <span>{customer.email}</span>
                            </div>
                             <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                                <Phone className="h-4 w-4" />
                                <span>{customer.phone_number || 'No phone provided'}</span>
                            </div>
                             <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                                <CalendarIcon className="h-4 w-4" />
                                <span>Joined on {format(new Date(customer.created_at), 'PPP')}</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard title="Total Spent" value={`GHS ${stats.totalSpent.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} icon={DollarSign} />
                <StatCard title="Total Orders" value={stats.totalOrders} icon={Package} />
                <StatCard title="Total Reviews" value={stats.totalReviews} icon={Star} />
                <StatCard title="Avg. Rating Given" value={stats.avgRating.toFixed(1)} icon={Star} />
            </div>

             <Card>
                <CardHeader>
                    <CardTitle>Order History</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Product</TableHead>
                                <TableHead>Total Price</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Date</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                           {orders.map(order => (
                             <TableRow key={order.id}>
                                <TableCell>{order.products?.name || 'N/A'}</TableCell>
                                <TableCell>GHS {(order.price_per_item * order.quantity).toLocaleString()}</TableCell>
                                <TableCell><Badge variant="outline">{order.status}</Badge></TableCell>
                                <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
                            </TableRow>
                           ))}
                           {orders.length === 0 && (
                               <TableRow>
                                   <TableCell colSpan={4} className="text-center">No orders found.</TableCell>
                               </TableRow>
                           )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Review History</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {reviews.map(review => (
                        <div key={review.id} className="flex items-start gap-4 p-4 border rounded-lg">
                            <div className="flex-1">
                                <div className="flex justify-between items-center">
                                    <p className="font-semibold">on <span className="font-medium">{review.products?.name || 'a product'}</span></p>
                                    <StarRating rating={review.rating} size={14} showText={false} />
                                </div>
                                <p className="text-sm mt-1 text-muted-foreground">{review.comment}</p>
                                <p className="text-xs text-muted-foreground mt-2">{format(new Date(review.created_at), 'PPpp')}</p>
                            </div>
                        </div>
                    ))}
                    {reviews.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">This customer has not left any reviews.</p>}
                </CardContent>
            </Card>

        </div>
    )
}
