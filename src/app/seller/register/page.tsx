'use client';

import { registerSeller } from '../actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useActionState, useEffect } from 'react';
import { Loader2, Store } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function SellerRegistrationPage() {
  const { toast } = useToast();
  const [state, formAction, isPending] = useActionState(registerSeller, { success: false, error: null });

  useEffect(() => {
    if (state?.error) {
      toast({
        variant: 'destructive',
        title: 'Registration Error',
        description: state.error,
      });
    }
  }, [state, toast]);

  return (
    <div className="flex-1 p-4 md:p-8 flex items-center justify-center bg-muted/20">
      <Card className="w-full max-w-lg shadow-xl border-none rounded-[32px] overflow-hidden bg-white">
        <div className="bg-primary p-8 text-center text-white">
            <div className="bg-white/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-md">
                <Store className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-black uppercase tracking-tight italic font-montserrat">Become a Vendor</CardTitle>
            <CardDescription className="text-white/80 font-medium font-inter mt-1">
                Join the official DEFIMART marketplace protocol.
            </CardDescription>
        </div>
        <form action={formAction}>
          <CardContent className="space-y-6 p-8">
            <div className="space-y-2">
              <Label htmlFor="full_name" className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Full Legal Name</Label>
              <Input id="full_name" name="full_name" placeholder="e.g. Kwame Mensah" required className="h-12 border-2 rounded-xl bg-muted/30 focus:border-primary/50" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shop_name" className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Proposed Shop Name</Label>
              <Input id="shop_name" name="shop_name" placeholder="e.g. Mensah Tech Hub" required className="h-12 border-2 rounded-xl bg-muted/30 focus:border-primary/50 font-black italic uppercase tracking-tight" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone_number" className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Verified Phone Number</Label>
              <Input id="phone_number" name="phone_number" type="tel" placeholder="+233 XX XXX XXXX" required className="h-12 border-2 rounded-xl bg-muted/30 focus:border-primary/50 font-mono" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Business Email Contact</Label>
              <Input id="email" name="email" type="email" placeholder="vendor@campus.com" required className="h-12 border-2 rounded-xl bg-muted/30 focus:border-primary/50 font-medium" />
            </div>
          </CardContent>
          <CardFooter className="p-8 pt-0 flex flex-col gap-4">
            <Button type="submit" className="w-full h-14 text-base font-black uppercase tracking-[2px] shadow-2xl shadow-primary/20 rounded-2xl font-poppins" disabled={isPending}>
              {isPending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
              {isPending ? 'Processing Application...' : 'Submit Application'}
            </Button>
            <p className="text-[10px] text-center text-muted-foreground uppercase tracking-widest leading-relaxed">
                By submitting, you agree to the DEFIMART Vendor Protocol and quality standards.
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}