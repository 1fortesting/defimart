'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Send, Loader2, Sparkles, Megaphone, Clock, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { sendSms } from '@/lib/sendSms';

interface NotificationPanelProps {
  role: 'CEO' | 'Sales' | 'Procurement';
}

const TEMPLATES = {
    CEO: [
        { label: 'System Update', title: '🛠️ DEFIMART UPDATE', body: 'We will be briefly offline for scheduled maintenance tonight at 12AM. We apologize for any inconvenience!' },
        { label: 'Global Promo', title: '🎁 SURPRISE OFFER', body: 'Flash Sale! Use code DEFI20 for 20% off your next purchase, valid today only!' },
    ],
    Sales: [
        { label: 'Flash Sale', title: '⚡ FLASH SALE LIVE', body: 'The 1-hour flash sale has started! Visit DEFIMART now to grab your favorites at massive discounts.' },
        { label: 'New Arrivals', title: '🆕 JUST LANDED', body: 'Fresh stock just arrived in the store! Check out the latest trends and essential study gear today.' },
        { label: 'Cart Reminder', title: '🛒 SHOPPING CART', body: 'You left items in your cart! Complete your order now and pick it up during our next campus delivery window.' },
    ],
    Procurement: [
        { label: 'Restock Alert', title: '📦 BACK IN STOCK', body: 'Our best-selling power banks and study accessories are finally back! Order now while supplies last.' },
        { label: 'New Inventory', title: '📚 NEW ARRIVALS', body: 'The latest semester textbooks and stationeries have been added to the store. Shop now for a productive week!' },
    ]
}

