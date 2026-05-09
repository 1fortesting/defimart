'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { Database } from '@/types/supabase';
import { sendSms } from '@/lib/sendSms';
import { getPickupDateString } from '@/lib/getPickupDate';

export async function updateOrderStatus(formData: FormData) {
    const supabase = await createClient() as any;
    const orderId = formData.get('orderId') as string;
    const newStatus = formData.get('status') as Database['public']['Enums']['order_status'];

    if (!orderId || !newStatus) {
        return { error: 'Invalid data provided.' };
    }

    const { data: order, error: fetchError } = await supabase
        .from('orders')
        .select('*, products(name), vendor_products:vendor_product_id(name), profiles:buyer_id(phone_number, display_name)')
        .eq('id', orderId)
        .single();

    if (fetchError || !order) {
        console.error('Failed to fetch order:', fetchError);
        return { error: 'Failed to retrieve order details.' };
    }
    
    const oldStatus = order.status;

    // --- INVENTORY MANAGEMENT ---
    // Handle stock adjustments for completed orders (Platform and Vendor)
    if (newStatus === 'completed' && oldStatus !== 'completed') {
        const table = order.product_id ? 'products' : 'vendor_products';
        const targetId = order.product_id || order.vendor_product_id;

        if (targetId) {
            const { data: product, error: productError } = await supabase
                .from(table)
                .select('quantity')
                .eq('id', targetId)
                .single();
            
            if (!productError && product !== null) {
                const newQuantity = (product.quantity ?? 0) - order.quantity;
                // Update product table with new quantity (ensure it doesn't go below 0)
                await supabase.from(table).update({ quantity: Math.max(0, newQuantity) }).eq('id', targetId);
            }
        }
    } 
    // Handle stock replenishment for cancelled/rolled back orders
    else if (oldStatus === 'completed' && newStatus !== 'completed') {
        const table = order.product_id ? 'products' : 'vendor_products';
        const targetId = order.product_id || order.vendor_product_id;

        if (targetId) {
            const { data: product } = await supabase.from(table).select('quantity').eq('id', targetId).single();
            if (product) {
                await supabase.from(table).update({ quantity: (product.quantity ?? 0) + order.quantity }).eq('id', targetId);
            }
        }
    }

    const { error: updateError } = await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
    
    if (updateError) return { error: 'Failed to update order status.' };

    // --- Notifications to Buyer ---
    const buyerPhoneNumber = order.profiles?.phone_number;
    const buyerName = order.profiles?.display_name || 'Customer';
    const productName = order.products?.name || order.vendor_products?.name || 'Your order';
    const pickupDate = getPickupDateString();

    if (buyerPhoneNumber) {
        let message = '';
        const orderShortId = order.id.substring(0, 8);

        if (newStatus === 'ready' && oldStatus !== 'ready') {
            message = `DEFIMART: Hi ${buyerName}, your order #${orderShortId} for '${productName}' is ready! 📦 Pick it up on ${pickupDate}. Payment is required on collection. Thank you!`;
        } else if (newStatus === 'completed' && oldStatus !== 'completed') {
            message = `DEFIMART: Order #${orderShortId} is now complete! ✅ Thank you for shopping with us, ${buyerName}. We hope you enjoy your purchase!`;
        } else if (newStatus === 'cancelled' && oldStatus !== 'cancelled') {
            message = `DEFIMART: Order #${orderShortId} for '${productName}' has been cancelled. ❌ If you didn't request this, please contact support immediately.`;
        }

        if (message) {
            await sendSms({ phoneNumber: buyerPhoneNumber, message });
        }
    }

    revalidatePath('/admin/sales/orders');
    revalidatePath('/seller/dashboard');
    revalidatePath('/orders');
    return { success: true };
}
