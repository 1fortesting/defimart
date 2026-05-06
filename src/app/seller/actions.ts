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
 * Implements a strict "Image-First" verification policy.
 */
export async function addSellerProduct(prevState: any, formData: FormData) {
  const supabase = await createClient();

  try {
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const price = Number(formData.get('price'));
    const categoryRaw = formData.get('category') as string;
    const file = formData.get('image') as File;

    // STEP 1: Validate file properly
    if (!file || file.size === 0 || file.name === 'undefined') {
      return { success: false, error: 'Image is required' };
    }

    if (!name || isNaN(price)) {
      return { success: false, error: 'Name and price are required' };
    }

    console.log('FILE RECEIVED:', file.name, file.size);

    // STEP 2: Generate safe file name
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

    // STEP 3: Upload to Supabase Storage (vendor-images bucket)
    const { error: uploadError } = await supabase.storage
      .from('vendor-images')
      .upload(fileName, file, {
        contentType: file.type,
        upsert: false
      });

    if (uploadError) {
      console.error('UPLOAD ERROR:', uploadError);
      return { success: false, error: 'Image upload failed' };
    }

    // STEP 4: Get public URL
    const { data: urlData } = supabase.storage
      .from('vendor-images')
      .getPublicUrl(fileName);

    const imageUrl = urlData?.publicUrl;

    if (!imageUrl) {
      return { success: false, error: 'Failed to generate image link' };
    }

    // STEP 5: Get authenticated user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Authentication failed' };
    }

    // STEP 6: Determine final category
    const finalCategory = categoryRaw === 'Other' ? (formData.get('custom_category') as string) : categoryRaw;

    // STEP 7: INSERT ONLY AFTER IMAGE SUCCESS
    const { error: dbError } = await (supabase as any)
      .from('vendor_products')
      .insert({
        name,
        description: description || '',
        price,
        category: finalCategory || 'Other',
        image_urls: [imageUrl],
        seller_id: user.id,
        is_approved: true,
        quantity: 1,
        tags: []
      });

    if (dbError) {
      console.error('DB ERROR:', dbError);
      // Cleanup orphan image from storage to maintain integrity
      await supabase.storage.from('vendor-images').remove([fileName]);
      return { success: false, error: 'Database insertion failed' };
    }

    // 🔄 Refresh relevant paths
    revalidatePath('/seller/dashboard');
    revalidatePath('/shops');

    return { success: true };

  } catch (err: any) {
    console.error('UNHANDLED ERROR:', err);
    return { success: false, error: err.message || 'A critical error occurred' };
  }
}
