'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { sendSms } from '@/lib/sendSms';

/**
 * Robust sequential product upload pipeline with comprehensive logging.
 * Bucket: vendor-images
 * Table: vendor_products
 */
export async function addSellerProduct(prevState: any, formData: FormData) {
  const supabase = await createClient();

  try {
    const file = formData.get('image') as File;
    const name = formData.get('name') as string;
    const price = Number(formData.get('price'));
    const quantity = parseInt(formData.get('quantity') as string, 10) || 1;
    const description = formData.get('description') as string;
    const category = formData.get('category') as string;
    const customCategory = formData.get('custom_category') as string;
    
    // Delivery fields
    const offers_delivery = formData.get('offers_delivery') === 'on';
    const delivery_price_type = formData.get('delivery_price_type') as string || 'fixed';
    const delivery_price = Number(formData.get('delivery_price') || 0);

    if (!file || file.size === 0) {
      return { success: false, error: 'Valid image required' };
    }

    const ext = file.name.split('.').pop() || 'jpg';
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('vendor-images')
      .upload(fileName, file, {
        contentType: file.type,
        upsert: false
      });

    if (uploadError) {
      return { success: false, error: `Upload failed: ${uploadError.message}` };
    }

    const { data: urlData } = supabase.storage
      .from('vendor-images')
      .getPublicUrl(fileName);

    const imageUrl = urlData?.publicUrl;

    if (!imageUrl) {
      return { success: false, error: 'No image URL generated' };
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Authentication required' };
    }

    const finalCategory = category === 'Other' ? customCategory : category;

    const { error: dbError } = await supabase
      .from('vendor_products' as any)
      .insert({
        name,
        description: description || '',
        price,
        category: finalCategory || 'Other',
        image_urls: [imageUrl],
        seller_id: user.id,
        is_approved: true,
        quantity: quantity,
        tags: [],
        offers_delivery,
        delivery_price_type,
        delivery_price: offers_delivery && delivery_price_type === 'fixed' ? delivery_price : 0
      });

    if (dbError) {
      await supabase.storage.from('vendor-images').remove([fileName]);
      return { success: false, error: `Database insert failed: ${dbError.message}` };
    }

    revalidatePath('/seller/dashboard');
    revalidatePath('/shops');

    return { success: true };

  } catch (err: any) {
    return { success: false, error: err.message || 'Unexpected failure' };
  }
}

/**
 * Updates an existing vendor product.
 */
export async function updateSellerProduct(prevState: any, formData: FormData) {
  const supabase = await createClient();

  try {
    const id = formData.get('id') as string;
    const file = formData.get('image') as File | null;
    const name = formData.get('name') as string;
    const price = Number(formData.get('price'));
    const quantity = parseInt(formData.get('quantity') as string, 10) || 0;
    const description = formData.get('description') as string;
    const category = formData.get('category') as string;
    const customCategory = formData.get('custom_category') as string;
    
    // Delivery fields
    const offers_delivery = formData.get('offers_delivery') === 'on';
    const delivery_price_type = formData.get('delivery_price_type') as string || 'fixed';
    const delivery_price = Number(formData.get('delivery_price') || 0);

    if (!id) return { success: false, error: 'Product ID is missing' };

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Authentication required' };

    const { data: oldProduct } = await supabase.from('vendor_products' as any).select('price').eq('id', id).single();

    const finalCategory = category === 'Other' ? customCategory : category;
    const updateData: any = {
      name,
      description: description || '',
      price,
      quantity: quantity,
      category: finalCategory || 'Other',
      offers_delivery,
      delivery_price_type,
      delivery_price: offers_delivery && delivery_price_type === 'fixed' ? delivery_price : 0
    };

    if (file && file.size > 0) {
      const ext = file.name.split('.').pop() || 'jpg';
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('vendor-images')
        .upload(fileName, file);

      if (uploadError) return { success: false, error: `Upload failed: ${uploadError.message}` };

      const { data: urlData } = supabase.storage.from('vendor-images').getPublicUrl(fileName);
      updateData.image_urls = [urlData.publicUrl];
    }

    const { error: dbError } = await supabase
      .from('vendor_products' as any)
      .update(updateData)
      .eq('id', id)
      .eq('seller_id', user.id);

    if (dbError) return { success: false, error: `Update failed: ${dbError.message}` };

    if (oldProduct && price < oldProduct.price) {
        const { data: wishlistedUsers } = await supabase
            .from('saved_products')
            .select('user_id, profiles(phone_number)')
            .eq('product_id', id);

        if (wishlistedUsers && wishlistedUsers.length > 0) {
            const usersWithPhones = wishlistedUsers.filter(u => (u.profiles as any)?.phone_number);
            const message = `DEFIMART PRICE DROP! 📉 The price of '${name}' in your wishlist has dropped to GHS ${price.toLocaleString()}. Grab it now from our student marketplace!`;
            
            await Promise.allSettled(
                usersWithPhones.map(u => sendSms({ phoneNumber: (u.profiles as any).phone_number, message }))
            );
        }
    }

    revalidatePath('/seller/dashboard');
    revalidatePath(`/products/${id}`);
    revalidatePath('/shops');
    
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Unexpected failure' };
  }
}

/**
 * Toggles the open/closed status of a shop.
 */
export async function toggleShopStatus(sellerId: string, isOpen: boolean) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('sellers' as any)
    .update({ is_open: isOpen })
    .eq('id', sellerId);

  if (error) throw error;
  revalidatePath('/seller/dashboard');
}

/**
 * Updates shop information including logo, hours, and description.
 */
export async function updateShopInfo(formData: FormData) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
            return { success: false, error: 'Authentication failed.' };
        }

        const sellerId = formData.get('sellerId') as string;
        const shopName = formData.get('shop_name') as string;
        const openTime = formData.get('open_time') as string;
        const closeTime = formData.get('close_time') as string;
        const description = formData.get('description') as string;
        const logoFile = formData.get('logo');

        if (!sellerId) {
            return { success: false, error: 'Shop ID is missing.' };
        }

        const { error: sellerError } = await supabase
            .from('sellers' as any)
            .update({
                shop_name: shopName,
                open_time: openTime,
                close_time: closeTime,
                description: description || null
            })
            .eq('id', sellerId);

        if (sellerError) throw sellerError;

        if (logoFile && typeof logoFile === 'object' && 'size' in logoFile && (logoFile as File).size > 0) {
            const file = logoFile as File;
            const fileName = `${user.id}/logo-${Date.now()}`;
            
            const { error: uploadError } = await supabase.storage
                .from('seller-avatars')
                .upload(fileName, file, { upsert: true });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('seller-avatars')
                .getPublicUrl(fileName);
            
            await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id);
            await supabase.auth.updateUser({ data: { avatar_url: publicUrl } });
        }

        revalidatePath('/seller/dashboard');
        revalidatePath('/shops');
        return { success: true };
    } catch (err: any) {
        console.error('Shop Update Error:', err);
        return { success: false, error: err.message };
    }
}

/**
 * Deletes an order record from the database.
 */
export async function deleteSellerOrder(orderId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: 'Authentication required.' };

  const { error } = await supabase
    .from('orders')
    .delete()
    .eq('id', orderId)
    .eq('seller_id', user.id);

  if (error) return { success: false, error: error.message };

  revalidatePath('/seller/dashboard');
  return { success: true };
}