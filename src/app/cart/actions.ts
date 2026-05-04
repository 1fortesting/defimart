'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { Tables } from '@/types/supabase';
import { sendSms } from '@/lib/sendSms';

export async function addToCart(formData: FormData) {
  const supabase = await createClient() as any;
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'You must be logged in to add items to your cart.' };
  }

  const productId = formData.get('productId') as string;

  if (!productId) {
    return { error: 'Product not found' };
  }

  // Check if item already in cart
  const { data: existingItem, error: fetchError } = await supabase
    .from('cart_items')
    .select('id, quantity')
    .eq('user_id', user.id)
    .eq('product_id', productId)
    .single();

  if (existingItem) {
    // Increment quantity
    const { error: updateError } = await supabase
      .from('cart_items')
      .update({ quantity: existingItem.quantity + 1 })
      .eq('id', existingItem.id);
    
    if (updateError) return { error: updateError.message };

  } else {
    // Add new item to cart
    const { error: insertError } = await supabase
      .from('cart_items')
      .insert({ product_id: productId, user_id: user.id, quantity: 1 });

    if (insertError) return { error: insertError.message };
  }

  revalidatePath('/cart');
  revalidatePath('/'); // To update cart count in header
  
  return { success: true };
}

export async function updateItemQuantity(formData: FormData) {
    const supabase = await createClient() as any;
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return redirect('/login');

    const cartItemId = formData.get('cartItemId') as string;
    const quantity = parseInt(formData.get('quantity') as string, 10);

    if (isNaN(quantity) || quantity < 1) {
        // Remove item if quantity is invalid or less than 1
        await supabase.from('cart_items').delete().eq('id', cartItemId);
    } else {
        await supabase.from('cart_items').update({ quantity }).eq('id', cartItemId);
    }

    revalidatePath('/cart');
}

export async function removeItem(formData: FormData) {
    const supabase = await createClient() as any;
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return redirect('/login');

    const cartItemId = formData.get('cartItemId') as string;
    await supabase.from('cart_items').delete().eq('id', cartItemId);

    revalidatePath('/cart');
}

export async function placeOrder(formData: FormData) {
    const supabase = await createClient() as any;
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return redirect('/login?message=Please log in to place an order.');
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('display_name, phone_number')
        .eq('id', user.id)
        .single();

    // 1. Get user's cart items with full product details
    const { data: cartItems, error: cartError } = await supabase
        .from('cart_items')
        .select('*, products(*)')
        .eq('user_id', user.id);
    
    if (cartError || !cartItems || cartItems.length === 0) {
        return redirect('/cart?error=Your cart is empty or there was an error.');
    }

    // 2. Create order records with price at time of purchase
    const newOrders = (cartItems as any[]).map((item: any) => {
        const product = item.products as Tables<'products'>;
        if (!product) {
            // This case should ideally not happen if DB constraints are set up
            throw new Error(`Product with ID ${item.product_id} not found for cart item ${item.id}`);
        }

        const isDiscountActive = product.discount_percentage && product.discount_end_date && new Date(product.discount_end_date) > new Date();

        const original_price_per_item = product.price;
        const price_per_item = isDiscountActive
            ? product.price - (product.price * (product.discount_percentage! / 100))
            : product.price;
            
        const notes = formData.get(`notes_${item.id}`) as string | null;

        return {
            buyer_id: user.id,
            product_id: item.product_id,
            quantity: item.quantity,
            seller_id: product.seller_id,
            status: 'pending' as const,
            original_price_per_item,
            price_per_item,
            cost_price_per_item: product.cost_price ?? 0,
            notes: notes,
        };
    });

    const { data: createdOrders, error: orderError } = await (supabase.from('orders').insert(newOrders).select() as any);

    if (orderError) {
        console.error("Order placement error:", orderError);
        return redirect(`/checkout?error=${orderError.message}`);
    }

    // --- SMS Notification Logic ---
    if (createdOrders && createdOrders.length > 0) {
        const buyerPhoneNumber = profile?.phone_number;
        const buyerName = profile?.display_name || 'Valued Customer';
        
        const adminPhoneNumbers = [
            process.env.SALES_ADMIN_PHONE_1,
            process.env.SALES_ADMIN_PHONE_2,
            process.env.SALES_ADMIN_PHONE_3,
        ].filter(Boolean) as string[];

        const totalAmount = (createdOrders as any[]).reduce((sum: number, order: any) => sum + (order.price_per_item * order.quantity), 0);
        
        const firstCartItem = (cartItems as any[]).find((item: any) => item.product_id === createdOrders[0].product_id);
        const firstProductName = firstCartItem?.products?.name || 'Unknown Product';
        const totalItems = (createdOrders as any[]).reduce((sum: number, order: any) => sum + order.quantity, 0);
        const productNameDisplay = totalItems > 1 ? `${firstProductName} & more` : firstProductName;
        
        const firstOrderId = createdOrders[0].id.substring(0, 8);

        // Send SMS to Buyer
        if (buyerPhoneNumber) {
            const buyerMessage = `DEFIMART: Your order #${firstOrderId} for '${productNameDisplay}' has been received. We are processing it and will notify you once it's approved. Thank you!`;
            try {
                await sendSms({ phoneNumber: buyerPhoneNumber, message: buyerMessage });
            } catch (e) {
                console.error("Failed to send order confirmation SMS to buyer:", e);
            }
        }

        // Send SMS to all Sales Admins
        if (adminPhoneNumbers.length > 0) {
             const adminMessage = `DEFIMART ADMIN ALERT: New order #${firstOrderId}. Item: ${productNameDisplay}. Amount: GHS ${totalAmount.toFixed(2)}. Customer: ${buyerName} (${buyerPhoneNumber || 'No Phone'}). Please review in dashboard.`;
             try {
                await Promise.all(
                    adminPhoneNumbers.map(number => sendSms({ phoneNumber: number, message: adminMessage }))
                );
            } catch(e) {
                console.error("Failed to send new order notification SMS to admins:", e);
            }
        }
    }
    // --- End SMS Logic ---

    // 3. Clear the user's cart
    const { error: deleteError } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', user.id);
    
    if (deleteError) {
        // This is not ideal, as the order was placed but cart not cleared.
        // For a real app, this would need a more robust transaction.
        console.error("Failed to clear cart after order placement:", deleteError);
    }

    // 4. Redirect to orders page with a success message
    revalidatePath('/orders');
    revalidatePath('/cart');
    revalidatePath('/'); // Revalidate header cart count
    redirect('/orders?success=Order placed successfully!');
}
