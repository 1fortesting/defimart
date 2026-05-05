'use server';

import { createClient } from '@/lib/supabase/server';

interface SendPushParams {
  userIds?: string[];
  audience?: 'all' | 'active' | 'category';
  title: string;
  body: string;
  type: string;
  role?: string;
}

/**
 * Utility to send push notifications by invoking the secure Supabase Edge Function.
 */
export async function sendPush({ userIds = [], audience = 'all', title, body, type, role = 'System' }: SendPushParams) {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase.functions.invoke('send-fcm', {
      body: { 
        userIds,
        audience,
        title,
        body,
        type,
        role 
      },
    });

    if (error) {
      let errorMessage = error.message;
      try {
        // Try to extract more detail if the error is from the function itself
        if (error.context && typeof error.context.json === 'function') {
           const details = await error.context.json();
           if (details.error) errorMessage = details.error;
        }
      } catch (e) {}
      
      console.error('Failed to invoke send-fcm function:', error);
      return { success: false, error: errorMessage || 'Notification service temporarily unavailable.' };
    }

    return { success: true, data };
  } catch (err: any) {
    console.error('Error sending push notification:', err);
    return { success: false, error: 'Network error: Failed to reach notification service.' };
  }
}
