'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Bell, Home, Package, ShoppingCart, Users, Tag, LineChart, Menu, LogOut, User as UserIcon, Building, Briefcase, Warehouse } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/client';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import type { User } from '@supabase/supabase-js';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { FullPageLoading } from '@/components/loading-spinner';


export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isVerified, setIsVerified] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const supabase = createClient();
    const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;

    const checkAdmin = async () => {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        setUser(currentUser);
        const isAdmin = currentUser?.email === adminEmail;
        
        if (pathname === '/admin/login') {
            if(isAdmin) {
                router.replace('/admin/departments');
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
    }
    checkAdmin();
  }, [router, pathname]);

  if (!isVerified) {
    return <FullPageLoading text="Verifying access..." />;
  }

  return <>{children}</>;
}
