'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHeader, TableRow, TableHead } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tables, Database } from '@/types/supabase';
import { Button } from '@/components/ui/button';
import { updateOrderStatus } from './actions';
import { useState, useTransition, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { ArrowDown, Loader2, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

type OrderWithDetails = Tables<'orders'> & {
  products: Pick<Tables<'products'>, 'name'> | null;
  profiles: Pick<Tables<'profiles'>, 'display_name' | 'phone_number'> | null;
};

function StatusSelector({ orderId, currentStatus, onUpdate, isPending }: { 
    orderId: string, 
    currentStatus: Database['public']['Enums']['order_status'],
    onUpdate: (formData: FormData) => void,
    isPending: boolean
}) {
    const [status, setStatus] = useState(currentStatus);

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        formData.set('status', status);
        onUpdate(formData);
    }

    return (
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <Select name="status" defaultValue={currentStatus} onValueChange={(value) => setStatus(value as any)}>
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
            <Button size="sm" type="submit" disabled={isPending} className="w-[60px]">
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
            </Button>
        </form>
    );
}

export default function AdminOrdersClientPage({ initialOrders }: { initialOrders: OrderWithDetails[] }) {
    const [orders, setOrders] = useState<OrderWithDetails[]>(initialOrders);
    const [isTransitioning, startTransition] = useTransition();
    const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);
    const { toast } = useToast();
    const router = useRouter();

    useEffect(() => {
        setOrders(initialOrders);
    }, [initialOrders]);
    
    const handleStatusUpdate = (formData: FormData) => {
        const orderId = formData.get('orderId') as string;
        setPendingOrderId(orderId);
        startTransition(async () => {
            const result = await updateOrderStatus(formData);
            if (result.success) {
                const newStatus = formData.get('status') as Database['public']['Enums']['order_status'];
                setOrders(prevOrders => 
                    prevOrders.map(order => 
                        order.id === orderId ? { ...order, status: newStatus } : order
                    )
                );
                toast({ title: "Success", description: "Order status updated instantly." });
            } else if (result.error) {
                toast({ variant: 'destructive', title: "Update Failed", description: result.error });
            }
            setPendingOrderId(null);
        });
    };
    
    const [isRefreshing, startRefreshTransition] = useTransition();

    const handleRefresh = () => {
        startRefreshTransition(() => {
            router.refresh();
        });
    }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>All Orders</CardTitle>
        <Button onClick={handleRefresh} disabled={isRefreshing} variant="outline" size="sm">
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
        </Button>
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
                      <StatusSelector 
                        orderId={order.id} 
                        currentStatus={order.status}
                        onUpdate={handleStatusUpdate}
                        isPending={pendingOrderId === order.id}
                      />
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
