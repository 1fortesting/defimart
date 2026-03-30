'use server';

import { createServerClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { sendSms } from '@/lib/sendSms';

export async function updateRequestStatus(formData: FormData) {
    const supabase = createServerClient();
    const requestId = formData.get('requestId') as string;
    const newStatus = formData.get('status') as string;

    if (!requestId || !newStatus) {
        return { error: 'Invalid data provided.' };
    }
    
    const { data: request, error: updateError } = await supabase
        .from('product_requests')
        .update({ status: newStatus })
        .eq('id', requestId)
        .select('*, profiles(phone_number)')
        .single();
    
    if (updateError || !request) {
        return { error: `Failed to update status: ${updateError?.message || 'Request not found'}.` };
    }
    
    // --- SMS Notification to User ---
    const userPhoneNumber = request.profiles?.phone_number;
    if (userPhoneNumber) {
        const shortDesc = request.description.substring(0, 30);
        let userMessage = `DEFIMART UPDATE: Your product request for "${shortDesc}..." has been updated to: ${newStatus.toUpperCase()}.`;
        if (newStatus === 'sourced') {
            userMessage += ' The item will be available in the store shortly!';
        } else if (newStatus === 'rejected') {
            userMessage += ' We were unable to source this item at this time. Thank you for your suggestion.';
        }
        
        try {
            await sendSms({ phoneNumber: userPhoneNumber, message: userMessage });
        } catch (e) {
            console.error("Failed to send status update SMS to user:", e);
        }
    }
    
    revalidatePath('/admin/procurement/requests');
    return { success: true };
}
