'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

const ProductSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  price: z.coerce.number().min(0, 'Price must be non-negative'),
  image_urls: z.string().optional(),
});

export async function createProduct(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'You must be logged in to create a product.' };
  }

  const values = {
    name: formData.get('name'),
    description: formData.get('description'),
    price: formData.get('price'),
    image_urls: formData.get('image_urls'),
  };
  
  const validatedFields = ProductSchema.safeParse(values);

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Create Product.',
    };
  }
  
  const { name, description, price, image_urls } = validatedFields.data;

  const imageUrlsArray = image_urls?.split(',').map(url => url.trim()).filter(url => url) || [];
  
  const { error } = await supabase.from('products').insert({
    name,
    description,
    price,
    image_urls: imageUrlsArray,
    seller_id: user.id
  });

  if (error) {
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
