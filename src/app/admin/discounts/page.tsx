import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Edit } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Tables } from '@/types/supabase';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

const DiscountedProductRow = ({ product }: { product: Tables<'products'> }) => {
  const isDiscountActive = product.discount_percentage && product.discount_end_date && new Date(product.discount_end_date) > new Date();

  if (!isDiscountActive) return null;

  const discountedPrice = product.price - (product.price * (product.discount_percentage! / 100));

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
      <TableCell>GHS {product.price.toFixed(2)}</TableCell>
      <TableCell>
        <Badge variant="secondary">{product.discount_percentage}%</Badge>
      </TableCell>
      <TableCell className="font-semibold">GHS {discountedPrice.toFixed(2)}</TableCell>
      <TableCell className="hidden md:table-cell">{product.discount_end_date ? format(new Date(product.discount_end_date), 'PPpp') : 'N/A'}</TableCell>
      <TableCell>
        <Button asChild variant="ghost" size="icon">
          <Link href={`/admin/products/${product.id}/edit`}>
            <Edit className="h-4 w-4" />
            <span className="sr-only">Edit</span>
          </Link>
        </Button>
      </TableCell>
    </TableRow>
  )
}

export default async function AdminDiscountsPage() {
  const supabase = createClient();

  const { data: products } = await supabase
    .from('products')
    .select('*')
    .gt('discount_percentage', 0)
    .gt('discount_end_date', new Date().toISOString())
    .order('created_at', { ascending: false })
    .returns<Tables<'products'>[]>();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl">Active Discounts</h1>
      </div>
      <Card>
        <CardHeader>
            <CardTitle>Discounted Products</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="hidden w-[100px] sm:table-cell">
                  <span className="sr-only">Image</span>
                </TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Original Price</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Discounted Price</TableHead>
                <TableHead className="hidden md:table-cell">Ends At</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products?.map((product) => (
                <DiscountedProductRow key={product.id} product={product} />
              ))}
               {(!products || products.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">No active discounts found.</TableCell>
                  </TableRow>
                )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
