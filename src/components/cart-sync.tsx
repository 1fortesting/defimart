'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { syncCart } from '@/app/cart/actions';

/**
 * Global background manager that bridges the gap between browser storage 
 * and the database source of truth. It migrates anonymous items to the 
 * cloud automatically after a user logs in.
 */
export function CartSync() {
    const router = useRouter();
    const isSyncingRef = useRef(false);

    useEffect(() => {
        const performSync = async () => {
            if (isSyncingRef.current) return;
            
            const cartRaw = localStorage.getItem('cart');
            if (!cartRaw) return;

            try {
                const items = JSON.parse(cartRaw);
                if (!Array.isArray(items)) return;

                // Detect items that haven't been pushed to the cloud yet
                const localItems = items.filter((i: any) => i.id?.toString().startsWith('local-'));
                if (localItems.length === 0) return;

                const supabase = createClient();
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                isSyncingRef.current = true;

                const syncItems = localItems.map((i: any) => ({
                    product_id: i.product_id || null,
                    vendor_product_id: i.vendor_product_id || null,
                    quantity: i.quantity
                }));

                const result = await syncCart(syncItems);
                
                if (result.success) {
                    // Filter out local-only items now that they are in the DB
                    const cleanCart = items.filter((i: any) => !i.id?.toString().startsWith('local-'));
                    localStorage.setItem('cart', JSON.stringify(cleanCart));
                    window.dispatchEvent(new Event('cart-updated'));
                    
                    // Signal the UI to refresh its server data
                    router.refresh();
                }
            } catch (err) {
                console.error('Cart Sync Failure:', err);
            } finally {
                isSyncingRef.current = false;
            }
        };

        // Listen for login events and initial load
        performSync();
        
        const supabase = createClient();
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
            if (event === 'SIGNED_IN') performSync();
        });

        return () => subscription.unsubscribe();
    }, [router]);

    return null;
}
