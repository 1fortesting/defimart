import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Tables } from '@/types/supabase';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Calendar, Info, WifiOff } from 'lucide-react';
import { AuthPrompt } from '@/components/auth-prompt';
import Image from 'next/image';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { CheckoutFormWrapper } from './checkout-form-wrapper';

type CartItemWithProduct = Tables<'cart_items'> & {
  products: Pick<Tables<'products'>, 'name' | 'price' | 'discount_percentage' | 'discount_end_date' | 'image_urls'> | null
};

export default async function CheckoutPage() {
  const supabase = await createClient();
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
        <h1 className="text-3xl font-bold mb-8 tracking-tight">Checkout</h1>
        <CheckoutFormWrapper cartItems={cartItems} subtotal={subtotal} />
      </main>
  );
}
