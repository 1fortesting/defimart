'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import { FullPageLoading } from '@/components/loading-spinner';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;

    // onAuthStateChange is the recommended way to handle auth state.
    // It's called on initial load and whenever the auth state changes.
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        const currentUser = session?.user ?? null;
        const isAdmin = currentUser?.email === adminEmail;
        const isLoginPage = window.location.pathname.startsWith('/admin/login');

        if (isLoginPage) {
          if (isAdmin) {
            // User is an admin and on the login page, redirect to dashboard
            router.replace('/admin/departments');
          } else {
            // User is not an admin and on the login page, so allow it to render
            setIsVerified(true);
          }
        } else {
          // User is on a protected admin page
          if (!isAdmin) {
            // User is not an admin, redirect to login
            router.replace('/admin/login');
          } else {
            // User is an admin, allow the page to render
            setIsVerified(true);
          }
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
    // We only want this effect to run once to set up the listener.
    // We use router in the dependency array to satisfy the linter.
  }, [router]);

  if (!isVerified) {
    return <FullPageLoading text="Verifying access..." />;
  }

  return <>{children}</>;
}
