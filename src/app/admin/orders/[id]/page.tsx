import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database, Tables } from '@/types/supabase';
import { notFound } from 'next/navigation';
import { BackButton } from '@/components/back-button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { Mail, Phone, User } from 'lucide-react';

type OrderWithDetails = Tables<'orders'> & {
    products: Tables<'products'> | null;
    profiles: Tables<'profiles'> | null;
};

export default async function OrderDetailsPage({ params }: { params: { id: string } }) {
    const cookieStore = cookies();
    const supabaseAdmin = createServerClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          cookies: {
            get(name: string) {
              return cookieStore.get(name)?.value;
            },
          },
        }
    );

    const { data: order, error } = await supabaseAdmin
        .from('orders')
        .select('*, products(*), profiles:profiles!orders_buyer_id_fkey(*)')
        .eq('id', params.id)
        .returns<OrderWithDetails[]>()
        .single();
    
    if (error || !order) {
        notFound();
    }

    const wasDiscounted = order.original_price_per_item > order.price_per_item;
    const finalTotal = order.price_per_item * order.quantity;

    return (
        <div className="flex flex-col gap-6">
             <div className="flex items-center gap-4">
                <BackButton />
                <h1 className="text-lg font-semibold md:text-2xl">
                    Order Details
                </h1>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                 <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Order #{order.id.substring(0, 8)}</CardTitle>
                        <CardDescription>
                            Date: {format(new Date(order.created_at), 'PPpp')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                         <div className="space-y-4">
                             <div>
                                <span className="text-sm font-medium text-muted-foreground">Status</span>
                                <p><Badge variant={order.status === 'completed' ? 'default' : order.status === 'ready' ? 'secondary' : order.status === 'cancelled' ? 'destructive' : 'outline'}>{order.status}</Badge></p>
                            </div>
                            <div>
                                <span className="text-sm font-medium text-muted-foreground">Total Amount</span>
                                <p className="font-semibold text-xl">GHS {finalTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                            </div>
                         </div>
                    </CardContent>
                </Card>

                 <Card>
                    <CardHeader>
                        <CardTitle>Customer</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-4">
                            <Avatar>
                                <AvatarImage src={order.profiles?.avatar_url || undefined} />
                                <AvatarFallback>{order.profiles?.display_name?.charAt(0) || 'U'}</AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-semibold">{order.profiles?.display_name || 'Anonymous'}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span>{order.profiles?.id || 'No email provided'}</span>
                        </div>
                         <div className="flex items-center gap-3 text-sm">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span>{order.profiles?.phone_number || 'No phone provided'}</span>
                        </div>
                    </CardContent>
                </Card>

                {order.notes && (
                     <Card className="lg:col-span-3">
                        <CardHeader>
                            <CardTitle>Order Notes</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm whitespace-pre-wrap">{order.notes}</p>
                        </CardContent>
                    </Card>
                )}

                 <Card className="lg:col-span-3">
                    <CardHeader>
                        <CardTitle>Product Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                         <div className="flex flex-col sm:flex-row gap-6">
                            <Image
                                src={order.products?.image_urls?.[0] || 'https://picsum.photos/seed/1/200/200'}
                                alt={order.products?.name || 'Product Image'}
                                width={150}
                                height={150}
                                className="rounded-md object-cover aspect-square"
                            />
                            <div className="flex-1 space-y-4">
                                <div>
                                    <span className="text-sm font-medium text-muted-foreground">Product</span>
                                    <p className="font-semibold text-lg">{order.products?.name || 'Product not found'}</p>
                                </div>
                                 <div className="grid grid-cols-2 gap-4">
                                     <div>
                                        <span className="text-sm font-medium text-muted-foreground">Quantity</span>
                                        <p className="font-semibold">{order.quantity}</p>
                                    </div>
                                    <div>
                                        <span className="text-sm font-medium text-muted-foreground">Price per item</span>
                                        {wasDiscounted ? (
                                            <div className="flex items-baseline gap-2">
                                                <span className="font-semibold">GHS {order.price_per_item.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                                <span className="text-sm text-muted-foreground line-through">GHS {order.original_price_per_item.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                            </div>
                                        ) : (
                                            <p className="font-semibold">GHS {order.price_per_item.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                        )}
                                    </div>
                                 </div>
                            </div>
                         </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

    