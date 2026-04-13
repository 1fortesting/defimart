'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { RefreshCw, Search, Star, Film } from 'lucide-react';
import type { Tables } from '@/types/supabase';
import { updateFeatureStatus } from './actions';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';

function FeatureSwitch({ productId, initialIsFeatured, initialIsOutstanding, onUpdate, isPending }: {
    productId: string;
    initialIsFeatured: boolean;
    initialIsOutstanding: boolean;
    onUpdate: (productId: string, isFeatured: boolean, isOutstanding: boolean) => void;
    isPending: boolean;
}) {
    const [isFeatured, setIsFeatured] = useState(initialIsFeatured);
    const [isOutstanding, setIsOutstanding] = useState(initialIsOutstanding);

    const handleFeatureChange = (type: 'featured' | 'outstanding', checked: boolean) => {
        if (type === 'featured') {
            setIsFeatured(checked);
            onUpdate(productId, checked, isOutstanding);
        } else {
            setIsOutstanding(checked);
            onUpdate(productId, isFeatured, checked);
        }
    };

    return (
        <div className="flex items-center gap-6">
            <div className="flex items-center space-x-2">
                <Switch
                    id={`featured-${productId}`}
                    checked={isFeatured}
                    onCheckedChange={(checked) => handleFeatureChange('featured', checked)}
                    disabled={isPending}
                    aria-label="Featured"
                />
                 <Label htmlFor={`featured-${productId}`}>Featured</Label>
            </div>
             <div className="flex items-center space-x-2">
                <Switch
                    id={`outstanding-${productId}`}
                    checked={isOutstanding}
                    onCheckedChange={(checked) => handleFeatureChange('outstanding', checked)}
                    disabled={isPending}
                    aria-label="Outstanding"
                />
                 <Label htmlFor={`outstanding-${productId}`}>Outstanding</Label>
            </div>
        </div>
    );
}

export default function HomepageFeaturesClientPage({ products }: { products: Tables<'products'>[] }) {
    const router = useRouter();
    const [isRefreshing, startRefreshTransition] = useTransition();
    const [searchQuery, setSearchQuery] = useState('');
    const [pendingProductId, setPendingProductId] = useState<string | null>(null);
    const [isUpdating, startUpdateTransition] = useTransition();
    const { toast } = useToast();

    const handleRefresh = () => startRefreshTransition(() => router.refresh());

    const handleUpdate = (productId: string, isFeatured: boolean, isOutstanding: boolean) => {
        setPendingProductId(productId);
        startUpdateTransition(async () => {
            const result = await updateFeatureStatus(productId, isFeatured, isOutstanding);
            if (!result.success) {
                toast({ variant: 'destructive', title: 'Update Failed', description: result.message });
            } else {
                 toast({ variant: 'success', title: 'Success!', description: 'Homepage feature status updated.' });
            }
            setPendingProductId(null);
        });
    };

    const filteredProducts = products.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <h1 className="text-lg font-semibold md:text-2xl">Homepage Features</h1>
                <Button onClick={handleRefresh} disabled={isRefreshing} variant="outline" size="sm">
                    <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Manage Homepage Products</CardTitle>
                    <CardDescription>
                        Control which products appear in the main slider (Featured) and the special section below (Outstanding).
                    </CardDescription>
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
                                <TableHead className="hidden w-[100px] sm:table-cell">
                                    <span className="sr-only">Image</span>
                                </TableHead>
                                <TableHead>Product Name</TableHead>
                                <TableHead className="text-center w-[300px]">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredProducts.map(product => (
                                <TableRow key={product.id}>
                                    <TableCell className="hidden sm:table-cell">
                                        <Image
                                            src={product.image_urls?.[0] || 'https://picsum.photos/seed/1/100/100'}
                                            alt={product.name}
                                            width={64}
                                            height={64}
                                            className="aspect-square rounded-md object-cover"
                                        />
                                    </TableCell>
                                    <TableCell className="font-medium">{product.name}</TableCell>
                                    <TableCell className="text-center">
                                        <FeatureSwitch
                                            productId={product.id}
                                            initialIsFeatured={product.is_featured || false}
                                            initialIsOutstanding={product.is_outstanding || false}
                                            onUpdate={handleUpdate}
                                            isPending={isUpdating && pendingProductId === product.id}
                                        />
                                    </TableCell>
                                </TableRow>
                            ))}
                            {filteredProducts.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center h-24">No products match your search.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
