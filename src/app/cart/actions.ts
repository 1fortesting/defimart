'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { Tables } from '@/types/supabase';
import { sendSms } from '@/lib/sendSms';

/**
 * Syncs multiple items from local storage to the database cart.
 * Uses a robust check to avoid duplicates and handle NULL column constraints.
 */
export async function syncCart(items: { product_id?: string | null, vendor_product_id?: string | null, quantity: number }[]) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !items || items.length === 0) return { success: false };

  try {
    for (const item of items) {
      // Build a specific query to find if this item (Platform or Vendor) already exists for this user
      let query = supabase
        .from('cart_items')
        .select('id, quantity')
        .eq('user_id', user.id);
      
      if (item.vendor_product_id) {
          query = query.eq('vendor_product_id', item.vendor_product_id).is('product_id', null);
      } else if (item.product_id) {
          query = query.eq('product_id', item.product_id).is('vendor_product_id', null);
      } else {
          continue; // Skip invalid items
      }

      const { data: existing } = await query.maybeSingle();

      if (existing) {
          // If it exists, update quantity (take the higher of the two)
          await supabase
            .from('cart_items')
            .update({ quantity: Math.max(existing.quantity, item.quantity) })
            .eq('id', existing.id);
      } else {
          // If it doesn't exist, insert new record
          await supabase.from('cart_items').insert({
            user_id: user.id,
            product_id: item.product_id || null,
            vendor_product_id: item.vendor_product_id || null,
            quantity: item.quantity
          });
      }
    }

    revalidatePath('/cart');
    revalidatePath('/checkout');
    return { success: true };
  } catch (error) {
    console.error('Batch Sync Error:', error);
    return { success: false, error: 'Failed to sync bag to cloud.' };
  }
}

/**
 * Adds a product to the cart with cloud-first synchronization.
 */
export async function addToCart(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Login required' };
  }

  const productId = formData.get('productId') as string;
  const isVendorProduct = formData.get('isVendor') === 'true';

  if (!productId) return { error: 'Invalid product' };

  // Check existence with specific attention to the alternate product columns
  let query = supabase
    .from('cart_items')
    .select('id, quantity')
    .eq('user_id', user.id);
  
  if (isVendorProduct) {
      query = query.eq('vendor_product_id', productId).is('product_id', null);
  } else {
      query = query.eq('product_id', productId).is('vendor_product_id', null);
  }

  const { data: existingItem } = await query.maybeSingle();

  if (existingItem) {
    await supabase
      .from('cart_items')
      .update({ quantity: existingItem.quantity + 1 })
      .eq('id', existingItem.id);
  } else {
    await supabase
      .from('cart_items')
      .insert({ 
          user_id: user.id, 
          quantity: 1,
          product_id: isVendorProduct ? null : productId,
          vendor_product_id: isVendorProduct ? productId : null
      });
  }

  revalidatePath('/cart');
  revalidatePath('/checkout');
  return { success: true };
}

export async function updateItemQuantity(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const cartItemId = formData.get('cartItemId') as string;
    const quantity = parseInt(formData.get('quantity') as string, 10);

    if (isNaN(quantity) || quantity < 1) {
        await supabase.from('cart_items').delete().eq('id', cartItemId);
    } else {
        await supabase.from('cart_items').update({ quantity }).eq('id', cartItemId);
    }

    revalidatePath('/cart');
    revalidatePath('/checkout');
}

export async function removeItem(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const cartItemId = formData.get('cartItemId') as string;
    await supabase.from('cart_items').delete().eq('id', cartItemId);
    revalidatePath('/cart');
    revalidatePath('/checkout');
}

export async function placeOrder(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return redirect('/login?message=Please log in to place an order.');
    }

    const { data: cartItems, error: cartError } = await supabase
        .from('cart_items')
        .select(`
            *, 
            products(*), 
            vendor_products:vendor_product_id(*)
        `)
        .eq('user_id', user.id);
    
    if (cartError || !cartItems || cartItems.length === 0) {
        return redirect('/cart?error=Bag empty');
    }

    const delivery_location = formData.get('delivery_location') as string | null;

    const newOrders = cartItems.map((item: any) => {
        const product = item.products || item.vendor_products;
        if (!product) throw new Error(`Product missing: ${item.id}`);

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
            delivery_location: delivery_location || null
        };
    });

    const { error: orderError } = await supabase.from('orders').insert(newOrders);

    if (orderError) return redirect(`/checkout?error=${orderError.message}`);

    // Notify Vendors
    const sendVendorNotifications = async () => {
        const uniqueSellerIds = Array.from(new Set(newOrders.map(o => o.seller_id)));
        for (const sellerId of uniqueSellerIds) {
            const { data: seller } = await supabase.from('sellers').select('phone_number').eq('user_id', sellerId).single();
            if (seller?.phone_number) {
                const prod = cartItems.find((i: any) => (i.products?.seller_id === sellerId || i.vendor_products?.seller_id === sellerId));
                const name = prod?.products?.name || prod?.vendor_products?.name || "an item";
                const message = `DEFIMART: New order alert for "${name}"! View details in your vendor hub.`;
                await sendSms({ phoneNumber: seller.phone_number, message });
            }
        }
    };
    sendVendorNotifications().catch(console.error);

    await supabase.from('cart_items').delete().eq('user_id', user.id);
    
    revalidatePath('/orders');
    revalidatePath('/cart');
    revalidatePath('/checkout');
    redirect('/orders?success=Order placed successfully!');
}
