import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, ShoppingCart, Package } from 'lucide-react';
import { Table, TableBody, TableCell, TableHeader, TableRow, TableHead } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tables } from '@/types/supabase';

type OrderWithProductAndBuyer = Tables<'orders'> & {
  products: Pick<Tables<'products'>, 'name'> | null;
  profiles: Pick<Tables<'profiles'>, 'display_name'> | null;
};


async function StatCard({ title, value, icon: Icon }: { title: string, value: string | number, icon: React.ElementType }) {
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

export default async function AdminDashboardPage() {
    const supabase = createClient();

    const { count: productCount } = await supabase.from('products').select('*', { count: 'exact', head: true });
    const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
    const { count: orderCount } = await supabase.from('orders').select('*', { count: 'exact', head: true });
    
    const { data: recentOrders, error } = await supabase
        .from('orders')
        .select('*, products(name), profiles(display_name)')
        .order('created_at', { ascending: false })
        .limit(5)
        .returns<OrderWithProductAndBuyer[]>();

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <StatCard title="Total Products" value={productCount ?? 0} icon={ShoppingCart} />
                <StatCard title="Total Users" value={userCount ?? 0} icon={Users} />
                <StatCard title="Total Orders" value={orderCount ?? 0} icon={Package} />
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
