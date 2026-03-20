'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const ProfileSchema = z.object({
  display_name: z.string().optional(),
  phone_number: z.string().optional(),
});

export async function updateUserProfile(prevState: any, formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'You must be logged in to update your profile.' };
  }

  const validatedFields = ProfileSchema.safeParse({
    display_name: formData.get('display_name'),
    phone_number: formData.get('phone_number'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      error: 'Invalid fields provided.',
    };
  }
  
  const { display_name, phone_number } = validatedFields.data;
  const avatarFile = formData.get('avatar') as File | null;

  let avatar_url = user.user_metadata.avatar_url;

  if (avatarFile && avatarFile.size > 0) {
      // Validate file type and size
      if (avatarFile.size > 5 * 1024 * 1024) { // 5MB limit
        return { error: 'Image file size must be less than 5MB.' };
      }
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(avatarFile.type)) {
        return { error: 'Invalid file type. Only JPG, PNG, and WEBP are allowed.' };
      }

      const fileName = `${user.id}/${Date.now()}-${avatarFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from('user_profile') 
        .upload(fileName, avatarFile, { upsert: true });

      if(uploadError) {
          return { error: `Storage Error: ${uploadError.message}` };
      }

      // If there was a previous avatar, remove it
      if (user.user_metadata.avatar_url) {
        const oldAvatarPath = new URL(user.user_metadata.avatar_url).pathname.split('/user_profile/')[1];
        if(oldAvatarPath) {
            await supabase.storage.from('user_profile').remove([oldAvatarPath]);
        }
      }

      const { data: { publicUrl } } = supabase.storage
        .from('user_profile')
        .getPublicUrl(fileName);
      
      avatar_url = publicUrl;
  }
  
  const { error: updateUserError } = await supabase.auth.updateUser({
      data: {
          display_name,
          phone_number,
          avatar_url,
      }
  });

  if (updateUserError) {
    return { error: updateUserError.message };
  }
  
  revalidatePath('/profile');
  revalidatePath('/profile/settings');
  revalidatePath('/'); // to update header
  return { message: 'Profile updated successfully!' };
}
