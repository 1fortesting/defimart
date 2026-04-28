'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHeader, TableRow, TableHead } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useActionState, useState, useTransition, useMemo, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { sendBulkSms } from './actions';
import { useToast } from '@/hooks/use-toast';
import { type CustomerWithPerformance } from './page';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatDistanceToNow } from 'date-fns';
import { Loader2, MessageSquare, Send, Users, TrendingUp, Sparkles, AlertTriangle, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

function SubmitButton({ disabled }: { disabled?: boolean }) {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending || disabled}>
            {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            {pending ? 'Sending...' : 'Send Message'}
        </Button>
    )
}

function CustomerTable({ 
    customers, 
    selectedCustomers, 
    onSelectionChange 
}: { 
    customers: CustomerWithPerformance[],
    selectedCustomers: Set<string>,
    onSelectionChange: (customerId: string, isSelected: boolean) => void
}) {
    const handleSelectAll = (isChecked: boolean) => {
        customers.forEach(customer => {
            if(customer.phone_number) {
                 onSelectionChange(customer.id, isChecked);
            }
        });
    };

    const areAllSelected = customers.length > 0 && customers.every(c => !c.phone_number || selectedCustomers.has(c.id));

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead className="w-[50px]">
                        <Checkbox onCheckedChange={(checked) => handleSelectAll(checked === true)} checked={areAllSelected} />
                    </TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Completed Orders</TableHead>
                    <TableHead>Joined</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {customers.map(customer => (
                    <TableRow key={customer.id} className={selectedCustomers.has(customer.id) ? 'bg-muted' : ''}>
                        <TableCell>
                            <Checkbox 
                                onCheckedChange={(checked) => onSelectionChange(customer.id, checked === true)} 
                                checked={selectedCustomers.has(customer.id)}
                                disabled={!customer.phone_number}
                            />
                        </TableCell>
                        <TableCell>
                            <div className="font-medium">{customer.display_name || 'N/A'}</div>
                            <div className="text-xs text-muted-foreground">{customer.email}</div>
                        </TableCell>
                        <TableCell>
                             {customer.phone_number ? customer.phone_number : <span className="text-xs text-muted-foreground italic">No phone</span>}
                        </TableCell>
                        <TableCell>{customer.completed_orders}</TableCell>
                        <TableCell>{formatDistanceToNow(new Date(customer.created_at), { addSuffix: true })}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    )
}


export default function CustomerMessagingClientPage({
    allCustomers,
    topCustomers,
    newSignups,
}: {
    allCustomers: CustomerWithPerformance[],
    topCustomers: CustomerWithPerformance[],
    newSignups: CustomerWithPerformance[]
}) {
    const { toast } = useToast();
    const [message, setMessage] = useState('');
    const [selectedCustomers, setSelectedCustomers] = useState<Set<string>>(new Set());
    const [activeTab, setActiveTab] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    const [state, formAction] = useActionState(sendBulkSms, { success: false, message: null });

    useEffect(() => {
        if(state.message) {
            if (state.success) {
                toast({ title: 'Success', description: state.message, variant: 'success' });
                setMessage('');
                setSelectedCustomers(new Set());
            } else {
                toast({ title: 'Error', description: state.message, variant: 'destructive' });
            }
        }
    }, [state, toast]);

    const handleSelectionChange = (customerId: string, isSelected: boolean) => {
        setSelectedCustomers(prev => {
            const newSet = new Set(prev);
            if (isSelected) {
                newSet.add(customerId);
            } else {
                newSet.delete(customerId);
            }
            return newSet;
        });
    };
    
    const customerLists = useMemo(() => ({
        all: allCustomers,
        top: topCustomers,
        new: newSignups,
    }), [allCustomers, topCustomers, newSignups]);

    const filteredCustomerLists = useMemo(() => {
        if (!searchQuery) return customerLists;
        const lowerQuery = searchQuery.toLowerCase();
        
        const filterFn = (c: CustomerWithPerformance) =>
            c.display_name?.toLowerCase().includes(lowerQuery) ||
            c.email?.toLowerCase().includes(lowerQuery) ||
            c.phone_number?.includes(searchQuery);

        return {
            all: allCustomers.filter(filterFn),
            top: topCustomers.filter(filterFn),
            new: newSignups.filter(filterFn),
        };
    }, [searchQuery, allCustomers, topCustomers, newSignups, customerLists]);

    const selectedCustomerIds = useMemo(() => {
        return allCustomers.filter(c => selectedCustomers.has(c.id) && c.phone_number).map(c => c.id);
    }, [selectedCustomers, allCustomers]);
    
    const handleFormSubmit = (formData: FormData) => {
        formData.append('customerIds', JSON.stringify(selectedCustomerIds));
        formAction(formData);
    }

    return (
        <div className="flex flex-col gap-6">
            <h1 className="text-lg font-semibold md:text-2xl flex items-center gap-2"><MessageSquare className="h-6 w-6" /> Customer Messaging</h1>

            <form action={handleFormSubmit}>
                 <Card>
                    <CardHeader>
                        <CardTitle>Compose Message</CardTitle>
                        <CardDescription>Craft your SMS and send it to selected customers. The "DEFIMART" sender ID will be used.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-2">
                            <Label htmlFor="message">Message</Label>
                            <Textarea 
                                id="message" 
                                name="message"
                                placeholder="e.g., Hi {name}, enjoy 10% off your next purchase with code: ..."
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                rows={4}
                            />
                            <p className="text-xs text-muted-foreground">{message.length} characters. Use {`{name}`} to insert the customer's name.</p>
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-between items-center">
                        <p className="text-sm text-muted-foreground">
                            Sending to <strong>{selectedCustomerIds.length}</strong> customer(s).
                        </p>
                        <SubmitButton disabled={selectedCustomerIds.length === 0 || message.trim().length === 0} />
                    </CardFooter>
                </Card>
            </form>
           

            <Card>
                <CardHeader>
                    <CardTitle>Select Recipients</CardTitle>
                    <CardDescription>Choose which customers to message from the lists below.</CardDescription>
                     <div className="pt-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                                placeholder="Search by name, email, or phone..."
                                className="pl-10"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="all"><Users className="mr-2"/>All Customers ({filteredCustomerLists.all.length})</TabsTrigger>
                            <TabsTrigger value="top"><TrendingUp className="mr-2"/>Top Customers ({filteredCustomerLists.top.length})</TabsTrigger>
                            <TabsTrigger value="new"><Sparkles className="mr-2"/>New Signups ({filteredCustomerLists.new.length})</TabsTrigger>
                        </TabsList>
                        <TabsContent value="all" className="mt-4">
                            <CustomerTable customers={filteredCustomerLists.all} selectedCustomers={selectedCustomers} onSelectionChange={handleSelectionChange} />
                        </TabsContent>
                        <TabsContent value="top" className="mt-4">
                            <CustomerTable customers={filteredCustomerLists.top} selectedCustomers={selectedCustomers} onSelectionChange={handleSelectionChange} />
                        </TabsContent>
                         <TabsContent value="new" className="mt-4">
                            <CustomerTable customers={filteredCustomerLists.new} selectedCustomers={selectedCustomers} onSelectionChange={handleSelectionChange} />
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    )
}
