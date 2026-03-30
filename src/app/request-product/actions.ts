'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { sendSms } from '@/lib/sendSms';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export async function createProductRequest(prevState: any, formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'You must be logged in to submit a request.', success: false };
  }

  const product_name = formData.get('product_name') as string;
  const description = formData.get('description') as string | null;
  const image = formData.get('image') as File | null;

  // --- Manual Validation ---
  if (!product_name || product_name.trim() === '') {
    return { error: 'Product name is required.', success: false };
  }

  let imageUrl: string | null = null;
  let storageFilePath: string | null = null;
  
  if (image && image.size > 0) {
    if (image.size > MAX_FILE_SIZE) {
      return { error: 'Image is too large. Max size is 5MB.', success: false };
    }
    if (!ACCEPTED_IMAGE_TYPES.includes(image.type)) {
      return { error: 'Invalid image format. Only JPG, PNG, and WEBP are accepted.', success: false };
    }
    
    // --- Image Upload ---
    storageFilePath = `${user.id}/${Date.now()}-${image.name}`;
    const { error: uploadError } = await supabase.storage
      .from('requested_product_images')
      .upload(storageFilePath, image);
    
    if (uploadError) {
      console.error('UPLOAD ERROR:', uploadError);
      return { error: `Storage Error: ${uploadError.message}`, success: false };
    }

    const { data: urlData } = supabase.storage
      .from('requested_product_images')
      .getPublicUrl(storageFilePath);
    
    imageUrl = urlData?.publicUrl || null;
  }

  // --- Database Insert ---
  const { error: insertError } = await supabase.from('product_requests').insert({
    product_name,
    description: description || '',
    user_id: user.id,
    image_url: imageUrl,
  });

  if (insertError) {
    // If DB insert fails, try to remove the uploaded image
    if (storageFilePath) {
        await supabase.storage.from('requested_product_images').remove([storageFilePath]);
    }
    console.error("DB INSERT ERROR:", insertError);
    return { error: `Database Error: ${insertError.message}`, success: false };
  }
  
  // If we reach here, everything was successful.
  
  // --- SMS Notifications (can run in background, no need to await all) ---
  const sendNotifications = async () => {
      const { data: profile } = await supabase.from('profiles').select('display_name, phone_number').eq('id', user.id).single();
      const adminPhoneNumbers = [
        process.env.PROCUREMENT_ADMIN_PHONE_1,
        process.env.PROCUREMENT_ADMIN_PHONE_2,
      ].filter(Boolean) as string[];

      if (adminPhoneNumbers.length > 0) {
        const adminMessage = `DEFIMART ADMIN: New product request from ${profile?.display_name || 'a user'}. Product: ${product_name}. Description: "${(description || '').substring(0, 50)}...". Please review in the admin dashboard.`;
        try {
          await Promise.all(
            adminPhoneNumbers.map(number => sendSms({ phoneNumber: number, message: adminMessage }))
          );
        } catch(e) {
          console.error("Failed to send new request notification SMS to admins:", e);
        }
      }
      
      if (profile?.phone_number) {
        const userMessage = `DEFIMART: Your product request for "${product_name}" has been received! Our team will review it and notify you of any updates. Thank you!`;
         try {
            await sendSms({ phoneNumber: profile.phone_number, message: userMessage });
        } catch (e) {
            console.error("Failed to send request confirmation SMS to user:", e);
        }
      }
  }
  sendNotifications(); // Fire and forget

  revalidatePath('/admin/procurement/requests');
  return { success: true, message: 'Your request has been submitted successfully.' };
}
