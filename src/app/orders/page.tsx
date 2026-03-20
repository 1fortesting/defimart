import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { logout } from '../auth/actions';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tables } from '@/types/supabase';

const Header = ({ user }: { user: any }) => (
  <header className="bg-card border-b p-4 flex justify-between items-center">
    <div className="font-bold text-lg text-primary">
      <Link href="/">DEFIMART</Link>
    </div>
    <div className="flex items-center gap-4">
      <Button variant="link" asChild>
        <Link href="/orders">My Orders</Link>
      </Button>
      <span className="text-sm text-muted-foreground">
        Welcome, {user.user_metadata?.display_name || user.email}
      </span>
      <form action={logout}>
        <Button variant="outline" size="sm">
          Logout
        </Button>
      </form>
    </div>
  </header>
);

type OrderWithProduct = Tables<'orders'> & {
  products: Pick<Tables<'products'>, 'name' | 'price' | 'image_urls'> | null
};

export default async function OrdersPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
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
    <div className="min-h-screen flex flex-col">
      <Header user={user} />
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
                    <TableCell>${((order.products?.price || 0) * order.quantity).toFixed(2)}</TableCell>
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
    </div>
  );
}