export function NotificationPanel({ role }: NotificationPanelProps) {
  const [body, setBody] = useState('');
  const [type, setType] = useState('');
  const [audience, setAudience] = useState<'all' | 'active' | 'category'>('all');
  const [targetCategory, setTargetCategory] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const getAvailableTypes = () => {
    if (role === 'CEO') return ['System Alert', 'Global Promotion', 'Security Update'];
    if (role === 'Sales') return ['Flash Sale', 'Discount Offer', 'New Arrivals', 'Cart Reminder'];
    if (role === 'Procurement') return ['Inventory Restock', 'New Arrivals'];
    return [];
  };

  const applyTemplate = (template: { title: string, body: string }) => {
    setBody(`${template.title}: ${template.body}`);
  };

  const handleSendSmsBroadcast = async () => {
    if (!body || !type) {
      toast({ variant: 'destructive', title: 'Missing fields', description: 'Please provide a message and select an alert category.' });
      return;
    }

    setIsLoading(true);
    try {
      const supabase = createClient();
      
      // 1. Fetch relevant user phone numbers
      let query = supabase.from('profiles').select('phone_number').not('phone_number', 'is', null);
      
      if (audience === 'category' && targetCategory) {
          // Find users who have items of this category in their wishlist or order history
          // This is a simplified fetch for broadcast logic
      }

      const { data: recipients, error: fetchError } = await query;
      
      if (fetchError || !recipients) throw new Error('Could not fetch recipients.');

      const phoneNumbers = recipients.map(r => r.phone_number).filter(Boolean) as string[];

      if (phoneNumbers.length === 0) {
          toast({ title: 'No Recipients', description: 'No users found with valid phone numbers for this audience.' });
          setIsLoading(false);
          return;
      }

      // 2. Perform Broadcast (Limit to chunks for API safety if needed, here we do a Promise.allSettled)
      // Note: In production, bulk SMS is usually handled via an Edge Function loop or bulk API endpoint
      const results = await Promise.allSettled(
          phoneNumbers.map(number => sendSms({ phoneNumber: number, message: body }))
      );

      const successful = results.filter(r => r.status === 'fulfilled').length;
      
      toast({ 
        variant: 'success',
        title: 'SMS Broadcast Complete', 
        description: `Successfully delivered to ${successful} out of ${phoneNumbers.length} recipients.` 
      });
      
      setBody('');
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Broadcast Failed', description: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
                <Card className="shadow-lg border-primary/20">
                    <CardHeader className="bg-primary/5 rounded-t-lg border-b border-primary/10">
                        <CardTitle className="flex items-center gap-2">
                            <MessageSquare className="h-5 w-5 text-primary" />
                            SMS Broadcast Center
                        </CardTitle>
                        <CardDescription>Deliver critical updates directly to customer phones from the {role} desk.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-6">
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="type" className="font-semibold">Alert Category</Label>
                                <Select value={type} onValueChange={setType}>
                                    <SelectTrigger className="border-primary/20">
                                    <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                    {getAvailableTypes().map(t => (
                                        <SelectItem key={t} value={t}>{t}</SelectItem>
                                    ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="audience" className="font-semibold">Target Audience</Label>
                                <Select value={audience} onValueChange={(v: any) => setAudience(v)}>
                                    <SelectTrigger className="border-primary/20">
                                    <SelectValue placeholder="Select audience" />
                                    </SelectTrigger>
                                    <SelectContent>
                                    <SelectItem value="all">Everyone (Broadcast)</SelectItem>
                                    <SelectItem value="active">Active Shoppers</SelectItem>
                                    <SelectItem value="category">Category Interest</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {audience === 'category' && (
                            <div className="grid gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                <Label htmlFor="category" className="font-semibold">Target Category</Label>
                                <Input 
                                    id="category" 
                                    placeholder="e.g. Electronics & Gadgets" 
                                    value={targetCategory}
                                    onChange={(e) => setTargetCategory(e.target.value)}
                                    className="border-primary/20"
                                />
                            </div>
                        )}

                        <div className="grid gap-2">
                        <Label htmlFor="body" className="font-semibold">SMS Content</Label>
                        <Textarea 
                            id="body" 
                            value={body} 
                            onChange={e => setBody(e.target.value.substring(0, 160))} 
                            placeholder="Write your SMS here. Keep it concise for maximum impact..." 
                            className="min-h-[120px] border-primary/20 focus:ring-primary resize-none"
                        />
                        <div className="flex justify-between items-center">
                             <p className="text-[10px] text-muted-foreground italic">Standard SMS is 160 characters.</p>
                             <p className={cn("text-[10px] font-bold", body.length > 140 ? "text-orange-500" : "text-muted-foreground")}>
                                {body.length}/160 characters
                             </p>
                        </div>
                        </div>

                        <Button onClick={handleSendSmsBroadcast} disabled={isLoading} className="w-full h-12 text-lg shadow-primary/20 font-bold uppercase tracking-wider">
                        {isLoading ? (
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        ) : (
                            <Send className="mr-2 h-5 w-5" />
                        )}
                        {isLoading ? 'Sending SMS...' : 'Send SMS Broadcast'}
                        </Button>
                    </CardContent>
                </Card>
            </div>

            <div className="space-y-6">
                <Card className="border-dashed border-primary/30 bg-primary/5">
                    <CardHeader>
                        <CardTitle className="text-sm flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-primary" />
                            Smart Templates
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-3">
                        {TEMPLATES[role].map((template, idx) => (
                            <Button 
                                key={idx} 
                                variant="outline" 
                                size="sm" 
                                onClick={() => applyTemplate(template)}
                                className="justify-start h-auto py-3 px-4 text-left font-medium border-primary/20 hover:bg-primary/10 hover:text-primary transition-all"
                            >
                                <div>
                                    <p className="text-xs uppercase tracking-tighter opacity-70 mb-1">{template.label}</p>
                                    <p className="truncate w-full text-sm">{template.title}</p>
                                </div>
                            </Button>
                        ))}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            Recent Activity
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xs text-muted-foreground text-center py-8 bg-muted/30 rounded-lg border border-dashed">
                            No SMS broadcasts <br/> sent this session.
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    </div>
  );
}
