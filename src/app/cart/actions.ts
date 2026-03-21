'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { Tables } from '@/types/supabase';
import { sendSms } from '@/lib/sendSms';

export async function addToCart(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return redirect('/login?message=You must be logged in to add items to your cart.');
  }

  const productId = formData.get('productId') as string;

  if (!productId) {
    // This should ideally redirect back with an error message
    return redirect('/?error=Product not found');
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
    
    if (updateError) return redirect(`/cart?error=${updateError.message}`);

  } else {
    // Add new item to cart
    const { error: insertError } = await supabase
      .from('cart_items')
      .insert({ product_id: productId, user_id: user.id, quantity: 1 });

    if (insertError) return redirect(`/cart?error=${insertError.message}`);
  }

  revalidatePath('/cart');
  revalidatePath('/'); // To update cart count in header
}

export async function updateItemQuantity(formData: FormData) {
    const supabase = createClient();
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
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return redirect('/login');

    const cartItemId = formData.get('cartItemId') as string;
    await supabase.from('cart_items').delete().eq('id', cartItemId);

    revalidatePath('/cart');
}

export async function placeOrder() {
    const supabase = createClient();
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
    const newOrders = cartItems.map(item => {
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

        return {
            buyer_id: user.id,
            product_id: item.product_id,
            quantity: item.quantity,
            seller_id: product.seller_id,
            status: 'pending' as const,
            original_price_per_item,
            price_per_item,
        };
    });

    const { data: createdOrders, error: orderError } = await supabase.from('orders').insert(newOrders).select();

    if (orderError) {
        console.error("Order placement error:", orderError);
        return redirect(`/checkout?error=${orderError.message}`);
    }

    // --- SMS Notification Logic ---
    if (createdOrders) {
        const buyerPhoneNumber = profile?.phone_number;
        const buyerName = profile?.display_name || 'Valued Customer';
        const adminPhoneNumber = process.env.ADMIN_PHONE_NUMBER;

        for (const order of createdOrders) {
            const cartItem = cartItems.find(item => item.product_id === order.product_id);
            if (!cartItem || !cartItem.products) continue;

            const productName = cartItem.products.name;
            const finalPrice = order.price_per_item * order.quantity;
            
            // Send SMS to Buyer
            if (buyerPhoneNumber) {
                const buyerMessage = `DEFIMART: Your order #${order.id.substring(0, 8)} for '${productName}' (GHS ${finalPrice.toFixed(2)}) has been received successfully. We are processing it and will notify you once it's approved. Thank you for shopping with Defimart.`;
                try {
                    await sendSms({ phoneNumber: buyerPhoneNumber, message: buyerMessage });
                } catch (e) {
                    console.error("Failed to send order confirmation SMS to buyer:", e);
                }
            }

            // Send SMS to Admin
            if (adminPhoneNumber) {
                 const adminMessage = `DEFIMART ADMIN ALERT: New order received. Order #${order.id.substring(0, 8)}. Item: ${productName}. Amount: GHS ${finalPrice.toFixed(2)}. Customer: ${buyerName} (${buyerPhoneNumber || 'No Phone'}). Please log in to the dashboard to review and take action.`;
                 try {
                    await sendSms({ phoneNumber: adminPhoneNumber, message: adminMessage });
                } catch(e) {
                    console.error("Failed to send new order notification SMS to admin:", e);
                }
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
