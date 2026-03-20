'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function logout() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect('/login');
}

export async function requestPasswordReset(formData: FormData) {
  const supabase = createClient();
  const email = formData.get('email') as string;

  const { error } = await supabase.auth.resetPasswordForEmail(email);

  if (error) {
    return redirect(`/auth/forgot-password?error=${encodeURIComponent(error.message)}`);
  }

  return redirect(`/auth/forgot-password?message=If an account exists for ${email}, a password reset link has been sent.`);
}
