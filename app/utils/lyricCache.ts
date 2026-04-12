import type { KrcLine } from "@/utils/krcParser";

export interface CachedLyricData {
  hash: string;
  lyricId?: string;
  lyricAccessKey?: string;
  lyrics?: KrcLine[];
  // 也可以存原始字符串，防止解析逻辑变动导致缓存失效
  decodeContent?: string;
}

export class LyricCacheDB {
  private dbName = "fan-music-lyric-cache";
  private storeName = "lyrics";
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

  async get(hash: string): Promise<CachedLyricData | null> {
    if (typeof window === "undefined") return null;
    await this.init();
    return new Promise((resolve) => {
      const transaction = this.db!.transaction(this.storeName, "readonly");
      const store = transaction.objectStore(this.storeName);
      const request = store.get(hash);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => resolve(null);
    });
  }

  async set(hash: string, data: CachedLyricData) {
    if (typeof window === "undefined") return;
    await this.init();
    const transaction = this.db!.transaction(this.storeName, "readwrite");
    const store = transaction.objectStore(this.storeName);
    store.put(data, hash);
  }

  async clearAll() {
    await this.init();
    return new Promise<void>((resolve, reject) => {
      const transaction = this.db!.transaction(this.storeName, "readwrite");
      const store = transaction.objectStore(this.storeName);
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = reject;
    });
  }
}

export const lyricCache =
  typeof window !== "undefined" ? new LyricCacheDB() : null;
