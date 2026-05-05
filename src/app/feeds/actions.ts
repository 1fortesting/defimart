'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

/**
 * LIKES
 */
export async function toggleLike(feedId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    // Check if already liked
    const { data: existingLike } = await supabase
        .from('feed_likes')
        .select('id')
        .eq('feed_id', feedId)
        .eq('user_id', user.id)
        .single();

    if (existingLike) {
        // Unlike
        await supabase
            .from('feed_likes')
            .delete()
            .eq('id', existingLike.id);
    } else {
        // Like
        await supabase
            .from('feed_likes')
            .insert({ feed_id: feedId, user_id: user.id });
    }

    revalidatePath('/feeds');
    return { success: true };
}

/**
 * COMMENTS
 */
export async function addComment(feedId: string, content: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    const { error } = await supabase
        .from('feed_comments')
        .insert({ feed_id: feedId, user_id: user.id, content });

    if (error) throw error;

    revalidatePath('/feeds');
    return { success: true };
}

export async function deleteComment(commentId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    const { error } = await supabase
        .from('feed_comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', user.id);

    if (error) throw error;

    revalidatePath('/feeds');
    return { success: true };
}

/**
 * SAVES
 */
export async function toggleSave(feedId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    const { data: existingSave } = await supabase
        .from('feed_saves')
        .select('id')
        .eq('feed_id', feedId)
        .eq('user_id', user.id)
        .single();

    if (existingSave) {
        await supabase
            .from('feed_saves')
            .delete()
            .eq('id', existingSave.id);
    } else {
        await supabase
            .from('feed_saves')
            .insert({ feed_id: feedId, user_id: user.id });
    }

    revalidatePath('/feeds');
    revalidatePath('/saved/feeds');
    return { success: true };
}
