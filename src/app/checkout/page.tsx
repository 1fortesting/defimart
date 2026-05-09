export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/server';
import { Tables } from '@/types/supabase';
import { AuthPrompt } from '@/components/auth-prompt';
import { CheckoutFormWrapper } from './checkout-form-wrapper';
import { Button } from '@/components/ui/button';
import { ShoppingBag, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

type CartItemWithProduct = Tables<'cart_items'> & {
  products: Tables<'products'> | null;
  vendor_products: Tables<'vendor_products'> | null;
};

export default async function CheckoutPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
        <main className="flex-1 p-8 flex items-center justify-center min-h-[400px]">
            <AuthPrompt />
        </main>
    );
  }

  // Standardized query to ensure database rows are correctly fetched and joined
  const { data: cartItemsRaw, error } = await supabase
    .from('cart_items')
    .select(`
      id,
      quantity,
      product_id,
      vendor_product_id,
      products:product_id(*),
      vendor_products:vendor_product_id(*)
    `)
    .eq('user_id', user.id);

  const cartItems = (cartItemsRaw || []) as any as CartItemWithProduct[];

  if (error || !cartItems || cartItems.length === 0) {
    return (
        <main className="flex-1 p-4 md:p-8 flex flex-col items-center justify-center min-h-[60vh] text-center">
            <div className="bg-muted rounded-full p-6 mb-6">
                <ShoppingBag className="h-12 w-12 text-muted-foreground" />
            </div>
            <h1 className="text-2xl font-black uppercase tracking-tight italic">Your bag is empty</h1>
            <p className="text-muted-foreground mt-2 mb-8 font-medium">It looks like your synchronized cart doesn't have any items yet.</p>
            <Button asChild className="rounded-2xl h-12 px-8 font-black uppercase tracking-widest">
                <Link href="/cart"><ArrowLeft className="mr-2 h-4 w-4" /> Go back to Cart</Link>
            </Button>
        </main>
    )
  }
  
  const subtotal = cartItems.reduce((acc, item) => {
    // Robust resolver to check both possible product sources
    const product = item.products || item.vendor_products;
    if (!product) return acc;
    
    const price = Number(product.price);
    const isDiscountActive = product.discount_percentage && product.discount_end_date && new Date(product.discount_end_date) > new Date();
    
    const finalPrice = isDiscountActive
      ? price - (price * (Number(product.discount_percentage) / 100))
      : price;
      
    return acc + (finalPrice * (item.quantity || 1));
  }, 0);

  return (
      <main className="flex-1 p-4 md:p-8 bg-muted/5 min-h-screen">
        <div className="max-w-7xl mx-auto">
            <div className="mb-8 flex flex-col gap-1">
                <h1 className="text-3xl font-black tracking-tight uppercase italic">Secure Checkout</h1>
                <p className="text-muted-foreground text-sm font-medium">Finalize your acquisition from the marketplace.</p>
            </div>
            <CheckoutFormWrapper cartItems={cartItems} subtotal={subtotal} />
        </div>
      </main>
  );
}
