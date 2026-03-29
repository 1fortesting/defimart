'use client';

import { useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useEffect } from 'react';

export function CheckoutButton() {
  const { pending } = useFormStatus();

  useEffect(() => {
    if (pending) {
      // When submission starts, clear the localStorage cart.
      // This is optimistic. If the order fails, the cart page will re-sync from DB
      // when it's visited again.
      localStorage.removeItem('cart');
      window.dispatchEvent(new Event('cart-updated'));
    }
  }, [pending]);

  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Placing Order...
        </>
      ) : (
        'Place Order'
      )}
    </Button>
  );
}
