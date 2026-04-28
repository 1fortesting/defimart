
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { sendSms } from '@/lib/sendSms';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export async function createProductRequest(prevState: any, formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'You must be logged in to submit a request.', success: false };
  }

  const product_name = formData.get('product_name') as string;
  const description = formData.get('description') as string | null;
  const imageFile = formData.get('image') as File | null;

  if (!product_name || product_name.trim() === '') {
    return { error: 'Product name is required.', success: false };
  }

  let imageUrl: string | null = null;
  let storageFilePath: string | null = null;

  if (imageFile && imageFile.size > 0) {
    if (imageFile.size > MAX_FILE_SIZE) {
        return { error: 'Image is too large. Max size is 5MB.', success: false };
    }
    if (!ACCEPTED_IMAGE_TYPES.includes(imageFile.type)) {
        return { error: 'Invalid image format. Please use JPG, PNG, or WEBP.', success: false };
    }

    try {
        storageFilePath = `${user.id}/${Date.now()}-${imageFile.name}`;

        const { error: uploadError } = await supabase.storage
          .from('requested_product_images')
          .upload(storageFilePath, imageFile, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) {
          console.error('UPLOAD ERROR:', uploadError);
          return { error: `Image upload failed: ${uploadError.message}`, success: false };
        }
        
        const { data: urlData } = supabase.storage
            .from('requested_product_images')
            .getPublicUrl(storageFilePath);

        imageUrl = urlData?.publicUrl || null;
        
        if (!imageUrl) {
            await supabase.storage.from('requested_product_images').remove([storageFilePath]);
            return { error: 'Could not get public URL for the uploaded image.', success: false };
        }

    } catch (err: any) {
        console.error('UPLOAD FAILED:', err);
        return { error: `An unexpected error occurred: ${err.message}`, success: false };
    }
  }

  const { error: insertError } = await supabase.from('product_requests').insert({
    product_name,
    description: description || '',
    user_id: user.id,
    image_url: imageUrl,
    department: 'procurement',
  });

  if (insertError) {
    console.error('DB ERROR:', insertError);

    if (storageFilePath) {
      // Rollback image upload if DB insert fails
      await supabase.storage.from('requested_product_images').remove([storageFilePath]);
    }

    return { error: `Database error: ${insertError.message}`, success: false };
  }
  
  // --- SMS Notifications ---
  const sendNotifications = async () => {
      const { data: profile } = await supabase.from('profiles').select('display_name, phone_number').eq('id', user.id).single();
      const adminPhoneNumbers = [
        process.env.PROCUREMENT_ADMIN_PHONE_1,
        process.env.PROCUREMENT_ADMIN_PHONE_2,
        process.env.SALES_ADMIN_PHONE_1,
        process.env.SALES_ADMIN_PHONE_2,
        process.env.SALES_ADMIN_PHONE_3,
      ].filter(Boolean) as string[];

      if (adminPhoneNumbers.length > 0) {
        const adminMessage = `DEFIMART ADMIN: New product request for PROCUREMENT from ${profile?.display_name || 'a user'}. Product: ${product_name}. Please review in the admin dashboard.`;
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
  sendNotifications();
  // --- End SMS ---

  revalidatePath('/admin/procurement/requests');
  revalidatePath('/admin/sales/requests');

  return { success: true, message: 'Request submitted successfully' };
}
