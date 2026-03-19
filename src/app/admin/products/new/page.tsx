'use client'

import { createProduct } from '../actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Link from 'next/link';
import { useFormState } from 'react-dom';

function SubmitButton() {
  return (
    <Button type="submit">Create Product</Button>
  );
}

export default function NewProductPage() {
    const initialState = { message: null, errors: {} };
    const [state, dispatch] = useFormState(createProduct, initialState);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Product</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={dispatch}>
          <div className="grid gap-6">
            <div className="grid gap-3">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" type="text" className="w-full" required />
               {state.errors?.name && <p className="text-sm text-red-500">{state.errors.name[0]}</p>}
            </div>
            <div className="grid gap-3">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" className="min-h-32" />
            </div>
             <div className="grid gap-3">
              <Label htmlFor="price">Price</Label>
              <Input id="price" name="price" type="number" step="0.01" required />
              {state.errors?.price && <p className="text-sm text-red-500">{state.errors.price[0]}</p>}
            </div>
            <div className="grid gap-3">
              <Label htmlFor="image_urls">Image URLs</Label>
               <Input id="image_urls" name="image_urls" type="text" placeholder="e.g. url1, url2" />
               <p className="text-xs text-muted-foreground">
                Provide comma-separated URLs for product images.
              </p>
            </div>
            <div className="flex justify-end gap-2">
                <Button variant="outline" asChild>
                    <Link href="/admin/products">Cancel</Link>
                </Button>
                <SubmitButton />
            </div>
             {state.message && <p className="text-sm text-red-500">{state.message}</p>}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
