'use client';

import { useState, useEffect } from 'react';
import { WifiOff, CheckCircle2, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { syncOfflineActions } from '@/lib/offline-sync';

export function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');
  const [showStatus, setShowStatus] = useState(false);

  useEffect(() => {
    // Initial state
    setIsOnline(navigator.onLine);

    const handleOnline = async () => {
      setIsOnline(true);
      setShowStatus(true);
      setSyncMessage('You\'re back online. Syncing your activity...');
      
      setIsSyncing(true);
      await syncOfflineActions((msg) => setSyncMessage(msg));
      setIsSyncing(false);

      // Hide after success
      setTimeout(() => setShowStatus(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowStatus(true);
      setSyncMessage('You\'re offline. You can still browse and save items.');
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
            "fixed top-4 left-1/2 -translate-x-1/2 z-[9999] px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 transition-colors",
            isOnline ? "bg-emerald-500 text-white" : "bg-orange-500 text-white"
          )}
        >
          {isSyncing ? (
            <RefreshCw className="h-5 w-5 animate-spin" />
          ) : isOnline ? (
            <CheckCircle2 className="h-5 w-5" />
          ) : (
            <WifiOff className="h-5 w-5" />
          )}
          <span className="font-medium text-sm md:text-base whitespace-nowrap">
            {syncMessage}
          </span>
          {!isOnline && (
            <button 
              onClick={() => setShowStatus(false)}
              className="ml-2 hover:opacity-80"
            >
              ×
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
