import { createClient } from '@/lib/supabase/server';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tables } from '@/types/supabase';
import { AuthPrompt } from '@/components/auth-prompt';
import { ArrowLeft, ArrowDown, ImageIcon } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

type OrderWithProduct = Tables<'orders'> & {
  products: Pick<Tables<'products'>, 'name' | 'image_urls'> | null;
  vendor_products: Pick<Tables<'vendor_products'>, 'name' | 'image_urls'> | null;
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
    .select('*, products(name, image_urls), vendor_products:vendor_product_id(name, image_urls)')
    .eq('buyer_id', user.id)
    .order('created_at', { ascending: false })
    .returns<OrderWithProduct[]>();
    
  if (error) {
    console.error('Error fetching orders:', error);
  }

  return (
      <main className="flex-1 p-4 md:p-8">
        <div className="container mx-auto max-w-5xl">
            <div className="mb-6">
                <Link href="/profile" className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:opacity-70 transition-all">
                    <ArrowLeft className="h-4 w-4" />
                    Back to My Account
                </Link>
            </div>
            <h1 className="text-3xl font-bold mb-8">My Orders</h1>
            <Card className="rounded-2xl shadow-xl border-none overflow-hidden bg-background">
            <CardContent className="p-0">
                <Table>
                <TableHeader className="bg-muted/50">
                    <TableRow>
                    <TableHead className="font-bold">Product</TableHead>
                    <TableHead className="font-bold">Quantity</TableHead>
                    <TableHead className="font-bold">Total Price</TableHead>
                    <TableHead className="font-bold">Status</TableHead>
                    <TableHead className="font-bold">Date</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {orders?.map((order) => {
                    const product = order.products || order.vendor_products;
                    const wasDiscounted = order.original_price_per_item > order.price_per_item;
                    const originalTotal = order.original_price_per_item * order.quantity;
                    const finalTotal = order.price_per_item * order.quantity;
                    const discountPercentage = wasDiscounted ? ((originalTotal - finalTotal) / originalTotal) * 100 : 0;
                    const imageUrl = product?.image_urls?.[0];

                    return (
                        <TableRow key={order.id} className="hover:bg-muted/5 transition-colors">
                        <TableCell>
                            <div className="flex items-center gap-4">
                            <div className="relative h-14 w-14 bg-muted rounded-xl flex items-center justify-center overflow-hidden border flex-shrink-0">
                                {imageUrl ? (
                                    <Image
                                        src={imageUrl}
                                        alt={product?.name || 'Product'}
                                        fill
                                        className="object-cover"
                                    />
                                ) : (
                                    <ImageIcon className="h-6 w-6 text-muted-foreground/30" />
                                )}
                            </div>
                            <span className="font-bold text-sm md:text-base">{product?.name || 'Item Information Unavailable'}</span>
                            </div>
                        </TableCell>
                        <TableCell className="font-medium">{order.quantity}</TableCell>
                        <TableCell>
                            {wasDiscounted ? (
                            <div className="flex flex-col">
                                <span className="text-[10px] text-muted-foreground line-through">GHS {originalTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                <div className="flex items-center gap-2">
                                    <span className="font-black text-foreground">GHS {finalTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                    {discountPercentage > 0 &&
                                        <Badge variant="destructive" className="h-4 px-1 text-[8px] font-black uppercase">
                                            -{discountPercentage.toFixed(0)}%
                                        </Badge>
                                    }
                                </div>
                            </div>
                            ) : (
                            <span className="font-black text-foreground">GHS {finalTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            )}
                        </TableCell>
                        <TableCell>
                            <Badge variant={order.status === 'completed' ? 'default' : order.status === 'ready' ? 'secondary' : order.status === 'cancelled' ? 'destructive' : 'outline'} className="capitalize font-bold">
                                {order.status}
                            </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground font-medium">{new Date(order.created_at).toLocaleDateString()}</TableCell>
                        </TableRow>
                    )
                    })}
                    {(!orders || orders.length === 0) && (
                    <TableRow>
                        <TableCell colSpan={5} className="text-center py-20">
                            <div className="flex flex-col items-center gap-3">
                                <div className="bg-muted p-4 rounded-full">
                                    <ImageIcon className="h-10 w-10 text-muted-foreground/40" />
                                </div>
                                <p className="text-muted-foreground font-bold">You have no orders yet.</p>
                                <Button asChild variant="outline" size="sm" className="rounded-xl">
                                    <Link href="/">Discover Products</Link>
                                </Button>
                            </div>
                        </TableCell>
                    </TableRow>
                    )}
                </TableBody>
                </Table>
            </CardContent>
            </Card>
        </div>
      </main>
  );
}
