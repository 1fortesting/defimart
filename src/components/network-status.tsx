'use client';

import { useState, useEffect } from 'react';
import { WifiOff, CheckCircle2, RefreshCw, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { syncOfflineActions } from '@/lib/offline-sync';

export function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');
  const [showStatus, setShowStatus] = useState(false);

  useEffect(() => {
    // Set initial state based on browser
    if (typeof navigator !== 'undefined') {
        setIsOnline(navigator.onLine);
    }

    const handleOnline = async () => {
      setIsOnline(true);
      setShowStatus(true);
      setSyncMessage('Welcome back! Reconnecting and syncing your data...');
      
      setIsSyncing(true);
      await syncOfflineActions((msg) => setSyncMessage(msg));
      setIsSyncing(false);

      // Keep success message visible for a moment
      setSyncMessage('System fully synchronized!');
      setTimeout(() => setShowStatus(false), 4000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowStatus(true);
      setSyncMessage('Working Offline: Defimart will sync when you return online.');
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
      {showStatus && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className={cn(
            "fixed top-4 left-1/2 -translate-x-1/2 z-[10000] px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 border backdrop-blur-md transition-all",
            isOnline 
              ? "bg-emerald-500/90 text-white border-emerald-400" 
              : "bg-orange-500/90 text-white border-orange-400"
          )}
        >
          {isSyncing ? (
            <RefreshCw className="h-5 w-5 animate-spin" />
          ) : isOnline ? (
            <CheckCircle2 className="h-5 w-5" />
          ) : (
            <WifiOff className="h-5 w-5 animate-pulse" />
          )}
          <span className="font-semibold text-sm md:text-base whitespace-nowrap">
            {syncMessage}
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
