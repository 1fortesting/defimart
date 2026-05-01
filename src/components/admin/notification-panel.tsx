
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Send, Loader2, Target, Sparkles, Megaphone, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { sendPush } from '@/lib/sendPush';
import { cn } from '@/lib/utils';

interface NotificationPanelProps {
  role: 'CEO' | 'Sales' | 'Procurement';
}

const TEMPLATES = {
    CEO: [
        { label: 'System Update', title: '🛠️ Scheduled Maintenance', body: 'Defimart will be briefly offline for updates tonight at 12AM. Thanks for your patience!' },
        { label: 'Global Promo', title: '🎁 Surprise Discount!', body: 'Use code DEFI20 for 20% off your entire order, valid today only!' },
    ],
    Sales: [
        { label: 'Flash Sale', title: '⚡ Flash Sale Live!', body: 'The 1-hour flash sale has started. Grab your favorites before they are gone!' },
        { label: 'New Arrivals', title: '🆕 Just Landed!', body: 'Fresh stock just arrived in the Fashion category. Shop the latest trends now.' },
        { label: 'Cart Reminder', title: '🛒 Forget Something?', body: 'You left items in your cart! Complete your order now and pick it up on the next scheduled day.' },
    ],
    Procurement: [
        { label: 'Restock Alert', title: '📦 Back in Stock!', body: 'Our best-selling power banks are finally back. Order yours now while supplies last.' },
        { label: 'New Inventory', title: '📚 New Books Available', body: 'The latest semester textbooks have been added to the store. Check them out!' },
    ]
}

export function NotificationPanel({ role }: NotificationPanelProps) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [type, setType] = useState('');
  const [audience, setAudience] = useState<'all' | 'active' | 'category'>('all');
  const [targetCategory, setTargetCategory] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const getAvailableTypes = () => {
    if (role === 'CEO') return ['Flash Sale', 'Promotion', 'New Arrivals', 'New Stock', 'Back in Stock', 'System Update'];
    if (role === 'Sales') return ['Flash Sale', 'Promotion', 'New Arrivals', 'Abandoned Cart'];
    if (role === 'Procurement') return ['New Stock', 'Back in Stock'];
    return [];
  };

  const applyTemplate = (template: { title: string, body: string }) => {
    setTitle(template.title);
    setBody(template.body);
  };

  const handleSend = async () => {
    if (!title || !body || !type) {
      toast({ variant: 'destructive', title: 'Missing fields', description: 'Please fill in all required fields.' });
      return;
    }

    setIsLoading(true);
    try {
      const result = await sendPush({
        title,
        body,
        type,
        audience,
        role
      });

      if (!result.success) throw new Error(result.error);

      toast({ 
        variant: 'success',
        title: 'Notification Sent', 
        description: `Successfully broadcasted to ${audience === 'all' ? 'all users' : 'target audience'}.` 
      });
      
      setTitle('');
      setBody('');
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Failed to send', description: err.message });
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
                            <Megaphone className="h-5 w-5 text-primary" />
                            Compose Broadcast
                        </CardTitle>
                        <CardDescription>Target your audience with a high-impact notification from the {role} desk.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-6">
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="type" className="font-semibold">Alert Category</Label>
                                <Select value={type} onValueChange={setType}>
                                    <SelectTrigger className="border-primary/20 focus:ring-primary">
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
                                    <SelectTrigger className="border-primary/20 focus:ring-primary">
                                    <SelectValue placeholder="Select audience" />
                                    </SelectTrigger>
                                    <SelectContent>
                                    <SelectItem value="all">Everyone (Broadcast)</SelectItem>
                                    <SelectItem value="active">Active Shoppers Only</SelectItem>
                                    <SelectItem value="category">Specific Category Interest</SelectItem>
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
                        <Label htmlFor="title" className="font-semibold">Headline</Label>
                        <Input 
                            id="title" 
                            value={title} 
                            onChange={e => setTitle(e.target.value.substring(0, 50))} 
                            placeholder="e.g. ⚡ Flash Sale Alert!" 
                            className="border-primary/20 focus:ring-primary"
                        />
                        <p className="text-[10px] text-muted-foreground text-right">{title.length}/50 characters</p>
                        </div>

                        <div className="grid gap-2">
                        <Label htmlFor="body" className="font-semibold">Message Body</Label>
                        <Textarea 
                            id="body" 
                            value={body} 
                            onChange={e => setBody(e.target.value.substring(0, 150))} 
                            placeholder="Write a catchy message to grab attention..." 
                            className="min-h-[100px] border-primary/20 focus:ring-primary resize-none"
                        />
                        <div className="flex justify-between items-center">
                             <p className="text-[10px] text-muted-foreground italic">Users see this on lock screens.</p>
                             <p className="text-[10px] text-muted-foreground">{body.length}/150 characters</p>
                        </div>
                        </div>

                        <Button onClick={handleSend} disabled={isLoading} className="w-full h-12 text-lg shadow-primary/20 font-bold uppercase tracking-wider">
                        {isLoading ? (
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        ) : (
                            <Send className="mr-2 h-5 w-5" />
                        )}
                        {isLoading ? 'Delivering...' : 'Broadcast Alert'}
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
                        <CardDescription className="text-xs">Quick starts for the {role} desk.</CardDescription>
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
                        <div className="space-y-4">
                            <div className="text-xs text-muted-foreground text-center py-8 bg-muted/30 rounded-lg border border-dashed">
                                No recently sent alerts <br/> logged for this session.
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    </div>
  );
}
