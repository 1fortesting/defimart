import { createClient } from '@/lib/supabase/server';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tables } from '@/types/supabase';
import { AuthPrompt } from '@/components/auth-prompt';
import { ArrowDown } from 'lucide-react';
import Image from 'next/image';

type OrderWithProduct = Tables<'orders'> & {
  products: Pick<Tables<'products'>, 'name' | 'image_urls'> | null
};

export default async function OrdersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
        <main className="flex-1 p-8 flex items-center justify-center">
          <AuthPrompt />
        </main>
    )
  }

  const { data: orders, error } = await supabase
    .from('orders')
    .select('*, products(name, image_urls)')
    .eq('buyer_id', user.id)
    .order('created_at', { ascending: false })
    .returns<OrderWithProduct[]>();
    
  if (error) {
    console.error('Error fetching orders:', error);
  }

  return (
      <main className="flex-1 p-4 md:p-8">
        <h1 className="text-3xl font-bold mb-8">My Orders</h1>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Total Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders?.map((order) => {
                  const wasDiscounted = order.original_price_per_item > order.price_per_item;
                  const originalTotal = order.original_price_per_item * order.quantity;
                  const finalTotal = order.price_per_item * order.quantity;
                  const discountPercentage = wasDiscounted ? ((originalTotal - finalTotal) / originalTotal) * 100 : 0;

                  return (
                    <TableRow key={order.id}>
                      <TableCell>
                        <div className="flex items-center gap-4">
                           <Image
                              src={order.products?.image_urls?.[0] || 'https://picsum.photos/seed/1/64/64'}
                              alt={order.products?.name || 'Product Image'}
                              width={64}
                              height={64}
                              className="rounded-md object-cover hidden sm:block"
                            />
                          <span>{order.products?.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{order.quantity}</TableCell>
                      <TableCell>
                        {wasDiscounted ? (
                          <div className="flex flex-col">
                              <span className="text-muted-foreground line-through">GHS {originalTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                              <div className="flex items-center gap-2">
                                  <span className="font-bold">GHS {finalTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                  {discountPercentage > 0 &&
                                    <Badge variant="destructive" className="flex items-center gap-1">
                                        <ArrowDown className="h-3 w-3" /> {discountPercentage.toFixed(0)}%
                                    </Badge>
                                  }
                              </div>
                          </div>
                        ) : (
                          <span className="font-bold">GHS {finalTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={order.status === 'completed' ? 'default' : order.status === 'ready' ? 'secondary' : order.status === 'cancelled' ? 'destructive' : 'outline'}>{order.status}</Badge>
                      </TableCell>
                      <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
                    </TableRow>
                  )
                })}
                {(!orders || orders.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">You have no orders yet.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
  );
}
