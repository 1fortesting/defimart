'use client';

import { createClient } from '@/lib/supabase/client';
import { Tables } from '@/types/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingCart, Trash2, Minus, Plus, CheckCircle, Loader2 } from 'lucide-react';
import { removeItem, updateItemQuantity } from './actions';
import { AuthPrompt } from '@/components/auth-prompt';
import { useEffect, useState, useTransition } from 'react';
import type { User } from '@supabase/supabase-js';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

type CartItemWithProduct = Tables<'cart_items'> & {
  products: Pick<Tables<'products'>, 'name' | 'price' | 'image_urls' | 'quantity' | 'discount_percentage' | 'discount_end_date'> | null
};

function QuantitySelector({ item, onQuantityChange, isPending }: { item: CartItemWithProduct, onQuantityChange: (itemId: string, newQuantity: number) => void, isPending: boolean }) {
    return (
        <div className="flex items-center gap-2 border rounded-full p-1">
            <Button
                onClick={() => onQuantityChange(item.id, item.quantity - 1)}
                type="button"
                size="icon"
                variant="ghost"
                className="h-6 w-6 rounded-full"
                disabled={isPending || item.quantity <= 1}
            >
                <Minus className="h-4 w-4" />
            </Button>
            <span className="w-8 text-center font-semibold">{item.quantity}</span>
            <Button
                onClick={() => onQuantityChange(item.id, item.quantity + 1)}
                type="button"
                size="icon"
                variant="ghost"
                className="h-6 w-6 rounded-full"
                disabled={isPending || (item.products?.quantity ?? 0) <= item.quantity}
            >
                <Plus className="h-4 w-4" />
            </Button>
        </div>
    );
}

