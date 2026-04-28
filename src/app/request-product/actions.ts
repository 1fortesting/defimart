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
  const imageFile = formData.get('image') as File | null;

  if (!product_name || product_name.trim() === '') {
    return { error: 'Product name is required.', success: false };
  }

  let imageUrl: string | null = null;
  let filePath: string | null = null;

  // STEP 1 & 2: Validate and Upload File
  if (imageFile && imageFile.size > 0) {
    console.log("Validating file:", imageFile.name, imageFile.type, imageFile.size);

    if (imageFile.size > MAX_FILE_SIZE) {
        return { error: 'Image is too large. Max size is 5MB.', success: false };
    }
    if (!ACCEPTED_IMAGE_TYPES.includes(imageFile.type)) {
        return { error: 'Invalid image format. Please use JPG, PNG, or WEBP.', success: false };
    }
    
    // As per your instructions
    const fileExt = imageFile.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    filePath = `requests/${fileName}`;
    
    console.log("Uploading file to path:", filePath);

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('requested_product_images') // MUST MATCH BUCKET NAME
      .upload(filePath, imageFile);
      
    console.log("Upload result:", uploadData);

    // STEP 3: Handle Upload Error
    if (uploadError) {
      console.error("Upload failed:", uploadError.message);
      // Return a user-friendly error message
      return { error: `Image upload failed: ${uploadError.message}. Please try again.`, success: false };
    }

    // STEP 4: Get Public URL
    const { data: publicUrlData } = supabase.storage
      .from('requested_product_images')
      .getPublicUrl(filePath);

    imageUrl = publicUrlData.publicUrl;
    console.log("Public URL:", imageUrl);
    
    if (!imageUrl) {
        // This is a critical failure state. The image was uploaded but we can't get a URL.
        // We must delete the orphaned file to prevent clutter.
        await supabase.storage.from('requested_product_images').remove([filePath]);
        return { error: 'Could not get a public URL for the uploaded image. The request was not saved.', success: false };
    }
  }

  // STEP 5: Save to Database
  const { error: insertError } = await supabase.from('product_requests').insert({
    product_name,
    description: description || '',
    user_id: user.id,
    image_url: imageUrl,
    department: 'sales', // As per your instruction
  });

  // STEP 7 & Rollback: Handle DB insert error and potential cleanup
  if (insertError) {
    console.error('DB Insert ERROR:', insertError);

    // If the image was uploaded but the DB insert failed, we must delete the orphaned image.
    if (filePath) {
      console.log("Rolling back image upload due to DB error:", filePath);
      await supabase.storage.from('requested_product_images').remove([filePath]);
    }

    return { error: `Database error: ${insertError.message}`, success: false };
  }
  
  // --- SMS Notifications ---
  const sendNotifications = async () => {
      const { data: profile } = await supabase.from('profiles').select('display_name, phone_number').eq('id', user.id).single();
      // Since new requests go to Sales, notify sales admins.
      const adminPhoneNumbers = [
        process.env.SALES_ADMIN_PHONE_1,
        process.env.SALES_ADMIN_PHONE_2,
        process.env.SALES_ADMIN_PHONE_3,
      ].filter(Boolean) as string[];

      if (adminPhoneNumbers.length > 0) {
        const adminMessage = `DEFIMART ADMIN: New product request for SALES from ${profile?.display_name || 'a user'}. Product: ${product_name}. Please review in the admin dashboard.`;
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

  revalidatePath('/admin/sales/requests');
  revalidatePath('/admin/procurement/requests');

  return { success: true, message: 'Request submitted successfully!' };
}
