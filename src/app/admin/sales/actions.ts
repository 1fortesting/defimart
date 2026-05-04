'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { Database } from '@/types/supabase';
import { sendSms } from '@/lib/sendSms';
import { getPickupDateString } from '@/lib/getPickupDate';
import { sendPush } from '@/lib/sendPush';

export async function updateOrderStatus(formData: FormData) {
    const supabase = await createClient() as any;
    const orderId = formData.get('orderId') as string;
    const newStatus = formData.get('status') as Database['public']['Enums']['order_status'];

    if (!orderId || !newStatus) {
        return { error: 'Invalid data provided.' };
    }

    const { data: order, error: fetchError } = await supabase
        .from('orders')
        .select('*, products(name), profiles:profiles!orders_buyer_id_fkey(phone_number)')
        .eq('id', orderId)
        .single();

    if (fetchError || !order) {
        console.error('Failed to fetch order:', fetchError);
        return { error: 'Failed to retrieve order details.' };
    }
    
    const oldStatus = order.status;

    if (newStatus === 'completed' && oldStatus !== 'completed') {
        const { data: product, error: productError } = await supabase
            .from('products')
            .select('quantity')
            .eq('id', order.product_id)
            .single();
        
        if (productError || product === null) {
            return { error: 'Order status NOT updated. Could not find the product to adjust stock.' };
        }

        const newQuantity = (product.quantity ?? 0) - order.quantity;
        if (newQuantity < 0) {
            return { error: `Order status NOT updated. Not enough stock to complete order. Only ${product.quantity ?? 0} available.` };
        }

        await supabase.from('products').update({ quantity: newQuantity }).eq('id', order.product_id);
    } else if (oldStatus === 'completed' && newStatus !== 'completed') {
        const { data: product } = await supabase.from('products').select('quantity').eq('id', order.product_id).single();
        if (product) {
            await supabase.from('products').update({ quantity: (product.quantity ?? 0) + order.quantity }).eq('id', order.product_id);
        }
    }

    const { error: updateError } = await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
    
    if (updateError) return { error: 'Failed to update order status.' };

    // --- Notifications ---
    if (newStatus === 'ready' && oldStatus !== 'ready') {
        const buyerPhoneNumber = order.profiles?.phone_number;
        const productName = order.products?.name;
        const pickupDate = getPickupDateString();

        // Push Alert
        await sendPush({
            userIds: [order.buyer_id],
            title: 'Order Ready for Pickup! 📦',
            body: `Your order for '${productName}' is ready. Pick it up on ${pickupDate}.`,
            type: 'Order Update',
            role: 'Sales'
        });

        // SMS fallback
        if (buyerPhoneNumber) {
            const message = `DEFIMART: Your order #${order.id.substring(0, 8)} for '${productName}' has been approved. Pickup will be available on ${pickupDate}. Thank you!`;
            await sendSms({ phoneNumber: buyerPhoneNumber, message });
        }
    }

    if (newStatus === 'completed' && oldStatus !== 'completed') {
        await sendPush({
            userIds: [order.buyer_id],
            title: 'Order Completed! ✅',
            body: `Thank you for shopping at DEFIMART. Your order #${order.id.substring(0, 8)} is now complete.`,
            type: 'Order Update',
            role: 'Sales'
        });
    }

    revalidatePath('/admin/sales/orders');
    return { success: true };
}
