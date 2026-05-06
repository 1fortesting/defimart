
'use client';

import { createClient } from '@/lib/supabase/client';
import { Tables } from '@/types/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingCart, Trash2, Minus, Plus, CheckCircle, Loader2, WifiOff, ImageIcon } from 'lucide-react';
import { removeItem, updateItemQuantity } from './actions';
import { AuthPrompt } from '@/components/auth-prompt';
import { useEffect, useState, useTransition } from 'react';
import type { User } from '@supabase/supabase-js';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

type CartItemWithProduct = Tables<'cart_items'> & {
  products?: any | null;
  vendor_products?: any | null;
};

function QuantitySelector({ item, onQuantityChange, isPending }: { item: CartItemWithProduct, onQuantityChange: (itemId: string, newQuantity: number) => void, isPending: boolean }) {
    const product = item.products || item.vendor_products;
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
                disabled={isPending || (product?.quantity ?? 0) <= item.quantity}
            >
                <Plus className="h-4 w-4" />
            </Button>
        </div>
    );
}

function CartItem({ item, onQuantityChange, onRemove, isPending }: { item: CartItemWithProduct, onQuantityChange: (itemId: string, newQuantity: number) => void, onRemove: (itemId: string) => void, isPending: boolean }) {
  const product = item.products || item.vendor_products;
  if (!product) return null;

  const isDiscountActive = product.discount_percentage && product.discount_end_date && new Date(product.discount_end_date) > new Date();
  const finalPrice = isDiscountActive 
    ? product.price - (product.price * (product.discount_percentage! / 100))
    : product.price;
  
  const stockStatus = product.quantity === null ? null :
    product.quantity > 5 ? <p className="text-sm text-green-600">In Stock</p> :
    product.quantity > 0 ? <p className="text-sm text-orange-500">Few units left</p> :
    <p className="text-sm text-red-500">Out of Stock</p>;

  const hasImage = product.image_urls && product.image_urls.length > 0;

  return (
    <div className="flex flex-col sm:flex-row gap-4 py-4">
      <div className="relative h-[100px] w-[100px] bg-muted rounded-md flex items-center justify-center overflow-hidden">
        {hasImage ? (
            <Image 
                src={product.image_urls[0]} 
                alt={product.name}
                fill
                className="object-cover"
            />
        ) : (
            <ImageIcon className="h-8 w-8 text-muted-foreground/30" />
        )}
      </div>
      <div className="flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-semibold text-base">{product.name}</h3>
          <div className="mt-1">{stockStatus}</div>
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
                <span className="text-sm text-muted-foreground line-through">GHS {product.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                <Badge variant="destructive">-{product.discount_percentage}%</Badge>
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

      if (user) {
        const { data: dbItems, error } = await supabase
          .from('cart_items')
          .select('*, products(name, price, image_urls, quantity, discount_percentage, discount_end_date), vendor_products:vendor_product_id(name, price, image_urls, quantity, discount_percentage, discount_end_date)')
          .eq('user_id', user.id)
          .order('created_at');

        if (!error && dbItems) {
          setCartItems(dbItems);
        }
      }
      setLoading(false);
    };

    syncCart();
  }, []);
  
  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) {
        handleRemoveItem(itemId);
        return;
    }

    setCartItems(prev => prev.map(item => item.id === itemId ? { ...item, quantity: newQuantity } : item));

    startTransition(() => {
        const formData = new FormData();
        formData.append('cartItemId', itemId);
        formData.append('quantity', String(newQuantity));
        updateItemQuantity(formData);
    });
  };

  const handleRemoveItem = (itemId: string) => {
    setCartItems(prev => prev.filter(item => item.id !== itemId));

    startTransition(() => {
        const formData = new FormData();
        formData.append('cartItemId', itemId);
        removeItem(formData);
    });
  };

  if (loading && cartItems.length === 0) {
    return <main className="flex-1 p-8 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></main>;
  }

  if (!user && cartItems.length === 0 && !loading) {
    return <main className="flex-1 p-8 flex items-center justify-center"><AuthPrompt /></main>;
  }

  const subtotal = cartItems.reduce((acc, item) => {
      const product = item.products || item.vendor_products;
      if (!product) return acc;
      const isDiscountActive = product.discount_percentage && product.discount_end_date && new Date(product.discount_end_date) > new Date();
      const finalPrice = isDiscountActive
        ? product.price - (product.price * (product.discount_percentage! / 100))
        : product.price;
      return acc + (finalPrice * item.quantity);
  }, 0);

  return (
      <main className="flex-1 p-4 md:p-8 bg-muted/20">
        {cartItems.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2">
                <h1 className="text-2xl font-bold mb-4">Shopping Cart ({cartItems.length})</h1>
              <Card>
                <CardContent className="divide-y p-0">
                    {cartItems.map(item => <div key={item.id} className="px-6"><CartItem item={item} onQuantityChange={handleQuantityChange} onRemove={handleRemoveItem} isPending={isPending} /></div>)}
                </CardContent>
              </Card>
            </div>
            <div>
              <h2 className="text-lg font-semibold mb-4 uppercase text-muted-foreground">Summary</h2>
              <Card>
                <CardContent className="space-y-4 pt-6">
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Subtotal</span>
                    <span>GHS {subtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="bg-green-50 text-green-700 p-3 rounded-md text-sm flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span>Free campus pickup included!</span>
                  </div>
                </CardContent>
                <CardFooter>
                    <Button asChild className="w-full mt-4" size="lg" disabled={isPending}><Link href="/checkout">Checkout</Link></Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        ) : (
          <div className="text-center py-24">
            <div className="bg-muted w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"><ShoppingCart className="h-10 w-10 text-muted-foreground/60" /></div>
            <h1 className="text-2xl font-bold mb-2">Your cart is empty</h1>
            <Button asChild className="mt-4 px-8"><Link href="/">Discover products</Link></Button>
          </div>
        )}
      </main>
  );
}
