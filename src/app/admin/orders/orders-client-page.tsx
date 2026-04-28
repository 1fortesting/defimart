'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHeader, TableRow, TableHead } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tables, Database } from '@/types/supabase';
import { Button } from '@/components/ui/button';
import { updateOrderStatus } from './actions';
import { useState, useTransition, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { ArrowDown, Eye, Loader2, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
            </Select>
            <input type="hidden" name="orderId" value={orderId} />
            <Button size="sm" type="submit" disabled={isPending} className="w-[60px]">
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
            </Button>
        </form>
    );
}

const OrderTableRow = ({ order, handleStatusUpdate, pendingOrderId }: { order: OrderWithDetails, handleStatusUpdate: (fd: FormData) => void, pendingOrderId: string | null }) => {
    const wasDiscounted = order.original_price_per_item > order.price_per_item;
    const originalTotal = order.original_price_per_item * order.quantity;
    const finalTotal = order.price_per_item * order.quantity;
    const discountPercentage = wasDiscounted ? ((originalTotal - finalTotal) / originalTotal) * 100 : 0;

    return (
        <TableRow>
            <TableCell>
                <div>{order.profiles?.display_name || 'N/A'}</div>
                <div className="text-sm text-muted-foreground hidden lg:block">{order.profiles?.phone_number || 'No phone'}</div>
            </TableCell>
            <TableCell>
                <div>{order.products?.name || 'N/A'}</div>
                <div className="text-sm text-muted-foreground">Qty: {order.quantity}</div>
            </TableCell>
            <TableCell className="hidden sm:table-cell">
                {wasDiscounted ? (
                <div className="flex flex-col">
                    <span className="text-muted-foreground line-through">GHS {originalTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-base">GHS {finalTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        <Badge variant="destructive" className="flex items-center gap-1">
                            <ArrowDown className="h-3 w-3" /> {discountPercentage.toFixed(0)}%
                        </Badge>
                    </div>
                </div>
                ) : (
                <span className="font-bold">GHS {finalTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                )}
            </TableCell>
            <TableCell className="hidden lg:table-cell">{new Date(order.created_at).toLocaleString()}</TableCell>
            <TableCell>
                <Badge variant={order.status === 'completed' ? 'default' : order.status === 'ready' ? 'secondary' : order.status === 'cancelled' ? 'destructive' : 'outline'}>{order.status}</Badge>
            </TableCell>
            <TableCell className="hidden md:table-cell">
                <StatusSelector 
                orderId={order.id} 
                currentStatus={order.status}
                onUpdate={handleStatusUpdate}
                isPending={pendingOrderId === order.id}
                />
            </TableCell>
            <TableCell>
                <Button asChild size="icon" variant="outline">
                <Link href={`/admin/orders/${order.id}`}>
                    <Eye className="h-4 w-4" />
                    <span className="sr-only">View Details</span>
                </Link>
                </Button>
            </TableCell>
        </TableRow>
    )
}

const OrderCard = ({ order, handleStatusUpdate, pendingOrderId }: { order: OrderWithDetails, handleStatusUpdate: (fd: FormData) => void, pendingOrderId: string | null }) => {
    const finalTotal = order.price_per_item * order.quantity;
    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-base">{order.products?.name || 'N/A'}</CardTitle>
                        <CardDescription>
                            by {order.profiles?.display_name || 'N/A'} &bull; Qty: {order.quantity}
                        </CardDescription>
                    </div>
                     <Badge variant={order.status === 'completed' ? 'default' : order.status === 'ready' ? 'secondary' : order.status === 'cancelled' ? 'destructive' : 'outline'}>{order.status}</Badge>
                </div>
            </CardHeader>
            <CardContent>
                <div className="flex justify-between items-center">
                    <div className="font-bold">GHS {finalTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleString()}</p>
                </div>
            </CardContent>
            <CardFooter className="flex-col items-stretch gap-2">
                 <StatusSelector 
                    orderId={order.id} 
                    currentStatus={order.status}
                    onUpdate={handleStatusUpdate}
                    isPending={pendingOrderId === order.id}
                  />
                  <Button asChild variant="outline">
                        <Link href={`/admin/orders/${order.id}`}><Eye className="mr-2 h-4 w-4" />View Details</Link>
                  </Button>
            </CardFooter>
        </Card>
    )
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
        {/* Desktop Table */}
        <div className="hidden md:block">
            <Table>
            <TableHeader>
                <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Product</TableHead>
                <TableHead className="hidden sm:table-cell">Pricing</TableHead>
                <TableHead className="hidden lg:table-cell">Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Actions</TableHead>
                <TableHead><span className="sr-only">View</span></TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {orders?.map((order) => (
                    <OrderTableRow key={order.id} order={order} handleStatusUpdate={handleStatusUpdate} pendingOrderId={pendingOrderId} />
                ))}
                {(!orders || orders.length === 0) && (
                    <TableRow>
                        <TableCell colSpan={7} className="text-center">No orders found.</TableCell>
                    </TableRow>
                )}
            </TableBody>
            </Table>
        </div>
        {/* Mobile View */}
        <div className="grid gap-4 md:hidden">
            {orders?.map((order) => (
                <OrderCard key={order.id} order={order} handleStatusUpdate={handleStatusUpdate} pendingOrderId={pendingOrderId} />
            ))}
            {(!orders || orders.length === 0) && (
                <p className="text-center text-muted-foreground py-8">No orders found.</p>
            )}
        </div>
      </CardContent>
    </Card>
  );
}

    