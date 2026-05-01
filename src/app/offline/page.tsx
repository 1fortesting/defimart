import { WifiOff, ShoppingBag, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function OfflinePage() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-muted/20">
      <div className="bg-orange-100 rounded-full p-8 mb-6 border-4 border-white shadow-inner">
        <WifiOff className="h-16 w-16 text-orange-500" />
      </div>
      <h1 className="text-3xl font-extrabold mb-2 tracking-tight">You are currently offline</h1>
      <p className="text-muted-foreground mb-8 max-w-sm leading-relaxed">
        Don't worry! You can still browse previously visited pages and your items will sync automatically when you're back online.
      </p>
      
      <div className="grid gap-4 w-full max-w-xs">
        <Button asChild size="lg" className="w-full">
          <Link href="/">
            <ShoppingBag className="mr-2 h-5 w-5" />
            Go to Homepage
          </Link>
        </Button>
        <Button variant="outline" asChild size="lg" className="w-full">
          <Link href="/">
             <ArrowLeft className="mr-2 h-4 w-4" />
             Try to Go Back
          </Link>
        </Button>
      </div>
      
      <p className="mt-12 text-xs text-muted-foreground italic">
        Last checked: {new Date().toLocaleTimeString()}
      </p>
    </main>
  );
}
