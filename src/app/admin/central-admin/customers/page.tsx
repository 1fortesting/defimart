import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/types/supabase';
import CentralAdminCustomersClientPage from './customers-client-page';

export default async function AdminCentralCustomersPage() {
    const cookieStore = cookies();
    const supabaseAdmin = createServerClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          cookies: {
            get(name: string) {
              return cookieStore.get(name)?.value;
            },
          },
        }
    );
    
    const { data: { users }, error: usersError } = await supabaseAdmin.auth.admin.listUsers();

    if (usersError) {
        console.error(usersError);
        return <p>Error fetching users.</p>
    }

    const { data: profiles, error: profilesError } = await supabaseAdmin.from('profiles').select('*');

    if (profilesError) {
      console.error(profilesError);
       return <p>Error fetching profiles.</p>
    }

    const usersWithProfiles = users.map(user => {
        const profile = profiles?.find(p => p.id === user.id);
        return {
            ...user,
            ...profile,
            ...user.user_metadata
        }
    });

    return <CentralAdminCustomersClientPage usersWithProfiles={usersWithProfiles} />;
}
