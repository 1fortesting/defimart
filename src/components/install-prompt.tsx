'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { useIsMobile } from '@/hooks/use-mobile';
import { X } from 'lucide-react';
import { ThemeProvider, useTheme } from 'next-themes';

interface BeforeInstallPromptEvent extends Event {
    readonly platforms: Array<string>;
    readonly userChoice: Promise<{
        outcome: 'accepted' | 'dismissed';
        platform: string;
    }>;
    prompt(): Promise<void>;
}

export function InstallPrompt() {
    const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
    const [isVisible, setIsVisible] = useState(false);
    const isMobile = useIsMobile();
    const { resolvedTheme } = useTheme();

    useEffect(() => {
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setInstallEvent(e as BeforeInstallPromptEvent);
            if (!sessionStorage.getItem('defimart-install-prompt-dismissed')) {
                 setIsVisible(true);
            }
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!installEvent) return;
        installEvent.prompt();
        await installEvent.userChoice;
        setIsVisible(false);
        setInstallEvent(null);
    };

    const handleDismiss = () => {
         setIsVisible(false);
         sessionStorage.setItem('defimart-install-prompt-dismissed', 'true');
    };

    const handleDragEnd = (event: any, info: any) => {
        if (info.offset.x < -100 || info.offset.x > 100) {
            handleDismiss();
        }
    };
    
    if (!isMobile) {
        return null;
    }

    return (
        <AnimatePresence>
            {isVisible && (
                <ThemeProvider forcedTheme={resolvedTheme === 'light' ? 'dark' : 'light'}>
                    <motion.div
                        className="fixed bottom-24 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-md z-50"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -200 }}
                        drag="x"
                        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                        onDragEnd={handleDragEnd}
                        dragElastic={0.2}
                    >
                        <div className="bg-background shadow-lg rounded-lg border p-4 flex items-center gap-4">
                            <Image src="https://iili.io/qO5Jeou.png" alt="DEFIMART Logo" width={40} height={40} className="rounded-md" />
                            <div className="flex-1">
                                <p className="font-semibold text-foreground">Install DEFIMART</p>
                                <p className="text-sm text-muted-foreground">Add to your home screen</p>
                            </div>
                            <Button onClick={handleInstallClick} size="sm">
                                Install
                            </Button>
                            <Button onClick={handleDismiss} size="icon" variant="ghost" className="h-8 w-8">
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </motion.div>
                </ThemeProvider>
            )}
        </AnimatePresence>
    );
}
