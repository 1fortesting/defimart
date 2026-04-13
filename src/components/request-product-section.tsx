import { RequestProductForm } from './request-product-form';
import { Button } from './ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { PackagePlus } from 'lucide-react';
import Link from 'next/link';
import type { User } from '@supabase/supabase-js';

export function RequestProductSection({ user }: { user: User | null }) {

    return (
        <div className="my-12 md:my-16">
             <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1" className="border-none rounded-lg overflow-hidden shadow-lg">
                    <AccordionTrigger className="p-6 text-left hover:no-underline transition-colors w-full bg-destructive text-destructive-foreground hover:bg-destructive/90 data-[state=open]:rounded-b-none">
                        <div className="flex w-full items-center gap-4">
                            <div className="bg-black/20 p-3 rounded-full">
                                <PackagePlus className="h-8 w-8 text-destructive-foreground" />
                            </div>
                            <div className="flex-1">
                                <h2 className="text-lg font-bold text-destructive-foreground">Can't Find It? Request It!</h2>
                                <p className="text-sm text-destructive-foreground/80">
                                    Click here and let us know what you need. We'll do our best to source it.
                                </p>
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="bg-card p-6 pt-2">
                         {user ? (
                            <div className="max-w-xl mx-auto border-t pt-6">
                                <RequestProductForm />
                            </div>
                        ) : (
                            <div className="text-center border-t py-8">
                                <p className="mb-4 text-muted-foreground">You need to be logged in to request a product.</p>
                                <Button asChild>
                                    <Link href="/login">Login to Make a Request</Link>
                                </Button>
                            </div>
                        )}
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </div>
    );
}
