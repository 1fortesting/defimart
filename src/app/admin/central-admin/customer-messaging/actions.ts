'use server';

import { sendSms } from '@/lib/sendSms';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function sendBulkSms(prevState: any, formData: FormData) {
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { cookies: { get: (name) => cookies().get(name)?.value } }
    );
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || user.email !== process.env.NEXT_PUBLIC_ADMIN_EMAIL) {
        return { success: false, message: 'Unauthorized action.' };
    }

    const message = formData.get('message') as string;
    const phoneNumbersString = formData.get('phoneNumbers') as string;

    if (!message || !phoneNumbersString) {
        return { success: false, message: 'Message and phone numbers are required.' };
    }
    
    const phoneNumbers = JSON.parse(phoneNumbersString) as string[];

    if (!Array.isArray(phoneNumbers) || phoneNumbers.length === 0) {
        return { success: false, message: 'No valid recipients selected.' };
    }

    try {
        // In a real production app, this should be handled by a proper queueing system
        // to avoid long-running server actions and to handle rate limits gracefully.
        const results = await Promise.allSettled(
            phoneNumbers.map(number => sendSms({ phoneNumber: number, message }))
        );

        const successfulSends = results.filter(r => r.status === 'fulfilled').length;
        const failedSends = results.length - successfulSends;

        let resultMessage = `SMS sent to ${successfulSends} customers.`;
        if (failedSends > 0) {
            resultMessage += ` ${failedSends} failed.`;
            console.error('Failed SMS sends:', results.filter(r => r.status === 'rejected'));
        }
        
        return { success: true, message: resultMessage };

    } catch (error) {
        console.error('Error sending bulk SMS:', error);
        return { success: false, message: 'An unexpected error occurred while sending messages.' };
    }
}
