'use client'

import { createProduct } from '../actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Link from 'next/link';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { useState } from 'react';
import Image from 'next/image';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>{pending ? 'Creating...' : 'Create Product'}</Button>
  );
}

export default function NewProductPage() {
    const initialState = { message: null, errors: {} };
    const [state, dispatch] = useActionState(createProduct, initialState);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        setImagePreview(URL.createObjectURL(file));
      } else {
        setImagePreview(null);
      }
    };

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
              <Label htmlFor="image">Product Image</Label>
              <Input id="image" name="image" type="file" accept="image/*" required onChange={handleImageChange} />
              {state.errors?.image && <p className="text-sm text-red-500">{state.errors.image[0]}</p>}
              {imagePreview && (
                <div className="mt-4">
                  <Image src={imagePreview} alt="Image Preview" width={200} height={200} className="rounded-md object-cover" />
                </div>
              )}
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
