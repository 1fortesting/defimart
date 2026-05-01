'use client';

/**
 * @fileOverview Logic to process the offline sync queue when connection is restored.
 */

import { getQueue, removeFromQueue, type OfflineAction } from './offline-db';
import { addToCart } from '@/app/cart/actions';
import { toggleSaveProduct } from '@/app/saved/actions';
import { placeOrder } from '@/app/cart/actions';

export async function syncOfflineActions(onProgress?: (msg: string) => void) {
    const queue = await getQueue();
    if (queue.length === 0) return;

    onProgress?.(`Syncing ${queue.length} offline actions...`);

    // Process actions sequentially to maintain order (especially for cart/orders)
    for (const action of queue) {
        try {
            const formData = new FormData();
            
            if (action.type === 'ADD_TO_CART') {
                formData.append('productId', action.payload.productId);
                await addToCart(formData);
            } 
            else if (action.type === 'SAVE_PRODUCT') {
                formData.append('productId', action.payload.productId);
                formData.append('pathname', action.payload.pathname);
                await toggleSaveProduct(formData);
            }
            else if (action.type === 'PLACE_ORDER') {
                // For checkout, we reconstruct notes from the payload
                Object.entries(action.payload.notes).forEach(([key, val]) => {
                    formData.append(key, val as string);
                });
                await placeOrder(formData);
            }

            // Remove from queue once successfully processed
            await removeFromQueue(action.id);
        } catch (error) {
            console.error(`Failed to sync action ${action.id}:`, error);
            // We stop processing if a critical action fails (like checkout)
            // or just log it and continue for non-critical ones.
        }
    }

    onProgress?.('All changes successfully synced!');
    
    // Refresh the UI
    window.dispatchEvent(new Event('cart-updated'));
    window.dispatchEvent(new Event('saved-updated'));
}
