'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

function AdminHeader() {
  const router = useRouter();
  const handleLogout = () => {
    sessionStorage.removeItem('isAdmin');
    router.push('/admin/login');
  };

  return (
    <header className="bg-card border-b p-4 flex justify-between items-center">
      <div className="font-bold text-lg text-primary">
        <Link href="/admin">DEFIMART Admin</Link>
      </div>
      <div className="flex items-center gap-4">
        <Button variant="link" asChild>
          <Link href="/">View Store</Link>
        </Button>
        <span className="text-sm text-muted-foreground">
          Welcome, Admin
        </span>
        <Button variant="outline" size="sm" onClick={handleLogout}>
          Logout
        </Button>
      </div>
    </header>
  );
}

const AdminSidebar = () => (
    <aside className="w-64 bg-card border-r p-4 flex flex-col gap-4">
        <nav>
            <ul>
                <li>
                    <Button variant="ghost" asChild className="w-full justify-start">
                        <Link href="/admin">Dashboard</Link>
                    </Button>
                </li>
                <li>
                    <Button variant="ghost" asChild className="w-full justify-start">
                        <Link href="/admin/products">Products</Link>
                    </Button>
                </li>
                <li>
                    <Button variant="ghost" asChild className="w-full justify-start">
                        <Link href="/admin/users">Users</Link>
                    </Button>
                </li>
            </ul>
        </nav>
    </aside>
);

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    const isAdmin = sessionStorage.getItem('isAdmin') === 'true';
    
    if (pathname === '/admin/login') {
        if(isAdmin) {
            router.replace('/admin');
        } else {
            setIsVerified(true);
        }
    } else {
        if (!isAdmin) {
            router.replace('/admin/login');
        } else {
            setIsVerified(true);
        }
    }
  }, [router, pathname]);

  if (!isVerified) {
    return null; // Or a loading spinner
  }

  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex flex-col">
        <AdminHeader />
        <div className="flex flex-1">
            <AdminSidebar />
            <main className="flex-1 p-8 bg-background">
                {children}
            </main>
        </div>
    </div>
  );
}
