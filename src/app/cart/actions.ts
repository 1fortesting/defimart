'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { Tables } from '@/types/supabase';
import { sendSms } from '@/lib/sendSms';

/**
 * Syncs multiple items from local storage to the database cart.
 */
export async function syncCart(items: { product_id?: string | null, vendor_product_id?: string | null, quantity: number }[]) {
  const supabase = await createClient() as any;
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !items || items.length === 0) return { success: false };

  // Prepare batch items
  const dbItems = items.map(item => ({
    user_id: user.id,
    product_id: item.product_id || null,
    vendor_product_id: item.vendor_product_id || null,
    quantity: item.quantity
  }));

  // Simple loop for individual upserts to handle existing items correctly
  for (const item of dbItems) {
      const query = supabase
        .from('cart_items')
        .select('id, quantity')
        .eq('user_id', user.id);
      
      if (item.vendor_product_id) {
          query.eq('vendor_product_id', item.vendor_product_id);
      } else {
          query.eq('product_id', item.product_id);
      }

      const { data: existing } = await query.single();

      if (existing) {
          await supabase.from('cart_items').update({ quantity: Math.max(existing.quantity, item.quantity) }).eq('id', existing.id);
      } else {
          await supabase.from('cart_items').insert(item);
      }
  }

  revalidatePath('/cart');
  revalidatePath('/checkout');
  return { success: true };
}

/**
 * Adds a product to the cart. 
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

    const delivery_location = formData.get('delivery_location') as string | null;

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
            delivery_location: delivery_location || null
        };
    });

    const { error: orderError } = await (supabase.from('orders').insert(newOrders) as any);

    if (orderError) return redirect(`/checkout?error=${orderError.message}`);

    // Notify Vendors
    const sendVendorNotifications = async () => {
        const uniqueSellerIds = Array.from(new Set(newOrders.map(o => o.seller_id)));
        for (const sellerId of uniqueSellerIds) {
            const { data: seller } = await supabase.from('sellers').select('phone_number').eq('user_id', sellerId).single();
            if (seller?.phone_number) {
                const prod = (cartItems as any[]).find(i => (i.products?.seller_id === sellerId || i.vendor_products?.seller_id === sellerId));
                const name = prod?.products?.name || prod?.vendor_products?.name || "an item";
                const message = `DEFIMART: You have a new order for "${name}"! Check your vendor dashboard.`;
                await sendSms({ phoneNumber: seller.phone_number, message });
            }
        }
    };
    sendVendorNotifications().catch(console.error);

    await supabase.from('cart_items').delete().eq('user_id', user.id);
    
    revalidatePath('/orders');
    revalidatePath('/cart');
    redirect('/orders?success=Order placed successfully!');
}
