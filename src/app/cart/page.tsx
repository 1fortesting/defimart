'use client';

import { createClient } from '@/lib/supabase/client';
import { Tables } from '@/types/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Image from 'next/image';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { ShoppingCart, X } from 'lucide-react';
import { removeItem, updateItemQuantity } from './actions';
import { AuthPrompt } from '@/components/auth-prompt';
import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { Badge } from '@/components/ui/badge';

type CartItemWithProduct = Tables<'cart_items'> & {
  products: Pick<Tables<'products'>, 'name' | 'price' | 'image_urls' | 'discount_percentage' | 'discount_end_date'> | null
};

function CartItemRow({ item }: { item: CartItemWithProduct }) {
  if (!item.products) return null;

  const isDiscountActive = item.products.discount_percentage && item.products.discount_end_date && new Date(item.products.discount_end_date) > new Date();
  const finalPrice = isDiscountActive 
    ? item.products.price - (item.products.price * (item.products.discount_percentage! / 100))
    : item.products.price;


  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-4">
          <Image 
            src={item.products.image_urls?.[0] || 'https://picsum.photos/seed/1/100/100'} 
            alt={item.products.name}
            width={60}
            height={60}
            className="rounded-md object-cover"
          />
          <div className="flex flex-col">
            <span className="font-medium">{item.products.name}</span>
             {isDiscountActive && <Badge variant="destructive" className="w-fit">-{item.products.discount_percentage}%</Badge>}
          </div>
        </div>
      </TableCell>
      <TableCell>
         <div className="flex flex-col">
            <span className={cn('font-semibold', { 'line-through text-muted-foreground': isDiscountActive })}>
              GHS {item.products.price.toFixed(2)}
            </span>
            {isDiscountActive && <span className="font-bold text-primary">GHS {finalPrice.toFixed(2)}</span>}
          </div>
      </TableCell>
      <TableCell>
        <form action={updateItemQuantity} className="flex items-center gap-2">
          <input type="hidden" name="cartItemId" value={item.id} />
          <Input type="number" name="quantity" defaultValue={item.quantity} className="w-20" min="1" />
          <Button type="submit" variant="outline" size="sm">Update</Button>
        </form>
      </TableCell>
      <TableCell className="font-semibold">GHS {(finalPrice * item.quantity).toFixed(2)}</TableCell>
      <TableCell>
        <form action={removeItem}>
            <input type="hidden" name="cartItemId" value={item.id} />
            <Button type="submit" variant="ghost" size="icon">
                <X className="h-4 w-4" />
            </Button>
        </form>
      </TableCell>
    </TableRow>
  );
}

export default function CartPage() {
  const [user, setUser] = useState<User | null>(null);
  const [cartItems, setCartItems] = useState<CartItemWithProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserAndCart = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data: items, error } = await supabase
          .from('cart_items')
          .select('*, products(name, price, image_urls, discount_percentage, discount_end_date)')
          .eq('user_id', user.id)
          .order('created_at')
          .returns<CartItemWithProduct[]>();

        if (error) {
          console.error('Error fetching cart:', error);
        } else {
          setCartItems(items || []);
        }
      }
      setLoading(false);
    };

    fetchUserAndCart();
  }, []);

  if (loading) {
    return (
        <main className="flex-1 p-8 flex items-center justify-center">
          <div>Loading...</div>
        </main>
    );
  }

  if (!user) {
    return (
        <main className="flex-1 p-8 flex items-center justify-center">
          <AuthPrompt />
        </main>
    );
  }

  const subtotal = cartItems?.reduce((acc, item) => {
      if (!item.products) return acc;
      const isDiscountActive = item.products.discount_percentage && item.products.discount_end_date && new Date(item.products.discount_end_date) > new Date();
      const finalPrice = isDiscountActive
        ? item.products.price - (item.products.price * (item.products.discount_percentage! / 100))
        : item.products.price;
      return acc + finalPrice * item.quantity;
  }, 0) ?? 0;

  return (
      <main className="flex-1 p-4 md:p-8">
        <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>
        {cartItems && cartItems.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead><span className="sr-only">Remove</span></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                        {cartItems.map(item => <CartItemRow key={item.id} item={item} />)}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-semibold">GHS {subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery</span>
                    <span className="font-semibold">Free (Pickup)</span>
                  </div>
                   <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>GHS {subtotal.toFixed(2)}</span>
                  </div>
                </CardContent>
                <CardFooter>
                    <Button asChild className="w-full">
                        <Link href="/checkout">Proceed to Checkout</Link>
                    </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-16">
            <ShoppingCart className="mx-auto h-12 w-12 mb-4" />
            <p>Your cart is currently empty.</p>
            <Button asChild className="mt-4">
                <Link href="/">Continue Shopping</Link>
            </Button>
          </div>
        )}
      </main>
  );
}

    