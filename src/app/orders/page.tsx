import { createClient } from '@/lib/supabase/server';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tables } from '@/types/supabase';
import { AuthPrompt } from '@/components/auth-prompt';
import { ArrowLeft, ImageIcon, Package, Calendar } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { cn, formatPrice } from '@/lib/utils';

type OrderWithProduct = Tables<'orders'> & {
  products: Pick<Tables<'products'>, 'name' | 'image_urls'> | null;
  vendor_products: Pick<Tables<'vendor_products'>, 'name' | 'image_urls'> | null;
};

function MobileOrderCard({ order }: { order: OrderWithProduct }) {
    const product = order.products || order.vendor_products;
    const wasDiscounted = order.original_price_per_item > order.price_per_item;
    const finalTotal = order.price_per_item * order.quantity;
    const imageUrl = product?.image_urls?.[0];

    return (
        <Card className="border-none shadow-sm rounded-2xl overflow-hidden bg-white mb-4 group hover:shadow-md transition-all">
            <CardContent className="p-0">
                <div className="flex p-4 gap-4">
                    <div className="relative h-20 w-20 bg-muted rounded-xl flex items-center justify-center overflow-hidden border flex-shrink-0">
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
                    <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                        <div className="space-y-1">
                            <h3 className="font-montserrat font-bold text-[14px] leading-tight text-foreground truncate uppercase tracking-tight">
                                {product?.name || 'Item Info Unavailable'}
                            </h3>
                            <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                <Package className="h-3 w-3" /> Qty: {order.quantity}
                            </div>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                             <div className="flex flex-col">
                                {wasDiscounted && (
                                    <span className="text-[10px] text-muted-foreground/60 font-bold line-through font-roboto">GHS {(order.original_price_per_item * order.quantity).toLocaleString()}</span>
                                )}
                                <span className="font-montserrat font-black text-lg text-primary tracking-tighter leading-none">
                                    GHS {finalTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            </div>
                            <Badge variant={order.status === 'completed' ? 'default' : order.status === 'ready' ? 'secondary' : order.status === 'cancelled' ? 'destructive' : 'outline'} className="h-6 text-[9px] font-black uppercase tracking-widest font-poppins">
                                {order.status}
                            </Badge>
                        </div>
                    </div>
                </div>
                <div className="bg-muted/30 px-4 py-2 flex justify-between items-center border-t border-muted/20">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-tighter font-poppins">
                        <Calendar className="h-3 w-3" /> {new Date(order.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                    <span className="text-[9px] font-mono text-muted-foreground opacity-50 uppercase">Ref: {order.id.substring(0, 8)}</span>
                </div>
            </CardContent>
        </Card>
    );
}

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
      <main className="flex-1 p-4 md:p-8 bg-muted/20 min-h-screen pb-24">
        <div className="container mx-auto max-w-5xl">
            <div className="mb-6 flex items-center justify-between">
                <Link href="/profile" className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-primary hover:opacity-70 transition-all font-poppins">
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Account
                </Link>
                <h1 className="text-xl md:text-3xl font-black italic uppercase tracking-tighter font-montserrat">Purchase History</h1>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block">
                <Card className="rounded-[32px] shadow-xl border-none overflow-hidden bg-white">
                <CardContent className="p-0">
                    <Table>
                    <TableHeader className="bg-muted/10">
                        <TableRow className="hover:bg-transparent">
                        <TableHead className="font-black text-[11px] uppercase tracking-widest font-poppins h-12">Product</TableHead>
                        <TableHead className="font-black text-[11px] uppercase tracking-widest font-poppins h-12">Quantity</TableHead>
                        <TableHead className="font-black text-[11px] uppercase tracking-widest font-poppins h-12">Total Price</TableHead>
                        <TableHead className="font-black text-[11px] uppercase tracking-widest font-poppins h-12">Status</TableHead>
                        <TableHead className="font-black text-[11px] uppercase tracking-widest font-poppins h-12 text-right px-6">Date</TableHead>
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
                            <TableRow key={order.id} className="hover:bg-muted/5 transition-colors border-muted/20">
                            <TableCell className="py-4">
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
                                <span className="font-bold text-[15px] font-inter">{product?.name || 'Item Information Unavailable'}</span>
                                </div>
                            </TableCell>
                            <TableCell className="font-bold font-inter">{order.quantity}</TableCell>
                            <TableCell>
                                {wasDiscounted ? (
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-muted-foreground line-through font-roboto">GHS {originalTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                    <div className="flex items-center gap-2">
                                        <span className="font-black text-foreground font-roboto">GHS {finalTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                        {discountPercentage > 0 &&
                                            <Badge variant="destructive" className="h-4 px-1 text-[8px] font-black uppercase">
                                                -{discountPercentage.toFixed(0)}%
                                            </Badge>
                                        }
                                    </div>
                                </div>
                                ) : (
                                <span className="font-black text-foreground font-roboto">GHS {finalTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                )}
                            </TableCell>
                            <TableCell>
                                <Badge variant={order.status === 'completed' ? 'default' : order.status === 'ready' ? 'secondary' : order.status === 'cancelled' ? 'destructive' : 'outline'} className="uppercase font-black text-[10px] tracking-widest font-poppins">
                                    {order.status}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground font-bold text-right px-6 font-roboto uppercase">{new Date(order.created_at).toLocaleDateString()}</TableCell>
                            </TableRow>
                        )
                        })}
                        {(!orders || orders.length === 0) && (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center py-32">
                                <div className="flex flex-col items-center gap-4">
                                    <div className="bg-muted/50 p-6 rounded-full">
                                        <Package className="h-10 w-10 text-muted-foreground/30" />
                                    </div>
                                    <p className="text-muted-foreground font-bold font-inter">No transactions found in this protocol.</p>
                                    <Button asChild className="rounded-xl h-11 px-8 font-black uppercase tracking-widest text-[11px] font-poppins">
                                        <Link href="/">Launch Discovery</Link>
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

            {/* Mobile Card Layout */}
            <div className="md:hidden space-y-4">
                {orders?.map(order => <MobileOrderCard key={order.id} order={order} />)}
                {(!orders || orders.length === 0) && (
                    <div className="text-center py-20 bg-white/50 rounded-[32px] border-4 border-dashed border-muted-foreground/10 flex flex-col items-center">
                         <Package className="h-12 w-12 text-muted-foreground/20 mb-4" />
                         <p className="text-muted-foreground font-black uppercase tracking-[2px] text-xs font-poppins">No orders recorded</p>
                    </div>
                )}
            </div>
        </div>
      </main>
  );
}
