export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/server';
import { CartClientPage } from './cart-client-page';

export default async function CartPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    // Standardized cloud fetch for authenticated users.
    // Explicitly joins with both product tables using foreign key identifiers.
    const { data: dbItems, error } = await supabase
      .from('cart_items')
      .select(`
        *, 
        products:products!cart_items_product_id_fkey(*), 
        vendor_products:vendor_products!cart_items_vendor_product_id_fkey(*)
      `)
      .eq('user_id', user.id)
      .order('created_at');

    if (error) {
        console.error('Cart Fetch Error Details:', JSON.stringify(error, null, 2));
    }

    return (
      <main className="flex-1 p-4 md:p-8 bg-muted/5 min-h-screen">
        <CartClientPage user={user as any} initialItems={dbItems || []} />
      </main>
    );
  }

  return (
    <main className="flex-1 p-4 md:p-8 bg-muted/5 min-h-screen">
      <CartClientPage user={null} initialItems={[]} />
    </main>
  );
}
