import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, Phone, MessageCircle } from 'lucide-react';
import Link from 'next/link';

export default function ContactPage() {
  const whatsappMessage = encodeURIComponent("i am messaging to request support on Deifmart plartform");
  const customerServiceNumber = "+233247067327";
  const customerServiceWaNumber = "233247067327";

  return (
    <main className="flex-1 p-4 md:p-8 bg-muted/20">
      <div className="container mx-auto max-w-3xl">
        <Card className="overflow-hidden shadow-lg border-none">
           <div className="bg-gradient-to-r from-primary via-yellow-400 to-orange-500 p-8 text-primary-foreground">
             <CardHeader className="text-center p-0">
                <CardTitle className="text-4xl font-bold">Get in Touch</CardTitle>
                <CardDescription className="text-primary-foreground/90 text-lg mt-2">
                    We're here to help. Reach out to us through any of the channels below.
                </CardDescription>
            </CardHeader>
           </div>
          <CardContent className="space-y-6 p-6 md:p-8">

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl"><Phone className="h-5 w-5 text-primary" /> Phone Support</CardTitle>
                     <CardDescription>Our team is available to take your calls.</CardDescription>
                </CardHeader>
                <CardContent className="grid sm:grid-cols-2 gap-4">
                     <a href={`tel:${customerServiceNumber}`} className="group p-4 flex flex-col items-center text-center rounded-lg border hover:bg-accent transition-colors">
                        <p className="font-semibold text-base">Bill Math</p>
                        <p className="text-sm text-muted-foreground">Customer Service</p>
                        <p className="font-mono mt-1 text-primary group-hover:underline">+233 24 706 7327</p>
                    </a>
                     <a href="tel:+233597204494" className="group p-4 flex flex-col items-center text-center rounded-lg border hover:bg-accent transition-colors">
                        <p className="font-semibold text-base">Sales Lead</p>
                         <p className="text-sm text-muted-foreground">General Inquiries</p>
                        <p className="font-mono mt-1 text-primary group-hover:underline">+233 59 720 4494</p>
                    </a>
                     <a href="tel:+233535548945" className="group p-4 flex flex-col items-center text-center rounded-lg border hover:bg-accent transition-colors">
                        <p className="font-semibold text-base">Agbeke Bridget Enam</p>
                         <p className="text-sm text-muted-foreground">Senior Sales</p>
                        <p className="font-mono mt-1 text-primary group-hover:underline">+233 53 554 8945</p>
                    </a>
                     <a href="tel:+233598560612" className="group p-4 flex flex-col items-center text-center rounded-lg border hover:bg-accent transition-colors">
                        <p className="font-semibold text-base">Anthony</p>
                         <p className="text-sm text-muted-foreground">Assistant Sales</p>
                        <p className="font-mono mt-1 text-primary group-hover:underline">+233 59 856 0612</p>
                    </a>
                </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
                <Card className="flex flex-col justify-between">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><MessageCircle className="h-5 w-5 text-green-500" /> WhatsApp</CardTitle>
                        <CardDescription>Get instant help via WhatsApp chat with our customer service.</CardDescription>
                    </CardHeader>
                     <CardContent>
                        <Button asChild className="w-full bg-green-600 hover:bg-green-700">
                            <a href={`https://wa.me/${customerServiceWaNumber}?text=${whatsappMessage}`} target="_blank" rel="noopener noreferrer">Chat with Bill Math</a>
                        </Button>
                    </CardContent>
                </Card>

                 <Card className="flex flex-col justify-between">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Mail className="h-5 w-5 text-primary" /> Email Support</CardTitle>
                        <CardDescription>Prefer to write? Send us an email for any inquiry.</CardDescription>
                    </CardHeader>
                     <CardContent>
                        <Button asChild variant="outline" className="w-full">
                            <a href="mailto:ericboatenglucky@gmail.com">Send an Email</a>
                        </Button>
                    </CardContent>
                </Card>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
