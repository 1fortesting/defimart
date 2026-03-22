'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';

export default function AdminLoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;

    if (!adminEmail) {
        toast({
            variant: 'destructive',
            title: 'Configuration Error',
            description: 'Admin email is not configured.',
        });
        setLoading(false);
        return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({ 
      email: adminEmail, 
      password: password 
    });

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: 'Incorrect password or admin account not set up.',
      });
    } else {
      // Successful admin login
      router.push('/admin/departments');
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-md">
         <div className="text-center mb-8">
            <Image
                src="https://iili.io/qO5Jeou.png"
                alt="DEFIMART Logo"
                width={200}
                height={40}
                className="object-contain"
            />
         </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-center">Admin Panel Access</CardTitle>
              <CardDescription className="text-center">Enter the developer-provided password to access the admin panel.</CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Verifying...' : 'Login'}
                </Button>
              </CardFooter>
            </form>
          </Card>
      </div>
    </div>
  );
}
