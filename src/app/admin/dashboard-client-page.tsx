'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, ShoppingCart, Package, RefreshCw } from 'lucide-react';
import { Table, TableBody, TableCell, TableHeader, TableRow, TableHead } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tables } from '@/types/supabase';

type OrderWithProductAndBuyer = Tables<'orders'> & {
  products: Pick<Tables<'products'>, 'name'> | null;
  profiles: Pick<Tables<'profiles'>, 'display_name'> | null;
};

function StatCard({ title, value, icon: Icon }: { title: string, value: string | number, icon: React.ElementType }) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
            </CardContent>
        </Card>
    );
}

export default function DashboardClientPage({
    stats,
    recentOrders
}: {
    stats: { productCount: number, userCount: number, orderCount: number },
    recentOrders: OrderWithProductAndBuyer[]
}) {
    const router = useRouter();
    const [isRefreshing, startTransition] = useTransition();

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <h1 className="text-lg font-semibold md:text-2xl">Dashboard</h1>
                <Button onClick={() => startTransition(() => router.refresh())} disabled={isRefreshing} variant="outline" size="sm">
                    <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <StatCard title="Total Products" value={stats.productCount ?? 0} icon={ShoppingCart} />
                <StatCard title="Total Customers" value={stats.userCount ?? 0} icon={Users} />
                <StatCard title="Total Orders" value={stats.orderCount ?? 0} icon={Package} />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Recent Orders</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Customer</TableHead>
                                <TableHead>Product</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Date</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                           {recentOrders?.map(order => (
                             <TableRow key={order.id}>
                                <TableCell>{order.profiles?.display_name || 'N/A'}</TableCell>
                                <TableCell>{order.products?.name || 'N/A'}</TableCell>
                                <TableCell><Badge variant="outline">{order.status}</Badge></TableCell>
                                <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
                            </TableRow>
                           ))}
                           {(!recentOrders || recentOrders.length === 0) && (
                               <TableRow>
                                   <TableCell colSpan={4} className="text-center">No recent orders.</TableCell>
                               </TableRow>
                           )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
