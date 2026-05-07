'use client';

import { WifiOff, RefreshCcw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import Link from 'next/link';

export default function OfflinePage() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-background min-h-screen relative overflow-hidden">
      {/* Branded Background Auras */}
      <div className="absolute top-[-10%] right-[-10%] w-[70%] h-[70%] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center max-w-sm w-full">
        <div className="mb-12">
            <Image 
                src="https://iili.io/qO5Jeou.png" 
                alt="Defimart Logo" 
                width={180} 
                height={40} 
                className="mx-auto object-contain"
            />
        </div>
        
        <div className="relative mb-8">
            <div className="absolute inset-0 bg-destructive/10 rounded-full blur-3xl animate-pulse" />
            <div className="bg-background border-2 border-dashed border-destructive/20 rounded-full p-10 relative">
                <WifiOff className="h-16 w-16 text-destructive" />
            </div>
        </div>
        
        <h1 className="text-3xl font-black tracking-tight text-foreground mb-4 uppercase">Lost Connection</h1>
        <p className="text-muted-foreground mb-10 leading-relaxed font-medium">
            It seems you're currently offline. Please check your internet settings to continue shopping.
        </p>
        
        <div className="flex flex-col gap-3 w-full">
            <Button 
                size="lg" 
                onClick={() => typeof window !== 'undefined' && window.location.reload()} 
                className="w-full h-14 text-base font-black uppercase tracking-widest shadow-xl shadow-primary/20 rounded-2xl"
            >
                <RefreshCcw className="mr-2 h-5 w-5" />
                Try Again
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full h-14 text-base font-black uppercase tracking-widest border-2 rounded-2xl">
                <Link href="/">
                    <Home className="mr-2 h-5 w-5" />
                    Back to Home
                </Link>
            </Button>
        </div>
        
        <p className="mt-16 text-[10px] text-muted-foreground uppercase tracking-[3px] font-black opacity-40">
          Defimart Offline Protocol
        </p>
      </div>
    </main>
  );
}
