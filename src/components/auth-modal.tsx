'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';

import { Zap, PackageCheck, Heart, Award, Mail, Lock, Eye, EyeOff, LogIn } from 'lucide-react';

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" {...props}>
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        <path d="M1 1h22v22H1z" fill="none"/>
    </svg>
);


const RightPanel = ({ view, setView }: { view: 'login' | 'signup', setView: (view: 'login' | 'signup') => void }) => {
    const router = useRouter();
    const { toast } = useToast();
    
    // Form State
    const [displayName, setDisplayName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        const supabase = createClient();
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
            toast({ variant: 'destructive', title: 'Login Failed', description: error.message });
        } else {
            router.refresh(); // Refresh to update server-side state
        }
        setLoading(false);
    };

    const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        const supabase = createClient();
        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { display_name: displayName } }
        });
        if (error) {
            toast({ variant: 'destructive', title: 'Signup Failed', description: error.message });
        } else {
            router.refresh();
        }
        setLoading(false);
    };

     const handleGoogleLogin = async () => {
        const supabase = createClient();
        setLoading(true);
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin,
            },
        });
        if (error) {
            toast({ variant: 'destructive', title: 'Google Login Failed', description: error.message });
            setLoading(false);
        }
    };


    return (
        <div className="p-8 sm:p-12 flex flex-col justify-center">
            <span className="text-sm font-bold text-primary tracking-widest uppercase">{view === 'login' ? 'Customer Sign In' : 'Create Account'}</span>
            <h1 className="text-3xl font-bold mt-2 text-foreground">{view === 'login' ? 'Sign in to continue' : 'Get started with DEFIMART'}</h1>
            <p className="text-muted-foreground mt-2 text-sm">
                {view === 'login' 
                    ? 'Access your saved carts, orders, and delivery updates' 
                    : 'Create an account to enjoy a seamless shopping experience.'}
            </p>

            <form onSubmit={view === 'login' ? handleLogin : handleSignup} className="mt-8 space-y-6">
                {view === 'signup' && (
                     <div className="space-y-2">
                        <Label htmlFor="displayName">Display Name</Label>
                        <Input id="displayName" placeholder="John Doe" value={displayName} onChange={e => setDisplayName(e.target.value)} required />
                    </div>
                )}
                <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required className="pl-10" />
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                         <Label htmlFor="password">Password</Label>
                         {view === 'login' && (
                             <Link href="/auth/forgot-password" tabIndex={-1} className="text-sm text-primary hover:underline">Forgot Password?</Link>
                         )}
                    </div>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required className="pl-10 pr-10" />
                        <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground" onClick={() => setShowPassword(!showPassword)}>
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                    </div>
                </div>
                
                <Button type="submit" className="w-full" size="lg" disabled={loading}>
                    <LogIn className="mr-2 h-4 w-4"/>
                    {loading ? (view === 'login' ? 'Signing in...' : 'Creating Account...') : (view === 'login' ? 'Sign In' : 'Create Account')}
                </Button>

                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                    </div>
                </div>

                 <Button variant="outline" className="w-full" size="lg" onClick={handleGoogleLogin} type="button" disabled={loading}>
                    <GoogleIcon className="mr-2 h-5 w-5" />
                    Google
                </Button>

                <p className="text-center text-sm text-muted-foreground">
                    {view === 'login' ? "New customer?" : "Already have an account?"}
                    <Button variant="link" type="button" onClick={() => setView(view === 'login' ? 'signup' : 'login')} className="text-primary">
                        {view === 'login' ? 'Create Account' : 'Sign In'}
                    </Button>
                </p>
            </form>
        </div>
    )
}

const LeftPanel = () => {
    const features = [
        { icon: Zap, text: "Lightning-fast checkout" },
        { icon: PackageCheck, text: "Real-time order tracking" },
        { icon: Heart, text: "Wishlists & saved items" },
        { icon: Award, text: "Exclusive deals & offers" },
    ]

    return (
        <div className="hidden md:flex flex-col justify-between p-8 sm:p-12 text-white bg-gradient-to-br from-primary via-orange-500 to-amber-600 rounded-l-lg">
            <div>
                <Image
                    src="https://iili.io/qO5Jeou.png"
                    alt="DEFIMART Logo"
                    width={150}
                    height={32}
                    className="object-contain"
                    style={{ filter: 'brightness(0) invert(1)' }}
                />
                <h2 className="text-3xl font-bold mt-8">Welcome Back</h2>
                <p className="mt-2 text-white/80">Access your saved carts, orders, and real-time delivery updates.</p>

                <ul className="mt-8 space-y-4">
                    {features.map((feature, i) => (
                        <li key={i} className="flex items-center gap-3">
                            <feature.icon className="h-5 w-5 text-white/80" />
                            <span>{feature.text}</span>
                        </li>
                    ))}
                </ul>
            </div>
            <div className="grid grid-cols-2 gap-4 text-center">
                 <div className="bg-black/20 p-4 rounded-lg">
                    <p className="text-xs text-white/60 font-semibold">SECURITY</p>
                    <p className="font-bold">OTP + Email</p>
                </div>
                 <div className="bg-black/20 p-4 rounded-lg">
                    <p className="text-xs text-white/60 font-semibold">SUPPORT</p>
                    <p className="font-bold">24/7</p>
                </div>
            </div>
        </div>
    )
}


export function AuthModal({ initialView }: { initialView: 'login' | 'signup' }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();
    const [view, setView] = useState(initialView);
    const [isModalOpen, setIsModalOpen] = useState(true);

    useEffect(() => {
        const error = searchParams.get('error');
        const message = searchParams.get('message');
        if (error) {
            toast({ variant: 'destructive', title: 'Error', description: error });
            router.replace('/login');
        }
        if (message) {
            toast({ title: 'Info', description: message });
            router.replace('/login');
        }
    }, [searchParams, router, toast]);

    useEffect(() => {
        if (!isModalOpen) {
            // Use a timeout to allow the fade-out animation to finish
            setTimeout(() => router.push('/'), 150);
        }
    }, [isModalOpen, router]);

    return (
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogContent className="max-w-4xl p-0 gap-0 rounded-lg shadow-2xl">
                <div className="grid grid-cols-1 md:grid-cols-2">
                    <LeftPanel />
                    <RightPanel view={view} setView={setView} />
                </div>
            </DialogContent>
        </Dialog>
    );
}
