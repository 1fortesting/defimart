'use client';

import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function LoadingSpinner({ className, text }: { className?: string, text?: string }) {
    return (
        <div className={cn("flex flex-col justify-center items-center h-full gap-4", className)}>
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            {text && <p className="text-muted-foreground animate-pulse">{text}</p>}
        </div>
    )
}

export function FullPageLoading({ text }: { text?: string }) {
    return (
        <main className="flex-1 flex items-center justify-center p-4">
            <LoadingSpinner text={text} />
        </main>
    )
}
