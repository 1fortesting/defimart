import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AuthPrompt } from '@/components/auth-prompt';
import { RequestProductForm } from '@/components/request-product-form';

export default async function RequestProductPage() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return (
            <main className="flex-1 p-8 flex items-center justify-center">
                <AuthPrompt />
            </main>
        );
    }
    
    return (
        <main className="flex-1 p-4 md:p-8 bg-muted/20">
            <div className="container mx-auto max-w-2xl">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-3xl">Request a Product</CardTitle>
                        <CardDescription>
                            Can't find what you're looking for? Let us know, and we'll do our best to source it for you.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <RequestProductForm />
                    </CardContent>
                </Card>
            </div>
        </main>
    );
}
