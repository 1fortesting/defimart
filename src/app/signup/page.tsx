'use client';

import Link from 'next/link';
import { useFormStatus, useActionState } from 'react-dom';
import { signup } from '@/app/auth/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Image from 'next/image';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" aria-disabled={pending}>
      {pending ? 'Creating Account...' : 'Create an account'}
    </Button>
  );
}

export default function SignupPage() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [state, formAction] = useActionState(signup, { error: null });

  useEffect(() => {
    const error = searchParams.get('error');
    if (error) {
      toast({
        variant: 'destructive',
        title: 'Registration Error',
        description: error,
      });
      router.replace('/signup', { scroll: false });
    }
  }, [searchParams, toast, router]);

  useEffect(() => {
    if (state?.error) {
      toast({
        variant: 'destructive',
        title: 'Registration Error',
        description: state.error,
      });
    }
  }, [state, toast]);


  return (
     <div className="w-full min-h-screen grid grid-cols-1 lg:grid-cols-2">
       <div className="relative hidden lg:flex flex-col items-center justify-center bg-primary text-primary-foreground p-8 overflow-hidden">
            <div className="absolute -top-1/4 -left-1/4 w-96 h-96 bg-primary-foreground/10 rounded-full" />
            <div className="absolute -bottom-1/4 -right-1/4 w-96 h-96 bg-primary-foreground/10 rounded-full" />
            <div className="absolute bottom-1/4 left-1/4 w-48 h-48 bg-primary-foreground/5 rounded-full" />
            <div className="z-10 text-left w-full max-w-md">
                <h1 className="text-4xl font-bold mb-4">Join DEFIMART!</h1>
                <p className="text-lg mb-8">Create an account to start buying and selling with ease.</p>
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
            <h2 className="text-3xl font-bold text-center mb-2 text-foreground">Create your Account</h2>
            <p className="text-center text-muted-foreground mb-8">Get started in just a few clicks</p>
            <form action={formAction}>
            <div className="grid gap-4">
                <div className="grid gap-2">
                <Label htmlFor="display_name">Display Name</Label>
                <Input id="display_name" name="display_name" placeholder="Your Name" required />
                </div>
                <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" placeholder="m@example.com" required />
                </div>
                <div className="grid gap-2">
                <Label htmlFor="phone_number">Phone Number</Label>
                <Input id="phone_number" name="phone_number" type="tel" placeholder="+1234567890" />
                </div>
                <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" name="password" type="password" required />
                </div>
                <SubmitButton />
                <div className="text-center text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link href="/login" className="underline text-primary transition-colors hover:text-primary/80">
                    Sign in
                </Link>
                </div>
            </div>
            </form>
        </div>
      </div>
    </div>
  );
}
