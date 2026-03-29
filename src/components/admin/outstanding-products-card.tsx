'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHeader, TableRow, TableHead } from '@/components/ui/table';
import { Crown, DollarSign, Package, Star } from 'lucide-react';
import type { ProductWithSalesAndReviews } from '@/app/admin/central-admin/product-performance/page';

interface OutstandingProductsCardProps {
    products: ProductWithSalesAndReviews[];
}

export function OutstandingProductsCard({ products }: OutstandingProductsCardProps) {
    if (!products || products.length === 0) {
        return null;
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <Crown className="h-6 w-6 text-yellow-500" />
                    <CardTitle>Most Outstanding Products</CardTitle>
                </div>
                <CardDescription>Top products based on overall performance.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Product</TableHead>
                            <TableHead className="text-right">Revenue</TableHead>
                            <TableHead className="text-right">Sales</TableHead>
                            <TableHead className="text-right">Rating</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {products.map(product => (
                            <TableRow key={product.id}>
                                <TableCell className="font-medium">{product.name}</TableCell>
                                <TableCell className="text-right">GHS {product.total_revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                                <TableCell className="text-right">{product.total_sales.toLocaleString('en-US')}</TableCell>
                                <TableCell className="text-right flex items-center justify-end gap-1">
                                    <Star className="h-4 w-4 text-primary" /> {product.average_rating.toFixed(1)}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
