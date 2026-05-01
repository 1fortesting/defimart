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
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[10000] px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 border bg-destructive text-destructive-foreground backdrop-blur-md"
        >
          <WifiOff className="h-5 w-5 animate-pulse" />
          <span className="font-semibold text-sm md:text-base whitespace-nowrap">
            You're offline. Please connect to continue.
          </span>
          <button 
            onClick={() => setShowStatus(false)}
            className="ml-2 p-1 hover:bg-white/20 rounded-full transition-colors"
            aria-label="Close status"
          >
            <X className="h-4 w-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
