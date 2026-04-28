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
    const customerIdsString = formData.get('customerIds') as string;

    if (!message || !customerIdsString) {
        return { success: false, message: 'Message and recipients are required.' };
    }
    
    const customerIds = JSON.parse(customerIdsString) as string[];

    if (!Array.isArray(customerIds) || customerIds.length === 0) {
        return { success: false, message: 'No valid recipients selected.' };
    }
    
    const { data: customers, error: customerError } = await supabase
        .from('profiles')
        .select('id, display_name, phone_number')
        .in('id', customerIds);
    
    if (customerError) {
        console.error('Error fetching customers for SMS:', customerError);
        return { success: false, message: 'Could not fetch customer details.' };
    }
    
    const validCustomers = customers.filter(c => c.phone_number);

    try {
        const results = await Promise.allSettled(
            validCustomers.map(customer => {
                const personalizedMessage = message.replace(/\{name\}/g, customer.display_name || 'Valued Customer');
                return sendSms({ phoneNumber: customer.phone_number!, message: personalizedMessage });
            })
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
