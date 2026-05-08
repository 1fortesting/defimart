import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Tables } from '@/types/supabase';
import { AuthPrompt } from '@/components/auth-prompt';
import { CheckoutFormWrapper } from './checkout-form-wrapper';

type CartItemWithProduct = Tables<'cart_items'> & {
  products: any | null;
  vendor_products?: any | null;
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

  // Fetch cart items with full product details for both platform and vendor products
  const { data: cartItems, error } = await supabase
    .from('cart_items')
    .select(`
      *, 
      products(name, price, discount_percentage, discount_end_date, image_urls, offers_delivery, delivery_price_type, delivery_price),
      vendor_products:vendor_product_id(name, price, discount_percentage, discount_end_date, image_urls, offers_delivery, delivery_price_type, delivery_price)
    `)
    .eq('user_id', user.id)
    .returns<CartItemWithProduct[]>();

  if (error || !cartItems || cartItems.length === 0) {
    return redirect('/cart');
  }
  
  const subtotal = cartItems.reduce((acc, item) => {
    const product = item.products || item.vendor_products;
    if (!product) return acc;
    const isDiscountActive = product.discount_percentage && product.discount_end_date && new Date(product.discount_end_date) > new Date();
    const finalPrice = isDiscountActive
      ? product.price - (product.price * (product.discount_percentage! / 100))
      : product.price;
    return acc + finalPrice * item.quantity;
  }, 0);

  return (
      <main className="flex-1 p-4 md:p-8 bg-muted/5">
        <div className="max-w-7xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-black tracking-tight uppercase italic">Secure Checkout</h1>
                <p className="text-muted-foreground text-sm font-medium">Finalize your acquisition from the marketplace.</p>
            </div>
            <CheckoutFormWrapper cartItems={cartItems} subtotal={subtotal} />
        </div>
      </main>
  );
}
