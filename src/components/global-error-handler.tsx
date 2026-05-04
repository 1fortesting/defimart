'use client';

import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

/**
 * GlobalErrorHandler sets up window-level listeners for unhandled errors and rejections.
 * This component should be rendered once in the Root Layout.
 */
export function GlobalErrorHandler() {
  const { toast } = useToast();

  useEffect(() => {
    // 1. Handle runtime JS errors (window.onerror)
    const handleRuntimeError = (event: ErrorEvent) => {
      console.error('Global Runtime Error:', event.error);
      
      // Prevent double-toasting for the same error if possible
      toast({
        variant: 'destructive',
        title: 'Application Error',
        description: 'An unexpected error occurred. Please refresh the page if the issue persists.',
      });
    };

    // 2. Handle unhandled promise rejections
    const handlePromiseRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled Promise Rejection:', event.reason);
      
      toast({
        variant: 'destructive',
        title: 'Connection Error',
        description: 'A background task failed. Check your internet connection or try again.',
      });
    };

    window.addEventListener('error', handleRuntimeError);
    window.addEventListener('unhandledrejection', handlePromiseRejection);

    return () => {
      window.removeEventListener('error', handleRuntimeError);
      window.removeEventListener('unhandledrejection', handlePromiseRejection);
    };
  }, [toast]);

  return null; // This component doesn't render anything UI-wise
}
