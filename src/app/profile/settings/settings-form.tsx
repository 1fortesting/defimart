'use client';
import React, { useState, useEffect, useActionState } from 'react';
import type { User } from '@supabase/supabase-js';
import { updateUserProfile } from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFormStatus } from 'react-dom';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';

function SubmitButton() {
    const { pending } = useFormStatus();
    return <Button type="submit" disabled={pending} className="w-full sm:w-auto">{pending ? 'Saving...' : 'Save Changes'}</Button>;
}

export function SettingsForm({ user }: { user: User }) {
    const { toast } = useToast();
    const initialState = { message: null, error: null };
    // useActionState is a React 19 hook, which this project uses.
    const [state, dispatch] = useActionState(updateUserProfile, initialState);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setImagePreview(URL.createObjectURL(file));
        } else {
            setImagePreview(null);
        }
    };
    
    useEffect(() => {
        if(state?.message) {
            toast({ title: 'Success', description: state.message });
        }
        if(state?.error) {
            toast({ variant: 'destructive', title: 'Error', description: state.error });
        }
    }, [state, toast]);

    return (
        <form action={dispatch} className="space-y-8">
            <div className="space-y-2">
                <Label>Profile Picture</Label>
                <div className="flex items-center gap-4">
                     <Avatar className="h-20 w-20">
                        {imagePreview ? (
                            <img src={imagePreview} alt="Preview" className="object-cover rounded-full aspect-square" />
                        ) : (
                            <>
                                <AvatarImage src={user.user_metadata.avatar_url} />
                                <AvatarFallback>{user.user_metadata.display_name?.[0] || user.email?.[0]}</AvatarFallback>
                            </>
                        )}
                    </Avatar>
                    <Input id="avatar" name="avatar" type="file" accept="image/*" onChange={handleImageChange} className="max-w-xs" />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="display_name">Display Name</Label>
                    <Input id="display_name" name="display_name" defaultValue={user.user_metadata.display_name || ''} />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="phone_number">Phone Number</Label>
                    <Input id="phone_number" name="phone_number" type="tel" defaultValue={user.user_metadata.phone_number || ''} />
                </div>
            </div>
             <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" defaultValue={user.email} disabled className="bg-muted/50" />
             </div>
            <div className="flex justify-end">
                <SubmitButton />
            </div>
        </form>
    );
}
