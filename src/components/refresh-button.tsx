'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { Button } from './ui/button';
import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

export function RefreshButton() {
    const router = useRouter();
    const [isRefreshing, startTransition] = useTransition();

    const handleRefresh = () => {
        startTransition(() => {
            router.refresh();
        });
    };

    return (
        <Button onClick={handleRefresh} disabled={isRefreshing} variant="ghost" size="icon">
            <RefreshCw className={cn("h-5 w-5 text-primary", isRefreshing && "animate-spin")} />
            <span className="sr-only">Refresh</span>
        </Button>
    );
}
