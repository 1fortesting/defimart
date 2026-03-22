'use client';

import { DepartmentLogin } from "@/components/admin/department-login";
import { useEffect, useState } from "react";
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { usePathname, useRouter } from 'next/navigation';
import { Bell, Home, Package, ShoppingCart, Users, Tag, LineChart, Menu, LogOut, User as UserIcon, Building, Briefcase, Warehouse, DoorOpen } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/client';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import type { User } from '@supabase/supabase-js';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from "@/lib/utils";

const navLinks = [
    { href: "/admin/central-admin/dashboard", text: "Dashboard", icon: Home },
    { href: "/admin/central-admin/analytics", text: "Analytics", icon: LineChart },
    { href: "/admin/central-admin/customers", text: "Customers", icon: Users },
];

const AdminNav = ({ isMobile = false }: { isMobile?: boolean }) => {
    const pathname = usePathname();

    const renderLink = (link: typeof navLinks[0]) => {
      const isActive = pathname.startsWith(link.href);
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
    }

    return (
         <nav className="grid items-start px-4 text-sm font-medium">
            {navLinks.map((link) => {
                if (isMobile) {
                    return <SheetClose asChild key={link.href}>{renderLink(link)}</SheetClose>
                }
                return renderLink(link);
            })}
        </nav>
    )
}

const AdminSidebar = () => {
    return (
        <aside className="hidden border-r bg-muted/40 md:block">
            <div className="flex h-full max-h-screen flex-col gap-2">
                <div className="flex h-14 items-center border-b px-6">
                    <Link href="/admin/departments" className="flex items-center gap-2 font-semibold">
                       <DoorOpen className="h-6 w-6 text-primary" />
                        <span className="text-lg">Central Admin</span>
                        <Badge variant="outline">Dept</Badge>
                    </Link>
                </div>
                <div className="flex-1 overflow-auto py-2">
                    <AdminNav />
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

const AdminHeader = ({ user, handleLogout }: { user: User | null; handleLogout: () => void }) => {
    const displayName = user?.user_metadata.display_name || user?.email;
    return (
        <header className="flex h-14 items-center gap-4 border-b bg-background px-4 lg:h-[60px] lg:px-6">
            <div className="md:hidden">
                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="outline" size="icon">
                            <Menu className="h-5 w-5" />
                            <span className="sr-only">Toggle navigation menu</span>
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="flex flex-col p-0 w-3/4">
                         <div className="flex h-14 items-center border-b px-6">
                            <Link href="/admin/departments" className="flex items-center gap-2 font-semibold">
                                <DoorOpen className="h-6 w-6 text-primary" />
                                <span className="text-lg">Central Admin</span>
                            </Link>
                        </div>
                        <div className="flex-1 overflow-auto py-2">
                            <AdminNav isMobile />
                        </div>
                         <div className="mt-auto p-4 border-t">
                            <Button size="sm" className="w-full" asChild>
                                <SheetClose asChild><Link href="/">View Storefront</Link></SheetClose>
                            </Button>
                        </div>
                    </SheetContent>
                </Sheet>
            </div>

            <div className="w-full flex-1">
                 {/* Can add search here if needed */}
            </div>

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="secondary" size="icon" className="rounded-full">
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={user?.user_metadata.avatar_url ?? undefined} />
                            <AvatarFallback>{displayName?.charAt(0)?.toUpperCase() ?? 'A'}</AvatarFallback>
                        </Avatar>
                        <span className="sr-only">Toggle user menu</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>
                        <p className="font-medium">{displayName}</p>
                        <p className="text-xs text-muted-foreground">{user?.email}</p>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={handleLogout} className="text-red-500">
                        <LogOut className="mr-2 h-4 w-4" />
                        Logout
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </header>
    );
};


export default function CentralAdminLayout({ children }: { children: React.ReactNode }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState<User | null>(null);
    const router = useRouter();

    useEffect(() => {
        if (sessionStorage.getItem('defimart-dept-auth-central-admin') === 'true') {
            setIsAuthenticated(true);
        }
        const supabase = createClient();
        supabase.auth.getUser().then(({ data }) => setUser(data.user));
    }, []);
    
    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-muted/40">
                <DepartmentLogin 
                    departmentName="Central Admin"
                    passwordEnvVar="NEXT_PUBLIC_CEO_PASSWORD"
                    sessionKey="defimart-dept-auth-central-admin"
                    onSuccess={() => setIsAuthenticated(true)}
                />
            </div>
        )
    }

    const handleLogout = async () => {
        const supabase = createClient();
        Object.keys(sessionStorage).forEach(key => {
            if (key.startsWith('defimart-dept-auth-')) {
                sessionStorage.removeItem(key);
            }
        });
        await supabase.auth.signOut();
        router.push('/admin/login');
    };

    return (
        <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
            <AdminSidebar />
            <div className="flex flex-col">
                <AdminHeader user={user} handleLogout={handleLogout} />
                <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
                {children}
                </main>
            </div>
        </div>
    )
}
