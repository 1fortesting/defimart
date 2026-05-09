export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/server';
import { CartClientPage } from './cart-client-page';

export default async function CartPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    // Fetch cart items with an explicit, robust join for both platform and vendor products
    const { data: dbItems, error } = await supabase
      .from('cart_items')
      .select(`
        *, 
        products!cart_items_product_id_fkey(
          id, name, price, image_urls, quantity, discount_percentage, discount_end_date, offers_delivery, delivery_price_type, delivery_price
        ), 
        vendor_products:vendor_product_id(
          id, name, price, image_urls, quantity, discount_percentage, discount_end_date, offers_delivery, delivery_price_type, delivery_price
        )
      `)
      .eq('user_id', user.id)
      .order('created_at');

    if (error) {
        console.error('Cart Fetch Error:', error);
    }

    return (
      <main className="flex-1 p-4 md:p-8 bg-muted/5 min-h-screen">
        <CartClientPage user={user} initialItems={dbItems || []} />
      </main>
    );
  }

  // Anonymous users rely on the client-side component to load from localStorage
  return (
    <main className="flex-1 p-4 md:p-8 bg-muted/5 min-h-screen">
      <CartClientPage user={null} initialItems={[]} />
    </main>
  );
}
