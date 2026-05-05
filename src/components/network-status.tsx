'use client';

import { useState, useEffect } from 'react';
import { WifiOff, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [showStatus, setShowStatus] = useState(false);

  useEffect(() => {
    if (typeof navigator !== 'undefined') {
        setIsOnline(navigator.onLine);
    }

    const handleOnline = () => {
      setIsOnline(true);
      setShowStatus(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowStatus(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <AnimatePresence>
      {showStatus && !isOnline && (
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 50, opacity: 0 }}
          className="fixed bottom-20 md:top-6 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:right-auto z-[10000] px-4 py-2.5 md:px-6 md:py-3 rounded-2xl md:rounded-full shadow-2xl flex items-center justify-between md:justify-start gap-3 border bg-destructive/95 text-destructive-foreground backdrop-blur-xl"
        >
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-1.5 rounded-lg">
                <WifiOff className="h-4 w-4 md:h-5 md:w-5 animate-pulse" />
            </div>
            <span className="font-bold text-xs md:text-sm tracking-tight">
              Connection lost. Reconnecting...
            </span>
          </div>
          <button 
            onClick={() => setShowStatus(false)}
            className="p-1.5 hover:bg-white/10 rounded-xl transition-colors"
            aria-label="Close status"
          >
            <X className="h-4 w-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
