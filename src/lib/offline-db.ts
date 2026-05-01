'use client';

/**
 * @fileOverview A simple IndexedDB wrapper for offline action queuing.
 */

const DB_NAME = 'DefimartOfflineDB';
const STORE_NAME = 'sync_queue';
const DB_VERSION = 1;

export interface OfflineAction {
    id: string;
    type: 'ADD_TO_CART' | 'SAVE_PRODUCT' | 'PLACE_ORDER';
    payload: any;
    timestamp: number;
}

export async function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

export async function addToQueue(action: Omit<OfflineAction, 'id' | 'timestamp'>) {
    const db = await openDB();
    const fullAction: OfflineAction = {
        ...action,
        id: crypto.randomUUID(),
        timestamp: Date.now()
    };

    return new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.add(fullAction);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

export async function getQueue(): Promise<OfflineAction[]> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

export async function removeFromQueue(id: string) {
    const db = await openDB();
    return new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(id);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

export async function clearQueue() {
    const db = await openDB();
    return new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.clear();

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}
