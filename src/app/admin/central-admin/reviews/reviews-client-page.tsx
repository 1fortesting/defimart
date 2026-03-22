'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { FilterX, Calendar as CalendarIcon, Download, Search } from 'lucide-react';
import { ReviewWithProductAndProfile } from './page';
import { StarRating } from '@/components/star-rating';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from '@/components/ui/input';

export default function ReviewsClientPage({
    reviews,
    allProducts,
    currentFilters
}: {
    reviews: ReviewWithProductAndProfile[],
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
    const [searchQuery, setSearchQuery] = useState('');

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
    
    const handleDownloadReport = () => {
        const dataToDownload = filteredReviews.map(r => ({
            review_id: r.id,
            product_name: r.products?.name || 'N/A',
            customer_name: r.profiles?.display_name || 'Anonymous',
            rating: r.rating,
            comment: r.comment || '',
            review_date: format(new Date(r.created_at), 'yyyy-MM-dd HH:mm:ss'),
        }));
        downloadCSV(dataToDownload, 'customer_reviews_report');
    };
    
    const hasFilters = currentFilters.date || currentFilters.productId;

    const filteredReviews = reviews.filter(review => {
        const query = searchQuery.toLowerCase();
        return (
            (review.comment && review.comment.toLowerCase().includes(query)) ||
            (review.products?.name && review.products.name.toLowerCase().includes(query)) ||
            (review.profiles?.display_name && review.profiles.display_name.toLowerCase().includes(query))
        );
    });

    return (
        <>
            <div className="flex items-center justify-between">
                <h1 className="text-lg font-semibold md:text-2xl">Customer Reviews</h1>
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                       <Button>
                          <Download className="mr-2 h-4 w-4" />
                          Download Report
                       </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Reviews Report</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onSelect={handleDownloadReport}>
                            Customer Reviews (.csv)
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Filters</CardTitle>
                    <CardDescription>Filter reviews by date and/or product.</CardDescription>
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
                    <CardTitle>All Reviews</CardTitle>
                    <div className="pt-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                            <Input
                            placeholder="Search by product, customer, or comment..."
                            className="pl-10 max-w-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {filteredReviews.map(review => (
                        <div key={review.id} className="flex items-start gap-4 border p-4 rounded-lg">
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
                                <p className="text-xs text-muted-foreground mt-2">{format(new Date(review.created_at), 'PPP')}</p>
                            </div>
                        </div>
                    ))}
                     {filteredReviews.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No reviews for the selected filters.</p>}
                </CardContent>
            </Card>
        </>
    )
}
