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
      const request = indexedDB.open(this.dbName, 2); // 升级版本
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
      request.onerror = () => reject(request.error);
      request.onblocked = () => reject(new Error("Database blocked"));
    });
  }

  async get(hash: string): Promise<string | null> {
    if (typeof window === "undefined") return null;
    try {
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
            // 过期数据，删除并返回 null
            this.delete(hash).catch(console.warn);
            resolve(null);
            return;
          }
          resolve(data.url);
        };
        request.onerror = () => resolve(null);
      });
    } catch (error) {
      console.warn("[AudioUrlCache] get error:", error);
      return null;
    }
  }

  /** 批量获取音频 URL 缓存 */
  async getBatch(hashes: string[]): Promise<Map<string, string>> {
    if (typeof window === "undefined") return new Map();
    try {
      await this.init();
      return new Promise((resolve) => {
        const transaction = this.db!.transaction(this.storeName, "readonly");
        const store = transaction.objectStore(this.storeName);
        const result = new Map<string, string>();
        
        let completed = 0;
        hashes.forEach(hash => {
          const request = store.get(hash);
          request.onsuccess = () => {
            const data: CachedAudioUrl | undefined = request.result;
            if (data && Date.now() - data.cachedAt <= data.ttl) {
              result.set(hash, data.url);
            }
            completed++;
            if (completed === hashes.length) {
              resolve(result);
            }
          };
          request.onerror = () => {
            completed++;
            if (completed === hashes.length) {
              resolve(result);
            }
          };
        });
        
        if (hashes.length === 0) {
          resolve(result);
        }
      });
    } catch (error) {
      console.warn("[AudioUrlCache] getBatch error:", error);
      return new Map();
    }
  }

  async set(hash: string, url: string, ttl = AudioUrlCacheDB.DEFAULT_TTL) {
    if (typeof window === "undefined") return;
    try {
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
    } catch (error) {
      console.warn("[AudioUrlCache] set error:", error);
    }
  }

  async delete(hash: string) {
    if (typeof window === "undefined") return;
    try {
      await this.init();
      const transaction = this.db!.transaction(this.storeName, "readwrite");
      const store = transaction.objectStore(this.storeName);
      store.delete(hash);
    } catch (error) {
      console.warn("[AudioUrlCache] delete error:", error);
    }
  }

  async clearAll() {
    if (typeof window === "undefined") return;
    try {
      await this.init();
      return new Promise<void>((resolve, reject) => {
        const transaction = this.db!.transaction(this.storeName, "readwrite");
        const store = transaction.objectStore(this.storeName);
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.warn("[AudioUrlCache] clearAll error:", error);
    }
  }
  
  /** 清理过期缓存 */
  async cleanup() {
    if (typeof window === "undefined") return;
    try {
      await this.init();
      return new Promise<void>((resolve) => {
        const transaction = this.db!.transaction(this.storeName, "readwrite");
        const store = transaction.objectStore(this.storeName);
        const request = store.openCursor();
        const now = Date.now();
        
        request.onsuccess = (e: any) => {
          const cursor = e.target.result;
          if (cursor) {
            const data: CachedAudioUrl = cursor.value;
            if (now - data.cachedAt > data.ttl) {
              cursor.delete();
            }
            cursor.continue();
          } else {
            resolve();
          }
        };
        request.onerror = () => resolve();
      });
    } catch (error) {
      console.warn("[AudioUrlCache] cleanup error:", error);
    }
  }
}

export const audioUrlCache =
  typeof window !== "undefined" ? new AudioUrlCacheDB() : null;
