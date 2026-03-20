'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Settings, User, Package, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Header } from '@/components/header';
import { AuthPrompt } from '@/components/auth-prompt';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User as SupabaseUser } from '@supabase/supabase-js';

const sidebarNavItems = [
  {
    title: "Profile",
    href: "/profile",
    icon: User,
  },
  {
    title: "Settings",
    href: "/profile/settings",
    icon: Settings
  },
  {
    title: "Orders",
    href: "/orders",
    icon: Package
  },
  {
    title: "Wishlist",
    href: "/wishlist",
    icon: Heart
  },
];


export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname()
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    }
    getUser();
  }, [])


  if (loading) {
      return (
         <div className="min-h-screen flex flex-col">
          <Header />
          <main className="flex-1 p-8 flex items-center justify-center">
            <div>Loading...</div>
          </main>
      </div>
      )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 p-8 flex items-center justify-center">
          <AuthPrompt />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex min-h-[calc(100vh_-_theme(spacing.16))] flex-1 flex-col gap-4 bg-muted/40 p-4 md:gap-8 md:p-10">
            <div className="mx-auto grid w-full max-w-6xl gap-2">
                <h1 className="text-3xl font-semibold">My Account</h1>
            </div>
            <div className="mx-auto grid w-full max-w-6xl items-start gap-6 md:grid-cols-[180px_1fr] lg:grid-cols-[250px_1fr]">
                <nav
                    className="grid gap-4 text-sm text-muted-foreground"
                >
                    {sidebarNavItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary",
                        pathname === item.href ? "text-primary bg-muted" : "text-muted-foreground"
                        )}
                    >
                        <item.icon className="h-4 w-4" />
                        {item.title}
                    </Link>
                    ))}
                </nav>
                <div className="grid gap-6">
                    {children}
                </div>
            </div>
        </main>
    </div>
  );
}
