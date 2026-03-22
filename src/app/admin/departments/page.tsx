import { createClient } from '@/lib/supabase/server';
import DepartmentsClientPage from './departments-client-page';
import { logout } from '@/app/auth/actions';

export default async function DepartmentsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="bg-background min-h-screen">
      <DepartmentsClientPage user={user} handleLogout={logout} />
    </div>
  );
}
