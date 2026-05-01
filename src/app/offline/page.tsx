'use client';

import { WifiOff, ShoppingBag, RefreshCcw, ShoppingCart, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function OfflinePage() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-muted/20 min-h-[calc(100vh-105px)]">
      <div className="bg-orange-100 rounded-full p-8 mb-6 border-4 border-white shadow-lg animate-pulse">
        <WifiOff className="h-16 w-16 text-orange-500" />
      </div>
      <h1 className="text-3xl font-extrabold mb-2 tracking-tight">Connectivity Lost</h1>
      <p className="text-muted-foreground mb-8 max-w-sm leading-relaxed">
        Defimart is currently in offline mode. Don't worry! You can still browse recently visited pages, view your cart, and your activity will sync automatically when you're back online.
      </p>
      
      <div className="grid gap-4 w-full max-w-xs">
        <Button asChild size="lg" className="w-full shadow-md">
          <Link href="/">
            <ShoppingBag className="mr-2 h-5 w-5" />
            Browse Cached Shop
          </Link>
        </Button>
        <div className="flex gap-2">
            <Button variant="outline" asChild size="lg" className="flex-1 bg-background">
                <Link href="/cart">
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Cart
                </Link>
            </Button>
             <Button variant="outline" asChild size="lg" className="flex-1 bg-background">
                <Link href="/saved">
                    <Heart className="mr-2 h-4 w-4" />
                    Wishlist
                </Link>
            </Button>
        </div>
        
        <div className="pt-4 border-t mt-4">
             <Button 
                variant="ghost" 
                onClick={() => typeof window !== 'undefined' && window.location.reload()} 
                className="text-primary hover:text-primary/80 font-semibold w-full"
            >
                 <RefreshCcw className="mr-2 h-4 w-4" />
                 Try to Reconnect
            </Button>
        </div>
      </div>
      
      <p className="mt-12 text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
        Pages you've visited recently are available for offline browsing.
      </p>
    </main>
  );
}
