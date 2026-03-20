import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHeader, TableRow, TableHead } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/types/supabase';

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

  return (
    <div className="flex flex-col gap-4">
        <div className="flex items-center">
            <h1 className="text-lg font-semibold md:text-2xl">Customers</h1>
        </div>
        <Card>
        <CardHeader>
            <CardTitle>Registered Users</CardTitle>
        </CardHeader>
        <CardContent>
            <Table>
            <TableHeader>
                <TableRow>
                <TableHead>Avatar</TableHead>
                <TableHead>Display Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Joined</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {usersWithProfiles.map((user) => (
                    <TableRow key={user.id}>
                        <TableCell>
                            <Avatar>
                                <AvatarImage src={user.avatar_url ?? undefined} />
                                <AvatarFallback>{user.display_name?.charAt(0) || user.email?.charAt(0)}</AvatarFallback>
                            </Avatar>
                        </TableCell>
                        <TableCell>{user.display_name || 'N/A'}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.phone_number || 'N/A'}</TableCell>
                        <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                    </TableRow>
                ))}
                {(!users || users.length === 0) && (
                    <TableRow>
                        <TableCell colSpan={5} className="text-center">No users found.</TableCell>
                    </TableRow>
                )}
            </TableBody>
            </Table>
        </CardContent>
        </Card>
    </div>
  );
}
