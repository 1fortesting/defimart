'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { sendSms } from '@/lib/sendSms';

export async function createProductRequest(prevState: any, formData: FormData) {
  const supabase = createClient();
  
  // Wrapper to catch any thrown errors and return a state object for useActionState
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('You must be logged in to submit a request.');
    }

    const product_name = formData.get('product_name') as string;
    const description = formData.get('description') as string | null;
    const imageFile = formData.get('image') as File | null;

    if (!product_name || product_name.trim() === '') {
      throw new Error('Product name is required.');
    }
    
    // STEP 1 & 2: STRICT VALIDATION
    if (!imageFile || imageFile.size === 0) {
      throw new Error("An image is required to submit a request.");
    }
    
    console.log("Selected file:", imageFile);
    
    if (!imageFile.type.startsWith("image/")) {
      throw new Error("File must be an image (e.g., JPG, PNG, WEBP).");
    }
    if (imageFile.size > 5 * 1024 * 1024) { // 5MB
      throw new Error("Image must be less than 5MB.");
    }
    
    // STEP 3: FORCE IMAGE UPLOAD
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
    
    // STEP 4: VERIFY UPLOAD
    const { data: publicUrlData } = supabase.storage
        .from("requested_product_images")
        .getPublicUrl(filePath);

    const imageUrl = publicUrlData?.publicUrl;
    console.log("Image URL:", imageUrl);
    
    // STEP 5: BLOCK IF URL IS EMPTY
    if (!imageUrl || imageUrl.trim() === "") {
        // Attempt to clean up the orphaned file
        await supabase.storage.from("requested_product_images").remove([filePath]);
        throw new Error("Failed to get image URL after upload. The request was not saved.");
    }

    // STEP 6: INSERT INTO DATABASE
    const { error: insertError } = await supabase.from("product_requests").insert({
      product_name,
      description: description || '',
      user_id: user.id,
      image_url: imageUrl,
      department: "sales"
    }).select().single();

    if (insertError) {
      // Attempt to clean up the orphaned file if DB insert fails
      await supabase.storage.from("requested_product_images").remove([filePath]);
      throw new Error(`Failed to save request to database: ${insertError.message}`);
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
    
    revalidatePath('/admin/sales/requests');
    revalidatePath('/admin/procurement/requests');
    
    // STEP 7: Only return success at the very end
    return { success: true, message: 'Request submitted successfully!' };

  } catch (error: any) {
    // Catch any thrown error and return it in the state object
    return { success: false, error: error.message, errors: {} };
  }
}
