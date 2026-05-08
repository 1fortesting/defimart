'use client';

import { createClient } from '@/lib/supabase/client';
import { Tables } from '@/types/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingCart, Trash2, Minus, Plus, CheckCircle, Loader2, ImageIcon, Truck } from 'lucide-react';
import { removeItem, updateItemQuantity, addToCart } from './actions';
import { AuthPrompt } from '@/components/auth-prompt';
import { useEffect, useState, useTransition, useMemo } from 'react';
import type { User } from '@supabase/supabase-js';
import { Badge } from '@/components/ui/badge';

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
                disabled={isPending || (product?.quantity !== null && product?.quantity <= item.quantity)}
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
    product.quantity > 5 ? <p className="text-sm text-green-600 font-medium">In Stock</p> :
    product.quantity > 0 ? <p className="text-sm text-orange-500 font-medium">Few units left</p> :
    <p className="text-sm text-red-500 font-medium">Out of Stock</p>;

  const hasImage = product.image_urls && product.image_urls.length > 0;

  return (
    <div className="flex flex-col sm:flex-row gap-4 py-6 px-4 hover:bg-muted/5 transition-colors">
      <div className="relative h-[100px] w-[100px] bg-muted rounded-xl flex items-center justify-center overflow-hidden border">
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
          <h3 className="font-bold text-base md:text-lg">{product.name}</h3>
          <div className="mt-1 flex items-center gap-3">
            {stockStatus}
            {product.offers_delivery && (
                <Badge variant="outline" className="text-[9px] font-black uppercase tracking-tighter bg-emerald-50 text-emerald-600 border-emerald-100 flex gap-1 h-5">
                    <Truck className="h-3 w-3" /> Delivery Available
                </Badge>
            )}
          </div>
        </div>
        <Button onClick={() => onRemove(item.id)} type="button" variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 p-2 h-auto mt-2 self-start rounded-lg transition-all" disabled={isPending}>
            <Trash2 className="mr-2 h-4 w-4" />
            Remove
        </Button>
      </div>
      <div className="flex flex-col items-start sm:items-end justify-between text-right gap-4">
        <div className="space-y-1">
            <div className="text-xl font-black">
                GHS {finalPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            {isDiscountActive && (
                <div className="flex items-center justify-end gap-2">
                    <span className="text-xs text-muted-foreground line-through">GHS {product.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    <Badge variant="destructive" className="h-5 px-1.5 text-[10px] font-black">-{product.discount_percentage}%</Badge>
                </div>
            )}
        </div>
        <QuantitySelector item={item} onQuantityChange={onQuantityChange} isPending={isPending} />
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
    const initCart = async () => {
      setLoading(true);
      
      const localCart = JSON.parse(localStorage.getItem('cart') || '[]');
      setCartItems(localCart);
      
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        // --- SYNC LOCAL TO DB ---
        // If there are items in local storage that aren't in DB, push them.
        if (localCart.length > 0) {
            for (const item of localCart) {
                if (item.id && item.id.startsWith('local-')) {
                    const fd = new FormData();
                    const prodId = item.product_id || item.vendor_product_id;
                    if (prodId) {
                        fd.append('productId', prodId);
                        if (item.vendor_product_id) fd.append('isVendor', 'true');
                        // Use multiple calls for each quantity or update action to handle this properly
                        // For simplicity in sync, we just add once, the DB sync below will get the full state
                        await addToCart(fd);
                    }
                }
            }
        }

        const { data: dbItems, error } = await supabase
          .from('cart_items')
          .select(`
            *, 
            products(name, price, image_urls, quantity, discount_percentage, discount_end_date, offers_delivery, delivery_price_type, delivery_price), 
            vendor_products:vendor_product_id(name, price, image_urls, quantity, discount_percentage, discount_end_date, offers_delivery, delivery_price_type, delivery_price)
          `)
          .eq('user_id', user.id)
          .order('created_at');

        if (!error && dbItems) {
          setCartItems(dbItems);
          localStorage.setItem('cart', JSON.stringify(dbItems));
          window.dispatchEvent(new Event('cart-updated'));
        }
      }
      setLoading(false);
    };

    initCart();
  }, []);
  
  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) {
        handleRemoveItem(itemId);
        return;
    }

    const updatedCart = cartItems.map(item => item.id === itemId ? { ...item, quantity: newQuantity } : item);
    setCartItems(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
    window.dispatchEvent(new Event('cart-updated'));

    startTransition(async () => {
        const formData = new FormData();
        formData.append('cartItemId', itemId);
        formData.append('quantity', String(newQuantity));
        await updateItemQuantity(formData);
    });
  };

  const handleRemoveItem = (itemId: string) => {
    const updatedCart = cartItems.filter(item => item.id !== itemId);
    setCartItems(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
    window.dispatchEvent(new Event('cart-updated'));

    startTransition(async () => {
        const formData = new FormData();
        formData.append('cartItemId', itemId);
        await removeItem(formData);
    });
  };

  const subtotal = useMemo(() => {
    return cartItems.reduce((acc, item) => {
        const product = item.products || item.vendor_products;
        if (!product) return acc;
        const isDiscountActive = product.discount_percentage && product.discount_end_date && new Date(product.discount_end_date) > new Date();
        const finalPrice = isDiscountActive
          ? product.price - (product.price * (product.discount_percentage! / 100))
          : product.price;
        return acc + (finalPrice * (item.quantity || 1));
    }, 0);
  }, [cartItems]);

  const hasDeliveryOption = useMemo(() => {
    return cartItems.some(item => (item.products || item.vendor_products)?.offers_delivery);
  }, [cartItems]);

  if (loading && cartItems.length === 0) {
    return <main className="flex-1 p-8 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></main>;
  }

  if (!user && cartItems.length === 0 && !loading) {
    return <main className="flex-1 p-8 flex items-center justify-center"><AuthPrompt /></main>;
  }

  return (
      <main className="flex-1 p-4 md:p-8 bg-muted/5 min-h-screen">
        {cartItems.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start max-w-7xl mx-auto">
            <div className="lg:col-span-2 space-y-4">
                <h1 className="text-3xl font-black tracking-tight italic uppercase">BAG ({cartItems.length})</h1>
                <Card className="border-none shadow-xl bg-background rounded-3xl overflow-hidden">
                    <div className="divide-y">
                        {cartItems.map(item => <CartItem key={item.id} item={item} onQuantityChange={handleQuantityChange} onRemove={handleRemoveItem} isPending={isPending} />)}
                    </div>
                </Card>
            </div>
            <div className="space-y-4">
              <h2 className="text-xs font-black uppercase tracking-[4px] text-muted-foreground ml-2">Checkout Details</h2>
              <Card className="border-none shadow-xl bg-background rounded-3xl p-6 md:p-8 space-y-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground font-medium">Subtotal</span>
                        <span className="font-bold">GHS {subtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between items-center text-emerald-600 font-bold">
                        <span>Logistics</span>
                        <span className="uppercase text-[10px] tracking-widest bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">
                            {hasDeliveryOption ? 'Delivery Available' : 'Free Pickup'}
                        </span>
                    </div>
                  </div>
                  
                  <div className="h-px bg-muted/50" />
                  
                  <div className="flex justify-between items-end">
                    <span className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Estimate</span>
                    <span className="text-3xl font-black text-primary leading-none">GHS {subtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>

                  <div className="bg-primary/5 text-primary p-4 rounded-2xl text-xs font-medium flex items-start gap-3 border border-primary/10">
                      <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <p>Final delivery fees (if any) are calculated at checkout and paid in person.</p>
                  </div>

                  <Button asChild className="w-full h-14 text-base md:text-lg font-black uppercase tracking-widest shadow-2xl shadow-primary/30 rounded-2xl" size="lg">
                      <Link href="/checkout">Checkout Now</Link>
                  </Button>
              </Card>
            </div>
          </div>
        ) : (
          <div className="text-center py-32 flex flex-col items-center">
            <div className="bg-background w-24 h-24 rounded-full flex items-center justify-center shadow-2xl mb-8 relative">
                <div className="absolute inset-0 bg-primary/10 rounded-full animate-ping opacity-20" />
                <ShoppingCart className="h-12 w-12 text-primary relative z-10" />
            </div>
            <h1 className="text-2xl md:text-3xl font-black italic uppercase tracking-tight mb-2">The bag is empty</h1>
            <p className="text-muted-foreground font-medium mb-10">Start discovery to find your next campus essential.</p>
            <Button asChild size="lg" className="h-14 px-10 font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-primary/20">
                <Link href="/">Discover Now</Link>
            </Button>
          </div>
        )}
      </main>
  );
}
