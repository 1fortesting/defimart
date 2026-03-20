'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function login(prevState: any, formData: FormData) {
  const supabase = createClient();

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message, success: false };
  }
  
  revalidatePath('/', 'layout');
  return { success: true, error: null };
}

export async function signup(prevState: any, formData: FormData) {
  const supabase = createClient();
  
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const displayName = formData.get('display_name') as string;
  const phoneNumber = formData.get('phone_number') as string;

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName,
        phone_number: phoneNumber,
      },
    },
  });

  if (error) {
    return { error: error.message, success: false };
  }

  revalidatePath('/', 'layout');
  return { success: true, error: null };
}

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
