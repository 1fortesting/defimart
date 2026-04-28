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
    
    console.log("Selected file on server:", imageFile);

    if (!product_name || product_name.trim() === '') {
      throw new Error('Product name is required.');
    }
    
    // As per new requirement, image is mandatory
    if (!imageFile || imageFile.size === 0) {
        throw new Error("An image is required to submit a request.");
    }
    
    let imageUrl: string | null = null;

    // STEP 1 & 2: STRICT FILE VALIDATION
    if (!imageFile.type.startsWith("image/")) {
      throw new Error("File must be an image (e.g., JPG, PNG, WEBP).");
    }
    if (imageFile.size > 5 * 1024 * 1024) { // 5MB
      throw new Error("Image must be less than 5MB.");
    }
    
    // STEP 3: FORCE IMAGE UPLOAD (BLOCKING)
    const fileExt = imageFile.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
    const filePath = `requests/${fileName}`;

    console.log("Uploading to:", filePath);
    
    const { data: uploadData, error: uploadError } = await supabase.storage
        .from("requested_product_images")
        .upload(filePath, imageFile);
    
    console.log("Upload result:", uploadData);

    if (uploadError || !uploadData) {
      console.error("Upload failed:", uploadError);
      throw new Error(`Image upload failed: ${uploadError?.message || 'Unknown storage error'}`);
    }
    
    // STEP 4: VERIFY UPLOAD EXISTS AND GET URL
    const { data: publicUrlData } = supabase.storage
        .from("requested_product_images")
        .getPublicUrl(filePath);

    imageUrl = publicUrlData?.publicUrl;
    console.log("Image URL:", imageUrl);
    
    // STEP 5: BLOCK IF IMAGE URL IS EMPTY
    if (!imageUrl || imageUrl.trim() === "") {
        // Clean up orphaned file
        await supabase.storage.from("requested_product_images").remove([filePath]);
        throw new Error("Image URL is empty after upload. The request was not saved.");
    }

    // STEP 6: ONLY THEN INSERT INTO DATABASE
    const { data: insertedRequest, error: insertError } = await supabase.from("product_requests").insert({
      product_name,
      description: description || '',
      user_id: user.id,
      image_url: imageUrl,
      department: "sales" // As per user instruction
    }).select().single();

    if (insertError) {
      // Clean up orphaned file if DB insert fails
      if (imageUrl) {
        const path = new URL(imageUrl).pathname.split('/requested_product_images/')[1];
        await supabase.storage.from("requested_product_images").remove([path]);
      }
      throw new Error(`Failed to save request to database: ${insertError.message}`);
    }

    // --- SMS Notifications ---
    const sendNotifications = async () => {
        const { data: profile } = await supabase.from('profiles').select('display_name, phone_number').eq('id', user.id).single();
        
        // Notify admins 
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
    return { success: false, error: error.message, errors: {} };
  }
}
