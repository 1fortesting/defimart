'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, Tag, RefreshCw, Search } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Tables } from '@/types/supabase';
import { ProductActions } from './product-actions';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Input } from '@/components/ui/input';

const ProductRow = ({ product }: { product: Tables<'products'> }) => {
  const isDiscountActive = product.discount_percentage && product.discount_end_date && new Date(product.discount_end_date) > new Date();

  return (
    <TableRow>
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
      <TableCell className="hidden md:table-cell">{product.category ?? 'N/A'}</TableCell>
      <TableCell className="hidden lg:table-cell">{product.brand ?? 'N/A'}</TableCell>
      <TableCell>GHS {product.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
      <TableCell className="hidden sm:table-cell">{product.quantity?.toLocaleString('en-US') ?? 'N/A'}</TableCell>
      <TableCell>
        {isDiscountActive ? (
          <Badge variant="secondary" className="flex items-center gap-1">
            <Tag className="h-3 w-3" />
            {product.discount_percentage}%
          </Badge>
        ) : (
          '-'
        )}
      </TableCell>
      <TableCell className="hidden md:table-cell">{new Date(product.created_at).toLocaleDateString()}</TableCell>
      <TableCell>
        <ProductActions product={product} />
      </TableCell>
    </TableRow>
  )
}

const ProductCard = ({ product }: { product: Tables<'products'> }) => {
    const isDiscountActive = product.discount_percentage && product.discount_end_date && new Date(product.discount_end_date) > new Date();
    return (
        <Card>
            <CardContent className="p-4">
                <div className="flex gap-4">
                    <Image
                        src={product.image_urls?.[0] || 'https://picsum.photos/seed/1/100/100'}
                        alt={product.name}
                        width={80}
                        height={80}
                        className="aspect-square rounded-md object-cover"
                    />
                    <div className="flex-1 space-y-1">
                        <div className="flex justify-between">
                            <p className="font-medium">{product.name}</p>
                            <ProductActions product={product} />
                        </div>
                        <p className="text-sm text-muted-foreground">{product.category ?? 'N/A'}</p>
                        <p className="text-sm font-bold">GHS {product.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    </div>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
                    <div>
                        <p className="font-semibold">{product.quantity?.toLocaleString('en-US') ?? 'N/A'}</p>
                        <p className="text-xs text-muted-foreground">Quantity</p>
                    </div>
                    <div>
                         {isDiscountActive ? (
                            <>
                                <p className="font-semibold">{product.discount_percentage}%</p>
                                <p className="text-xs text-muted-foreground">Discount</p>
                            </>
                        ) : (
                             <>
                                <p className="font-semibold">-</p>
                                <p className="text-xs text-muted-foreground">Discount</p>
                            </>
                        )}
                    </div>
                    <div>
                        <p className="font-semibold">{new Date(product.created_at).toLocaleDateString()}</p>
                        <p className="text-xs text-muted-foreground">Created</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export default function ProductsClientPage({ products }: { products: Tables<'products'>[] }) {
    const router = useRouter();
    const [isRefreshing, startTransition] = useTransition();
    const [searchQuery, setSearchQuery] = useState('');

    const filteredProducts = products.filter(product => 
        product.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl">Products</h1>
        <div className="flex items-center gap-2">
            <Button onClick={() => startTransition(() => router.refresh())} disabled={isRefreshing} variant="outline" size="sm">
                <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
            </Button>
            <Button asChild size="sm">
            <Link href="/admin/products/new">
                <PlusCircle className="mr-2 h-4 w-4" /> Add Product
            </Link>
            </Button>
        </div>
      </div>
      <Card>
        <CardHeader>
            <CardTitle>All Products</CardTitle>
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
            {/* Desktop Table */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="hidden w-[100px] sm:table-cell">
                      <span className="sr-only">Image</span>
                    </TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className="hidden md:table-cell">Category</TableHead>
                    <TableHead className="hidden lg:table-cell">Brand</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead className="hidden sm:table-cell">Quantity</TableHead>
                    <TableHead>Discount</TableHead>
                    <TableHead className="hidden md:table-cell">Created at</TableHead>
                    <TableHead>
                      <span className="sr-only">Actions</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts?.map((product) => (
                    <ProductRow key={product.id} product={product} />
                  ))}
                   {(!filteredProducts || filteredProducts.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center">No products found.</TableCell>
                      </TableRow>
                    )}
                </TableBody>
              </Table>
            </div>
             {/* Mobile Card List */}
            <div className="grid gap-4 md:hidden">
              {filteredProducts?.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
               {(!filteredProducts || filteredProducts.length === 0) && (
                  <p className="text-center text-muted-foreground py-8">No products found.</p>
                )}
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
