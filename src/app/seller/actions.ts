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

export async function addSellerProduct(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  // Get seller record
  const { data: seller } = await supabase
    .from('sellers' as any)
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!seller) throw new Error('Seller not found');

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

    // Using the new 'vendor-images' bucket
    const { error: uploadError } = await supabase.storage
      .from('vendor-images')
      .upload(filePath, imageFile);

    if (uploadError) throw uploadError;

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

  if (error) throw error;

  revalidatePath('/seller/dashboard');
  revalidatePath('/');
  return { success: true };
}
