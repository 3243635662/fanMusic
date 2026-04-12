export interface CachedAudioUrl {
  hash: string;
  url: string;
  cachedAt: number; // 时间戳 ms
  /** URL 有效期，单位 ms，默认 2 小时 */
  ttl: number;
}

export class AudioUrlCacheDB {
  private dbName = "fan-music-audio-url-cache";
  private storeName = "audioUrls";
  private db: IDBDatabase | null = null;

  /** 默认缓存有效期：2 小时 */
  static readonly DEFAULT_TTL = 2 * 60 * 60 * 1000;

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

  async get(hash: string): Promise<string | null> {
    if (typeof window === "undefined") return null;
    await this.init();
    return new Promise((resolve) => {
      const transaction = this.db!.transaction(this.storeName, "readonly");
      const store = transaction.objectStore(this.storeName);
      const request = store.get(hash);
      request.onsuccess = () => {
        const data: CachedAudioUrl | undefined = request.result;
        if (!data) {
          resolve(null);
          return;
        }
        // 检查是否过期
        if (Date.now() - data.cachedAt > data.ttl) {
          resolve(null);
          return;
        }
        resolve(data.url);
      };
      request.onerror = () => resolve(null);
    });
  }

  async set(hash: string, url: string, ttl = AudioUrlCacheDB.DEFAULT_TTL) {
    if (typeof window === "undefined") return;
    await this.init();
    const transaction = this.db!.transaction(this.storeName, "readwrite");
    const store = transaction.objectStore(this.storeName);
    store.put(
      {
        hash,
        url,
        cachedAt: Date.now(),
        ttl,
      },
      hash
    );
  }

  async clearAll() {
    if (typeof window === "undefined") return;
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

export const audioUrlCache =
  typeof window !== "undefined" ? new AudioUrlCacheDB() : null;
