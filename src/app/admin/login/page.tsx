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
  const [email, setEmail] = useState('');
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

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: error.message,
      });
    } else if (data.user?.email !== adminEmail) {
        toast({
            variant: 'destructive',
            title: 'Authorization Failed',
            description: 'You are not authorized to access the admin panel.',
        });
        await supabase.auth.signOut(); // Log out the non-admin user
    } else {
      // Successful admin login
      router.push('/admin');
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
                className="object-contain mx-auto"
            />
         </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-center">Admin Panel Access</CardTitle>
              <CardDescription className="text-center">Enter your admin credentials to manage the store</CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="grid gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        placeholder="admin@example.com"
                    />
                </div>
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
