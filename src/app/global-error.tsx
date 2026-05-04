'use client';

import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

/**
 * global-error.tsx is a special Next.js file that wraps the entire app,
 * including the root layout. It MUST define its own <html> and <body> tags.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="flex justify-center">
            <div className="bg-red-100 dark:bg-red-900/30 p-6 rounded-full">
              <AlertTriangle className="w-16 h-16 text-red-600 dark:text-red-400" />
            </div>
          </div>
          
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tighter text-foreground">
              Critical System Error
            </h1>
            <p className="text-muted-foreground text-lg">
              We encountered a critical error that prevented the application from starting.
            </p>
          </div>

          <div className="p-4 bg-muted rounded-lg text-left overflow-auto max-h-40 border border-border">
             <p className="font-mono text-xs text-muted-foreground break-all">
                {error.message || 'Unknown Error'}
                {error.digest && <span className="block mt-2 opacity-50">Digest: {error.digest}</span>}
             </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button 
              onClick={() => reset()} 
              size="lg"
              className="font-semibold"
            >
              <RefreshCcw className="w-4 h-4 mr-2" />
              Reset Application
            </Button>
            <Button 
              onClick={() => window.location.href = '/'} 
              variant="outline"
              size="lg"
            >
              Back to Home
            </Button>
          </div>
          
          <p className="text-sm text-muted-foreground pt-4">
            If the problem persists, please contact support at support@defimartonline.com
          </p>
        </div>
      </body>
    </html>
  );
}
