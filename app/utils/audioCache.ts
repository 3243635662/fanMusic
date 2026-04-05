export class AudioCacheDB {
    private dbName = 'fan-music-cache';
    private storeName = 'songs';
    private db: IDBDatabase | null = null;

    async init() {
        if (this.db) return this.db;
        return new Promise<IDBDatabase>((resolve, reject) => {
            const request = indexedDB.open(this.dbName, 1);
            request.onupgradeneeded = (e: any) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    db.createObjectStore(this.storeName);
                }
            };
            request.onsuccess = (e: any) => {
                this.db = e.target.result;
                resolve(this.db!);
            };
            request.onerror = reject;
        });
    }

    async get(hash: string): Promise<Blob | null> {
        await this.init();
        return new Promise((resolve) => {
            const transaction = this.db!.transaction(this.storeName, 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.get(hash);
            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => resolve(null);
        });
    }

    async set(hash: string, blob: Blob) {
        await this.init();
        const transaction = this.db!.transaction(this.storeName, 'readwrite');
        const store = transaction.objectStore(this.storeName);
        store.put(blob, hash);
    }

    async getStats() {
        await this.init();
        return new Promise<{ count: number; size: number }>((resolve) => {
            const transaction = this.db!.transaction(this.storeName, 'readonly');
            const store = transaction.objectStore(this.storeName);
            const countRequest = store.count();
            const cursorRequest = store.openCursor();

            let count = 0;
            let size = 0;

            countRequest.onsuccess = () => count = countRequest.result;
            cursorRequest.onsuccess = (e: any) => {
                const cursor = e.target.result;
                if (cursor) {
                    const blob = cursor.value;
                    size += blob.size;
                    cursor.continue();
                } else {
                    resolve({ count, size });
                }
            };
        });
    }

    async clearAll() {
        await this.init();
        return new Promise<void>((resolve, reject) => {
            const transaction = this.db!.transaction(this.storeName, 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.clear();
            request.onsuccess = () => resolve();
            request.onerror = reject;
        });
    }
}

export const audioCache = typeof window !== 'undefined' ? new AudioCacheDB() : null;
