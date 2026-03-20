'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Bell, Home, Package, ShoppingCart, Users, Tag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

const AdminSidebar = () => {
    const pathname = usePathname();
    const navLinks = [
        { href: "/admin", text: "Dashboard", icon: Home },
        { href: "/admin/products", text: "Products", icon: ShoppingCart },
        { href: "/admin/discounts", text: "Discounts", icon: Tag },
        { href: "/admin/orders", text: "Orders", icon: Package },
        { href: "/admin/users", text: "Customers", icon: Users },
    ];

    return (
        <aside className="hidden border-r bg-muted/40 md:block">
            <div className="flex h-full max-h-screen flex-col gap-2">
                <div className="flex h-14 items-center border-b px-6">
                    <Link href="/admin" className="flex items-center gap-2 font-semibold">
                        <Image
                            src="https://iili.io/qO5Jeou.png"
                            alt="DEFIMART Logo"
                            width={120}
                            height={28}
                            className="object-contain"
                        />
                        <Badge variant="outline">Admin</Badge>
                    </Link>
                     <Button variant="outline" size="icon" className="ml-auto h-8 w-8">
                        <Bell className="h-4 w-4" />
                        <span className="sr-only">Toggle notifications</span>
                    </Button>
                </div>
                <div className="flex-1 overflow-auto py-2">
                    <nav className="grid items-start px-4 text-sm font-medium">
                        {navLinks.map((link) => {
                             const isActive = pathname === link.href || (pathname.startsWith(link.href) && link.href !== '/admin');
                             return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary ${isActive ? 'bg-muted text-primary' : ''}`}
                                >
                                    <link.icon className="h-4 w-4" />
                                    {link.text}
                                </Link>
                            )
                        })}
                    </nav>
                </div>
                <div className="mt-auto p-4">
                    <Button size="sm" className="w-full" asChild>
                        <Link href="/">View Storefront</Link>
                    </Button>
                </div>
            </div>
        </aside>
    );
};

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
  
  const handleLogout = () => {
    sessionStorage.removeItem('isAdmin');
    router.push('/admin/login');
  };

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <AdminSidebar />
      <div className="flex flex-col">
         <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-6 justify-end">
            <Button variant="secondary" onClick={handleLogout}>
                Logout
            </Button>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
