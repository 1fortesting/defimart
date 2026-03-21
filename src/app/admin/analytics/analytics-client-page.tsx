'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Package, Users, Star, ShoppingCart, Download } from 'lucide-react';
import { SalesChart } from './sales-chart';
import { Table, TableBody, TableCell, TableHeader, TableRow, TableHead } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { StarRating } from '@/components/star-rating';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ProductWithSalesAndReviews, ReviewWithProductAndProfile } from './page';
import { format } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const StatCard = ({ title, value, icon: Icon, change }: { title: string, value: string | number, icon: React.ElementType, change?: string }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
            {change && <p className="text-xs text-muted-foreground">{change}</p>}
        </CardContent>
    </Card>
);


export default function AnalyticsClientPage({ stats, dailySales, productsWithPerf, recentReviews }: {
    stats: { totalRevenue: number, totalSales: number, totalCustomers: number, productCount: number },
    dailySales: { date: string, total: number }[],
    productsWithPerf: ProductWithSalesAndReviews[],
    recentReviews: ReviewWithProductAndProfile[]
}) {

    const downloadCSV = (data: any[], filename: string) => {
        if (data.length === 0) return;
        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row => headers.map(header => {
                const cell = row[header];
                const stringCell = (cell === null || cell === undefined) ? '' : String(cell);
                // Escape quotes and commas
                return `"${stringCell.replace(/"/g, '""')}"`;
            }).join(','))
        ].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        if (link.href) {
            URL.revokeObjectURL(link.href);
        }
        link.href = URL.createObjectURL(blob);
        link.download = `${filename}_${format(new Date(), 'yyyy-MM-dd')}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    
    const handleDownloadAllProducts = () => {
        const dataToDownload = productsWithPerf.map(p => ({
            id: p.id,
            name: p.name,
            category: p.category,
            price: p.price,
            quantity_on_hand: p.quantity,
            total_sales_units: p.total_sales,
            total_revenue: p.total_revenue.toFixed(2),
            average_rating: p.average_rating.toFixed(2),
            review_count: p.review_count,
            created_at: format(new Date(p.created_at), 'yyyy-MM-dd'),
        }));
        downloadCSV(dataToDownload, 'all_products_performance');
    }

    return (
        <>
            <div className="flex justify-end">
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                       <Button>
                          <Download className="mr-2 h-4 w-4" />
                          Download Reports
                       </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Performance Reports</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onSelect={handleDownloadAllProducts}>
                            All Product Performance (.csv)
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard title="Total Revenue" value={`GHS ${stats.totalRevenue.toFixed(2)}`} icon={DollarSign} />
                <StatCard title="Total Sales" value={`+${stats.totalSales}`} icon={ShoppingCart} />
                <StatCard title="Total Customers" value={stats.totalCustomers} icon={Users} />
                <StatCard title="Total Products" value={stats.productCount} icon={Package} />
            </div>
            <div className="grid gap-4 grid-cols-1 lg:grid-cols-7">
                <Card className="lg:col-span-4">
                    <CardHeader>
                        <CardTitle>Sales Overview</CardTitle>
                        <CardDescription>Total revenue for the last 7 days.</CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                       <SalesChart data={dailySales} />
                    </CardContent>
                </Card>
                <Card className="lg:col-span-3">
                    <CardHeader>
                        <CardTitle>Top Products</CardTitle>
                        <CardDescription>Your best-selling products by revenue.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Product</TableHead>
                                    <TableHead className="text-right">Revenue</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {productsWithPerf.slice(0, 5).map(product => (
                                <TableRow key={product.id}>
                                    <TableCell>{product.name}</TableCell>
                                    <TableCell className="text-right">GHS {product.total_revenue.toFixed(2)}</TableCell>
                                </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
            <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>All Product Performance</CardTitle>
                    </CardHeader>
                    <CardContent>
                         <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Product</TableHead>
                                    <TableHead>Sales</TableHead>
                                    <TableHead>Revenue</TableHead>
                                    <TableHead>Rating</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {productsWithPerf.map(product => (
                                    <TableRow key={product.id}>
                                        <TableCell className="font-medium">{product.name}</TableCell>
                                        <TableCell>{product.total_sales}</TableCell>
                                        <TableCell>GHS {product.total_revenue.toFixed(2)}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1">
                                                <Star className="h-4 w-4 text-primary" /> {product.average_rating.toFixed(1)} ({product.review_count})
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>Recent Reviews</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {recentReviews.map(review => (
                            <div key={review.id} className="flex items-start gap-4">
                               <Avatar>
                                    <AvatarFallback>{review.profiles?.display_name?.charAt(0) || 'U'}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <div className="flex justify-between items-center">
                                        <p className="font-semibold">{review.profiles?.display_name || 'Anonymous'}</p>
                                        <StarRating rating={review.rating} size={14} showText={false} />
                                    </div>
                                    <p className="text-sm text-muted-foreground">on <span className="font-medium">{review.products?.name || 'a product'}</span></p>
                                    <p className="text-sm mt-1">{review.comment}</p>
                                </div>
                            </div>
                        ))}
                         {recentReviews.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No recent reviews.</p>}
                    </CardContent>
                </Card>
            </div>
        </>
    )
}
