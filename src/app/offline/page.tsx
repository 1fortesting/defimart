'use client';

import { WifiOff, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

export default function OfflinePage() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-background min-h-[calc(100vh-105px)]">
      <div className="mb-8">
        <Image 
            src="https://iili.io/qO5Jeou.png" 
            alt="Defimart Logo" 
            width={180} 
            height={40} 
            className="mx-auto object-contain grayscale opacity-50"
        />
      </div>
      
      <div className="bg-muted rounded-full p-8 mb-6">
        <WifiOff className="h-16 w-16 text-muted-foreground" />
      </div>
      
      <h1 className="text-2xl font-bold mb-4 tracking-tight">No Internet Connection</h1>
      <p className="text-muted-foreground mb-8 max-w-xs leading-relaxed">
        Please connect to your internet to continue shopping on Defimart.
      </p>
      
      <Button 
        size="lg" 
        onClick={() => typeof window !== 'undefined' && window.location.reload()} 
        className="w-full max-w-xs shadow-md"
      >
        <RefreshCcw className="mr-2 h-5 w-5" />
        Try Again
      </Button>
      
      <p className="mt-12 text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
        Stable connection required for secure transactions
      </p>
    </main>
  );
}
