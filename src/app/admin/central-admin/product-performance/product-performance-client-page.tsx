'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHeader, TableRow, TableHead } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FilterX, Star, Download, Search, Bot, Loader2 } from 'lucide-react';
import { ProductWithSalesAndReviews } from './page';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from '@/components/ui/input';
import { 
  AlertDialog, 
  AlertDialogContent, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogDescription, 
  AlertDialogFooter,
  AlertDialogCancel
} from '@/components/ui/alert-dialog';
import { getReviewSummaryForProduct } from './actions';
import { Badge } from '@/components/ui/badge';
import { OutstandingProductsCard } from '@/components/admin/outstanding-products-card';


export default function ProductPerformanceClientPage({
    productsWithPerf,
    outstandingProducts,
    allProducts,
    currentFilters
}: {
    productsWithPerf: ProductWithSalesAndReviews[],
    outstandingProducts: ProductWithSalesAndReviews[],
    allProducts: { id: string, name: string }[],
    currentFilters: { date?: string, productId?: string }
}) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const [selectedDate, setSelectedDate] = useState<string>(currentFilters.date || '');
    const [selectedProductId, setSelectedProductId] = useState<string | undefined>(
        currentFilters.productId
    );
    const [searchQuery, setSearchQuery] = useState('');

    const [isSummaryLoading, setIsSummaryLoading] = useState(false);
    const [selectedProductForSummary, setSelectedProductForSummary] = useState<ProductWithSalesAndReviews | null>(null);
    const [summaryResult, setSummaryResult] = useState<{ summary: string; sentiment: string; error?: string } | null>(null);

    const filteredProducts = productsWithPerf.filter(product => 
        product.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleGenerateSummary = async (product: ProductWithSalesAndReviews) => {
        setSelectedProductForSummary(product);
        setIsSummaryLoading(true);
        setSummaryResult(null);

        const result = await getReviewSummaryForProduct(product.id);
        if ('error' in result) {
            setSummaryResult({ summary: '', sentiment: 'Neutral', error: result.error as string });
        } else {
            setSummaryResult(result as { summary: string; sentiment: string; });
        }
        setIsSummaryLoading(false);
    };

    const handleApplyFilters = () => {
        const params = new URLSearchParams(searchParams.toString());
        if (selectedDate) {
            params.set('date', selectedDate);
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
    
    const handleDownloadReport = () => {
        const dataToDownload = filteredProducts.map(p => ({
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
    };
    
    const hasFilters = currentFilters.date || currentFilters.productId;

    return (
        <>
            <div className="flex items-center justify-between">
                <h1 className="text-lg font-semibold md:text-2xl">Product Performance</h1>
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                       <Button>
                          <Download className="mr-2 h-4 w-4" />
                          Download Report
                       </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Performance Report</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onSelect={handleDownloadReport}>
                            Product Performance (.csv)
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
            
            <OutstandingProductsCard products={outstandingProducts} />

            <Card>
                <CardHeader>
                    <CardTitle>Filters</CardTitle>
                    <CardDescription>Filter performance data by date and/or product.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col sm:flex-row flex-wrap items-start gap-4">
                     <Input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="w-full sm:w-[240px]"
                        placeholder="Filter by date"
                        max={format(new Date(), 'yyyy-MM-dd')}
                    />

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
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                        <div>
                            <CardTitle>All Product Performance</CardTitle>
                            <CardDescription className="mt-1">
                                View performance metrics for all products. Sorted by revenue by default.
                            </CardDescription>
                        </div>
                         <Button 
                            onClick={() => filteredProducts.length > 0 && handleGenerateSummary(filteredProducts[0])} 
                            disabled={isSummaryLoading || filteredProducts.length === 0}
                        >
                            {isSummaryLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bot className="mr-2 h-4 w-4" />}
                            AI Summary for Top Result
                        </Button>
                    </div>
                    <div className="pt-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                            <Input
                            placeholder="Search products..."
                            className="pl-10 max-w-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
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
                            {filteredProducts.map(product => (
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
                            {filteredProducts.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center h-24">No data for the selected filters.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <AlertDialog open={!!selectedProductForSummary} onOpenChange={(open) => !open && setSelectedProductForSummary(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>AI Review Summary for {selectedProductForSummary?.name}</AlertDialogTitle>
                        <AlertDialogDescription>
                            An AI-generated summary of the most recent customer reviews.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    {isSummaryLoading && <div className="flex justify-center items-center h-24"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}
                    {summaryResult && (
                        <div>
                            {summaryResult.error ? (
                                <p className="text-red-500">{summaryResult.error}</p>
                            ) : (
                                <>
                                    <p className="mb-4">{summaryResult.summary}</p>
                                    <p><strong>Overall Sentiment:</strong> <Badge variant={summaryResult.sentiment === 'Positive' ? 'default' : summaryResult.sentiment === 'Negative' ? 'destructive' : 'secondary'}>{summaryResult.sentiment}</Badge></p>
                                </>
                            )}
                        </div>
                    )}
                    <AlertDialogFooter>
                        <AlertDialogCancel>Close</AlertDialogCancel>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
