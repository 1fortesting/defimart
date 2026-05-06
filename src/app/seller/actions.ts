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
 * Strictly validates image upload success before database insertion.
 */
export async function addSellerProduct(formData: FormData) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Authentication required.' };

    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const priceRaw = formData.get('price');
    const price = priceRaw ? parseFloat(priceRaw as string) : 0;
    
    let category = formData.get('category') as string;
    if (category === 'Other') {
        const customCategory = formData.get('custom_category') as string;
        category = customCategory || 'Other';
    }

    const imageFile = formData.get('image') as File;

    if (!name || isNaN(price)) {
      return { success: false, error: 'Name and price are required.' };
    }

    // Mandatory Image Validation
    if (!imageFile || imageFile.size === 0) {
      return { success: false, error: 'Product image is required.' };
    }

    // Upload to vendor-images bucket
    const fileExt = imageFile.name.split('.').pop() || 'jpg';
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;
    const filePath = `uploads/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('vendor-images')
      .upload(filePath, imageFile);

    if (uploadError) {
      return { success: false, error: `Image upload failed: ${uploadError.message}` };
    }

    const { data: urlData } = supabase.storage
      .from('vendor-images')
      .getPublicUrl(filePath);
    
    const publicUrl = urlData?.publicUrl;
    
    if (!publicUrl) {
      await supabase.storage.from('vendor-images').remove([filePath]);
      return { success: false, error: 'Could not generate image link.' };
    }

    // Insert into vendor_products
    const { error: dbError } = await (supabase as any)
      .from('vendor_products')
      .insert({
        name,
        description: description || '',
        price,
        category: category || 'Uncategorized',
        image_urls: [publicUrl],
        seller_id: user.id,
        is_approved: true,
        quantity: 1
      });

    if (dbError) {
      // Cleanup orphan image if DB insertion fails
      await supabase.storage.from('vendor-images').remove([filePath]);
      return { success: false, error: `Database Error: ${dbError.message}` };
    }

    revalidatePath('/seller/dashboard');
    revalidatePath('/shops');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'An unexpected error occurred.' };
  }
}
