'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';

interface BeforeInstallPromptEvent extends Event {
    readonly platforms: Array<string>;
    readonly userChoice: Promise<{
        outcome: 'accepted' | 'dismissed';
        platform: string;
    }>;
    prompt(): Promise<void>;
}

export function InstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const isMobile = useIsMobile();

    useEffect(() => {
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        const handleAppInstalled = () => {
            setDeferredPrompt(null);
        };

        window.addEventListener('appinstalled', handleAppInstalled);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        await deferredPrompt.userChoice;
        setDeferredPrompt(null);
    };

    if (!deferredPrompt || !isMobile) {
        return null;
    }

    return (
        <>
            <div className="fixed top-0 left-0 w-full h-[60px] flex items-center gap-3 px-3 py-2 bg-background border-b shadow-sm z-[9999]">
                <Image 
                    src="https://iili.io/qO5Jeou.png" 
                    alt="App Icon"
                    width={32}
                    height={32}
                    className="rounded-lg"
                />
                <div className="flex-1">
                    <div className="text-sm font-semibold text-foreground">Install Defimart</div>
                    <div className="text-xs text-muted-foreground">Add to home screen</div>
                </div>
                <Button onClick={handleInstallClick} size="sm" className="px-4 py-1.5 h-auto text-sm rounded-md">
                    Install
                </Button>
            </div>
            {/* Placeholder to push content down */}
            <div className="h-[60px] w-full" />
        </>
    );
}
