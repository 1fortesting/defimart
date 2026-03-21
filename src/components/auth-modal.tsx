'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';

import { Zap, PackageCheck, Heart, Award, Mail, Lock, Eye, EyeOff, ArrowRight, Phone, User } from 'lucide-react';

const RightPanel = ({ view, setView }: { view: 'login' | 'signup', setView: (view: 'login' | 'signup') => void }) => {
    const router = useRouter();
    const { toast } = useToast();
    
    const [displayName, setDisplayName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
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
            router.refresh();
        }
        setLoading(false);
    };

    const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        const supabase = createClient();

        let formattedPhoneNumber = phoneNumber.trim();
        if (formattedPhoneNumber.startsWith('0')) {
            formattedPhoneNumber = '+233' + formattedPhoneNumber.substring(1);
        }

        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { 
                display_name: displayName,
                phone_number: formattedPhoneNumber
            } }
        });
        if (error) {
            toast({ variant: 'destructive', title: 'Signup Failed', description: error.message });
        } else {
            router.refresh();
        }
        setLoading(false);
    };
    
    const signupForm = (
        <form onSubmit={handleSignup} className="flex flex-col">
            <div className="space-y-3">
                 <div className="text-center">
                    <p className="text-sm font-semibold text-primary uppercase">CREATE ACCOUNT</p>
                    <h1 className="text-3xl font-bold text-foreground mt-1">
                        Join DEFIMART
                    </h1>
                    <p className="text-muted-foreground mt-2 text-base">
                        Complete the steps below to get started.
                    </p>
                </div>

                <div className="flex items-center justify-center gap-8 my-4">
                    <div className="flex flex-col items-center gap-2 text-primary">
                        <div className="bg-primary text-primary-foreground rounded-full h-10 w-10 flex items-center justify-center">
                            <User className="h-5 w-5" />
                        </div>
                        <span className="text-sm font-semibold">Personal</span>
                    </div>
                     <div className="flex-grow border-t border-dashed"></div>
                     <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <div className="bg-muted text-muted-foreground rounded-full h-10 w-10 flex items-center justify-center">
                            <Lock className="h-5 w-5" />
                        </div>
                        <span className="text-sm">Security</span>
                    </div>
                </div>

                <div className="text-left py-2">
                     <p className="font-semibold flex items-center gap-2"><User className="text-primary h-5 w-5" /> Personal Information</p>
                </div>


                <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="displayName">Full Name</Label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input id="displayName" placeholder="Kwame Mensah" value={displayName} onChange={e => setDisplayName(e.target.value)} required  className="pl-10" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="phoneNumber">Phone Number</Label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input id="phoneNumber" type="tel" placeholder="+233 XX XXX XXXX" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} required className="pl-10" />
                        </div>
                    </div>
                </div>
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
                    </div>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required className="pl-10 pr-10" />
                        <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground" onClick={() => setShowPassword(!showPassword)}>
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                    </div>
                </div>
            </div>
            
            <div className="space-y-3 pt-4">
                <Button type="submit" className="w-full" size="lg" disabled={loading}>
                    {loading ? 'Creating Account...' : 'Continue'}
                </Button>

                <Button variant="outline" type="button" onClick={() => setView('login')} className="w-full">
                    Already have an account? Sign In
                </Button>
            </div>
        </form>
    );

    const loginForm = (
        <form onSubmit={handleLogin}>
            <div className="mb-4 text-center md:text-left">
                <p className="text-sm font-semibold text-primary uppercase">Customer Sign In</p>
                <h1 className="text-3xl font-bold text-foreground mt-1">
                    Sign in to continue
                </h1>
                <p className="text-muted-foreground mt-2 text-base">
                    Access your saved carts, orders, and delivery updates.
                </p>
            </div>
            <div className="space-y-3">
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
                        <Link href="/auth/forgot-password" tabIndex={-1} className="text-sm text-primary hover:underline">Forgot Password?</Link>
                    </div>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required className="pl-10 pr-10" />
                        <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground" onClick={() => setShowPassword(!showPassword)}>
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                    </div>
                </div>
            </div>
            
            <div className="space-y-3 pt-4">
                <Button type="submit" className="w-full" size="lg" disabled={loading}>
                    {loading ? 'Signing in...' : <> <ArrowRight className="mr-2 h-4 w-4"/> Sign In </>}
                </Button>

                <Button variant="outline" type="button" onClick={() => setView('signup')} className="w-full">
                    New customer? Create Account
                </Button>
            </div>
        </form>
    );

    return (
        <div className="flex flex-col bg-background p-8 md:rounded-r-2xl justify-center h-full">
            <div className="md:hidden bg-gradient-to-br from-primary via-orange-500 to-amber-600 p-8 text-white shadow-lg rounded-t-2xl -m-8 mb-8">
                 <div className="flex items-center gap-4">
                    <div className="bg-white/20 p-2 rounded-lg">
                         <div className="w-10 h-10 flex items-center justify-center font-bold text-white text-2xl">D</div>
                    </div>
                    <div>
                        <h2 className="font-bold text-lg">DEFIMART</h2>
                        <p className="text-sm text-white/80">{view === 'login' ? 'Welcome Back' : 'Create an Account'}</p>
                    </div>
                 </div>
            </div>
            {view === 'login' ? loginForm : signupForm}
        </div>
    )
}

