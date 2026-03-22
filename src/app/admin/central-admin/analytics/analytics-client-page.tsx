'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Package, Users, ShoppingCart, Download, FilterX, Calendar as CalendarIcon } from 'lucide-react';
import { SalesChart } from './sales-chart';
import { Table, TableBody, TableCell, TableHeader, TableRow, TableHead } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ProductWithSalesAndReviews } from './page';
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
import { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

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


export default function AnalyticsClientPage({
    stats,
    dailySales,
    salesChartDescription,
    salesChartTimeUnit,
    productsWithPerf,
    allProducts,
    currentFilters
}: {
    stats: { totalRevenue: number, totalSales: number, totalCustomers: number, productCount: number },
    dailySales: { date: string, total: number }[],
    salesChartDescription: string,
    salesChartTimeUnit: 'day' | 'hour',
    productsWithPerf: ProductWithSalesAndReviews[],
    allProducts: { id: string, name: string }[],
    currentFilters: { date?: string, productId?: string }
}) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // To avoid timezone issues where a UTC date might be the previous day in a local timezone,
    // we parse the 'yyyy-mm-dd' string from the URL as a local date by providing a time component.
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(
        currentFilters.date ? new Date(`${currentFilters.date}T12:00:00`) : undefined
    );
    const [selectedProductId, setSelectedProductId] = useState<string | undefined>(
        currentFilters.productId
    );

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
                <h1 className="text-lg font-semibold md:text-2xl">Analytics</h1>
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
            <Card>
                <CardHeader>
                    <CardTitle>Filters</CardTitle>
                    <CardDescription>Filter analytics data by date and/or product.</CardDescription>
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

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard title={hasFilters ? "Filtered Revenue" : "Total Revenue"} value={`GHS ${stats.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} icon={DollarSign} />
                <StatCard title={hasFilters ? "Filtered Units Sold" : "Total Units Sold"} value={`+${stats.totalSales.toLocaleString('en-US')}`} icon={ShoppingCart} />
                <StatCard title="Total Customers" value={stats.totalCustomers.toLocaleString('en-US')} icon={Users} />
                <StatCard title="Total Products" value={stats.productCount.toLocaleString('en-US')} icon={Package} />
            </div>
            <div className="grid gap-4 grid-cols-1 lg:grid-cols-7">
                <Card className="lg:col-span-4">
                    <CardHeader>
                        <CardTitle>Sales Overview</CardTitle>
                        <CardDescription>{salesChartDescription}</CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                       <SalesChart data={dailySales} timeUnit={salesChartTimeUnit} />
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
        </>
    )
}
