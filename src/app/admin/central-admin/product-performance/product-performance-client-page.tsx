'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHeader, TableRow, TableHead } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { FilterX, Calendar as CalendarIcon, Star } from 'lucide-react';
import { ProductWithSalesAndReviews } from './page';

export default function ProductPerformanceClientPage({
    productsWithPerf,
    allProducts,
    currentFilters
}: {
    productsWithPerf: ProductWithSalesAndReviews[],
    allProducts: { id: string, name: string }[],
    currentFilters: { date?: string, productId?: string }
}) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

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
    
    const hasFilters = currentFilters.date || currentFilters.productId;

    return (
        <>
            <div className="flex items-center justify-between">
                <h1 className="text-lg font-semibold md:text-2xl">Product Performance</h1>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Filters</CardTitle>
                    <CardDescription>Filter performance data by date and/or product.</CardDescription>
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
                                    <TableCell>{product.total_sales.toLocaleString('en-US')}</TableCell>
                                    <TableCell>GHS {product.total_revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1">
                                            <Star className="h-4 w-4 text-primary" /> {product.average_rating.toFixed(1)} ({product.review_count})
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {productsWithPerf.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center h-24">No data for the selected filters.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </>
    )
}