const LeftPanel = () => {
    const features = [
        { icon: Zap, text: "Lightning-fast checkout" },
        { icon: PackageCheck, text: "Real-time order tracking" },
        { icon: Heart, text: "Wishlists & saved items" },
        { icon: Award, text: "Exclusive deals & offers" },
    ];
    
    const title = 'Join Our Marketplace';
    const description = 'Create your account to unlock fast checkout, wishlists, and exclusive deals.';

    return (
        <div className="hidden md:flex flex-col justify-between p-8 text-white bg-gradient-to-br from-primary via-orange-500 to-amber-600 rounded-l-2xl">
            <div>
                 <div className="flex items-center gap-4 mb-6">
                    <div className="bg-white/20 p-2 rounded-lg">
                        <Image src="https://iili.io/qO5Jeou.png" alt="DEFIMART Logo" width={40} height={40} className="brightness-0 invert" />
                    </div>
                    <div>
                        <p className="font-bold text-lg leading-tight">DEFIMART</p>
                        <p className="text-sm text-white/80 leading-tight">Customer & Checkout</p>
                    </div>
                 </div>
                <h2 className="text-3xl font-bold">{title}</h2>
                <p className="mt-2 text-base text-white/80">{description}</p>

                <ul className="mt-6 space-y-3">
                    {features.map((feature, i) => (
                        <li key={i} className="flex items-center gap-4">
                            <div className="bg-white/20 p-2 rounded-lg">
                                <feature.icon className="h-5 w-5 text-white" />
                            </div>
                            <span className="text-sm">{feature.text}</span>
                        </li>
                    ))}
                </ul>
            </div>
            <div className="flex items-center gap-4 mt-6">
                 <div className="bg-black/20 text-center px-4 py-3 rounded-lg flex-1">
                    <p className="text-xs font-semibold tracking-wider text-white/60">SECURITY</p>
                    <p className="text-sm font-medium">OTP + Email</p>
                </div>
                 <div className="bg-black/20 text-center px-4 py-3 rounded-lg flex-1">
                    <p className="text-xs font-semibold tracking-wider text-white/60">SUPPORT</p>
                     <p className="text-sm font-medium">24/7</p>
                </div>
            </div>
        </div>
    )
}


export function AuthModal({ initialView }: { initialView: 'login' | 'signup' }) {
    const router = useRouter();
    const [view, setView] = useState(initialView);
    const [isModalOpen, setIsModalOpen] = useState(true);

    useEffect(() => {
        if (!isModalOpen) {
            // Use a timeout to allow the fade-out animation to finish
            setTimeout(() => router.back(), 150);
        }
    }, [isModalOpen, router]);

    // When view changes (e.g. from login to signup), update URL without full navigation
    useEffect(() => {
        window.history.replaceState(null, '', `/${view}`);
    }, [view]);

    return (
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogContent className="p-0 gap-0 shadow-2xl rounded-2xl overflow-hidden w-[calc(100%-2rem)] max-w-sm md:w-full md:max-w-4xl md:grid md:grid-cols-2">
                <DialogHeader className="sr-only">
                  <DialogTitle>Authentication</DialogTitle>
                </DialogHeader>
                <LeftPanel />
                <RightPanel view={view} setView={setView} />
            </DialogContent>
        </Dialog>
    );
}
