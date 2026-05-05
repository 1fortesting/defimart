'use client';

import { registerSeller } from '../actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { Loader2, Store } from 'lucide-react';

export default function SellerRegistrationPage() {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    setLoading(true);
    // Let the form action handle the submission
  };

  return (
    <div className="flex-1 p-4 md:p-8 flex items-center justify-center bg-muted/20">
      <Card className="w-full max-w-lg shadow-xl">
        <CardHeader className="text-center">
            <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Store className="h-8 w-8 text-primary" />
            </div>
          <CardTitle className="text-2xl font-bold">Become a Vendor</CardTitle>
          <CardDescription>
            Fill out the details below to start selling on DEFIMART.
          </CardDescription>
        </CardHeader>
        <form action={registerSeller} onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input id="full_name" name="full_name" placeholder="John Doe" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shop_name">Shop Name</Label>
              <Input id="shop_name" name="shop_name" placeholder="John's Electronics" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone_number">Phone Number</Label>
              <Input id="phone_number" name="phone_number" type="tel" placeholder="+233 123 456 789" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Business Email</Label>
              <Input id="email" name="email" type="email" placeholder="shop@example.com" required />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Submit Application
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
