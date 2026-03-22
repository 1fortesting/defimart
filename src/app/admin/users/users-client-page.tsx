'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHeader, TableRow, TableHead } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';

type UserWithProfile = User & {
    avatar_url?: string | null;
    display_name?: string | null;
    phone_number?: string | null;
}

export default function AdminUsersClientPage({ usersWithProfiles }: { usersWithProfiles: UserWithProfile[] }) {
  const router = useRouter();
  const [isRefreshing, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold md:text-2xl">Customers</h1>
             <Button onClick={() => startTransition(() => router.refresh())} disabled={isRefreshing} variant="outline" size="sm">
                <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
            </Button>
        </div>
        <Card>
        <CardHeader>
            <CardTitle>Registered Users</CardTitle>
        </CardHeader>
        <CardContent>
            <Table>
            <TableHeader>
                <TableRow>
                <TableHead className="hidden sm:table-cell">Avatar</TableHead>
                <TableHead>Display Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="hidden md:table-cell">Phone</TableHead>
                <TableHead className="hidden lg:table-cell">Joined</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {usersWithProfiles.map((user) => (
                    <TableRow key={user.id} onClick={() => router.push(`/admin/users/${user.id}`)} className="cursor-pointer">
                        <TableCell className="hidden sm:table-cell">
                            <Avatar>
                                <AvatarImage src={user.avatar_url ?? undefined} />
                                <AvatarFallback>{user.display_name?.charAt(0) || user.email?.charAt(0)}</AvatarFallback>
                            </Avatar>
                        </TableCell>
                        <TableCell className="font-medium">{user.display_name || 'N/A'}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell className="hidden md:table-cell">{user.phone_number || 'N/A'}</TableCell>
                        <TableCell className="hidden lg:table-cell">{new Date(user.created_at).toLocaleDateString()}</TableCell>
                    </TableRow>
                ))}
                {(!usersWithProfiles || usersWithProfiles.length === 0) && (
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
