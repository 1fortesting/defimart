'use client';

import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

export function GlobalToaster() {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const router = useRouter();
    const { toast } = useToast();

    useEffect(() => {
        const success = searchParams.get('success');
        const error = searchParams.get('error');
        const message = searchParams.get('message');
        
        // Create a new URLSearchParams object to modify
        const newParams = new URLSearchParams(searchParams.toString());

        let shouldReplace = false;

        if (success) {
            toast({
                variant: 'success',
                title: 'Success',
                description: success,
            });
            newParams.delete('success');
            shouldReplace = true;
        }
        if (error) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: error,
            });
            newParams.delete('error');
            shouldReplace = true;
        }
        if (message) {
            toast({
                title: 'Info',
                description: message,
            });
            newParams.delete('message');
            shouldReplace = true;
        }
        
        if (shouldReplace) {
             const newUrl = `${pathname}${newParams.toString() ? `?${newParams.toString()}` : ''}`;
             router.replace(newUrl, { scroll: false });
        }

    }, [searchParams, pathname, router, toast]);

    return null;
}
