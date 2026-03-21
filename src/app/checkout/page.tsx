import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Tables } from '@/types/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Calendar, Info } from 'lucide-react';
import { placeOrder } from '@/app/cart/actions';
import { AuthPrompt } from '@/components/auth-prompt';

type CartItemWithProduct = Tables<'cart_items'> & {
  products: Pick<Tables<'products'>, 'name' | 'price' | 'discount_percentage' | 'discount_end_date' > | null
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
    .select('*, products(name, price, discount_percentage, discount_end_date)')
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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
                    <CardTitle>Order Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {cartItems.map(item => {
                             if (!item.products) return null;
                            const isDiscountActive = item.products.discount_percentage && item.products.discount_end_date && new Date(item.products.discount_end_date) > new Date();
                            const finalPrice = isDiscountActive
                                ? item.products.price - (item.products.price * (item.products.discount_percentage! / 100))
                                : item.products.price;

                            return (
                                <div key={item.id} className="flex justify-between text-sm">
                                    <span>{item.products?.name} x {item.quantity}</span>
                                    <span>GHS {(finalPrice * item.quantity).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>
                            )
                        })}
                        <hr className="my-2" />
                        <div className="flex justify-between font-medium">
                            <span>Subtotal</span>
                            <span>GHS {subtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between font-medium">
                            <span>Delivery</span>
                            <span>Free</span>
                        </div>
                        <hr className="my-2" />
                         <div className="flex justify-between text-lg font-bold">
                            <span>Total</span>
                            <span>GHS {subtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <form action={placeOrder} className="w-full">
                            <Button type="submit" className="w-full">
                                Place Order
                            </Button>
                        </form>
                    </CardFooter>
                </Card>
            </div>
        </div>
      </main>
  );
}

    
