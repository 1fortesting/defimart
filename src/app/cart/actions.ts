'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

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

    // 1. Get user's cart items
    const { data: cartItems, error: cartError } = await supabase
        .from('cart_items')
        .select('*, products(seller_id)')
        .eq('user_id', user.id);
    
    if (cartError || !cartItems || cartItems.length === 0) {
        return redirect('/cart?error=Your cart is empty or there was an error.');
    }

    // 2. Create order records
    const newOrders = cartItems.map(item => ({
        buyer_id: user.id,
        product_id: item.product_id,
        quantity: item.quantity,
        seller_id: item.products!.seller_id, // non-null assertion as we selected it
        status: 'pending' as const,
    }));

    const { error: orderError } = await supabase.from('orders').insert(newOrders);

    if (orderError) {
        return redirect(`/checkout?error=${orderError.message}`);
    }

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
    revalidatePath('/'); // Revalidate header cart count
    redirect('/orders?success=Order placed successfully!');
}
