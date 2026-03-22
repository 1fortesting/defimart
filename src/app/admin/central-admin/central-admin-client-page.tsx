'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Package, Users, Star, ShoppingCart, Download, FilterX, Calendar as CalendarIcon, RefreshCw } from 'lucide-react';
import { Table, TableBody, TableCell, TableHeader, TableRow, TableHead } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { StarRating } from '@/components/star-rating';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useState, useTransition, useEffect } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { type ProductWithSalesAndReviews, type ReviewWithProductAndProfile } from './page';
import { type Tables } from '@/types/supabase';
import { DepartmentLogin } from '@/components/admin/department-login';

type OrderWithProductAndBuyer = Tables<'orders'> & {
  products: Pick<Tables<'products'>, 'name'> | null;
  profiles: Pick<Tables<'profiles'>, 'display_name'> | null;
};

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

// We need a separate component for the chart to avoid it being part of the initial static export
function SalesChartClient({ data, timeUnit }: { data: { date: string, total: number }[], timeUnit: 'day' | 'hour'}) {
    const [SalesChart, setSalesChart] = useState<React.ComponentType<any> | null>(null);

    useEffect(() => {
        import('../sales/sales-chart').then(mod => setSalesChart(() => mod.SalesChart));
    }, []);

    if (!SalesChart) return <div className="h-[200px] w-full flex items-center justify-center"><p>Loading Chart...</p></div>;

    return <SalesChart data={data} timeUnit={timeUnit} />;
}


export default function CentralAdminClientPage({
    dashboardStats,
    recentOrders,
    analyticsStats,
    dailySales,
    salesChartDescription,
    salesChartTimeUnit,
    productsWithPerf,
    recentReviews,
    allProducts,
    currentFilters
}: {
    dashboardStats: { productCount: number, userCount: number, orderCount: number },
    recentOrders: OrderWithProductAndBuyer[],
    analyticsStats: { totalRevenue: number, totalSales: number, totalCustomers: number, productCount: number },
    dailySales: { date: string, total: number }[],
    salesChartDescription: string,
    salesChartTimeUnit: 'day' | 'hour',
    productsWithPerf: ProductWithSalesAndReviews[],
    recentReviews: ReviewWithProductAndProfile[],
    allProducts: { id: string, name: string }[],
    currentFilters: { date?: string, productId?: string }
}) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isRefreshing, startTransition] = useTransition();

    const [selectedDate, setSelectedDate] = useState<Date | undefined>(
        currentFilters.date ? new Date(`${currentFilters.date}T12:00:00`) : undefined
    );
    const [selectedProductId, setSelectedProductId] = useState<string | undefined>(
        currentFilters.productId
    );

    useEffect(() => {
        if (sessionStorage.getItem('defimart-dept-auth-central-admin') === 'true') {
            setIsAuthenticated(true);
        }
    }, []);
    
    if (!isAuthenticated) {
        return <DepartmentLogin 
            departmentName="Central Admin"
            passwordEnvVar="NEXT_PUBLIC_CEO_PASSWORD"
            sessionKey="defimart-dept-auth-central-admin"
            onSuccess={() => setIsAuthenticated(true)}
        />
    }

    const handleApplyFilters = () => {
        const params = new URLSearchParams(searchParams.toString());
        if (selectedDate) {
            params.set('date', format(selectedDate, 'yyyy-MM-dd'));
        } else {
            params.delete('date');
        }
        if (selectedProductId) {
            params.set('productId', selectedProductId);
        } else {
            params.delete('productId');
        }
        router.push(`${pathname}?${params.toString()}`);
    }
    
    const handleClearFilters = () => {
        router.push(pathname);
    }

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
        downloadCSV(dataToDownload, 'product_performance_report');
    }
    
    const hasFilters = currentFilters.date || currentFilters.productId;

    return (
        <>
            <div className="flex items-center justify-between">
                <h1 className="text-lg font-semibold md:text-2xl">Central Admin</h1>
                <div className="flex items-center gap-2">
                    <Button onClick={() => startTransition(() => router.refresh())} disabled={isRefreshing} variant="outline" size="sm">
                        <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
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
                                Product Performance (.csv)
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard title={hasFilters ? "Filtered Revenue" : "Total Revenue"} value={`GHS ${analyticsStats.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} icon={DollarSign} />
                <StatCard title={hasFilters ? "Filtered Units Sold" : "Total Units Sold"} value={`+${analyticsStats.totalSales.toLocaleString('en-US')}`} icon={ShoppingCart} />
                <StatCard title="Total Customers" value={dashboardStats.userCount.toLocaleString('en-US')} icon={Users} />
                <StatCard title="Total Products" value={dashboardStats.productCount.toLocaleString('en-US')} icon={Package} />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Analytics Filters</CardTitle>
                    <CardDescription>Filter sales overview, top products, and performance data.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col sm:flex-row flex-wrap items-center gap-4">
                     <Popover>
                        <PopoverTrigger asChild>
                            <Button
                            variant={"outline"}
                            className={cn(
                                "w-full sm:w-[240px] justify-start text-left font-normal",
                                !selectedDate && "text-muted-foreground"
                            )}
                            >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {selectedDate ? format(selectedDate, "PPP") : <span>Filter by date</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar
                                mode="single"
                                selected={selectedDate}
                                onSelect={setSelectedDate}
                                initialFocus
                                disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                            />
                        </PopoverContent>
                    </Popover>

                    <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                        <SelectTrigger className="w-full sm:w-[240px]">
                            <SelectValue placeholder="Filter by product" />
                        </SelectTrigger>
                        <SelectContent>
                            {allProducts.map(product => (
                                <SelectItem key={product.id} value={product.id}>{product.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <div className="flex gap-2">
                        <Button onClick={handleApplyFilters}>Apply</Button>
                        {hasFilters && (
                            <Button variant="ghost" onClick={handleClearFilters}>
                                <FilterX className="mr-2 h-4 w-4" />
                            Clear
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>

            <div className="grid gap-4 grid-cols-1 lg:grid-cols-7">
                <Card className="lg:col-span-4">
                    <CardHeader>
                        <CardTitle>Sales Overview</CardTitle>
                        <CardDescription>{salesChartDescription}</CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                       <SalesChartClient data={dailySales} timeUnit={salesChartTimeUnit} />
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
                                    <TableCell className="text-right">GHS {product.total_revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
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
                        <CardTitle>Recent Orders</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Product</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Date</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                            {recentOrders?.map(order => (
                                <TableRow key={order.id}>
                                    <TableCell>{order.profiles?.display_name || 'N/A'}</TableCell>
                                    <TableCell>{order.products?.name || 'N/A'}</TableCell>
                                    <TableCell><Badge variant="outline">{order.status}</Badge></TableCell>
                                    <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
                                </TableRow>
                            ))}
                            {(!recentOrders || recentOrders.length === 0) && (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center">No recent orders.</TableCell>
                                </TableRow>
                            )}
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
                                    <AvatarImage src={review.profiles?.avatar_url || undefined} />
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
                         {recentReviews.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No recent reviews for the selected filters.</p>}
                    </CardContent>
                </Card>
            </div>
        </>
    )
}
