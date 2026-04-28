'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { sendSms } from '@/lib/sendSms';

export async function createProductRequest(prevState: any, formData: FormData) {
  const supabase = createClient();
  
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('You must be logged in to submit a request.');
    }

    const product_name = formData.get('product_name') as string;
    const description = formData.get('description') as string | null;
    const imageFile = formData.get('image') as File | null;
    
    console.log("File received on server:", imageFile);

    if (!product_name || product_name.trim() === '') {
      return { success: false, error: 'Product name is required.' };
    }
    
    let imageUrl: string | null = null;
    
    if (imageFile && imageFile.size > 0) {
        console.log("Selected file:", imageFile.name, imageFile.size);

        // STEP 1: VALIDATE FILE BEFORE UPLOAD
        if (!imageFile.type.startsWith("image/")) {
            return { success: false, error: "File must be an image (e.g., JPG, PNG, WEBP)." };
        }
        if (imageFile.size > 5 * 1024 * 1024) { // 5MB
            return { success: false, error: "Image must be less than 5MB." };
        }

        // STEP 2: FIX IMAGE UPLOAD
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
        const filePath = `requests/${fileName}`;
        console.log("Uploading to:", filePath);

        const { data: uploadData, error: uploadError } = await supabase.storage
            .from("requested_product_images")
            .upload(filePath, imageFile);

        console.log("Upload result:", uploadData);

        // STEP 3: HANDLE UPLOAD ERROR
        if (uploadError) {
            console.error("Upload failed:", uploadError.message);
            return { success: false, error: `Image upload failed: ${uploadError.message}` };
        }

        // STEP 4: GET PUBLIC URL
        const { data: publicUrlData } = supabase.storage
            .from("requested_product_images")
            .getPublicUrl(filePath);

        imageUrl = publicUrlData?.publicUrl;
        console.log("Public URL:", imageUrl);
        
        // STEP 5: BLOCK IF IMAGE URL IS EMPTY
        if (!imageUrl) {
            // Clean up if URL retrieval fails
            await supabase.storage.from("requested_product_images").remove([filePath]);
            return { success: false, error: "Failed to get image URL after upload." };
        }
    }

    // STEP 6: INSERT INTO DATABASE
    const { error: insertError } = await supabase.from("product_requests").insert({
      product_name,
      description: description || '',
      user_id: user.id,
      image_url: imageUrl,
      department: "sales"
    });

    if (insertError) {
      if (imageUrl) {
        const path = new URL(imageUrl).pathname.split('/requested_product_images/')[1];
        await supabase.storage.from("requested_product_images").remove([path]);
      }
      return { success: false, error: `Database error: ${insertError.message}` };
    }

    // --- SMS Notifications ---
    const sendNotifications = async () => {
        const { data: profile } = await supabase.from('profiles').select('display_name, phone_number').eq('id', user.id).single();
        
        const adminPhoneNumbers = [
            process.env.SALES_ADMIN_PHONE_1,
            process.env.SALES_ADMIN_PHONE_2,
            process.env.SALES_ADMIN_PHONE_3,
        ].filter(Boolean) as string[];

        if (adminPhoneNumbers.length > 0) {
          const adminMessage = `DEFIMART ADMIN: New product request for SALES from ${profile?.display_name || 'a user'}. Product: ${product_name}. Please review in the admin dashboard.`;
          try {
            await Promise.all(adminPhoneNumbers.map(number => sendSms({ phoneNumber: number, message: adminMessage })));
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
    
    revalidatePath('/admin/procurement/requests');
    revalidatePath('/admin/sales/requests');
    
    return { success: true, message: 'Request submitted successfully!' };

  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
