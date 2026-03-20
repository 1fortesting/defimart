'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

const ProductSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  price: z.coerce.number().min(0, 'Price must be non-negative'),
  image: z
    .any()
    .refine((file) => file?.size > 0, 'Image is required.')
    .refine((file) => file?.size < 5 * 1024 * 1024, 'Max image size is 5MB.')
    .refine(
      (file) => ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file?.type),
      'Only .jpg, .jpeg, .png and .webp formats are supported.'
    ),
});


export async function createProduct(prevState: any, formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'You must be logged in to create a product.' };
  }

  const validatedFields = ProductSchema.safeParse({
    name: formData.get('name'),
    description: formData.get('description'),
    price: formData.get('price'),
    image: formData.get('image'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Create Product.',
    };
  }
  
  const { name, description, price, image } = validatedFields.data;

  const imageFile = image as File;
  const fileName = `${Date.now()}-${imageFile.name}`;
  const { error: uploadError } = await supabase.storage
    .from('products-images')
    .upload(fileName, imageFile);
  
  if (uploadError) {
    return { message: `Storage Error: ${uploadError.message}` };
  }

  const { data: { publicUrl } } = supabase.storage
    .from('products-images')
    .getPublicUrl(fileName);
  
  const { error } = await supabase.from('products').insert({
    name,
    description,
    price,
    image_urls: [publicUrl],
    seller_id: user.id
  });

  if (error) {
    // Attempt to delete the uploaded image if the DB insert fails
    await supabase.storage.from('products-images').remove([fileName]);
    return { message: error.message };
  }
  
  revalidatePath('/admin/products');
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
