export const dynamic = 'force-dynamic';

import { createServerClient } from '@supabase/ssr';
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
import { Mail, Phone, User, MapPin, StickyNote, Package, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';

type OrderWithDetails = Tables<'orders'> & {
    products: Tables<'products'> | null;
    vendor_products: Tables<'vendor_products'> | null;
    profiles: Tables<'profiles'> | null;
};

export default async function OrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const cookieStore = await cookies();
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

    const { id } = await params;

    const { data: order, error } = await supabaseAdmin
        .from('orders')
        .select('*, products(*), vendor_products:vendor_product_id(*), profiles:profiles!orders_buyer_id_fkey(*)')
        .eq('id', id)
        .returns<OrderWithDetails[]>()
        .single();
    
    if (error || !order) {
        notFound();
    }

    const product = order.products || order.vendor_products;
    const wasDiscounted = order.original_price_per_item > order.price_per_item;
    const finalTotal = order.price_per_item * order.quantity;
    const isDelivery = product?.offers_delivery;

    return (
        <div className="flex flex-col gap-8 pb-12 animate-in fade-in duration-500">
             <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <BackButton />
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black italic uppercase tracking-tighter font-montserrat">
                            Transaction Log
                        </h1>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1 font-poppins">Order ID: #{order.id.substring(0, 8)}</p>
                    </div>
                </div>
                <Badge variant={order.status === 'completed' ? 'default' : order.status === 'ready' ? 'secondary' : order.status === 'cancelled' ? 'destructive' : 'outline'} className="h-8 px-4 text-xs font-black uppercase tracking-widest font-poppins w-fit">
                    {order.status === 'ready' ? (isDelivery ? 'In Transit' : 'Accepted') : order.status}
                </Badge>
            </div>

            <div className="grid gap-6 md:grid-cols-12">
                 {/* Left Column: Summary & Status */}
                 <div className="md:col-span-8 space-y-6">
                    <Card className="border-none shadow-sm rounded-[32px] overflow-hidden bg-white">
                        <CardHeader className="bg-muted/5 border-b p-6 md:p-8">
                            <CardTitle className="text-[11px] font-black uppercase tracking-[3px] text-muted-foreground font-poppins">Product Information</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 md:p-8">
                            <div className="flex flex-col sm:flex-row gap-8">
                                <div className="relative h-40 w-40 sm:h-48 sm:w-48 bg-muted/30 rounded-[24px] overflow-hidden border-2 border-white shadow-md flex-shrink-0">
                                    <Image
                                        src={product?.image_urls?.[0] || 'https://picsum.photos/seed/1/400/400'}
                                        alt={product?.name || 'Product'}
                                        fill
                                        className="object-contain p-4"
                                    />
                                </div>
                                <div className="flex-1 flex flex-col justify-center space-y-4">
                                    <div>
                                        <Badge variant="outline" className="mb-2 text-[9px] font-black uppercase tracking-tighter h-5 px-2 bg-primary/5 text-primary border-primary/10">
                                            {order.product_id ? 'Official Inventory' : 'Vendor Item'}
                                        </Badge>
                                        <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight font-montserrat leading-tight">{product?.name || 'Item Information Unavailable'}</h2>
                                        <p className="text-xs font-bold text-muted-foreground mt-1 uppercase tracking-widest font-poppins">{product?.category || 'General'}</p>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-8 pt-2">
                                        <div>
                                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest font-poppins mb-1">Unit Valuation</p>
                                            <div className="flex items-center gap-2">
                                                <span className="text-lg font-black text-foreground font-roboto">GHS {order.price_per_item.toLocaleString()}</span>
                                                {wasDiscounted && <Badge variant="destructive" className="h-4 px-1 text-[8px] font-black uppercase font-poppins">Sale</Badge>}
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest font-poppins mb-1">Order Volume</p>
                                            <span className="text-lg font-black text-foreground font-roboto">{order.quantity} Units</span>
                                        </div>
                                    </div>
                                    
                                    <Separator className="bg-muted/10" />
                                    
                                    <div className="pt-2">
                                        <p className="text-[10px] font-black text-primary uppercase tracking-[3px] font-poppins mb-1">Total Transaction Value</p>
                                        <span className="text-3xl font-black text-foreground font-montserrat tracking-tighter">GHS {finalTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Instructions & Location */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <Card className="border-none shadow-sm rounded-[32px] bg-white overflow-hidden">
                            <CardHeader className="bg-muted/5 border-b p-6">
                                <CardTitle className="text-[11px] font-black uppercase tracking-[3px] text-muted-foreground font-poppins flex items-center gap-2">
                                    <MapPin className="h-3.5 w-3.5 text-primary" /> Delivery Logistics
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                {order.delivery_location ? (
                                    <p className="text-sm font-black text-foreground font-inter bg-primary/5 p-4 rounded-2xl border-2 border-dashed border-primary/10">
                                        {order.delivery_location}
                                    </p>
                                ) : (
                                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest text-center py-4 font-poppins">Self-Pickup Protocol</p>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-sm rounded-[32px] bg-white overflow-hidden">
                            <CardHeader className="bg-muted/5 border-b p-6">
                                <CardTitle className="text-[11px] font-black uppercase tracking-[3px] text-muted-foreground font-poppins flex items-center gap-2">
                                    <StickyNote className="h-3.5 w-3.5 text-amber-600" /> Buyer Notes
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                {order.notes ? (
                                    <p className="text-xs leading-relaxed text-amber-800 italic font-inter bg-amber-50 p-4 rounded-2xl border border-amber-100">
                                        &ldquo;{order.notes}&rdquo;
                                    </p>
                                ) : (
                                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest text-center py-4 font-poppins">No Special Instructions</p>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                 </div>

                 {/* Right Column: Customer Details */}
                 <div className="md:col-span-4 space-y-6">
                    <Card className="border-none shadow-sm rounded-[32px] bg-white overflow-hidden sticky top-8">
                        <CardHeader className="bg-muted/5 border-b p-6 md:p-8">
                            <CardTitle className="text-[11px] font-black uppercase tracking-[3px] text-muted-foreground font-poppins">Buyer Identity</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 md:p-8 space-y-8">
                            <div className="flex flex-col items-center text-center space-y-4">
                                <Avatar className="h-24 w-24 border-[6px] border-background shadow-2xl ring-1 ring-primary/10">
                                    <AvatarImage src={order.profiles?.avatar_url || undefined} className="object-cover" />
                                    <AvatarFallback className="bg-primary/5 text-primary text-3xl font-black font-montserrat">
                                        {order.profiles?.display_name?.charAt(0) || 'U'}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <h3 className="text-xl font-black uppercase tracking-tight font-montserrat">{order.profiles?.display_name || 'Anonymous Buyer'}</h3>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1 font-poppins">Verified Marketplace User</p>
                                </div>
                            </div>

                            <Separator className="bg-muted/10" />

                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest font-poppins">Contact Protocol</p>
                                    {order.profiles?.phone_number ? (
                                        <Button variant="outline" className="w-full h-12 rounded-xl justify-start gap-4 border-2 font-bold font-roboto" asChild>
                                            <a href={`tel:${order.profiles.phone_number}`}>
                                                <Phone className="h-4 w-4 text-primary" />
                                                {order.profiles.phone_number}
                                            </a>
                                        </Button>
                                    ) : (
                                        <p className="text-sm font-medium text-muted-foreground font-inter">No phone number on record.</p>
                                    )}
                                </div>
                                <div className="space-y-1.5">
                                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest font-poppins">Digital ID</p>
                                    <div className="flex items-center gap-3 bg-muted/20 p-4 rounded-xl">
                                        <Mail className="h-4 w-4 text-primary shrink-0" />
                                        <span className="text-xs font-bold text-foreground truncate font-inter lowercase">{order.profiles?.id || 'No email provided'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-primary/5 p-5 rounded-2xl border-2 border-dashed border-primary/10">
                                <p className="text-[10px] font-bold text-primary uppercase tracking-widest leading-relaxed font-poppins flex items-start gap-2">
                                    <ShoppingBag className="h-3.5 w-3.5 shrink-0" />
                                    <span>Initiated transaction on {format(new Date(order.created_at), 'PPPP')}. Status updates will be sent via SMS to the verified phone number.</span>
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                 </div>
            </div>
        </div>
    )
}
