export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/server';
import { CartClientPage } from './cart-client-page';

export default async function CartPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    // Explicit, redundant fetch logic to handle potential schema inconsistencies 
    // during the rollout of delivery and discount features.
    const { data: dbItems, error } = await supabase
      .from('cart_items')
      .select(`
        *, 
        products:product_id(*), 
        vendor_products:vendor_product_id(*)
      `)
      .eq('user_id', user.id)
      .order('created_at');

    if (error) {
        console.error('Cart Fetch Error Details:', JSON.stringify(error, null, 2));
    }

    return (
      <main className="flex-1 p-4 md:p-8 bg-muted/5 min-h-screen">
        <CartClientPage user={user} initialItems={dbItems || []} />
      </main>
    );
  }

  return (
    <main className="flex-1 p-4 md:p-8 bg-muted/5 min-h-screen">
      <CartClientPage user={null} initialItems={[]} />
    </main>
  );
}