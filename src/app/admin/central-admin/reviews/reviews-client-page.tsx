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
import { FilterX, Calendar as CalendarIcon } from 'lucide-react';
import { ReviewWithProductAndProfile } from './page';
import { StarRating } from '@/components/star-rating';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';


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
                <h1 className="text-lg font-semibold md:text-2xl">Customer Reviews</h1>
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
                </CardHeader>
                <CardContent className="space-y-4">
                    {reviews.map(review => (
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
                     {reviews.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No reviews for the selected filters.</p>}
                </CardContent>
            </Card>
        </>
    )
}
