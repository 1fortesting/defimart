import { createClient } from '@/lib/supabase/server';
import { HeaderNav } from './header-nav';
import type { User as SupabaseUser } from '@supabase/supabase-js';

export async function BottomNav() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let cartItemCount = 0;
  if (user) {
    const { count } = await supabase
      .from('cart_items')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);
    cartItemCount = count ?? 0;
  }

  return (
    <header className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t p-1 z-50">
      <HeaderNav user={user} cartItemCount={cartItemCount} isMobile={true} />
    </header>
  );
}
