'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Send, Loader2, Users, Target } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { sendPush } from '@/lib/sendPush';

interface NotificationPanelProps {
  role: 'CEO' | 'Sales' | 'Procurement';
}

export function NotificationPanel({ role }: NotificationPanelProps) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [type, setType] = useState('');
  const [audience, setAudience] = useState<'all' | 'active'>('all');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const getAvailableTypes = () => {
    if (role === 'CEO') return ['Flash Sale', 'Promotion', 'New Arrivals', 'New Stock', 'Back in Stock', 'System Update'];
    if (role === 'Sales') return ['Flash Sale', 'Promotion', 'New Arrivals', 'Abandoned Cart'];
    if (role === 'Procurement') return ['New Stock', 'Back in Stock'];
    return [];
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
        description: `Successfully sent "${type}" alert to ${audience === 'all' ? 'everyone' : 'active users'}.` 
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
    <Card className="shadow-lg border-primary/20">
      <CardHeader className="bg-primary/5 rounded-t-lg">
        <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Compose Push Alert
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
                    <SelectItem value="all">Everyone</SelectItem>
                    <SelectItem value="active">Active Shoppers Only</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="title" className="font-semibold">Headline</Label>
          <Input 
            id="title" 
            value={title} 
            onChange={e => setTitle(e.target.value)} 
            placeholder="e.g. ⚡ Flash Sale Alert!" 
            className="border-primary/20 focus:ring-primary"
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="body" className="font-semibold">Message Body</Label>
          <Textarea 
            id="body" 
            value={body} 
            onChange={e => setBody(e.target.value)} 
            placeholder="Write a catchy message to grab attention..." 
            className="min-h-[100px] border-primary/20 focus:ring-primary resize-none"
          />
          <p className="text-[10px] text-muted-foreground text-right italic">Users will see this on their lock screen.</p>
        </div>

        <Button onClick={handleSend} disabled={isLoading} className="w-full h-12 text-lg shadow-primary/20">
          {isLoading ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : (
            <Send className="mr-2 h-5 w-5" />
          )}
          {isLoading ? 'Delivering...' : 'Broadcast Notification'}
        </Button>
      </CardContent>
    </Card>
  );
}
