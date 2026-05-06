
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

/**
 * Registers a new seller on the platform.
 */
export async function registerSeller(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Unauthorized');

  const full_name = formData.get('full_name') as string;
  const shop_name = formData.get('shop_name') as string;
  const phone_number = formData.get('phone_number') as string;
  const email = formData.get('email') as string;

  const { error } = await supabase
    .from('sellers' as any)
    .insert({
      user_id: user.id,
      full_name,
      shop_name,
      phone_number,
      email,
      status: 'pending'
    });

  if (error) throw error;

  revalidatePath('/seller');
  redirect('/seller/dashboard');
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
 * Updates shop information including logo and hours.
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
        const logoFile = formData.get('logo');

        if (!sellerId) {
            return { success: false, error: 'Shop ID is missing.' };
        }

        const { error: sellerError } = await supabase
            .from('sellers' as any)
            .update({
                shop_name: shopName,
                open_time: openTime,
                close_time: closeTime
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
 * Submits a new product to the vendor_products table.
 * Specifically uses the 'vendor-images' bucket for image storage.
 */
export async function addSellerProduct(formData: FormData) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized.' };

    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const priceRaw = formData.get('price');
    const price = priceRaw ? parseFloat(priceRaw as string) : 0;
    
    let category = formData.get('category') as string;
    if (category === 'Other') {
        const customCategory = formData.get('custom_category') as string;
        category = customCategory || 'Other';
    }

    const imageFile = formData.get('image');

    if (!name || isNaN(price)) {
      return { success: false, error: 'Product name and price are required.' };
    }

    let image_url = null;

    if (imageFile && typeof imageFile === 'object' && 'size' in imageFile && (imageFile as File).size > 0) {
      const file = imageFile as File;
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `uploads/${fileName}`;

      // Uploading to the dedicated vendor-images bucket
      const { error: uploadError } = await supabase.storage
        .from('vendor-images')
        .upload(filePath, file);

      if (uploadError) throw new Error(`Image upload failed: ${uploadError.message}`);

      const { data: { publicUrl } } = supabase.storage
        .from('vendor-images')
        .getPublicUrl(filePath);
      
      image_url = publicUrl;
    }

    // Explicitly inserting into the vendor_products table
    const { error } = await (supabase as any)
      .from('vendor_products')
      .insert({
        name,
        description,
        price,
        category,
        image_urls: image_url ? [image_url] : [],
        seller_id: user.id,
        is_approved: true, // Auto-display on platform as requested
        quantity: 1, // Default quantity
        cost_price: 0 // Default to prevent constraint errors
      });

    if (error) throw new Error(`Failed to list product: ${error.message}`);

    revalidatePath('/seller/dashboard');
    revalidatePath('/shops');
    return { success: true };
  } catch (err: any) {
    console.error('Add Vendor Product Error:', err);
    return { success: false, error: err.message };
  }
}
