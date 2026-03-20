import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function AuthPrompt() {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 text-foreground">
      <div className="bg-muted rounded-full p-6 mb-6">
        <Lock className="h-12 w-12 text-muted-foreground" />
      </div>
      <h2 className="text-3xl font-bold mb-2">Login Required</h2>
      <p className="text-muted-foreground mb-8 max-w-sm">
        Please sign in to access your wishlist, messages, and profile details.
      </p>
      <Button asChild size="lg">
        <Link href="/login">Sign In / Register</Link>
      </Button>
    </div>
  );
}
