'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Send, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';

interface NotificationPanelProps {
  role: 'CEO' | 'Sales' | 'Procurement';
}

export function NotificationPanel({ role }: NotificationPanelProps) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [type, setType] = useState('');
  const [audience, setAudience] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const supabase = createClient();

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
      // In a real implementation, this calls your Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('send-fcm', {
        body: { title, body, type, audience, role }
      });

      if (error) throw error;

      toast({ title: 'Notification Queued', description: 'Your message is being delivered to devices.' });
      setTitle('');
      setBody('');
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Failed to send', description: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Compose Notification</CardTitle>
        <CardDescription>Send a push notification to users based on your {role} permissions.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="type">Notification Type</Label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger>
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
          <Label htmlFor="audience">Target Audience</Label>
          <Select value={audience} onValueChange={setAudience}>
            <SelectTrigger>
              <SelectValue placeholder="Select audience" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Registered Users</SelectItem>
              <SelectItem value="active">Active Buyers (Last 30 days)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="title">Title</Label>
          <Input id="title" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. ⚡ Flash Sale Alert!" />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="body">Message Body</Label>
          <Textarea id="body" value={body} onChange={e => setBody(e.target.value)} placeholder="Keep it short and catchy..." />
        </div>

        <Button onClick={handleSend} disabled={isLoading} className="w-full">
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
          Broadcast Notification
        </Button>
      </CardContent>
    </Card>
  );
}