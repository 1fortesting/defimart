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

import { Zap, PackageCheck, Heart, Award, Mail, Lock, Eye, EyeOff, ArrowRight, Phone } from 'lucide-react';

const RightPanel = ({ view, setView }: { view: 'login' | 'signup', setView: (view: 'login' | 'signup') => void }) => {
    const router = useRouter();
    const { toast } = useToast();
    
    // Form State
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
            router.refresh(); // Refresh to update server-side state
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


    return (
        <div className="flex flex-col bg-background md:justify-center md:rounded-r-2xl">
            {/* Mobile Header */}
            <div className="md:hidden bg-gradient-to-br from-primary via-orange-500 to-amber-600 p-8 text-white shadow-lg">
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

            {/* Form section */}
            <div className="p-8 sm:p-12 flex-grow flex flex-col justify-center">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-foreground leading-tight">
                        {view === 'login' ? 'Sign in to' : 'Get started with'} <br /> <span className="text-primary">DEFIMART</span>
                    </h1>
                    <p className="text-muted-foreground mt-4 text-base">
                        {view === 'login' 
                            ? 'Access your saved carts, orders, and delivery updates.' 
                            : 'Create an account to enjoy a seamless shopping experience.'}
                    </p>
                </div>


                <form onSubmit={view === 'login' ? handleLogin : handleSignup} className="space-y-6">
                    {view === 'signup' && (
                        <div className="space-y-2">
                            <Label htmlFor="displayName">Display Name</Label>
                            <Input id="displayName" placeholder="John Doe" value={displayName} onChange={e => setDisplayName(e.target.value)} required />
                        </div>
                    )}
                    {view === 'signup' && (
                        <div className="space-y-2">
                            <Label htmlFor="phoneNumber">Phone Number</Label>
                             <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input id="phoneNumber" type="tel" placeholder="055 123 4567" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} required className="pl-10" />
                            </div>
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
                    
                    <div className="space-y-4 pt-4">
                        <Button type="submit" className="w-full" size="lg" disabled={loading}>
                            <ArrowRight className="mr-2 h-4 w-4"/>
                            {loading ? (view === 'login' ? 'Signing in...' : 'Creating Account...') : (view === 'login' ? 'Sign In' : 'Create Account')}
                        </Button>

                         <Button variant="outline" type="button" onClick={() => setView(view === 'login' ? 'signup' : 'login')} className="w-full">
                            {view === 'login' ? 'New customer? Create Account' : 'Already have an account? Sign In'}
                        </Button>
                    </div>
                </form>
            </div>
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
        <div className="hidden md:flex flex-col justify-between p-12 text-white bg-gradient-to-br from-primary via-orange-500 to-amber-600 rounded-l-2xl">
            <div>
                 <div className="mb-20">
                    <h1 className="text-5xl font-bold text-white">DefiM</h1>
                    <p className="text-sm text-white/80 tracking-widest mt-1">Shop | Earn | Grow</p>
                </div>
                <h2 className="text-4xl font-bold">Welcome Back</h2>
                <p className="mt-4 text-lg text-white/80">Access your saved carts, orders, and real-time delivery updates.</p>

                <ul className="mt-12 space-y-5">
                    {features.map((feature, i) => (
                        <li key={i} className="flex items-center gap-3">
                            <feature.icon className="h-5 w-5 text-white/80" />
                            <span>{feature.text}</span>
                        </li>
                    ))}
                </ul>
            </div>
            <div className="flex items-center gap-4">
                 <div className="bg-black/20 px-4 py-2 rounded-lg">
                    <p className="text-xs font-semibold tracking-wider text-white/60">SECURITY</p>
                </div>
                 <div className="bg-black/20 px-4 py-2 rounded-lg">
                    <p className="text-xs font-semibold tracking-wider text-white/60">SUPPORT</p>
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
            <DialogContent className="p-0 gap-0 shadow-2xl rounded-2xl overflow-hidden w-[calc(100%-2rem)] max-w-sm md:w-full md:max-w-4xl md:grid md:grid-cols-2 md:min-h-[720px]">
                <DialogHeader className="sr-only">
                  <DialogTitle>Authentication</DialogTitle>
                </DialogHeader>
                <LeftPanel />
                <RightPanel view={view} setView={setView} />
            </DialogContent>
        </Dialog>
    );
}
