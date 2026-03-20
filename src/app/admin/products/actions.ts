'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

const BaseProductSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  price: z.coerce.number().min(0, 'Price must be non-negative'),
  quantity: z.coerce.number().int().min(0, 'Quantity must be a non-negative integer'),
  category: z.string().optional(),
  discount_percentage: z.coerce.number().min(0).max(100).nullable().optional(),
  discount_end_date: z.string().nullable().optional(),
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
  if (!user) {
    return { error: 'You must be logged in to create a product.' };
  }

  const rawFormData = Object.fromEntries(formData.entries());

  const validatedFields = CreateProductSchema.safeParse({
    ...rawFormData,
    price: parseFloat(rawFormData.price as string),
    quantity: parseInt(rawFormData.quantity as string, 10),
    discount_percentage: rawFormData.discount_percentage ? parseFloat(rawFormData.discount_percentage as string) : null,
    discount_end_date: rawFormData.discount_end_date || null
  });
  
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Create Product.',
    };
  }
  
  const { name, description, price, quantity, category, image, discount_percentage, discount_end_date } = validatedFields.data;

  const imageFile = image as File;
  const fileName = `${Date.now()}-${imageFile.name}`;
  const { error: uploadError } = await supabase.storage
    .from('product_images')
    .upload(fileName, imageFile);
  
  if (uploadError) {
    return { message: `Storage Error: ${uploadError.message}` };
  }

  const { data: { publicUrl } } = supabase.storage
    .from('product_images')
    .getPublicUrl(fileName);
  
  const { error } = await supabase.from('products').insert({
    name,
    description,
    price,
    quantity,
    category: category || null,
    image_urls: [publicUrl],
    seller_id: user.id,
    discount_percentage: (discount_percentage && discount_end_date) ? discount_percentage : null,
    discount_end_date: (discount_percentage && discount_end_date) ? new Date(discount_end_date).toISOString() : null,
  });

  if (error) {
    // Attempt to delete the uploaded image if the DB insert fails
    await supabase.storage.from('product_images').remove([fileName]);
    return { message: error.message };
  }
  
  revalidatePath('/admin/products');
  revalidatePath('/');
  redirect('/admin/products');
}

export async function updateProduct(prevState: any, formData: FormData) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { error: 'You must be logged in to update a product.' };
    }

    const rawFormData = Object.fromEntries(formData.entries());

     const validatedFields = UpdateProductSchema.safeParse({
        ...rawFormData,
        price: parseFloat(rawFormData.price as string),
        quantity: parseInt(rawFormData.quantity as string, 10),
        discount_percentage: rawFormData.discount_percentage ? parseFloat(rawFormData.discount_percentage as string) : null,
        discount_end_date: rawFormData.discount_end_date || null
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Missing Fields. Failed to Update Product.',
        };
    }

    const { id, name, description, price, quantity, category, image, discount_percentage, discount_end_date } = validatedFields.data;

    const { data: existingProduct, error: fetchError } = await supabase.from('products').select('image_urls').eq('id', id).single();
    if(fetchError) return { message: `Failed to fetch existing product: ${fetchError.message}` };

    let newImageUrls = existingProduct.image_urls;
    const imageFile = image as File;

    if (imageFile && imageFile.size > 0) {
        // Validate image
        if (imageFile.size > 5 * 1024 * 1024) return { message: 'Max image size is 5MB.' };
        if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(imageFile.type)) return { message: 'Only .jpg, .jpeg, .png and .webp formats are supported.' };

        const fileName = `${Date.now()}-${imageFile.name}`;
        const { error: uploadError } = await supabase.storage.from('product_images').upload(fileName, imageFile);

        if (uploadError) return { message: `Storage Error: ${uploadError.message}` };

        const { data: { publicUrl } } = supabase.storage.from('product_images').getPublicUrl(fileName);
        newImageUrls = [publicUrl];

        // Delete old image if it exists
        if (existingProduct.image_urls && existingProduct.image_urls[0]) {
            const oldImageName = existingProduct.image_urls[0].split('/').pop();
            if (oldImageName) await supabase.storage.from('product_images').remove([oldImageName]);
        }
    }
    
    const { error: updateError } = await supabase.from('products').update({
        name,
        description,
        price,
        quantity,
        category: category || null,
        image_urls: newImageUrls,
        discount_percentage: (discount_percentage && discount_end_date) ? discount_percentage : null,
        discount_end_date: (discount_percentage && discount_end_date) ? new Date(discount_end_date).toISOString() : null,
    }).eq('id', id);


    if (updateError) {
        return { message: updateError.message };
    }

    revalidatePath('/admin/products');
    revalidatePath(`/admin/products/${id}/edit`);
    revalidatePath('/');
    redirect('/admin/products');
}


export async function deleteProduct(formData: FormData) {
    const supabase = createClient();
    const productId = formData.get('productId') as string;

    const { error } = await supabase.from('products').delete().eq('id', productId);

    if (error) {
        return { message: error.message };
    }

    revalidatePath('/admin/products');
    revalidatePath('/');
}

    
