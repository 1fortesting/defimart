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
          initial={{ y: 100, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 100, opacity: 0, scale: 0.95 }}
          className="fixed bottom-24 left-4 right-4 md:left-auto md:right-8 md:bottom-8 md:w-auto z-[10000] p-1 pr-2 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex items-center gap-3 border border-white/20 bg-background/80 backdrop-blur-2xl ring-1 ring-black/5"
        >
          <div className="bg-destructive p-2.5 rounded-full shadow-lg shadow-destructive/20 flex-shrink-0">
              <WifiOff className="h-4 w-4 text-white animate-pulse" />
          </div>
          <div className="flex flex-col pr-2 min-w-0">
              <span className="text-[10px] font-black uppercase tracking-[2px] text-destructive leading-none">Offline Mode</span>
              <span className="text-xs font-bold text-muted-foreground mt-1 whitespace-nowrap overflow-hidden text-ellipsis">Check your connection</span>
          </div>
          <button 
            onClick={() => setShowStatus(false)}
            className="p-1.5 hover:bg-muted rounded-full transition-colors ml-auto flex-shrink-0"
            aria-label="Close alert"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
