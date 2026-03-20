
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tables } from '@/types/supabase';
import { AuthPrompt } from '@/components/auth-prompt';

type OrderWithProduct = Tables<'orders'> & {
  products: Pick<Tables<'products'>, 'name' | 'price' | 'image_urls'> | null
};

export default async function OrdersPage() {
  const supabase = createClient();
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
    .select('*, products(name, price, image_urls)')
    .eq('buyer_id', user.id)
    .returns<OrderWithProduct[]>();
    
  if (error) {
    console.error('Error fetching orders:', error);
  }

  return (
      <main className="flex-1 p-8">
        <h1 className="text-3xl font-bold mb-8">My Orders</h1>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders?.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <div className="flex items-center gap-4">
                        <span>{order.products?.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{order.quantity}</TableCell>
                    <TableCell>GHS {((order.products?.price || 0) * order.quantity).toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant={order.status === 'completed' ? 'default' : 'secondary'}>{order.status}</Badge>
                    </TableCell>
                    <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
                {!orders || orders.length === 0 && (
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
