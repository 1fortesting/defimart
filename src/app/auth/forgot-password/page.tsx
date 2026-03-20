'use client';

import Link from 'next/link';
import { useFormStatus } from 'react-dom';
import { requestPasswordReset } from '@/app/auth/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import Image from 'next/image';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" aria-disabled={pending}>
      {pending ? 'Sending...' : 'Send Reset Link'}
    </Button>
  );
}

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  const searchParams = useSearchParams();

  useEffect(() => {
    const error = searchParams.get('error');
    const message = searchParams.get('message');
    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error,
      });
    }
     if (message) {
      toast({
        title: 'Success',
        description: message,
      });
    }
  }, [searchParams, toast]);

  return (
     <div className="w-full min-h-screen grid grid-cols-1 lg:grid-cols-2">
       <div className="hidden lg:flex flex-col items-center justify-center bg-primary text-primary-foreground p-8">
            <div className="text-left w-full max-w-md">
                <h1 className="text-4xl font-bold mb-4">Forgot Password?</h1>
                <p className="text-lg mb-8">No worries, we'll send you reset instructions.</p>
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
            <h2 className="text-3xl font-bold text-center mb-2 text-foreground">Reset your Password</h2>
            <p className="text-center text-muted-foreground mb-8">Enter your email to receive a password reset link.</p>
            <form action={requestPasswordReset}>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" placeholder="m@example.com" required />
                </div>
                <SubmitButton />
                <div className="text-center text-sm text-muted-foreground">
                    Remember your password?{' '}
                  <Link href="/login" className="underline text-primary">
                    Back to Sign in
                  </Link>
                </div>
              </div>
            </form>
        </div>
      </div>
    </div>
  );
}
