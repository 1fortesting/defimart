import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, Phone, MessageCircle } from 'lucide-react';
import Link from 'next/link';

export default function ContactPage() {
  return (
    <main className="flex-1 p-4 md:p-8 bg-muted/20">
      <div className="container mx-auto max-w-2xl">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-3xl">Contact Support</CardTitle>
            <CardDescription>We're here to help. Reach out to us through any of the channels below.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="flex items-start gap-4 p-4 border rounded-lg bg-background">
                <Phone className="h-8 w-8 text-primary flex-shrink-0" />
                <div>
                    <h3 className="font-semibold">Phone Support</h3>
                    <div className="mt-1 space-y-1">
                        <a href="tel:+233597204494" className="text-muted-foreground hover:underline block">+233 59 720 4494</a>
                        <a href="tel:+233594085956" className="text-muted-foreground hover:underline block">+233 59 408 5956</a>
                        <a href="tel:+233554972905" className="text-muted-foreground hover:underline block">+233 55 497 2905</a>
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-4 p-4 border rounded-lg bg-background">
                <Mail className="h-8 w-8 text-primary flex-shrink-0" />
                <div>
                    <h3 className="font-semibold">Email Support</h3>
                    <a href="mailto:ericboatenglucky@gmail.com" className="text-muted-foreground hover:underline">ericboatenglucky@gmail.com</a>
                </div>
            </div>
             <div className="flex items-center gap-4 p-4 border rounded-lg bg-background">
                <MessageCircle className="h-8 w-8 text-green-500 flex-shrink-0" />
                <div className="flex-1">
                    <h3 className="font-semibold">WhatsApp</h3>
                    <p className="text-muted-foreground">Get instant help via WhatsApp chat.</p>
                </div>
                <Button asChild className="bg-green-600 hover:bg-green-700">
                    <a href="https://wa.me/233597204494" target="_blank" rel="noopener noreferrer">Chat Now</a>
                </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
