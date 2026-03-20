'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function updateOrderStatus(formData: FormData) {
    const supabase = createClient();
    const orderId = formData.get('orderId') as string;
    const status = formData.get('status') as string;

    const { error } = await supabase
        .from('orders')
        .update({ status: status })
        .eq('id', orderId);
    
    if (error) {
        console.error("Failed to update order status:", error);
        return { error: 'Failed to update order status.' };
    }

    revalidatePath('/admin/orders');
}
