import type { KrcLine } from "@/utils/krcParser";

export interface CachedLyricData {
  hash: string;
  lyricId?: string;
  lyricAccessKey?: string;
  lyrics?: KrcLine[];
  // 也可以存原始字符串，防止解析逻辑变动导致缓存失效
  decodeContent?: string;
  cachedAt?: number; // 添加时间戳用于过期检查
}

export class LyricCacheDB {
  private dbName = "fan-music-lyric-cache";
  private storeName = "lyrics";
  private db: IDBDatabase | null = null;
  
  /** 默认缓存有效期：24 小时 */
  static readonly DEFAULT_TTL = 24 * 60 * 60 * 1000;

  async init() {
    if (this.db) return this.db;
    return new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 2); // 升级版本以支持新字段
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

  async get(hash: string): Promise<CachedLyricData | null> {
    if (typeof window === "undefined") return null;
    try {
      await this.init();
      return new Promise((resolve) => {
        const transaction = this.db!.transaction(this.storeName, "readonly");
        const store = transaction.objectStore(this.storeName);
        const request = store.get(hash);
        request.onsuccess = () => {
          const data: CachedLyricData | undefined = request.result;
          if (!data) {
            resolve(null);
            return;
          }
          // 检查是否过期（24 小时）
          if (data.cachedAt && Date.now() - data.cachedAt > LyricCacheDB.DEFAULT_TTL) {
            // 过期数据，删除并返回 null
            this.delete(hash).catch(console.warn);
            resolve(null);
            return;
          }
          resolve(data);
        };
        request.onerror = () => resolve(null);
      });
    } catch (error) {
      console.warn("[LyricCache] get error:", error);
      return null;
    }
  }

  async set(hash: string, data: CachedLyricData) {
    if (typeof window === "undefined") return;
    try {
      await this.init();
      const transaction = this.db!.transaction(this.storeName, "readwrite");
      const store = transaction.objectStore(this.storeName);
      // 添加缓存时间戳
      const enrichedData = { ...data, cachedAt: Date.now() };
      store.put(enrichedData, hash);
    } catch (error) {
      console.warn("[LyricCache] set error:", error);
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
      console.warn("[LyricCache] delete error:", error);
    }
  }

  /** 批量获取歌词缓存 */
  async getBatch(hashes: string[]): Promise<Map<string, CachedLyricData>> {
    if (typeof window === "undefined") return new Map();
    try {
      await this.init();
      return new Promise((resolve) => {
        const transaction = this.db!.transaction(this.storeName, "readonly");
        const store = transaction.objectStore(this.storeName);
        const result = new Map<string, CachedLyricData>();
        
        let completed = 0;
        hashes.forEach(hash => {
          const request = store.get(hash);
          request.onsuccess = () => {
            const data: CachedLyricData | undefined = request.result;
            if (data && (!data.cachedAt || Date.now() - data.cachedAt <= LyricCacheDB.DEFAULT_TTL)) {
              result.set(hash, data);
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
      console.warn("[LyricCache] getBatch error:", error);
      return new Map();
    }
  }

  async clearAll() {
    await this.init();
    return new Promise<void>((resolve, reject) => {
      const transaction = this.db!.transaction(this.storeName, "readwrite");
      const store = transaction.objectStore(this.storeName);
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
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
            const data: CachedLyricData = cursor.value;
            if (data.cachedAt && now - data.cachedAt > LyricCacheDB.DEFAULT_TTL) {
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
      console.warn("[LyricCache] cleanup error:", error);
    }
  }
}

export const lyricCache =
  typeof window !== "undefined" ? new LyricCacheDB() : null;
