import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/types/supabase';
import AdminUsersClientPage from './users-client-page';

export default async function AdminUsersPage() {
    const cookieStore = cookies();
    // We need to use the service role key to fetch all users,
    // which is safe to do in a server component.
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

    // To get profile data like display_name, we fetch from the profiles table
    const { data: profiles, error: profilesError } = await supabaseAdmin.from('profiles').select('*');

    if (profilesError) {
      console.error(profilesError);
       return <p>Error fetching profiles.</p>
    }

    const usersWithProfiles = users.map(user => {
        const profile = profiles?.find(p => p.id === user.id);
        return {
            ...user,
            ...profile
        }
    });

    return <AdminUsersClientPage usersWithProfiles={usersWithProfiles} />;
}
