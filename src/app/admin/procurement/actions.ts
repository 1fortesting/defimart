'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { generateProductTags } from '@/ai/flows/ai-product-tag-generator';

const BaseProductSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  price: z.coerce.number().min(0, 'Price must be non-negative'),
  cost_price: z.coerce.number().min(0, 'Cost price must be non-negative').optional(),
  quantity: z.coerce.number().int().min(0, 'Quantity must be a non-negative integer'),
  category: z.string().optional(),
  brand: z.string().optional(),
  discount_percentage: z.coerce.number().min(0).max(100).nullable().optional(),
  discount_end_date: z.string().nullable().optional(),
  is_featured: z.preprocess((val) => val === 'on', z.boolean()).optional(),
  is_outstanding: z.preprocess((val) => val === 'on', z.boolean()).optional(),
});

const CreateProductSchema = BaseProductSchema.extend({
  image: z
    .any()
    .refine((file) => file?.size > 0, 'Image is required.')
    .refine((file) => file?.size < 5 * 1024 * 1024, 'Max image size is 5MB.')
    .refine(
      (file) => ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file?.type),
      'Only .jpg, .jpeg, .png and .webp formats are supported.'
    ),
});

const UpdateProductSchema = BaseProductSchema.extend({
  id: z.string().min(1, 'Product ID is required'),
  image: z.any().optional(), // Image is optional on update
});


export async function createProduct(prevState: any, formData: FormData) {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;

  if (!user || !adminEmail || user.email !== adminEmail) {
      return { message: 'Unauthorized action. Only the designated admin can create products.', success: false, errors: {} };
  }

  // Ensure a profile exists for the admin user to satisfy the foreign key constraint.
  const { data: profile, error: getProfileError } = await supabase.from('profiles').select('id').eq('id', user.id).maybeSingle();
  if (getProfileError) {
      console.error('Error checking for admin profile:', getProfileError);
      return { message: `Database error: ${getProfileError.message}`, success: false, errors: {} };
  }
  if (!profile) {
      const { error: createProfileError } = await supabase.from('profiles').insert({ 
          id: user.id, 
          display_name: user.user_metadata.display_name || user.email,
          avatar_url: user.user_metadata.avatar_url,
          phone_number: user.user_metadata.phone_number
      });
      if (createProfileError) {
          console.error('Error creating admin profile:', createProfileError);
          return { message: `Failed to create required seller profile: ${createProfileError.message}`, success: false, errors: {} };
      }
  }

  const sellerId = user.id;

  const rawFormData = Object.fromEntries(formData.entries());

  if (rawFormData.category === 'Other') {
    const customCategory = (rawFormData.custom_category as string)?.trim();
    rawFormData.category = customCategory || null;
  }

  const validatedFields = CreateProductSchema.safeParse({
    ...rawFormData,
    price: parseFloat(rawFormData.price as string),
    cost_price: rawFormData.cost_price ? parseFloat(rawFormData.cost_price as string) : 0,
    quantity: parseInt(rawFormData.quantity as string, 10),
    discount_percentage: rawFormData.discount_percentage ? parseFloat(rawFormData.discount_percentage as string) : null,
    discount_end_date: rawFormData.discount_end_date || null
  });
  
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Create Product.',
      success: false,
    };
  }
  
  const { name, description, price, cost_price, quantity, category, brand, image, discount_percentage, discount_end_date, is_featured, is_outstanding } = validatedFields.data;

  const imageFile = image as File;
  const storageFilePath = `public/${user.id}-${Date.now()}-${imageFile.name}`;
  const { error: uploadError } = await supabase.storage
    .from('product_images')
    .upload(storageFilePath, imageFile);
  
  if (uploadError) {
    return { message: `Storage Error: ${uploadError.message}`, success: false, errors: {} };
  }

  const { data: urlData } = supabase.storage
    .from('product_images')
    .getPublicUrl(storageFilePath);

  if (!urlData?.publicUrl) {
    await supabase.storage.from('product_images').remove([storageFilePath]);
    return { message: 'Could not get public URL for image.', success: false, errors: {} };
  }
  const publicUrl = urlData.publicUrl;

  let aiTags: string[] = [];
  try {
    const tagResponse = await generateProductTags({
      productName: name,
      description: description || '',
      category: category || '',
    });
    aiTags = tagResponse.tags;
  } catch (e) {
    console.error("AI Tag generation failed:", e);
  }
  
  const { error } = await supabase.from('products').insert({
    name,
    description,
    price,
    cost_price: cost_price || 0,
    quantity,
    category: category || null,
    brand: brand || null,
    image_urls: [publicUrl],
    seller_id: sellerId,
    discount_percentage: (discount_percentage && discount_end_date) ? discount_percentage : null,
    discount_end_date: (discount_percentage && discount_end_date) ? new Date(discount_end_date).toISOString() : null,
    tags: aiTags,
    is_featured: is_featured || false,
    is_outstanding: is_outstanding || false,
  });

  if (error) {
    // Attempt to delete the uploaded image if the DB insert fails
    await supabase.storage.from('product_images').remove([storageFilePath]);
    return { message: error.message, success: false, errors: {} };
  }
  
  revalidatePath('/admin/procurement/products');
  revalidatePath('/');
  return { success: true };
}

