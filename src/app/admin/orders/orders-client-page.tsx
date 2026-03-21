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
import { cn } from '@/lib/utils';
import { ArrowDown } from 'lucide-react';

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
              <TableHead>Product</TableHead>
              <TableHead>Pricing</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
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
                        <div>{order.profiles?.display_name || 'N/A'}</div>
                        <div className="text-sm text-muted-foreground">{order.profiles?.phone_number || 'No phone'}</div>
                    </TableCell>
                    <TableCell>
                        <div>{order.products?.name || 'N/A'}</div>
                        <div className="text-sm text-muted-foreground">Qty: {order.quantity}</div>
                    </TableCell>
                    <TableCell>
                       {wasDiscounted ? (
                         <div className="flex flex-col">
                            <span className="text-muted-foreground line-through">GHS {originalTotal.toFixed(2)}</span>
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-base">GHS {finalTotal.toFixed(2)}</span>
                                <Badge variant="destructive" className="flex items-center gap-1">
                                    <ArrowDown className="h-3 w-3" /> {discountPercentage.toFixed(0)}%
                                </Badge>
                            </div>
                         </div>
                       ) : (
                        <span className="font-bold">GHS {finalTotal.toFixed(2)}</span>
                       )}
                    </TableCell>
                    <TableCell>{new Date(order.created_at).toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={order.status === 'completed' ? 'default' : order.status === 'ready' ? 'secondary' : 'outline'}>{order.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <StatusSelector orderId={order.id} currentStatus={order.status} />
                    </TableCell>
                </TableRow>
            )})}
            {(!orders || orders.length === 0) && (
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

    