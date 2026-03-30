'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { sendSms } from '@/lib/sendSms';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

const RequestProductSchema = z.object({
  product_name: z.string().min(1, 'Please provide a product name.'),
  description: z.string().optional(),
  image: z.any().optional(),
});


export async function createProductRequest(prevState: any, formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'You must be logged in to submit a request.', success: false, errors: {} };
  }

  const rawFormData = Object.fromEntries(formData.entries());
  const validatedFields = RequestProductSchema.safeParse(rawFormData);

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      error: 'Invalid fields provided.',
      success: false,
    };
  }
  
  const { product_name, description } = validatedFields.data;
  const imageFile = validatedFields.data.image as File | null;
  let imageUrl: string | null = null;
  let storageFilePath: string | null = null;
  
  if (imageFile && imageFile.size > 0) {
    // Manual validation for the file
    if (imageFile.size > MAX_FILE_SIZE) {
      return { error: 'Max image size is 5MB.', success: false, errors: { image: ['Max image size is 5MB.'] } };
    }
    if (!ACCEPTED_IMAGE_TYPES.includes(imageFile.type)) {
      return { error: 'Only .jpg, .jpeg, .png and .webp formats are supported.', success: false, errors: { image: ['Invalid file type.'] } };
    }
    
    // Upload logic
    storageFilePath = `${user.id}/${Date.now()}-${imageFile.name}`;
    const { error: uploadError } = await supabase.storage
      .from('requested_product_images')
      .upload(storageFilePath, imageFile);
    
    if (uploadError) {
      console.error('UPLOAD ERROR:', uploadError);
      return { error: `Storage Error: ${uploadError.message}`, success: false, errors: {} };
    }

    const { data: urlData } = supabase.storage
      .from('requested_product_images')
      .getPublicUrl(storageFilePath);
    
    imageUrl = urlData?.publicUrl || null;
  }

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
    return { error: `Database Error: ${insertError.message}`, success: false, errors: {} };
  }
  
  // --- SMS Notifications ---
  const { data: profile } = await supabase.from('profiles').select('display_name, phone_number').eq('id', user.id).single();
  
  // Notify Admins
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
  
  // Notify User
  if (profile?.phone_number) {
    const userMessage = `DEFIMART: Your product request for "${product_name}" has been received! Our team will review it and notify you of any updates. Thank you!`;
     try {
        await sendSms({ phoneNumber: profile.phone_number, message: userMessage });
    } catch (e) {
        console.error("Failed to send request confirmation SMS to user:", e);
    }
  }

  revalidatePath('/admin/procurement/requests');
  return { success: true, message: 'Your request has been submitted successfully. We will notify you of any updates via SMS.' };
}
