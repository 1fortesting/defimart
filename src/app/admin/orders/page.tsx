'use client';

import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHeader, TableRow, TableHead } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tables, Database } from '@/types/supabase';
import { Button } from '@/components/ui/button';
import { updateOrderStatus } from './actions';
import { useFormStatus } from 'react-dom';
import { useEffect, useState } from 'react';

type OrderWithDetails = Tables<'orders'> & {
  products: Pick<Tables<'products'>, 'name'> | null;
  profiles: Pick<Tables<'profiles'>, 'display_name' | 'phone_number'> | null;
};

function StatusSelector({ orderId, currentStatus }: { orderId: string, currentStatus: Database['public']['Enums']['order_status'] }) {
    const { pending } = useFormStatus();

    return (
        <div className="flex items-center gap-2">
            <Select name="status" defaultValue={currentStatus}>
                <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="ready">Ready</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
            </Select>
            <input type="hidden" name="orderId" value={orderId} />
            <Button size="sm" type="submit" disabled={pending}>{pending ? 'Saving...' : 'Save'}</Button>
        </div>
    );
}

export default function AdminOrdersPage() {
    const [orders, setOrders] = useState<OrderWithDetails[]>([]);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        const supabase = createClient();
        const fetchOrders = async () => {
            const { data, error } = await supabase
                .from('orders')
                .select('*, products(name), profiles(display_name, phone_number)')
                .order('created_at', { ascending: false })
                .returns<OrderWithDetails[]>();

            if (error) {
                console.error('Error fetching orders:', error);
            } else if (data) {
                setOrders(data);
            }
            setLoading(false);
        }

        fetchOrders();
    }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Orders</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
                <TableRow>
                    <TableCell colSpan={6} className="text-center">Loading...</TableCell>
                </TableRow>
            ) : orders?.map((order) => (
                <TableRow key={order.id}>
                    <TableCell>{order.profiles?.display_name || 'N/A'}</TableCell>
                    <TableCell>{order.profiles?.phone_number || 'N/A'}</TableCell>
                    <TableCell>{order.products?.name || 'N/A'}</TableCell>
                    <TableCell>{order.quantity}</TableCell>
                    <TableCell>{new Date(order.created_at).toLocaleString()}</TableCell>
                    <TableCell>
                      <form action={updateOrderStatus}>
                        <StatusSelector orderId={order.id} currentStatus={order.status} />
                      </form>
                    </TableCell>
                </TableRow>
            ))}
            {!loading && (!orders || orders.length === 0) && (
                <TableRow>
                    <TableCell colSpan={6} className="text-center">No orders found.</TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
