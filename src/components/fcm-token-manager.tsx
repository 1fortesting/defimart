'use client';

import { useEffect } from 'react';
import { requestForToken, onMessageListener } from '@/firebase/messaging';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function FCMTokenManager() {
  const { toast } = useToast();

  useEffect(() => {
    const setupMessaging = async () => {
      // Check for environment variables before proceeding
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        console.warn('Supabase credentials missing. FCM Token registration skipped.');
        return;
      }

      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      try {
        const token = await requestForToken();
        if (token) {
          // Upsert token to Supabase
          await supabase.from('fcm_tokens').upsert({
            user_id: user.id,
            token: token,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'token' });
        }
      } catch (error) {
        console.error('Error during FCM token setup:', error);
      }
    };

    setupMessaging();

    // Listen for foreground messages
    const unsubscribe = onMessageListener().then((payload: any) => {
      if (payload) {
        toast({
          title: payload.notification?.title || 'Notification',
          description: payload.notification?.body || '',
        });
      }
    }).catch(err => console.log('failed: ', err));

    // Foreground listener usually returns a promise that resolves when message received.
    // In a real world app, you'd handle cleanup if the SDK supports it.
  }, [toast]);

  return null;
}
