import { Header } from '@/components/header';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AuthPrompt } from '@/components/auth-prompt';

export default async function ProfilePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 p-8 flex items-center justify-center">
        {!user ? (
          <AuthPrompt />
        ) : (
          <div className="w-full max-w-4xl">
            <h1 className="text-3xl font-bold mb-8">My Profile</h1>
            <Card>
                <CardHeader>
                    <CardTitle>Profile Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                     <Avatar className="h-24 w-24">
                        <AvatarImage src={user.user_metadata.avatar_url} />
                        <AvatarFallback>{user.user_metadata.display_name?.[0] || user.email?.[0]}</AvatarFallback>
                    </Avatar>
                    <p><strong>Display Name:</strong> {user.user_metadata.display_name}</p>
                    <p><strong>Email:</strong> {user.email}</p>
                    <p><strong>Phone:</strong> {user.user_metadata.phone_number || 'Not provided'}</p>
                </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
