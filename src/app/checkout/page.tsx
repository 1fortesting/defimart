export const dynamic = 'force-dynamic';

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
    // If cart is empty on server, guest might still have local items not yet synced.
    // We redirect to cart so initCart sync logic can run.
    return redirect('/cart');
  }
  
  const subtotal = cartItems.reduce((acc, item) => {
    // Ensure item and products are handled safely regardless of return shape
    const product = Array.isArray(item.products) ? item.products[0] : item.products;
    const vProduct = Array.isArray(item.vendor_products) ? item.vendor_products[0] : item.vendor_products;
    const p = product || vProduct;

    if (!p || typeof p.price !== 'number') return acc;
    
    const isDiscountActive = p.discount_percentage && p.discount_end_date && new Date(p.discount_end_date) > new Date();
    const finalPrice = isDiscountActive
      ? p.price - (p.price * (p.discount_percentage! / 100))
      : p.price;
      
    return acc + (finalPrice * (item.quantity || 1));
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
