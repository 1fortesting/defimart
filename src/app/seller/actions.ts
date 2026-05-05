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
 * Refactored for extreme robustness to prevent 'unexpected response' errors.
 */
export async function updateShopInfo(formData: FormData) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
            return { success: false, error: 'Authentication failed. Please log in again.' };
        }

        const sellerId = formData.get('sellerId') as string;
        const shopName = formData.get('shop_name') as string;
        const openTime = formData.get('open_time') as string;
        const closeTime = formData.get('close_time') as string;
        const logoFile = formData.get('logo');

        if (!sellerId) {
            return { success: false, error: 'Shop ID is missing. Profile cannot be updated.' };
        }

        // 1. Update basic shop details
        const { error: sellerError } = await supabase
            .from('sellers' as any)
            .update({
                shop_name: shopName,
                open_time: openTime,
                close_time: closeTime
            })
            .eq('id', sellerId);

        if (sellerError) {
            console.error('DB Update Error:', sellerError);
            return { success: false, error: `Failed to update shop details: ${sellerError.message}` };
        }

        // 2. Handle Logo Upload if a file was provided
        // We check if it's an object with a size property to ensure it's a valid File/Blob
        if (logoFile && typeof logoFile === 'object' && 'size' in logoFile && logoFile.size > 0) {
            const file = logoFile as File;
            
            // Validate file type
            if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
                return { success: false, error: 'Invalid file type. Please upload a JPG, PNG, or WEBP image.' };
            }

            // Limit file size to 5MB
            if (file.size > 5 * 1024 * 1024) {
                return { success: false, error: 'Logo file is too large. Max size is 5MB.' };
            }

            // Create a unique filename in the user's folder
            const fileName = `${user.id}/logo-${Date.now()}`;
            
            const { error: uploadError } = await supabase.storage
                .from('seller-avatars')
                .upload(fileName, file, { upsert: true });

            if (uploadError) {
                console.error('Storage Upload Error:', uploadError);
                return { success: false, error: `Failed to upload logo: ${uploadError.message}` };
            }

            const { data: { publicUrl } } = supabase.storage
                .from('seller-avatars')
                .getPublicUrl(fileName);
            
            // Sync image URL across public profiles and auth metadata
            await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id);
            
            const { error: authUpdateError } = await supabase.auth.updateUser({
                data: { avatar_url: publicUrl }
            });

            if (authUpdateError) {
                console.warn('Auth metadata sync failed:', authUpdateError.message);
                // We don't fail the whole action for this as the DB is already updated
            }
        }

        // Clear server-side caches
        revalidatePath('/seller/dashboard');
        revalidatePath('/shops');
        
        return { success: true };
    } catch (err: any) {
        console.error('Unhandled Shop Update Error:', err);
        return { success: false, error: err.message || 'A server-side error occurred during the update.' };
    }
}

/**
 * Submits a new product for admin approval.
 */
export async function addSellerProduct(formData: FormData) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized: Session expired.' };

    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const priceRaw = formData.get('price');
    const price = priceRaw ? parseFloat(priceRaw as string) : 0;
    const category = formData.get('category') as string;
    const imageFile = formData.get('image');

    if (!name || isNaN(price)) {
      return { success: false, error: 'Product name and price are required.' };
    }

    let image_url = null;

    if (imageFile && typeof imageFile === 'object' && 'size' in imageFile && imageFile.size > 0) {
      const file = imageFile as File;
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `seller-uploads/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('vendor-images')
        .upload(filePath, file);

      if (uploadError) throw new Error(`Image upload failed: ${uploadError.message}`);

      const { data: { publicUrl } } = supabase.storage
        .from('vendor-images')
        .getPublicUrl(filePath);
      
      image_url = publicUrl;
    }

    const { error } = await supabase
      .from('products')
      .insert({
        name,
        description,
        price,
        category,
        image_urls: image_url ? [image_url] : [],
        seller_id: user.id,
        is_approved: false
      } as any);

    if (error) throw new Error(`Failed to list product: ${error.message}`);

    revalidatePath('/seller/dashboard');
    revalidatePath('/');
    return { success: true };
  } catch (err: any) {
    console.error('Add Product Action Error:', err);
    return { success: false, error: err.message || 'Failed to submit product.' };
  }
}