function CartItem({ item, onQuantityChange, onRemove, isPending }: { item: CartItemWithProduct, onQuantityChange: (itemId: string, newQuantity: number) => void, onRemove: (itemId: string) => void, isPending: boolean }) {
  if (!item.products) return null;

  const isDiscountActive = item.products.discount_percentage && item.products.discount_end_date && new Date(item.products.discount_end_date) > new Date();
  const finalPrice = isDiscountActive 
    ? item.products.price - (item.products.price * (item.products.discount_percentage! / 100))
    : item.products.price;
  
  const stockStatus = item.products.quantity === null ? null :
    item.products.quantity > 5 ? <p className="text-sm text-green-600">In Stock</p> :
    item.products.quantity > 0 ? <p className="text-sm text-orange-500">Few units left</p> :
    <p className="text-sm text-red-500">Out of Stock</p>;


  return (
    <div className="flex flex-col sm:flex-row gap-4 py-4">
      <Image 
        src={item.products.image_urls?.[0] || 'https://picsum.photos/seed/1/100/100'} 
        alt={item.products.name}
        width={100}
        height={100}
        className="rounded-md object-cover aspect-square"
      />
      <div className="flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-semibold text-base">{item.products.name}</h3>
          {stockStatus}
        </div>
        <Button onClick={() => onRemove(item.id)} type="button" variant="ghost" size="sm" className="text-muted-foreground hover:text-red-500 hover:bg-transparent p-0 h-auto mt-2 self-start" disabled={isPending}>
            <Trash2 className="mr-2 h-4 w-4" />
            Remove
        </Button>
      </div>
      <div className="flex flex-col items-start sm:items-end justify-between text-right">
        <div className="text-lg font-bold">
            GHS {finalPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        {isDiscountActive && (
            <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground line-through">GHS {item.products.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                <Badge variant="destructive">-{item.products.discount_percentage}%</Badge>
            </div>
        )}
        <div className="mt-2">
          <QuantitySelector item={item} onQuantityChange={onQuantityChange} isPending={isPending} />
        </div>
      </div>
    </div>
  );
}

export default function CartPage() {
  const [user, setUser] = useState<User | null>(null);
  const [cartItems, setCartItems] = useState<CartItemWithProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const syncCart = async () => {
      setLoading(true);
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      let finalCart: CartItemWithProduct[] = [];

      if (user) {
        // Logged-in user: DB is the source of truth
        const { data: dbItems, error } = await supabase
          .from('cart_items')
          .select('*, products(name, price, image_urls, quantity, discount_percentage, discount_end_date)')
          .eq('user_id', user.id)
          .order('created_at')
          .returns<CartItemWithProduct[]>();

        if (error) {
          console.error('Error fetching cart:', error);
        } else {
          finalCart = dbItems || [];
          // Overwrite local storage to sync it with the DB state
          localStorage.setItem('cart', JSON.stringify(finalCart));
        }
      } else {
        // Logged-out user: local storage is the source of truth
        try {
            finalCart = JSON.parse(localStorage.getItem('cart') || '[]') as CartItemWithProduct[];
        } catch (e) {
            console.error('Failed to parse cart from local storage', e);
            finalCart = [];
        }
      }
      
      setCartItems(finalCart);
      setLoading(false);
      // Dispatch event to ensure header count is correct after sync
      window.dispatchEvent(new Event('cart-updated'));
    };

    syncCart();
  }, []);
  
  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) {
        handleRemoveItem(itemId);
        return;
    }

    const newCartItems = cartItems.map(item =>
        item.id === itemId ? { ...item, quantity: newQuantity } : item
    );
    setCartItems(newCartItems); // Instant UI update
    
    // Update local storage
    localStorage.setItem('cart', JSON.stringify(newCartItems));
    // Notify header
    window.dispatchEvent(new Event('cart-updated'));

    // Sync with DB if user is logged in and the item is from the DB
    if(user && !itemId.startsWith('local-')) {
        startTransition(() => {
            const formData = new FormData();
            formData.append('cartItemId', itemId);
            formData.append('quantity', String(newQuantity));
            updateItemQuantity(formData);
        });
    }
  };

  const handleRemoveItem = (itemId: string) => {
    const newCartItems = cartItems.filter(item => item.id !== itemId);
    setCartItems(newCartItems); // Instant UI update

    // Update local storage
    localStorage.setItem('cart', JSON.stringify(newCartItems));
    // Notify header
    window.dispatchEvent(new Event('cart-updated'));

    // Sync with DB if user is logged in and the item is from the DB
    if(user && !itemId.startsWith('local-')) {
        startTransition(() => {
            const formData = new FormData();
            formData.append('cartItemId', itemId);
            removeItem(formData);
        });
    }
  };


  if (loading) {
    return (
        <main className="flex-1 p-8 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
    );
  }

  if (!user && cartItems.length === 0) {
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

  const totalItems = cartItems?.reduce((acc, item) => acc + item.quantity, 0) ?? 0;

  return (
      <main className="flex-1 p-4 md:p-8">
        {cartItems && cartItems.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2">
                <h1 className="text-2xl font-bold mb-4">Cart ({totalItems})</h1>
              <Card>
                <CardContent className="divide-y p-0">
                    {cartItems.map(item => <div key={item.id} className="px-6">
                        <CartItem 
                            item={item} 
                            onQuantityChange={handleQuantityChange} 
                            onRemove={handleRemoveItem}
                            isPending={isPending}
                        />
                    </div>)}
                </CardContent>
              </Card>
            </div>
            <div>
              <h2 className="text-lg font-semibold mb-4 uppercase text-muted-foreground">Cart Summary</h2>
              <Card>
                <CardContent className="space-y-4 pt-6">
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Subtotal</span>
                    <span>GHS {subtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="bg-green-50 text-green-700 p-3 rounded-md text-sm flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span>Free campus pickup on all your orders!</span>
                  </div>
                </CardContent>
                <CardFooter>
                    <Button asChild className="w-full mt-4" size="lg" disabled={isPending}>
                        <Link href="/checkout">Checkout (GHS {subtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})</Link>
                    </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-16">
            <ShoppingCart className="mx-auto h-12 w-12 mb-4" />
             <h1 className="text-2xl font-bold mb-2">Your cart is empty!</h1>
            <p className="mb-4">Browse our categories and discover our best deals!</p>
            <Button asChild className="mt-4">
                <Link href="/">Start Shopping</Link>
            </Button>
          </div>
        )}
      </main>
  );
}
