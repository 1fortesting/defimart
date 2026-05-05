'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function updateSellerStatus(sellerId: string, status: 'approved' | 'rejected') {
  const supabase = await createClient();

  const { error } = await supabase
    .from('sellers' as any)
    .update({ status })
    .eq('id', sellerId);

  if (error) throw error;

  revalidatePath('/admin/sellers');
}
