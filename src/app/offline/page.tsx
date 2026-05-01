import { WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function OfflinePage() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center p-8 text-center">
      <div className="bg-muted rounded-full p-6 mb-6">
        <WifiOff className="h-12 w-12 text-muted-foreground" />
      </div>
      <h1 className="text-3xl font-bold mb-2">You are offline</h1>
      <p className="text-muted-foreground mb-8 max-w-sm">
        Please check your internet connection. We'll be here when you're back online.
      </p>
      <Button asChild>
        <Link href="/">Try Again</Link>
      </Button>
    </main>
  );
}