'use client';

import { useTransition } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { type ProductRequestWithUser } from './page';
import Image from 'next/image';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function RequestsClientPage({ initialRequests }: { initialRequests: ProductRequestWithUser[] }) {
    const [isRefreshing, startRefreshTransition] = useTransition();
    const router = useRouter();

    const handleRefresh = () => startRefreshTransition(() => router.refresh());

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <h1 className="text-lg font-semibold md:text-2xl">Customer Product Requests</h1>
                <Button onClick={handleRefresh} disabled={isRefreshing} variant="outline" size="sm">
                    <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>
            
            {initialRequests.length === 0 && (
                <Card>
                    <CardContent className="text-center text-muted-foreground p-16">
                        <p>No product requests for the sales department.</p>
                    </CardContent>
                </Card>
            )}

            {initialRequests.length > 0 && (
                 <Card>
                    <CardHeader>
                        <CardTitle>Incoming Requests</CardTitle>
                        <CardDescription>Review new product requests from customers.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Accordion type="single" collapsible className="w-full">
                            {initialRequests.map((request) => (
                                <AccordionItem key={request.id} value={request.id}>
                                    <AccordionTrigger>
                                        <div className="w-full text-left">
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1 truncate pr-4">
                                                    <p className="font-semibold truncate">{request.product_name}</p>
                                                    <p className="text-sm text-muted-foreground">from {request.profiles?.display_name || 'Anonymous'}</p>
                                                </div>
                                                <div className="text-right flex-shrink-0">
                                                    <p className="text-sm text-muted-foreground">{formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}</p>
                                                </div>
                                            </div>
                                            {request.image_url && (
                                                <div className="mt-4">
                                                    <Image src={request.image_url} alt="Product request" width={100} height={100} className="rounded-md object-cover aspect-square" />
                                                </div>
                                            )}
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="space-y-4">
                                        <div className="grid md:grid-cols-3 gap-6">
                                            <div className="md:col-span-2 space-y-4">
                                                <h4 className="font-semibold">Full Description</h4>
                                                <p className="text-muted-foreground whitespace-pre-wrap">{request.description}</p>
                                                <h4 className="font-semibold">Customer Details</h4>
                                                <p className="text-sm text-muted-foreground"><strong>Name:</strong> {request.profiles?.display_name || 'N/A'}</p>
                                                <p className="text-sm text-muted-foreground"><strong>Phone:</strong> {request.profiles?.phone_number || 'N/A'}</p>
                                            </div>
                                            <div className="space-y-2">
                                                <h4 className="font-semibold">Uploaded Image</h4>
                                                {request.image_url ? (
                                                    <a href={request.image_url} target="_blank" rel="noopener noreferrer">
                                                        <Image src={request.image_url} alt="Product request" width={200} height={200} className="rounded-lg border object-cover aspect-square hover:opacity-80 transition-opacity w-full max-h-[200px]" />
                                                    </a>
                                                ) : (
                                                    <div className="flex items-center justify-center h-[200px] w-full bg-muted rounded-lg">
                                                        <p className="text-sm text-muted-foreground">No image provided</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
