import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>
          This is how your profile appears to others on the platform.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <Avatar className="h-24 w-24">
            <AvatarImage src={user.user_metadata.avatar_url} />
            <AvatarFallback>{user.user_metadata.display_name?.[0] || user.email?.[0]}</AvatarFallback>
          </Avatar>
          <div className="grid gap-1 text-center sm:text-left">
             <h2 className="text-2xl font-bold">{user.user_metadata.display_name || 'No display name'}</h2>
             <p className="text-muted-foreground">{user.email}</p>
          </div>
        </div>
        <Separator />
        <div className="grid gap-2">
            <h3 className="font-semibold text-lg">Contact Information</h3>
            <p className="text-sm"><strong>Email:</strong> {user.email}</p>
            <p className="text-sm"><strong>Phone:</strong> {user.user_metadata.phone_number || 'Not provided'}</p>
        </div>
      </CardContent>
    </Card>
  );
}
