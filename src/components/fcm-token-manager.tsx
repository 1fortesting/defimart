'use client';

import { useEffect, useState } from 'react';
import { requestForToken, onMessageListener } from '@/firebase/messaging';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function FCMTokenManager() {
  const { toast } = useToast();
  const supabase = createClient();

  useEffect(() => {
    const setupMessaging = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const token = await requestForToken();
      if (token) {
        // Upsert token to Supabase
        await supabase.from('fcm_tokens').upsert({
          user_id: user.id,
          token: token,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'token' });
      }
    };

    setupMessaging();

    // Listen for foreground messages
    onMessageListener().then((payload: any) => {
      if (payload) {
        toast({
          title: payload.notification?.title || 'Notification',
          description: payload.notification?.body || '',
        });
      }
    }).catch(err => console.log('failed: ', err));
  }, []);

  return null;
}