'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function toggleSaveProduct(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'You must be logged in to save items.' };
  }

  const productId = formData.get('productId') as string;
  const pathname = formData.get('pathname') as string || '/';

  // Check if product is already saved
  const { data: existingSave, error: fetchError } = await supabase
    .from('saved_products')
    .select('id')
    .eq('user_id', user.id)
    .eq('product_id', productId)
    .single();
  
  if (existingSave) {
    // Unsave it
    const { error: deleteError } = await supabase
      .from('saved_products')
      .delete()
      .eq('id', existingSave.id);

    if (deleteError) {
      console.error("Failed to unsave product:", deleteError);
      return { error: "Failed to unsave product" };
    }
  } else {
    // Save it
    const { error: insertError } = await supabase
      .from('saved_products')
      .insert({ product_id: productId, user_id: user.id });
    
    if (insertError) {
      console.error("Failed to save product:", insertError);
       return { error: "Failed to save product" };
    }
  }

  revalidatePath(pathname);
  revalidatePath('/saved');
  return { success: true };
}
