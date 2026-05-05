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
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized: Session expired.' };

    const sellerId = formData.get('sellerId') as string;
    const shopName = formData.get('shop_name') as string;
    const openTime = formData.get('open_time') as string;
    const closeTime = formData.get('close_time') as string;
    const avatarFile = formData.get('logo') as File | null;

    if (!sellerId) return { success: false, error: 'Shop ID is missing.' };

    try {
        // 1. Update Seller Details
        const { error: sellerError } = await supabase
            .from('sellers' as any)
            .update({
                shop_name: shopName,
                open_time: openTime,
                close_time: closeTime
            })
            .eq('id', sellerId);

        if (sellerError) throw new Error(`Database error: ${sellerError.message}`);

        // 2. Update Logo if provided
        if (avatarFile && avatarFile instanceof File && avatarFile.size > 0) {
            if (!['image/jpeg', 'image/png', 'image/webp'].includes(avatarFile.type)) {
                throw new Error('Invalid file type. Only JPG, PNG, and WEBP are allowed.');
            }

            // Limit file size to 5MB
            if (avatarFile.size > 5 * 1024 * 1024) {
                throw new Error('Logo size exceeds 5MB limit.');
            }

            const fileName = `${user.id}/shop-logo-${Date.now()}`;
            const { error: uploadError } = await supabase.storage
                .from('seller-avatars')
                .upload(fileName, avatarFile, { upsert: true });

            if (uploadError) {
                console.error('Storage Upload Error:', uploadError);
                throw new Error(`Upload failed: ${uploadError.message}. Check storage permissions.`);
            }

            const { data: { publicUrl } } = supabase.storage
                .from('seller-avatars')
                .getPublicUrl(fileName);
            
            // Sync with Auth metadata
            const { error: authUpdateError } = await supabase.auth.updateUser({
                data: { avatar_url: publicUrl }
            });
            if (authUpdateError) console.warn('Auth metadata sync failed:', authUpdateError.message);
            
            // Sync with Profiles table
            await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id);
        }

        revalidatePath('/seller/dashboard');
        revalidatePath('/shops');
        return { success: true };
    } catch (err: any) {
        console.error('Seller Update Action Error:', err);
        return { success: false, error: err.message || 'An unexpected error occurred during shop update.' };
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
    const imageFile = formData.get('image') as File | null;

    if (!name || isNaN(price)) {
      return { success: false, error: 'Product name and price are required.' };
    }

    let image_url = null;

    if (imageFile && imageFile instanceof File && imageFile.size > 0) {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `seller-uploads/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('vendor-images')
        .upload(filePath, imageFile);

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
