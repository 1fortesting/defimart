'use client';

import { useEffect, useState, useTransition, useMemo } from 'react';
import { Tables } from '@/types/supabase';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingCart, Trash2, Minus, Plus, CheckCircle, Loader2, ImageIcon, Truck } from 'lucide-react';
import { removeItem, updateItemQuantity } from './actions';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { User } from '@supabase/supabase-js';

type CartItemWithProduct = Tables<'cart_items'> & {
  products?: any | null;
  vendor_products?: any | null;
};

function QuantitySelector({ item, onQuantityChange, isPending }: { item: CartItemWithProduct, onQuantityChange: (itemId: string, newQuantity: number) => void, isPending: boolean }) {
    const product = item.products || item.vendor_products;
    return (
        <div className="flex items-center gap-2 border rounded-full p-1 bg-background">
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
            <span className="w-8 text-center font-bold text-xs">{item.quantity}</span>
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

function CartItemUI({ item, onQuantityChange, onRemove, isPending }: { item: CartItemWithProduct, onQuantityChange: (itemId: string, newQuantity: number) => void, onRemove: (itemId: string) => void, isPending: boolean }) {
  const product = item.products || item.vendor_products;
  
  // Robust fallback: if join data is missing but IDs exist, item is invalid.
  if (!product) return null;

  const isDiscountActive = product.discount_percentage && product.discount_end_date && new Date(product.discount_end_date) > new Date();
  const finalPrice = isDiscountActive 
    ? product.price - (product.price * (product.discount_percentage! / 100))
    : product.price;

  const hasImage = product.image_urls && product.image_urls.length > 0;

  return (
    <div className={cn("flex flex-col sm:flex-row gap-4 py-6 px-4 hover:bg-muted/5 transition-colors", isPending && "opacity-50 pointer-events-none")}>
      <div className="relative h-[100px] w-[100px] bg-muted rounded-2xl flex items-center justify-center overflow-hidden border shadow-inner">
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
          <h3 className="font-bold text-base md:text-lg leading-tight">{product.name}</h3>
          <div className="mt-1.5 flex items-center gap-2">
            {product.offers_delivery && (
                <Badge variant="outline" className="text-[9px] font-black uppercase tracking-tighter bg-emerald-50 text-emerald-600 border-emerald-100 flex gap-1 h-5">
                    <Truck className="h-3 w-3" /> Delivery Available
                </Badge>
            )}
          </div>
        </div>
        <Button onClick={() => onRemove(item.id)} type="button" variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 p-2 h-auto mt-2 self-start rounded-xl transition-all" disabled={isPending}>
            <Trash2 className="mr-2 h-4 w-4" />
            Remove
        </Button>
      </div>
      <div className="flex flex-col items-start sm:items-end justify-between text-right gap-4">
        <div className="space-y-1">
            <div className="text-xl font-black">
                GHS {(finalPrice * item.quantity).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            {isDiscountActive && (
                <div className="flex items-center justify-end gap-2">
                    <span className="text-[10px] text-muted-foreground line-through">GHS {(product.price * item.quantity).toLocaleString()}</span>
                    <Badge variant="destructive" className="h-4 px-1 text-[8px] font-black">-{product.discount_percentage}%</Badge>
                </div>
            )}
        </div>
        <QuantitySelector item={item} onQuantityChange={onQuantityChange} isPending={isPending} />
      </div>
    </div>
  );
}

export function CartClientPage({ user, initialItems }: { user: User | null, initialItems: CartItemWithProduct[] }) {
  const [items, setItems] = useState<CartItemWithProduct[]>(initialItems);
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState(!user);

  useEffect(() => {
    if (!user) {
        const localCart = localStorage.getItem('cart');
        if (localCart) {
            try {
                setItems(JSON.parse(localCart));
            } catch (e) {}
        }
        setLoading(false);
    } else {
        // Only use DB items once authenticated, but filter out ones that didn't join correctly
        const validItems = initialItems.filter(i => i.products || i.vendor_products);
        setItems(validItems);
        // Sync local cache for badges
        localStorage.setItem('cart', JSON.stringify(validItems));
        window.dispatchEvent(new Event('cart-updated'));
    }
  }, [user, initialItems]);

  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) {
        handleRemoveItem(itemId);
        return;
    }

    const updated = items.map(item => item.id === itemId ? { ...item, quantity: newQuantity } : item);
    setItems(updated);
    localStorage.setItem('cart', JSON.stringify(updated));
    window.dispatchEvent(new Event('cart-updated'));

    if (user && !itemId.startsWith('local-')) {
        startTransition(async () => {
            const formData = new FormData();
            formData.append('cartItemId', itemId);
            formData.append('quantity', String(newQuantity));
            await updateItemQuantity(formData);
        });
    }
  };

  const handleRemoveItem = (itemId: string) => {
    const updated = items.filter(item => item.id !== itemId);
    setItems(updated);
    localStorage.setItem('cart', JSON.stringify(updated));
    window.dispatchEvent(new Event('cart-updated'));

    if (user && !itemId.startsWith('local-')) {
        startTransition(async () => {
            const formData = new FormData();
            formData.append('cartItemId', itemId);
            await removeItem(formData);
        });
    }
  };

  const subtotal = useMemo(() => {
    return items.reduce((acc, item) => {
        const product = item.products || item.vendor_products;
        if (!product) return acc;
        const isDiscountActive = product.discount_percentage && product.discount_end_date && new Date(product.discount_end_date) > new Date();
        const finalPrice = isDiscountActive
          ? product.price - (product.price * (product.discount_percentage! / 100))
          : product.price;
        return acc + (finalPrice * (item.quantity || 1));
    }, 0);
  }, [items]);

  if (loading) {
      return (
          <div className="max-w-7xl mx-auto flex items-center justify-center py-32">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
      );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {items.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2 space-y-4">
              <h1 className="text-3xl font-black tracking-tight italic uppercase">YOUR BAG ({items.length})</h1>
              <Card className="border-none shadow-xl bg-background rounded-[32px] overflow-hidden">
                  <div className="divide-y divide-muted/30">
                      {items.map(item => <CartItemUI key={item.id} item={item} onQuantityChange={handleQuantityChange} onRemove={handleRemoveItem} isPending={isPending} />)}
                  </div>
              </Card>
          </div>
          <div className="space-y-4">
            <h2 className="text-xs font-black uppercase tracking-[4px] text-muted-foreground ml-2">Acquisition Summary</h2>
            <Card className="border-none shadow-2xl bg-background rounded-[40px] p-6 md:p-8 space-y-6 sticky top-8">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                      <span className="text-muted-foreground font-bold text-xs uppercase tracking-widest">Subtotal</span>
                      <span className="font-black text-lg">GHS {subtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between items-center text-emerald-600 font-bold">
                      <span className="text-xs uppercase tracking-widest opacity-70">Protocol</span>
                      <span className="uppercase text-[10px] tracking-widest bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 shadow-sm">
                          Free Admin Pickup
                      </span>
                  </div>
                </div>
                
                <div className="h-px bg-muted/20 w-full" />
                
                <div className="flex justify-between items-end">
                  <span className="text-[10px] font-black uppercase tracking-[3px] text-muted-foreground mb-1">Total Valuation</span>
                  <span className="text-4xl font-black text-primary tracking-tighter leading-none">GHS {subtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>

                <div className="bg-primary/5 text-primary p-5 rounded-3xl text-[10px] font-bold uppercase tracking-wider flex items-start gap-4 border border-primary/10">
                    <CheckCircle className="h-5 w-5 mt-[-2px] flex-shrink-0" />
                    <p className="leading-relaxed">All campus transactions are completed in person via cash or mobile money upon pickup.</p>
                </div>

                <Button asChild className="w-full h-16 text-lg font-black uppercase tracking-widest shadow-2xl shadow-primary/30 rounded-3xl" size="lg">
                    <Link href="/checkout">Finalize Checkout</Link>
                </Button>
            </Card>
          </div>
        </div>
      ) : (
        <div className="text-center py-32 flex flex-col items-center">
          <div className="bg-background w-24 h-24 rounded-full flex items-center justify-center shadow-2xl mb-8 relative border-2 border-primary/10">
              <div className="absolute inset-0 bg-primary/10 rounded-full animate-ping opacity-20" />
              <ShoppingCart className="h-10 w-10 text-primary relative z-10" />
          </div>
          <h1 className="text-2xl md:text-3xl font-black italic uppercase tracking-tight mb-2">The bag is empty</h1>
          <p className="text-muted-foreground font-medium mb-10 max-w-xs mx-auto">Start discovery to find high-performance campus essentials from our marketplace.</p>
          <Button asChild size="lg" className="h-14 px-10 font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-primary/20">
              <Link href="/">Discover Now</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
