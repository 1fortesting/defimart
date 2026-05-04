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
export async function sendPush({ userIds, audience = 'all', title, body, type, role = 'System' }: SendPushParams) {
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
      console.error('Failed to invoke send-fcm function:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err: any) {
    console.error('Error sending push notification:', err);
    return { success: false, error: err.message };
  }
}
