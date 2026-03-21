import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Tables } from '@/types/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Calendar, Info } from 'lucide-react';
import { placeOrder } from '@/app/cart/actions';
import { AuthPrompt } from '@/components/auth-prompt';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';

type CartItemWithProduct = Tables<'cart_items'> & {
  products: Pick<Tables<'products'>, 'name' | 'price' | 'discount_percentage' | 'discount_end_date' | 'image_urls'> | null
};

export default async function CheckoutPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
        <main className="flex-1 p-8 flex items-center justify-center">
            <AuthPrompt />
        </main>
    );
  }

  const { data: cartItems, error } = await supabase
    .from('cart_items')
    .select('*, products(name, price, discount_percentage, discount_end_date, image_urls)')
    .eq('user_id', user.id)
    .returns<CartItemWithProduct[]>();

  if (error || !cartItems || cartItems.length === 0) {
    return redirect('/cart');
  }
  
  const subtotal = cartItems.reduce((acc, item) => {
    if (!item.products) return acc;
    const isDiscountActive = item.products.discount_percentage && item.products.discount_end_date && new Date(item.products.discount_end_date) > new Date();
    const finalPrice = isDiscountActive
      ? item.products.price - (item.products.price * (item.products.discount_percentage! / 100))
      : item.products.price;
    return acc + finalPrice * item.quantity;
  }, 0);

  return (
      <main className="flex-1 p-4 md:p-8">
        <h1 className="text-3xl font-bold mb-8">Checkout</h1>
        <form action={placeOrder} className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2 space-y-8">
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
                            <AlertTitle>Payment on Pickup</AlertTitle>
                            <AlertDescription>
                                No online payment is required. You will pay in person when you collect your order.
                            </AlertDescription>
                        </Alert>
                    </CardContent>
                </Card>
            </div>
            <div>
                 <Card>
                    <CardHeader>
                    <CardTitle>Order Summary & Notes</CardTitle>
                    <CardDescription>Review your items and add any specific notes.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {cartItems.map(item => {
                             if (!item.products) return null;
                            const isDiscountActive = item.products.discount_percentage && item.products.discount_end_date && new Date(item.products.discount_end_date) > new Date();
                            const finalPrice = isDiscountActive
                                ? item.products.price - (item.products.price * (item.products.discount_percentage! / 100))
                                : item.products.price;

                            return (
                                <div key={item.id} className="space-y-3">
                                    <div className="flex justify-between items-start gap-4 text-sm">
                                       <div className="flex items-start gap-4">
                                            <Image 
                                                src={item.products.image_urls?.[0] || 'https://picsum.photos/seed/1/64/64'}
                                                alt={item.products.name}
                                                width={64}
                                                height={64}
                                                className="rounded-md object-cover aspect-square"
                                            />
                                            <div>
                                                <p className="font-medium">{item.products.name}</p>
                                                <p className="text-muted-foreground">Qty: {item.quantity}</p>
                                            </div>
                                       </div>
                                        <span className="font-medium">GHS {(finalPrice * item.quantity).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                    </div>
                                    <Textarea name={`notes_${item.id}`} placeholder="Add notes (e.g. size, color...)" rows={2} />
                                    <Separator />
                                </div>
                            )
                        })}
                        
                        <div className="flex justify-between font-medium text-sm">
                            <span>Subtotal</span>
                            <span>GHS {subtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between font-medium text-sm">
                            <span>Delivery</span>
                            <span>Free</span>
                        </div>
                        <Separator />
                         <div className="flex justify-between text-lg font-bold">
                            <span>Total</span>
                            <span>GHS {subtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" className="w-full">
                            Place Order
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </form>
      </main>
  );
}
