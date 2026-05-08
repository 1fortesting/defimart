
'use client';

import { Tables } from '@/types/supabase';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Calendar, Info, WifiOff, MapPin, Truck } from 'lucide-react';
import { placeOrder } from '@/app/cart/actions';
import Image from 'next/image';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { CheckoutButton } from './checkout-button';
import { useToast } from '@/hooks/use-toast';
import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';

type CartItemWithProduct = Tables<'cart_items'> & {
  products: any | null;
  vendor_products?: any | null;
};

export function CheckoutFormWrapper({ cartItems, subtotal }: { cartItems: CartItemWithProduct[], subtotal: number }) {
  const { toast } = useToast();

  const requiresDelivery = useMemo(() => {
      return cartItems.some(item => {
          const product = item.products || item.vendor_products;
          return product?.offers_delivery === true;
      });
  }, [cartItems]);

  const deliveryFees = useMemo(() => {
      return cartItems.reduce((acc, item) => {
          const product = item.products || item.vendor_products;
          if (product?.offers_delivery && product.delivery_price_type === 'fixed') {
              return acc + (product.delivery_price || 0);
          }
          return acc;
      }, 0);
  }, [cartItems]);

  const totalPayable = subtotal + deliveryFees;

  const handleFormAction = async (formData: FormData) => {
    if (!navigator.onLine) {
        toast({
            title: 'No Internet',
            description: 'Please connect to the internet to place your order.',
            variant: 'destructive'
        });
        return;
    }

    await placeOrder(formData);
  };

  return (
    <form action={handleFormAction} className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-8">
            {requiresDelivery && (
                <Card className="border-2 border-primary/20 shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="bg-primary/5 p-6 md:p-8 flex items-center gap-4 border-b border-primary/10">
                        <div className="bg-primary p-3 rounded-2xl text-white">
                            <Truck className="h-6 w-6" />
                        </div>
                        <div>
                            <CardTitle className="text-xl font-black uppercase tracking-tight">Delivery Details</CardTitle>
                            <CardDescription className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-0.5">Some items in your cart offer direct delivery.</CardDescription>
                        </div>
                    </div>
                    <CardContent className="p-6 md:p-8 space-y-6">
                        <div className="grid gap-3">
                            <Label htmlFor="delivery_location" className="font-black text-xs uppercase tracking-[2px] text-muted-foreground flex items-center gap-2">
                                <MapPin className="h-3.5 w-3.5 text-primary" /> Delivery Destination
                            </Label>
                            <Input 
                                id="delivery_location" 
                                name="delivery_location" 
                                placeholder="e.g., University Hall, Block B Room 22" 
                                required={requiresDelivery}
                                className="h-14 border-2 rounded-2xl text-base font-medium px-6 bg-muted/20 focus:border-primary/50"
                            />
                            <p className="text-[10px] text-muted-foreground font-medium italic">Your location is shared only with vendors offering delivery for your order.</p>
                        </div>
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>Pickup Information</CardTitle>
                </CardHeader>
                <CardContent>
                    <Alert>
                        <Calendar className="h-4 w-4" />
                        <AlertTitle>Order & Pickup Schedule</AlertTitle>
                        <AlertDescription>
                            <ul className="list-disc list-inside mt-2">
                                <li><strong>Pickup 1 (Wednesday):</strong> For all orders placed between Monday and Wednesday.</li>
                                <li><strong>Pickup 2 (Saturday):</strong> For all orders placed between Thursday and Saturday.</li>
                            </ul>
                        </AlertDescription>
                    </Alert>
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle>Payment Method</CardTitle>
                </CardHeader>
                <CardContent>
                    <Alert variant="default">
                        <Info className="h-4 w-4" />
                        <AlertTitle>Payment on Collection</AlertTitle>
                        <AlertDescription>
                            No upfront payment required. You will pay in person when you collect your order or when it is delivered to you.
                        </AlertDescription>
                    </Alert>
                </CardContent>
            </Card>
        </div>
        <div>
             <Card className="shadow-2xl rounded-3xl overflow-hidden border-none bg-background">
                <div className="bg-muted/5 p-6 border-b">
                    <CardTitle className="text-lg font-black uppercase tracking-widest leading-none">Summary</CardTitle>
                </div>
                <CardContent className="p-6 space-y-4">
                    {cartItems.map(item => {
                        const product = item.products || item.vendor_products;
                        if (!product) return null;
                        const isDiscountActive = product.discount_percentage && product.discount_end_date && new Date(product.discount_end_date) > new Date();
                        const finalPrice = isDiscountActive
                            ? product.price - (product.price * (product.discount_percentage! / 100))
                            : product.price;

                        return (
                            <div key={item.id} className="space-y-3">
                                <div className="flex justify-between items-start gap-4 text-sm">
                                   <div className="flex items-start gap-4">
                                        <Image 
                                            src={product.image_urls?.[0] || 'https://picsum.photos/seed/1/64/64'}
                                            alt={product.name}
                                            width={64}
                                            height={64}
                                            className="rounded-md object-cover aspect-square"
                                        />
                                        <div>
                                            <p className="font-bold text-sm leading-tight line-clamp-1">{product.name}</p>
                                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black mt-1">Qty: {item.quantity}</p>
                                            {product.offers_delivery && (
                                                <Badge variant="secondary" className="h-4 px-1.5 text-[8px] font-black uppercase tracking-tighter mt-1 bg-emerald-50 text-emerald-700 border-emerald-100">
                                                    {product.delivery_price_type === 'fixed' ? `Delivery: GHS ${product.delivery_price}` : 'Delivery (Pay on arrival)'}
                                                </Badge>
                                            )}
                                        </div>
                                   </div>
                                    <span className="font-black text-foreground">GHS {(finalPrice * item.quantity).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>
                                <Textarea name={`notes_${item.id}`} placeholder="Special instructions for this item..." rows={2} className="text-xs bg-muted/10 rounded-xl" />
                                <Separator className="opacity-50" />
                            </div>
                        )
                    })}
                    
                    <div className="space-y-2">
                        <div className="flex justify-between font-bold text-xs uppercase tracking-widest text-muted-foreground">
                            <span>Subtotal</span>
                            <span>GHS {subtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                        {deliveryFees > 0 && (
                            <div className="flex justify-between font-bold text-xs uppercase tracking-widest text-emerald-600">
                                <span>Delivery Fees</span>
                                <span>GHS {deliveryFees.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                        )}
                        <div className="flex justify-between font-bold text-xs uppercase tracking-widest text-muted-foreground">
                            <span>Admin Pickup</span>
                            <span className="text-emerald-600">Free</span>
                        </div>
                    </div>
                    
                    <Separator className="h-0.5 bg-primary/20" />
                    
                     <div className="flex justify-between items-end pt-2">
                        <span className="text-[10px] font-black uppercase tracking-[3px] text-muted-foreground mb-1">Total Payable</span>
                        <span className="text-3xl font-black text-primary tracking-tighter">GHS {totalPayable.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                </CardContent>
                <CardFooter className="p-6 pt-0 flex flex-col gap-4">
                    <CheckoutButton />
                    {!navigator.onLine && (
                        <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 p-4 rounded-2xl w-full">
                            <WifiOff className="h-4 w-4" />
                            <span className="font-bold">Check your internet to complete order.</span>
                        </div>
                    )}
                </CardFooter>
            </Card>
        </div>
    </form>
  );
}
