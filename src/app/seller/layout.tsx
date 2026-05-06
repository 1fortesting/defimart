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
      <div className="flex-1 min-h-screen flex items-center justify-center bg-muted/20 p-6">
        <Alert className="max-w-md bg-background shadow-xl border-none p-8 rounded-3xl">
          <Clock className="h-8 w-8 text-primary mb-4" />
          <AlertTitle className="text-xl font-black uppercase tracking-widest mb-2">Application Pending</AlertTitle>
          <AlertDescription className="text-muted-foreground font-medium leading-relaxed">
            The board is reviewing your application for <strong>{seller.shop_name}</strong>. You will receive an SMS confirmation once your shop is ready for launch.
          </AlertDescription>
          <Button asChild variant="outline" className="mt-8 w-full font-bold h-12 rounded-xl"><Link href="/">Back to Main Site</Link></Button>
        </Alert>
      </div>
    );
  }

  if (seller.status === 'rejected') {
    return (
      <div className="flex-1 min-h-screen flex items-center justify-center bg-muted/20 p-6">
        <Alert variant="destructive" className="max-w-md bg-background shadow-xl border-none p-8 rounded-3xl">
          <Ban className="h-8 w-8 text-destructive mb-4" />
          <AlertTitle className="text-xl font-black uppercase tracking-widest mb-2">Launch Denied</AlertTitle>
          <AlertDescription className="text-muted-foreground font-medium leading-relaxed">
            We regret to inform you that your shop application for <strong>{seller.shop_name}</strong> was not approved at this time. Please contact corporate support for further details.
          </AlertDescription>
          <Button asChild variant="outline" className="mt-8 w-full font-bold h-12 rounded-xl"><Link href="/contact">Contact Support</Link></Button>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col bg-background">
      {children}
    </div>
  );
}
