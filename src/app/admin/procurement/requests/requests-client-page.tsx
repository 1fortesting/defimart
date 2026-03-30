'use client';

import { useState, useTransition, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { ProductRequestWithUser } from './page';
import Image from 'next/image';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { updateRequestStatus } from './actions';
import { useToast } from '@/hooks/use-toast';

function StatusSelector({ requestId, currentStatus, onUpdate, isPending }: { 
    requestId: string, 
    currentStatus: string,
    onUpdate: (formData: FormData) => void,
    isPending: boolean
}) {
    const [status, setStatus] = useState(currentStatus);

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        formData.set('status', status);
        onUpdate(formData);
    }

    return (
        <form onSubmit={handleSubmit} className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <Select name="status" defaultValue={currentStatus} onValueChange={(value) => setStatus(value as any)}>
                <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="sourced">Sourced</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
            </Select>
            <input type="hidden" name="requestId" value={requestId} />
            <Button size="sm" type="submit" disabled={isPending} className="w-[60px]">
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
            </Button>
        </form>
    );
}

const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    sourced: 'bg-green-100 text-green-800 border-green-200',
    rejected: 'bg-red-100 text-red-800 border-red-200',
}

export default function ProductRequestsClientPage({ initialRequests }: { initialRequests: ProductRequestWithUser[] }) {
    const [isRefreshing, startRefreshTransition] = useTransition();
    const [isUpdating, startUpdateTransition] = useTransition();
    const [pendingRequestId, setPendingRequestId] = useState<string | null>(null);
    const router = useRouter();
    const { toast } = useToast();

    const handleRefresh = () => startRefreshTransition(() => router.refresh());

    const handleStatusUpdate = (formData: FormData) => {
        const requestId = formData.get('requestId') as string;
        setPendingRequestId(requestId);
        startUpdateTransition(async () => {
            const result = await updateRequestStatus(formData);
            if (result?.success) {
                toast({ variant: 'success', title: 'Status Updated', description: 'The customer has been notified.'});
                router.refresh();
            } else if (result?.error) {
                 toast({ variant: 'destructive', title: 'Update Failed', description: result.error });
            }
            setPendingRequestId(null);
        });
    };

    const groupedRequests = useMemo(() => {
        return initialRequests.reduce((acc, request) => {
            const status = request.status || 'pending';
            if (!acc[status]) acc[status] = [];
            acc[status].push(request);
            return acc;
        }, {} as Record<string, ProductRequestWithUser[]>);
    }, [initialRequests]);
    
    const requestSections = [
        { status: 'pending', title: 'Pending Requests' },
        { status: 'sourced', title: 'Sourced Requests' },
        { status: 'rejected', title: 'Rejected Requests' }
    ];

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
                        <p>No product requests yet.</p>
                    </CardContent>
                </Card>
            )}

            <div className="space-y-4">
                {requestSections.map(section => {
                    const requests = groupedRequests[section.status] || [];
                    if (requests.length === 0) return null;

                    return (
                        <Card key={section.status}>
                            <CardHeader>
                                <CardTitle>{section.title} ({requests.length})</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Accordion type="single" collapsible className="w-full">
                                    {requests.map((request) => (
                                        <AccordionItem key={request.id} value={request.id}>
                                            <AccordionTrigger>
                                                <div className="flex justify-between items-center w-full">
                                                    <div className="flex items-center gap-4 text-left">
                                                        {request.image_url && <Image src={request.image_url} alt="Product request" width={40} height={40} className="rounded-md object-cover" />}
                                                        <div className="truncate">
                                                            <p className="font-semibold truncate">{request.product_name}</p>
                                                            <p className="text-sm text-muted-foreground">from {request.profiles?.display_name || 'Anonymous'}</p>
                                                        </div>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground mr-4 hidden md:block">{formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}</p>
                                                </div>
                                            </AccordionTrigger>
                                            <AccordionContent className="space-y-4">
                                                <div className="grid md:grid-cols-3 gap-6">
                                                    <div className="md:col-span-2 space-y-4">
                                                        <h4 className="font-semibold">Product Name</h4>
                                                        <p className="text-muted-foreground">{request.product_name}</p>
                                                        <h4 className="font-semibold">Full Description</h4>
                                                        <p className="text-muted-foreground whitespace-pre-wrap">{request.description}</p>
                                                        <h4 className="font-semibold">Customer Details</h4>
                                                        <p className="text-sm text-muted-foreground"><strong>Name:</strong> {request.profiles?.display_name || 'N/A'}</p>
                                                        <p className="text-sm text-muted-foreground"><strong>Phone:</strong> {request.profiles?.phone_number || 'N/A'}</p>
                                                    </div>
                                                     {request.image_url && (
                                                         <div className="space-y-2">
                                                            <h4 className="font-semibold">Uploaded Image</h4>
                                                            <a href={request.image_url} target="_blank" rel="noopener noreferrer">
                                                                <Image src={request.image_url} alt="Product request" width={200} height={200} className="rounded-lg border object-cover aspect-square hover:opacity-80 transition-opacity" />
                                                            </a>
                                                         </div>
                                                     )}
                                                </div>
                                                <div className="flex items-center justify-between mt-4 border-t pt-4">
                                                     <p className="text-sm font-medium">Update Status:</p>
                                                     <StatusSelector 
                                                        requestId={request.id}
                                                        currentStatus={request.status}
                                                        onUpdate={handleStatusUpdate}
                                                        isPending={isUpdating && pendingRequestId === request.id}
                                                     />
                                                </div>
                                            </AccordionContent>
                                        </AccordionItem>
                                    ))}
                                </Accordion>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>
        </div>
    );
}
