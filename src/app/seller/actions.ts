'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

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

export async function toggleShopStatus(sellerId: string, isOpen: boolean) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('sellers' as any)
    .update({ is_open: isOpen })
    .eq('id', sellerId);

  if (error) throw error;
  revalidatePath('/seller/dashboard');
}

export async function updateShopInfo(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    const sellerId = formData.get('sellerId') as string;
    const shopName = formData.get('shop_name') as string;
    const openTime = formData.get('open_time') as string;
    const closeTime = formData.get('close_time') as string;
    const avatarFile = formData.get('logo') as File | null;

    try {
        // Update Seller Details
        const { error: sellerError } = await supabase
            .from('sellers' as any)
            .update({
                shop_name: shopName,
                open_time: openTime,
                close_time: closeTime
            })
            .eq('id', sellerId);

        if (sellerError) throw new Error(`Database error: ${sellerError.message}`);

        // Update Logo (Profile Avatar) - Using user_profile bucket as requested
        if (avatarFile && avatarFile.size > 0) {
            const fileName = `${user.id}/shop-logo-${Date.now()}`;
            const { error: uploadError } = await supabase.storage
                .from('user_profile')
                .upload(fileName, avatarFile, { upsert: true });

            if (uploadError) throw new Error(`Storage upload error: ${uploadError.message}`);

            const { data: { publicUrl } } = supabase.storage
                .from('user_profile')
                .getPublicUrl(fileName);
            
            // Sync with Auth metadata
            await supabase.auth.updateUser({
                data: { avatar_url: publicUrl }
            });
            
            // Sync with Profiles table
            const { error: profileError } = await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id);
            if (profileError) throw new Error(`Profile update error: ${profileError.message}`);
        }

        revalidatePath('/seller/dashboard');
        revalidatePath('/shops');
        return { success: true };
    } catch (err: any) {
        console.error('Error updating shop info:', err);
        return { success: false, error: err.message || 'An unexpected error occurred.' };
    }
}

export async function addSellerProduct(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const name = formData.get('name') as string;
  const description = formData.get('description') as string;
  const price = parseFloat(formData.get('price') as string);
  const category = formData.get('category') as string;
  const imageFile = formData.get('image') as File;

  let image_url = null;

  if (imageFile && imageFile.size > 0) {
    const fileExt = imageFile.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
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
}
