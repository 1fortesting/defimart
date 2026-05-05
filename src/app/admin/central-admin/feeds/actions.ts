'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const CreateFeedSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  content: z.string().min(10, "Content must be at least 10 characters"),
  tags: z.string().optional(),
  productId: z.string().optional(),
});

export async function createFeed(prevState: any, formData: FormData) {
  const supabase = await createClient();
  
  const validatedFields = CreateFeedSchema.safeParse({
    title: formData.get('title'),
    content: formData.get('content'),
    tags: formData.get('tags'),
    productId: formData.get('productId'),
  });

  if (!validatedFields.success) {
    return { error: validatedFields.error.flatten().fieldErrors };
  }

  const { title, content, tags, productId } = validatedFields.data;
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'Unauthorized' };

  const images = formData.getAll('images') as File[];
  const image_urls: string[] = [];

  // Handle multiple image uploads
  for (const image of images) {
    if (image && image.size > 0) {
      const fileExt = image.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `feed-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('feeds')
        .upload(filePath, image);

      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage
          .from('feeds')
          .getPublicUrl(filePath);
        image_urls.push(publicUrl);
      }
    }
  }

  const tagArray = tags ? tags.split(',').map((t: string) => t.trim()) : [];
  const finalProductId = productId && productId !== 'none' ? productId : null;

  const { error: insertError } = await (supabase as any).from('feeds').insert({
    title,
    content,
    image_urls,
    tags: tagArray,
    author_id: user.id,
    is_published: true,
    product_id: finalProductId,
  });

  if (insertError) {
    console.error('Feed insertion error:', insertError);
    return { error: 'Failed to create post in database: ' + insertError.message };
  }

  revalidatePath('/feeds');
  revalidatePath('/admin/central-admin/feeds');
  
  return { success: true, message: 'Upload success' };
}

export async function deleteFeed(id: string) {
    const supabase = await createClient();
    const { error } = await supabase.from('feeds').delete().eq('id', id);
    if (error) return { error: error.message };
    revalidatePath('/feeds');
    revalidatePath('/admin/central-admin/feeds');
    return { success: true };
}
