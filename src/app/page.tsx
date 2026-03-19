import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { logout } from './auth/actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

const Header = ({ user }: { user: any }) => (
  <header className="bg-card border-b p-4 flex justify-between items-center">
    <div className="font-bold text-lg text-primary">DEFIMART</div>
    <div className="flex items-center gap-4">
      <span className="text-sm text-muted-foreground">
        Welcome, {user.user_metadata?.display_name || user.email}
      </span>
      <form action={logout}>
        <Button variant="outline" size="sm">
          Logout
        </Button>
      </form>
    </div>
  </header>
);

export default async function Home() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect('/login');
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header user={user} />
      <main className="flex-1 p-8">
        <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>My Products</CardTitle>
              <CardDescription>Manage your product listings.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href="/products">View Products</Link>
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>My Orders</CardTitle>
              <CardDescription>View and manage your orders.</CardDescription>
            </CardHeader>
            <CardContent>
               <Button asChild>
                <Link href="/orders">View Orders</Link>
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Messages</CardTitle>
              <CardDescription>Chat with buyers and sellers.</CardDescription>
            </CardHeader>
            <CardContent>
               <Button asChild>
                <Link href="/messages">View Messages</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
