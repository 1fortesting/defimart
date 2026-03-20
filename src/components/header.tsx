import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search,
} from 'lucide-react';
import { logout } from '@/app/auth/actions';
import { HeaderNav } from './header-nav';

export async function Header() {
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
    <header className="bg-card border-b p-4 flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <div className="font-bold text-lg text-primary">
          <Link href="/">DEFIMART</Link>
        </div>
        <div className="flex-1 max-w-md mx-4">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search..." className="pl-10" />
            </div>
        </div>
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <span className="text-sm text-muted-foreground hidden md:inline">
                Welcome, {user.user_metadata?.display_name || user.email}
              </span>
              <form action={logout}>
                <Button variant="outline" size="sm">
                  Logout
                </Button>
              </form>
            </>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link href="/login">Login</Link>
              </Button>
              <Button asChild>
                <Link href="/signup">Sign Up</Link>
              </Button>
            </>
          )}
        </div>
      </div>
      <HeaderNav cartItemCount={cartItemCount} />
    </header>
  );
}
