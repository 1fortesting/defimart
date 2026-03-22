'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Edit, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Tables } from '@/types/supabase';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';

const InventoryProductRow = ({ product }: { product: Tables<'products'> }) => {
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
      <TableCell>
        <Badge variant={product.quantity === 0 ? 'destructive' : 'secondary'}>{product.quantity}</Badge>
      </TableCell>
      <TableCell>GHS {product.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
      <TableCell className="hidden md:table-cell">{product.category ?? 'N/A'}</TableCell>
      <TableCell>
        <Button asChild variant="ghost" size="icon">
          <Link href={`/admin/procurement/products/${product.id}/edit`}>
            <Edit className="h-4 w-4" />
            <span className="sr-only">Edit</span>
          </Link>
        </Button>
      </TableCell>
    </TableRow>
  )
}

export default function InventoryClientPage({ products }: { products: Tables<'products'>[] }) {
    const router = useRouter();
    const [isRefreshing, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl">Low Stock Inventory</h1>
         <Button onClick={() => startTransition(() => router.refresh())} disabled={isRefreshing} variant="outline" size="sm">
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
        </Button>
      </div>
      <Card>
        <CardHeader>
            <CardTitle>Products with 5 or less units</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="hidden w-[100px] sm:table-cell">
                  <span className="sr-only">Image</span>
                </TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Price</TableHead>
                <TableHead className="hidden md:table-cell">Category</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <InventoryProductRow key={product.id} product={product} />
              ))}
               {products.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">No products with low stock.</TableCell>
                  </TableRow>
                )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
