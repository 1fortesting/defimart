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
 * Robust sequential product upload pipeline with logging.
 */
export async function addSellerProduct(prevState: any, formData: FormData) {
  const supabase = await createClient();

  try {
    console.log('--- START UPLOAD PROCESS ---');

    const file = formData.get('image') as File;
    const name = formData.get('name') as string;
    const price = Number(formData.get('price'));
    const description = formData.get('description') as string;
    const categoryRaw = formData.get('category') as string;
    const customCategory = formData.get('custom_category') as string;

    // 🔍 STEP 1: CHECK FILE
    if (!file) {
      console.log('❌ FILE IS NULL');
      return { success: false, error: 'No file received' };
    }

    console.log('📁 FILE:', file);
    console.log('📁 NAME:', file.name);
    console.log('📁 SIZE:', file.size);
    console.log('📁 TYPE:', file.type);

    if (file.size === 0) {
      console.log('❌ FILE SIZE IS 0');
      return { success: false, error: 'Empty file' };
    }

    // 🔍 STEP 2: GENERATE NAME
    const ext = file.name.split('.').pop() || 'jpg';
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${ext}`;

    console.log('📦 UPLOADING TO BUCKET: vendor-images');
    console.log('📦 FILE NAME:', fileName);

    // 🔍 STEP 3: UPLOAD
    const { error: uploadError } = await supabase.storage
      .from('vendor-images')
      .upload(fileName, file, {
        contentType: file.type,
        upsert: false
      });

    if (uploadError) {
      console.log('❌ UPLOAD ERROR:', uploadError.message);
      return { success: false, error: `Upload failed: ${uploadError.message}` };
    }

    console.log('✅ UPLOAD SUCCESS');

    // 🔍 STEP 4: GET URL
    const { data: urlData } = supabase.storage
      .from('vendor-images')
      .getPublicUrl(fileName);

    const imageUrl = urlData?.publicUrl;
    console.log('🌍 IMAGE URL:', imageUrl);

    if (!imageUrl) {
      return { success: false, error: 'No image URL generated' };
    }

    // 🔍 STEP 5: GET SELLER
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('❌ AUTH USER NOT FOUND');
      return { success: false, error: 'Authentication required' };
    }

    // 🔍 STEP 6: INSERT PRODUCT
    const finalCategory = categoryRaw === 'Other' ? customCategory : categoryRaw;

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
      console.log('❌ DB ERROR:', dbError.message);
      // Optional: Cleanup orphaned image
      await supabase.storage.from('vendor-images').remove([fileName]);
      return { success: false, error: `Database insert failed: ${dbError.message}` };
    }

    console.log('✅ PRODUCT INSERTED');

    revalidatePath('/seller/dashboard');
    revalidatePath('/shops');

    return { success: true };

  } catch (err: any) {
    console.log('🔥 FINAL ERROR:', err);
    return { success: false, error: err.message || 'Unexpected failure' };
  }
}
