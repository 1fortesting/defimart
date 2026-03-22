'use client'

import { createProduct } from '../actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Link from 'next/link';
import React, { useActionState, useState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import Image from 'next/image';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const categories = [
    "Electronics & Gadgets",
    "Fashion & Apparel",
    "Home & Kitchen",
    "Health & Beauty",
    "Sports & Fitness",
    "Books & Stationery",
    "Groceries & Food",
    "Other"
];

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
        {pending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating...</> : 'Create Product'}
    </Button>
  );
}

export default function NewProductPage() {
    const initialState = { message: null, errors: {}, success: false };
    const [state, dispatch] = useActionState(createProduct, initialState);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const router = useRouter();
    const { toast } = useToast();

    useEffect(() => {
      if (state.success) {
        toast({ title: 'Success', description: 'Product created successfully.' });
        router.push('/admin/procurement/products');
      } else if (state.message) {
        toast({ variant: 'destructive', title: 'Error', description: state.message });
      }
    }, [state, router, toast]);

    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        setImagePreview(URL.createObjectURL(file));
      } else {
        setImagePreview(null);
      }
    };

  return (
    <form action={dispatch} className="grid flex-1 items-start gap-4 sm:py-0 md:gap-8">
      <div className="mx-auto grid max-w-5xl flex-1 auto-rows-max gap-4">
        <div className="flex items-center gap-4">
           <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
            Add New Product
          </h1>
          <div className="hidden items-center gap-2 md:ml-auto md:flex">
             <Button variant="outline" asChild>
                <Link href="/admin/procurement/products">Cancel</Link>
            </Button>
            <SubmitButton />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-[1fr_250px] lg:grid-cols-3 lg:gap-8">
            <div className="grid auto-rows-max items-start gap-4 lg:col-span-2 lg:gap-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Product Details</CardTitle>
                        <CardDescription>
                            Basic information about the product.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-6">
                        <div className="grid gap-3">
                            <Label htmlFor="name">Name</Label>
                            <Input id="name" name="name" type="text" className="w-full" required />
                            {state.errors?.name && <p className="text-sm text-red-500">{state.errors.name[0]}</p>}
                        </div>
                        <div className="grid gap-3">
                            <Label htmlFor="brand">Brand</Label>
                            <Input id="brand" name="brand" type="text" className="w-full" placeholder="e.g. Apple, Samsung" />
                            {state.errors?.brand && <p className="text-sm text-red-500">{state.errors.brand[0]}</p>}
                        </div>
                        <div className="grid gap-3">
                            <Label htmlFor="description">Description</Label>
                            <Textarea id="description" name="description" className="min-h-32" />
                        </div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>Pricing & Stock</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-6 md:grid-cols-2">
                        <div className="grid gap-3">
                            <Label htmlFor="price">Price (GHS)</Label>
                            <Input id="price" name="price" type="number" step="0.01" required />
                            {state.errors?.price && <p className="text-sm text-red-500">{state.errors.price[0]}</p>}
                        </div>
                        <div className="grid gap-3">
                            <Label htmlFor="quantity">Quantity</Label>
                            <Input id="quantity" name="quantity" type="number" min="0" required />
                            {state.errors?.quantity && <p className="text-sm text-red-500">{state.errors.quantity[0]}</p>}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Discount</CardTitle>
                         <CardDescription>
                            Apply a time-limited discount to this product.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-6 md:grid-cols-2">
                        <div className="grid gap-3">
                            <Label htmlFor="discount_percentage">Discount (%)</Label>
                            <Input id="discount_percentage" name="discount_percentage" type="number" step="0.1" min="0" max="100" />
                            {state.errors?.discount_percentage && <p className="text-sm text-red-500">{state.errors.discount_percentage[0]}</p>}
                        </div>
                        <div className="grid gap-3">
                            <Label htmlFor="discount_end_date">Discount End Date</Label>
                            <Input id="discount_end_date" name="discount_end_date" type="datetime-local" />
                             {state.errors?.discount_end_date && <p className="text-sm text-red-500">{state.errors.discount_end_date[0]}</p>}
                        </div>
                    </CardContent>
                </Card>
            </div>
             <div className="grid auto-rows-max items-start gap-4 lg:gap-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Category</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Select name="category">
                            <SelectTrigger>
                                <SelectValue placeholder="Select Category" />
                            </SelectTrigger>
                            <SelectContent>
                                {categories.map(category => (
                                    <SelectItem key={category} value={category}>{category}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {state.errors?.category && <p className="text-sm text-red-500">{state.errors.category[0]}</p>}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Product Image</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                        <Input id="image" name="image" type="file" accept="image/*" required onChange={handleImageChange} className="w-full"/>
                        {state.errors?.image && <p className="text-sm text-red-500">{state.errors.image[0]}</p>}
                        {imagePreview && (
                            <div className="mt-2">
                            <Image src={imagePreview} alt="Image Preview" width={200} height={200} className="w-full aspect-square rounded-md object-cover" />
                            </div>
                        )}
                    </CardContent>
                </Card>
             </div>
        </div>
         <div className="flex items-center justify-center gap-2 md:hidden">
            <Button variant="outline" asChild>
                <Link href="/admin/procurement/products">Cancel</Link>
            </Button>
            <SubmitButton />
        </div>
      </div>
    </form>
  );
}
