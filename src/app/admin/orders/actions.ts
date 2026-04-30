'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { Database } from '@/types/supabase';
import { sendSms } from '@/lib/sendSms';
import { getPickupDateString } from '@/lib/getPickupDate';

export async function updateOrderStatus(formData: FormData) {
    const supabase = await createClient();
    const orderId = formData.get('orderId') as string;
    const newStatus = formData.get('status') as Database['public']['Enums']['order_status'];

    if (!orderId || !newStatus) {
        return { error: 'Invalid data provided.' };
    }

    // Get the original order details to know the old status and what to update
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

    // --- Stock Adjustment Logic ---
    // Only adjust stock if the status is changing to/from 'completed'
    if (newStatus === 'completed' && oldStatus !== 'completed') {
        // Decrease stock
        // NOTE: In a production app, this should be an atomic transaction or an RPC call.
        // Doing it sequentially here can lead to inconsistencies if one step fails.
        const { data: product, error: productError } = await supabase
            .from('products')
            .select('quantity')
            .eq('id', order.product_id)
            .single();
        
        if (productError || product === null) {
            console.error("Failed to fetch product for stock update:", productError);
            return { error: 'Order status NOT updated. Could not find the product to adjust stock.' };
        }

        const newQuantity = (product.quantity ?? 0) - order.quantity;
        if (newQuantity < 0) {
            return { error: `Order status NOT updated. Not enough stock to complete order. Only ${product.quantity ?? 0} available.` };
        }

        const { error: stockUpdateError } = await supabase
            .from('products')
            .update({ quantity: newQuantity })
            .eq('id', order.product_id);
            
        if (stockUpdateError) {
             console.error("Failed to update product stock:", stockUpdateError);
             return { error: 'Order status NOT updated. Failed to update product stock.' };
        }
    } else if (oldStatus === 'completed' && newStatus !== 'completed') {
        // Increase stock (revert completion)
        // This makes the system more robust against mistakes.
        const { data: product, error: productError } = await supabase
            .from('products')
            .select('quantity')
            .eq('id', order.product_id)
            .single();

        if (productError || product === null) {
            console.error("Failed to fetch product for stock restoration:", productError);
            return { error: 'Order status NOT updated. Could not find the product to restore stock.' };
        }
        
        const newQuantity = (product.quantity ?? 0) + order.quantity;

        const { error: stockUpdateError } = await supabase
            .from('products')
            .update({ quantity: newQuantity })
            .eq('id', order.product_id);
            
        if (stockUpdateError) {
            console.error("Failed to restore product stock:", stockUpdateError);
            return { error: 'Order status NOT updated. Failed to restore product stock.' };
        }
    }

    // --- Update Order Status ---
    // This runs after stock has been successfully adjusted (if needed).
    const { error: updateError } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);
    
    if (updateError) {
        console.error("Failed to update order status:", updateError);
        // This is a critical error state. Stock was adjusted but status update failed.
        // Needs manual intervention.
        return { error: 'CRITICAL: Stock was adjusted, but failed to update order status. Please check data for consistency.' };
    }

    // --- SMS Notification on Approval ---
    if (newStatus === 'ready' && oldStatus !== 'ready') {
        const buyerPhoneNumber = order.profiles?.phone_number;
        const productName = order.products?.name;

        if (buyerPhoneNumber && productName) {
            const pickupDate = getPickupDateString();
            const message = `DEFIMART: Your order #${order.id.substring(0, 8)} for '${productName}' has been approved. Pickup will be available on ${pickupDate}. Please ensure timely collection. Thank you!`;
            try {
                await sendSms({ phoneNumber: buyerPhoneNumber, message });
            } catch (e) {
                console.error("Failed to send order approval SMS to buyer:", e);
            }
        }
    }
    // --- End SMS Logic ---

    // Revalidation is now handled client-side by router.refresh() if needed
    
    return { success: true };
}