export async function updateProduct(prevState: any, formData: FormData) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { message: 'Unauthorized.', success: false, errors: {} };

    const rawFormData = Object.fromEntries(formData.entries());

    if (rawFormData.category === 'Other') {
        const customCategory = (rawFormData.custom_category as string)?.trim();
        rawFormData.category = customCategory || null;
    }

     const validatedFields = UpdateProductSchema.safeParse({
        ...rawFormData,
        price: parseFloat(rawFormData.price as string),
        cost_price: rawFormData.cost_price ? parseFloat(rawFormData.cost_price as string) : 0,
        quantity: parseInt(rawFormData.quantity as string, 10),
        discount_percentage: rawFormData.discount_percentage ? parseFloat(rawFormData.discount_percentage as string) : null,
        discount_end_date: rawFormData.discount_end_date || null
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Missing Fields. Failed to Update Product.',
            success: false
        };
    }

    const { id, name, description, price, cost_price, quantity, category, brand, image, discount_percentage, discount_end_date, is_featured, is_outstanding } = validatedFields.data;

    const { data: existingProduct, error: fetchError } = await supabase.from('products').select('image_urls').eq('id', id).single();
    if (fetchError || !existingProduct) {
        return { message: `Failed to fetch existing product: ${fetchError?.message || 'Product not found.'}`, success: false, errors: {} };
    }

    let newImageUrls = existingProduct.image_urls;
    const imageFile = image as File;

    if (imageFile && imageFile.size > 0) {
        // Validate image
        if (imageFile.size > 5 * 1024 * 1024) return { message: 'Max image size is 5MB.', success: false, errors: {} };
        if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(imageFile.type)) return { message: 'Only .jpg, .jpeg, .png and .webp formats are supported.', success: false, errors: {} };

        const storageFilePath = `public/${user.id}-${Date.now()}-${imageFile.name}`;
        const { error: uploadError } = await supabase.storage.from('product_images').upload(storageFilePath, imageFile);

        if (uploadError) return { message: `Storage Error: ${uploadError.message}`, success: false, errors: {} };

        const { data: urlData } = supabase.storage.from('product_images').getPublicUrl(storageFilePath);
        
        if (!urlData?.publicUrl) {
            await supabase.storage.from('product_images').remove([storageFilePath]);
            return { message: 'Could not get public URL for image.', success: false, errors: {} };
        }
        const publicUrl = urlData.publicUrl;
        newImageUrls = [publicUrl];

        // Delete old image if it exists
        if (existingProduct.image_urls && existingProduct.image_urls[0]) {
            try {
                const oldImageUrl = new URL(existingProduct.image_urls[0]);
                const oldImageKey = oldImageUrl.pathname.split('/product_images/')[1];
                if (oldImageKey) await supabase.storage.from('product_images').remove([oldImageKey]);
            } catch (e) {
                console.error("Failed to parse or delete old image:", e);
            }
        }
    }

    let aiTags: string[] | null = null;
    try {
        const tagResponse = await generateProductTags({
            productName: name,
            description: description || '',
            category: category || '',
        });
        aiTags = tagResponse.tags;
    } catch (e) {
        console.error("AI tag generation failed during update:", e);
    }
    
    const updateObject = {
        name,
        description,
        price,
        cost_price: cost_price || 0,
        quantity,
        category: category || null,
        brand: brand || null,
        image_urls: newImageUrls,
        discount_percentage: (discount_percentage && discount_end_date) ? discount_percentage : null,
        discount_end_date: (discount_percentage && discount_end_date) ? new Date(discount_end_date).toISOString() : null,
        is_featured: is_featured || false,
        is_outstanding: is_outstanding || false,
        ...(aiTags && { tags: aiTags }),
    };


    const { error: updateError } = await supabase.from('products').update(updateObject).eq('id', id);


    if (updateError) {
        return { message: updateError.message, success: false, errors: {} };
    }

    revalidatePath('/admin/procurement/products');
    revalidatePath(`/admin/procurement/products/${id}/edit`);
    revalidatePath('/');
    return { success: true };
}


export async function deleteProduct(formData: FormData) {
    const supabase = createClient();
    const productId = formData.get('productId') as string;

    const { error } = await supabase.from('products').delete().eq('id', productId);

    if (error) {
        return { message: error.message };
    }

    revalidatePath('/admin/procurement/products');
    revalidatePath('/');
}
