'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHeader, TableRow, TableHead } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tables, Database } from '@/types/supabase';
import { Button } from '@/components/ui/button';
import { updateOrderStatus } from './actions';
import { useFormStatus } from 'react-dom';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';

type OrderWithDetails = Tables<'orders'> & {
  products: Pick<Tables<'products'>, 'name'> | null;
  profiles: Pick<Tables<'profiles'>, 'display_name' | 'phone_number'> | null;
};

function StatusSelector({ orderId, currentStatus }: { orderId: string, currentStatus: Database['public']['Enums']['order_status'] }) {
    const { pending } = useFormStatus();

    return (
        <form action={updateOrderStatus} className="flex items-center gap-2">
            <Select name="status" defaultValue={currentStatus}>
                <SelectTrigger className="w-[140px]">
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
        </form>
    );
}

export default function AdminOrdersClientPage({ initialOrders }: { initialOrders: OrderWithDetails[] }) {
    const [orders, setOrders] = useState<OrderWithDetails[]>(initialOrders);
    
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
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders?.map((order) => (
                <TableRow key={order.id}>
                    <TableCell>{order.profiles?.display_name || 'N/A'}</TableCell>
                    <TableCell>{order.profiles?.phone_number || 'N/A'}</TableCell>
                    <TableCell>{order.products?.name || 'N/A'}</TableCell>
                    <TableCell>{order.quantity}</TableCell>
                    <TableCell>{new Date(order.created_at).toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={order.status === 'completed' ? 'default' : order.status === 'ready' ? 'secondary' : 'outline'}>{order.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <StatusSelector orderId={order.id} currentStatus={order.status} />
                    </TableCell>
                </TableRow>
            ))}
            {(!orders || orders.length === 0) && (
                <TableRow>
                    <TableCell colSpan={7} className="text-center">No orders found.</TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
