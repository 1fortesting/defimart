'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const error = searchParams.get('error');
    const message = searchParams.get('message');
    if (error) {
      toast({
        variant: 'destructive',
        title: 'Authentication Error',
        description: error,
      });
      router.replace('/login', { scroll: false });
    }
    if (message) {
      toast({
        title: 'Info',
        description: message,
      });
      router.replace('/login', { scroll: false });
    }
  }, [searchParams, toast, router]);
  
  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Authentication Error',
        description: error.message,
      });
      setLoading(false);
    } else {
      router.push('/');
      router.refresh();
    }
  };

  return (
    <div className="w-full min-h-screen grid grid-cols-1 lg:grid-cols-2">
       <div className="relative hidden lg:flex flex-col items-center justify-center bg-primary text-primary-foreground p-8 overflow-hidden">
            <div className="absolute -top-1/4 -left-1/4 w-96 h-96 bg-primary-foreground/10 rounded-full" />
            <div className="absolute -bottom-1/4 -right-1/4 w-96 h-96 bg-primary-foreground/10 rounded-full" />
            <div className="absolute bottom-1/4 left-1/4 w-48 h-48 bg-primary-foreground/5 rounded-full" />
            <div className="z-10 text-left w-full max-w-md">
                <h1 className="text-4xl font-bold mb-4">Welcome Back!</h1>
                <p className="text-lg mb-8">Sign in to access your account and continue your shopping.</p>
                 <Image
                    src="https://iili.io/qO5Jeou.png"
                    alt="DEFIMART Logo"
                    width={400}
                    height={100}
                    className="object-contain"
                />
            </div>
        </div>
      <div className="flex items-center justify-center p-4 bg-background">
          <div className="w-full max-w-sm">
            <h2 className="text-3xl font-bold text-center mb-2 text-foreground">Login to DEFIMART</h2>
            <p className="text-center text-muted-foreground mb-8">Enter your details below</p>
            <form onSubmit={handleLogin}>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    name="email" 
                    type="email" 
                    placeholder="m@example.com" 
                    required 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                     <Label htmlFor="password">Password</Label>
                     <Link href="/auth/forgot-password" className="text-sm underline text-primary transition-colors hover:text-primary/80">
                        Forgot password?
                    </Link>
                  </div>
                  <Input 
                    id="password" 
                    name="password" 
                    type="password" 
                    required 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Signing In...' : 'Sign In'}
                </Button>
                <div className="text-center text-sm text-muted-foreground">
                  Don&apos;t have an account?{' '}
                  <Link href="/signup" className="underline text-primary transition-colors hover:text-primary/80">
                    Sign up
                  </Link>
                </div>
              </div>
            </form>
          </div>
      </div>
    </div>
  );
}
