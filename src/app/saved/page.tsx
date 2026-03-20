import { Header } from '@/components/header';
import { createClient } from '@/lib/supabase/server';
import { AuthPrompt } from '@/components/auth-prompt';

export default async function SavedPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 p-8 flex items-center justify-center">
        {!user ? (
          <AuthPrompt />
        ) : (
          <div>
            <h1 className="text-3xl font-bold mb-8 text-center">Wishlist</h1>
            <div className="text-center text-muted-foreground">
                You have no saved items.
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
