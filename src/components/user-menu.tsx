'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import Link from 'next/link';
import { logout } from '@/app/auth/actions';
import type { User } from '@supabase/supabase-js';
import { User as UserIcon, LogOut, MessageSquare, HelpCircle, Phone, FileText, Shield } from 'lucide-react';

export function UserMenu({ user }: { user: User | null }) {
  if (!user) {
    return (
      <>
        <Button variant="ghost" asChild>
          <Link href="/login">Login</Link>
        </Button>
        <Button asChild>
          <Link href="/signup">Sign Up</Link>
        </Button>
      </>
    );
  }

  const handleLogout = async () => {
    await logout();
  };
  
  const displayName = user.user_metadata.display_name || user.email;

  return (
    <div className="flex items-center gap-3">
        {displayName && (
            <div className="hidden md:flex flex-col items-end">
                <p className="text-base font-medium leading-none">Welcome</p>
                <p className="text-sm leading-none text-muted-foreground truncate max-w-40">{displayName}</p>
            </div>
        )}
        <DropdownMenu>
        <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
            <Avatar className="h-12 w-12">
                <AvatarImage src={user.user_metadata.avatar_url ?? undefined} />
                <AvatarFallback>{user.user_metadata.display_name?.[0] || user.email?.[0]}</AvatarFallback>
            </Avatar>
            <span className="sr-only">Toggle user menu</span>
            </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.user_metadata.display_name}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
            <Link href="/profile"><UserIcon className="mr-2 h-4 w-4" />Profile</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
            <Link href="/messages"><MessageSquare className="mr-2 h-4 w-4" />Messages</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
            <Link href="/faq"><HelpCircle className="mr-2 h-4 w-4" />FAQ</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
                <Link href="/contact"><Phone className="mr-2 h-4 w-4" />Contact</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
                <Link href="/terms"><FileText className="mr-2 h-4 w-4" />Terms of Service</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
                <Link href="/privacy"><Shield className="mr-2 h-4 w-4" />Privacy Policy</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
            onSelect={(e) => {
                e.preventDefault();
                handleLogout();
            }}
            className="cursor-pointer text-red-500 focus:text-red-500 focus:bg-red-500/10"
            >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
            </DropdownMenuItem>
        </DropdownMenuContent>
        </DropdownMenu>
    </div>
  );
}
