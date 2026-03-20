import { createClient } from '@/lib/supabase/server';
import { SettingsForm } from './settings-form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';


export default async function SettingsPage() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Layout should handle this, but as a safeguard
    if (!user) return null;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Settings</CardTitle>
                <CardDescription>Manage your account settings and personal information.</CardDescription>
            </CardHeader>
            <CardContent>
                <SettingsForm user={user} />
            </CardContent>
        </Card>
    );
}
