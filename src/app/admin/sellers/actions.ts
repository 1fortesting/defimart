'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { sendSms } from '@/lib/sendSms';

export async function updateSellerStatus(sellerId: string, status: 'approved' | 'rejected') {
  const supabase = await createClient();

  // 1. Fetch seller details to get phone number and shop name
  const { data: seller, error: fetchError } = await supabase
    .from('sellers' as any)
    .select('phone_number, shop_name')
    .eq('id', sellerId)
    .single();

  if (fetchError || !seller) throw new Error('Seller not found');

  // 2. Update status in database
  const { error: updateError } = await supabase
    .from('sellers' as any)
    .update({ status })
    .eq('id', sellerId);

  if (updateError) throw updateError;

  // 3. Send SMS notification to the vendor
  if (seller.phone_number) {
    const message = status === 'approved' 
        ? `DEFIMART: Congratulations! Your shop "${seller.shop_name}" has been approved. You can now log in to your dashboard and start listing products.`
        : `DEFIMART: We regret to inform you that your vendor application for "${seller.shop_name}" was not approved at this time. Contact support for more details.`;
    
    await sendSms({ phoneNumber: seller.phone_number, message });
  }

  revalidatePath('/admin/sellers');
}
