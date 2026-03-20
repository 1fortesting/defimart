import { Header } from '@/components/header';
import { createClient } from '@/lib/supabase/server';
import { AuthPrompt } from '@/components/auth-prompt';

export default async function SellPage() {
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
            <h1 className="text-3xl font-bold mb-8 text-center">Sell on DEFIMART</h1>
            <div className="text-center text-muted-foreground">
                This feature is coming soon!
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
