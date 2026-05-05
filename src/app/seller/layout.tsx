'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, usePathname } from 'next/navigation';
import { FullPageLoading } from '@/components/loading-spinner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Clock, Ban, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function SellerLayout({ children }: { children: React.ReactNode }) {
  const [seller, setSeller] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkSeller = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login?from=' + pathname);
        return;
      }

      const { data } = await supabase
        .from('sellers' as any)
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      setSeller(data);
      setLoading(false);

      if (!data && pathname !== '/seller/register') {
        router.push('/seller/register');
      }
    };

    checkSeller();
  }, [pathname, router]);

  if (loading) return <FullPageLoading text="Authenticating seller..." />;

  // If on registration page, just render children
  if (pathname === '/seller/register') return <>{children}</>;

  if (!seller) return null;

  if (seller.status === 'pending') {
    return (
      <div className="flex-1 p-8 flex items-center justify-center bg-muted/20">
        <Alert className="max-w-md">
          <Clock className="h-5 w-5" />
          <AlertTitle>Application Pending</AlertTitle>
          <AlertDescription>
            Your seller application for <strong>{seller.shop_name}</strong> is currently being reviewed by our team. You will be notified via <strong>SMS</strong> once approved.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (seller.status === 'rejected') {
    return (
      <div className="flex-1 p-8 flex items-center justify-center bg-muted/20">
        <Alert variant="destructive" className="max-w-md">
          <Ban className="h-5 w-5" />
          <AlertTitle>Application Rejected</AlertTitle>
          <AlertDescription>
            We regret to inform you that your seller application has been rejected. We have sent you an <strong>SMS</strong> with more details. Please contact support if you have questions.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <header className="border-b bg-background px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <CheckCircle className="h-6 w-6 text-green-500" />
          <div>
            <h1 className="font-bold text-lg">{seller.shop_name}</h1>
            <p className="text-xs text-muted-foreground">Seller Dashboard</p>
          </div>
        </div>
        <Button asChild variant="outline" size="sm">
            <Link href="/">Storefront</Link>
        </Button>
      </header>
      <main className="flex-1 bg-muted/10">
        {children}
      </main>
    </div>
  );
}
