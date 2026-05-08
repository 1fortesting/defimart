'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { Tables } from '@/types/supabase';
import { sendSms } from '@/lib/sendSms';

/**
 * Adds a product to the cart. Automatically detects if it's a platform product
 * or a vendor product based on the context of the addition.
 */
export async function addToCart(formData: FormData) {
  const supabase = await createClient() as any;
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'You must be logged in to add items to your cart.' };
  }

  const productId = formData.get('productId') as string;
  const isVendorProduct = formData.get('isVendor') === 'true';

  if (!productId) {
    return { error: 'Product not found' };
  }

  // Check if item already in cart
  const query = supabase
    .from('cart_items')
    .select('id, quantity')
    .eq('user_id', user.id);
  
  if (isVendorProduct) {
      query.eq('vendor_product_id', productId);
  } else {
      query.eq('product_id', productId);
  }

  const { data: existingItem } = await query.single();

  if (existingItem) {
    const { error: updateError } = await supabase
      .from('cart_items')
      .update({ quantity: existingItem.quantity + 1 })
      .eq('id', existingItem.id);
    
    if (updateError) return { error: updateError.message };

  } else {
    // Add new item to cart
    const { error: insertError } = await supabase
      .from('cart_items')
      .insert({ 
          user_id: user.id, 
          quantity: 1,
          product_id: isVendorProduct ? null : productId,
          vendor_product_id: isVendorProduct ? productId : null
      });

    if (insertError) return { error: insertError.message };
  }

  revalidatePath('/cart');
  revalidatePath('/'); 
  
  return { success: true };
}

export async function updateItemQuantity(formData: FormData) {
    const supabase = await createClient() as any;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return redirect('/login');

    const cartItemId = formData.get('cartItemId') as string;
    const quantity = parseInt(formData.get('quantity') as string, 10);

    if (isNaN(quantity) || quantity < 1) {
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

    const { data: cartItems, error: cartError } = await supabase
        .from('cart_items')
        .select('*, products(*), vendor_products:vendor_product_id(*)')
        .eq('user_id', user.id);
    
    if (cartError || !cartItems || cartItems.length === 0) {
        return redirect('/cart?error=Your cart is empty.');
    }

    const newOrders = (cartItems as any[]).map((item: any) => {
        const product = item.products || item.vendor_products;
        if (!product) throw new Error(`Product not found for cart item ${item.id}`);

        const isDiscountActive = product.discount_percentage && product.discount_end_date && new Date(product.discount_end_date) > new Date();
        const price_per_item = isDiscountActive
            ? product.price - (product.price * (product.discount_percentage! / 100))
            : product.price;
            
        return {
            buyer_id: user.id,
            product_id: item.product_id,
            vendor_product_id: item.vendor_product_id,
            quantity: item.quantity,
            seller_id: product.seller_id,
            status: 'pending' as const,
            original_price_per_item: product.price,
            price_per_item,
            cost_price_per_item: product.cost_price ?? 0,
            notes: formData.get(`notes_${item.id}`) as string | null,
        };
    });

    const { data: createdOrders, error: orderError } = await (supabase.from('orders').insert(newOrders).select() as any);

    if (orderError) return redirect(`/checkout?error=${orderError.message}`);

    // --- Notify Vendors via SMS ---
    const sendVendorNotifications = async () => {
        // Find unique sellers from the created orders
        const uniqueSellerIds = Array.from(new Set(newOrders.map(o => o.seller_id)));
        
        for (const sellerId of uniqueSellerIds) {
            // Don't notify the admin for platform products (handled by admin systems separately)
            if (sellerId === process.env.NEXT_PUBLIC_ADMIN_ID) continue;

            const { data: seller } = await supabase
                .from('sellers')
                .select('phone_number, shop_name')
                .eq('user_id', sellerId)
                .single();

            if (seller?.phone_number) {
                const sellerOrders = newOrders.filter(o => o.seller_id === sellerId);
                const firstProductName = sellerOrders[0].product_id ? 'a platform product' : 'a vendor product';
                // Try to get a real name if we can
                const prod = (cartItems as any[]).find(i => (i.products?.seller_id === sellerId || i.vendor_products?.seller_id === sellerId));
                const name = prod?.products?.name || prod?.vendor_products?.name || "an item";

                const message = `DEFIMART: You have a new order for "${name}"! Login to your shop dashboard at ${process.env.NEXT_PUBLIC_SITE_URL}/seller/dashboard to process it.`;
                await sendSms({ phoneNumber: seller.phone_number, message });
            }
        }
    };
    
    // Fire and forget notification
    sendVendorNotifications().catch(err => console.error("Vendor notification failed:", err));

    // Clean up
    await supabase.from('cart_items').delete().eq('user_id', user.id);
    
    revalidatePath('/orders');
    revalidatePath('/cart');
    revalidatePath('/'); 
    redirect('/orders?success=Order placed successfully! Vendors have been notified.');
}
