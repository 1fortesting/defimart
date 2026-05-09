export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/server';
import { CartClientPage } from './cart-client-page';
import { AuthPrompt } from '@/components/auth-prompt';

export default async function CartPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    // Authenticated users read strictly from the database
    const { data: dbItems, error } = await supabase
      .from('cart_items')
      .select(`
        *, 
        products(name, price, image_urls, quantity, discount_percentage, discount_end_date, offers_delivery, delivery_price_type, delivery_price), 
        vendor_products:vendor_product_id(name, price, image_urls, quantity, discount_percentage, discount_end_date, offers_delivery, delivery_price_type, delivery_price)
      `)
      .eq('user_id', user.id)
      .order('created_at');

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
