import { createClient } from '@/lib/supabase/server';
import { HeaderNav } from './header-nav';

export async function BottomNav() {
  const supabase = createClient();
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
    <header className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t p-2 z-50">
      <HeaderNav cartItemCount={cartItemCount} />
    </header>
  );
}

    