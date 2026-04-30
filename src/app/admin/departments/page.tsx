export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/server';
import DepartmentsClientPage from './departments-client-page';
import { logout } from '@/app/auth/actions';

export default async function DepartmentsPage() {
  const supabase = await createClient();
  
  // Safety check for runtime execution
  if (!supabase || !supabase.auth) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Initializing system...</p>
      </div>
    );
  }

  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="bg-background min-h-screen">
      <DepartmentsClientPage user={user} handleLogout={logout} />
    </div>
  );
}
