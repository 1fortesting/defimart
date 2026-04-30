export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/server';
import { AuthPrompt } from '@/components/auth-prompt';

export default async function MessagesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  return (
      <main className="flex-1 p-8 flex items-center justify-center">
        {!user ? (
          <AuthPrompt />
        ) : (
          <div>
            <h1 className="text-3xl font-bold mb-8 text-center">Messages</h1>
            <div className="text-center text-muted-foreground">
                You have no messages.
            </div>
          </div>
        )}
      </main>
  );
}
