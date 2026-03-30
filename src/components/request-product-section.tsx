import { createClient } from '@/lib/supabase/server';
import { RequestProductForm } from './request-product-form';
import { AuthPrompt } from './auth-prompt';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { PackagePlus } from 'lucide-react';
import Link from 'next/link';
import { Button } from './ui/button';

export async function RequestProductSection() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    return (
        <div className="my-8">
            <Card className="bg-muted/30">
                <CardHeader className="text-center">
                     <div className="mx-auto bg-background p-3 rounded-full w-fit">
                        <PackagePlus className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="text-2xl font-bold">Can't Find What You're Looking For?</CardTitle>
                    <CardDescription className="max-w-2xl mx-auto">
                        Let us know what product you need, and our procurement team will do their best to source it for you.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {user ? (
                        <div className="max-w-xl mx-auto">
                            <RequestProductForm />
                        </div>
                    ) : (
                        <div className="text-center">
                            <p className="mb-4 text-muted-foreground">You need to be logged in to request a product.</p>
                            <Button asChild>
                                <Link href="/login">Login to Make a Request</Link>
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
