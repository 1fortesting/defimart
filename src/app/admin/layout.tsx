import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { logout } from '../auth/actions';
import { Button } from '@/components/ui/button';

const AdminHeader = ({ user }: { user: any }) => (
  <header className="bg-card border-b p-4 flex justify-between items-center">
    <div className="font-bold text-lg text-primary">
      <Link href="/admin">DEFIMART Admin</Link>
    </div>
    <div className="flex items-center gap-4">
      <Button variant="link" asChild>
        <Link href="/">View Store</Link>
      </Button>
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


const AdminSidebar = () => (
    <aside className="w-64 bg-card border-r p-4 flex flex-col gap-4">
        <nav>
            <ul>
                <li>
                    <Button variant="ghost" asChild className="w-full justify-start">
                        <Link href="/admin/products">Products</Link>
                    </Button>
                </li>
                {/* Add other admin links here */}
            </ul>
        </nav>
    </aside>
);

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  // Here you would add a check to see if the user is an admin
  // For now, we'll allow any logged-in user to see the admin pages

  return (
    <div className="min-h-screen flex flex-col">
        <AdminHeader user={user} />
        <div className="flex flex-1">
            <AdminSidebar />
            <main className="flex-1 p-8 bg-background">
                {children}
            </main>
        </div>
    </div>
  );
}
