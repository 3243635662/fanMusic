import { defineStore } from "pinia";
import type {
  MyPlayListType,
  RecommendationPlayListType,
  PlayQueueTrackType,
} from "#shared/types/music";
import { parseKrc } from "@/utils/krcParser";
import { lyricCache } from "@/utils/lyricCache";
import { audioUrlCache } from "@/utils/audioUrlCache";

/**
 * 清理不兼容的旧缓存 URL，强制重新从服务端获取
 * - 旧 CDN 直链 (http://fs.xxx) 在 HTTPS 下无法播放
 * - 旧本地代理 (/api/music/proxy) 在 Cloudflare Worker 方案下已废弃
 * 返回 null 让 playTrack 重新请求 musicUrl API 获取新的代理 URL
 */
function toProxiedUrl(url: string): string | null {
  if (url.startsWith("http://") || url.startsWith("https://fs.")) {
    return null;
  }
  if (url.startsWith("/api/music/proxy")) {
    return null;
  }
  return url;
}

export const useMusicStore = defineStore(
  "music",
  () => {
    // --- 状态定义 ---

    // 当前播放歌曲
    const currentTrack = ref<PlayQueueTrackType | null>(null);
    // 播放状态
    const isPlaying = ref(false);
    const isLoadingUrl = ref(false); // 是否正在加载歌曲URL
    const isBuffering = ref(false); // 是否由于网络原因正在缓冲音频
    // 播放进度 (单位：秒)
    const currentTime = ref(0);
    const totalTime = ref(0);
    // 播放模式
    type PlayMode = "loop" | "sequence" | "random" | "single";
    const playMode = ref<PlayMode>("loop");
    // 播放队列
    const playQueue = ref<PlayQueueTrackType[]>([]);
    // 听歌历史
    const recentTracks = ref<PlayQueueTrackType[]>([]);

    // 搜索相关的状态
    const searchSongs = ref<any[]>([]);
    const lastSearchKeyword = ref("");
    const searchHistory = ref<string[]>([]);

    // 歌单相关的状态
    const MyplayList = ref<MyPlayListType[]>([]);
    const recommendationPlayList = ref<RecommendationPlayListType[]>([]);

    // 音量控制 (0-1)
    const volume = ref(0.4);

    // 配置项
    const MAX_QUEUE_SIZE = 500;

    // --- 生命周期 (客户端) ---
    onMounted(async () => {
      if (import.meta.client && audioUrlCache) {
        // 从 IndexedDB 缓存恢复有效的音频 URL，避免每次刷新都重新请求
        // Blob URL 刷新即毁，但酷狗 CDN URL 有时效性，从缓存读取会自动校验过期
        nextTick(async () => {
          const restoreUrl = async (t: any) => {
            if (!t || !t.hash) return;
            const cachedUrl = await audioUrlCache!.get(t.hash);
            if (cachedUrl) {
              t.url = toProxiedUrl(cachedUrl);
            } else {
              t.url = null;
            }
          };

          if (currentTrack.value) {
            await restoreUrl(currentTrack.value);
          }
          await Promise.all(playQueue.value.map(restoreUrl));
          await Promise.all(recentTracks.value.map(restoreUrl));
        });
      }
    });

    function clearQueue() {
      playQueue.value = [];
      currentTrack.value = null;
      isPlaying.value = false;
      currentTime.value = 0;
      totalTime.value = 0;
    }

    function clearHistory() {
      recentTracks.value = [];
    }

    function clearCacheUrls() {
      // 当清理缓存时，也要清理 store 中所有已存在的 URL，强制走重新获取逻辑
      if (currentTrack.value) currentTrack.value.url = null;
      playQueue.value.forEach(t => t.url = null);
      recentTracks.value.forEach(t => t.url = null);
    }

    function setSearchSongs(songs: any[], keyword: string) {
      searchSongs.value = songs;
      lastSearchKeyword.value = keyword;

      // 添加到搜索历史 (去重并限制数量)
      if (keyword.trim()) {
        const history = new Set([keyword, ...searchHistory.value]);
        searchHistory.value = Array.from(history).slice(0, 10);
      }
    }

    function setPlayList(list: MyPlayListType[]) {
      MyplayList.value = list;
    }

    function setRecommendationPlayList(list: RecommendationPlayListType[]) {
      recommendationPlayList.value = list;
    }

    function setPlayQueue(tracks: PlayQueueTrackType[]) {
      // 限制最大数量
      playQueue.value = tracks.slice(0, MAX_QUEUE_SIZE);
    }

    function addToQueue(tracks: PlayQueueTrackType | PlayQueueTrackType[]) {
      const newTracks = Array.isArray(tracks) ? tracks : [tracks];
      // 去重，不在队列中的才加进去
      const toAdd = newTracks.filter(
        (t) => !playQueue.value.some((q) => q.hash === t.hash),
      );

      playQueue.value = [...playQueue.value, ...toAdd];

      // 超出限制时，淘汰最早加入的歌曲 (队头的)
      if (playQueue.value.length > MAX_QUEUE_SIZE) {
        playQueue.value = playQueue.value.slice(-MAX_QUEUE_SIZE);
      }
    }

    async function playTrack(track: PlayQueueTrackType) {
      // 0. 确保将要播放的歌曲加入到队列中 (避免后续走缓存提前 return 导致未被加入队列)
      addToQueue(track);

      // [新增] 加入听歌历史 (去重并移到最前)
      const history = [
        track,
        ...recentTracks.value.filter((t) => t.hash !== track.hash),
      ];
      recentTracks.value = history.slice(0, 100); // 最多保留 100 条历史

      // [优化] 1. 尝试从当前运行时的队列中寻找
      const existingTrack = playQueue.value.find((t) => t.hash === track.hash);

      // 2. 如果队列里已经有这首歌且有播放链接，直接使用
      if (existingTrack && existingTrack.url) {
        const proxied = toProxiedUrl(existingTrack.url);
        if (proxied) {
          existingTrack.url = proxied;
          currentTrack.value = { ...existingTrack };
          isPlaying.value = true;
          // 依然触发预加载下一首
          preloadNextTrack();
          return;
        }
        // 旧缓存 URL 已失效，置空让后续逻辑重新获取
        existingTrack.url = null;
      }

      // 立即设置当前轨道数据（用于 UI 即时显示封面、标题等）
      currentTrack.value = { ...track };

      // 如果没有播放链接，先从缓存读取，缓存没有再走网络
      if (currentTrack.value && !currentTrack.value.url) {
        // 尝试从 IndexedDB 缓存读取
        if (import.meta.client && audioUrlCache) {
          const cachedUrl = await audioUrlCache.get(track.hash);
          if (cachedUrl) {
            const proxiedUrl = toProxiedUrl(cachedUrl);
            if (proxiedUrl) {
              currentTrack.value.url = proxiedUrl;
              // 同步更新到队列
              const qi = playQueue.value.findIndex((t) => t.hash === track.hash);
              if (qi !== -1 && playQueue.value[qi]) playQueue.value[qi].url = proxiedUrl;
              isPlaying.value = true;
              updateLyricForTrack(currentTrack.value);
              preloadNextTrack();
              return;
            }
            // 旧缓存 URL 已失效，清掉继续走网络请求
          }
        }

        isLoadingUrl.value = true;
        try {
          const res: any = await $fetch("/api/music/musicUrl", {
            query: { hash: track.hash },
          });

          if (res.code === 0 && res.result) {
            currentTrack.value.url = res.result;

            // 同步更新到队列中
            const queueIndex = playQueue.value.findIndex(
              (t) => t.hash === track.hash,
            );
            if (queueIndex !== -1) {
              const queueItem = playQueue.value[queueIndex];
              if (queueItem) queueItem.url = res.result;
            }

            // 写入 IndexedDB 缓存
            if (import.meta.client && audioUrlCache) {
              audioUrlCache.set(track.hash, res.result);
            }
          } else {
            throw new Error(res.message || "获取播放地址失败");
          }
        } catch (error) {
          console.error("播放失败:", error);
          isPlaying.value = false;
          return;
        } finally {
          isLoadingUrl.value = false;
        }
      }

      // 3. 开始播放
      isPlaying.value = true;

      // 4. [优化] 下发歌词任务 (优先从缓存加载，否则网络请求)
      updateLyricForTrack(currentTrack.value);

      // 5. [新增] 预加载下一首播放信息
      preloadNextTrack();
    }

    // [新增] 更新歌词 (带缓存)
    async function updateLyricForTrack(track: PlayQueueTrackType | null) {
      if (!track || !track.hash) return;

      // 1. 如果歌曲自带了解析好的歌词，直接返回
      if (track.lyrics && track.lyrics.length > 0) return;

      // 2. 尝试从本地 IndexedDB 缓存加载
      if (import.meta.client && lyricCache) {
        const cached = await lyricCache.get(track.hash);
        if (cached && (cached.lyrics || cached.decodeContent)) {
          track.lyricId = cached.lyricId;
          track.lyricAccessKey = cached.lyricAccessKey;
          // 如果缓存里有解析好的，直接拿；否则解析
          if (cached.lyrics) {
            track.lyrics = cached.lyrics;
          } else if (cached.decodeContent) {
            track.lyrics = parseKrc(cached.decodeContent);
          }
          return;
        }
      }

      // 3. 缓存未命中的话，走网络请求 (即原 preloadTrackLyric 逻辑)
      await preloadTrackLyric(track);
    }

    // 内部辅助：预加载歌词信息并本地存储到歌曲对象中
    async function preloadTrackLyric(track: PlayQueueTrackType) {
      if (!track || !track.hash) return;

      try {
        // 1. 获取歌词 ID (带 accesskey)
        const idRes: any = await $fetch("/api/music/getLyricId", {
          query: { hash: track.hash },
        });

        if (idRes.code === 0 && idRes.result) {
          track.lyricId = idRes.result.id;
          track.lyricAccessKey = idRes.result.accesskey;

          // 2. 获取具体内容并存储
          const infoRes: any = await $fetch("/api/music/getLyricInfo", {
            query: { id: track.lyricId, accesskey: track.lyricAccessKey },
          });

            if (infoRes.code === 0 && infoRes.result?.decodeContent) {
              const lyrics = parseKrc(infoRes.result.decodeContent);
              track.lyrics = lyrics;
  
              // [存储到缓存]
              if (import.meta.client && lyricCache) {
                lyricCache.set(track.hash, {
                  hash: track.hash,
                  lyricId: track.lyricId,
                  lyricAccessKey: track.lyricAccessKey,
                  lyrics: lyrics, // 使用刚a解析出来的 plain 数组，避免 Proxy
                  decodeContent: infoRes.result.decodeContent,
                });
              }
            }
        }
      } catch (err) {
        console.error("[Lyric-Fetch] 歌词获取链路异常:", err);
      }
    }

    // [新增] 预加载下一首歌曲的 URL
    async function preloadNextTrack() {
      if (playQueue.value.length <= 1) return;

      let currentIndex = playQueue.value.findIndex(
        (t) => t.hash === (currentTrack.value?.hash || ""),
      );
      if (currentIndex === -1) return;

      let nextIndex = currentIndex + 1;
      // 根据模式简单判断下一首（暂不考虑随机模式的预知，仅处理顺序和循环）
      if (nextIndex >= playQueue.value.length) {
        if (playMode.value === "loop") nextIndex = 0;
        else return;
      }

      const nextTrack = playQueue.value[nextIndex];
      if (!nextTrack) return;

      // 如果下一首还没有 URL，则静默加载
      if (!nextTrack.url) {
        try {
          const res: any = await $fetch("/api/music/musicUrl", {
            query: { hash: nextTrack.hash },
          });
          if (res.code === 0 && res.result) {
            nextTrack.url = res.result;
            if (import.meta.client && audioUrlCache) {
              audioUrlCache.set(nextTrack.hash, res.result);
            }
          }
        } catch (e) {
        }
      }
    }

    // [新增] 替换整个队列并播放
    function replaceQueueAndPlay(tracks: PlayQueueTrackType[]) {
      if (!tracks.length) return;
      // 清空并替换新队列
      playQueue.value = tracks.map((t) => ({ ...t })).slice(0, MAX_QUEUE_SIZE);
      // 播放第一首
      const firstTrack = playQueue.value[0];
      if (firstTrack) {
        playTrack(firstTrack);
      }
    }

    async function playNext() {
      if (playQueue.value.length === 0) return;
      if (playQueue.value.length === 1) {
        const firstTrack = playQueue.value[0];
        if (firstTrack) await playTrack(firstTrack);
        return;
      }

      let currentIndex = playQueue.value.findIndex(
        (t) => t.hash === (currentTrack.value?.hash || ""),
      );
      if (currentIndex === -1) currentIndex = 0;

      let nextIndex = currentIndex;

      switch (playMode.value) {
        case "random":
          // 随机模式，避开当前这首歌
          do {
            nextIndex = Math.floor(Math.random() * playQueue.value.length);
          } while (nextIndex === currentIndex);
          break;
        case "sequence":
          nextIndex = currentIndex + 1;
          if (nextIndex >= playQueue.value.length) {
            // 顺序模式播完停止
            isPlaying.value = false;
            return;
          }
          break;
        case "single":
        case "loop":
        default:
          // 用户主动点击下一首时，单曲循环和列表循环行为一致，切到下一首
          nextIndex = currentIndex + 1;
          if (nextIndex >= playQueue.value.length) nextIndex = 0;
          break;
      }

      const nextTrack = playQueue.value[nextIndex];
      if (nextTrack) {
        await playTrack(nextTrack);
      }
    }

    async function playPrev() {
      if (playQueue.value.length === 0) return;
      if (playQueue.value.length === 1) {
        const firstTrack = playQueue.value[0];
        if (firstTrack) await playTrack(firstTrack);
        return;
      }

      let currentIndex = playQueue.value.findIndex(
        (t) => t.hash === (currentTrack.value?.hash || ""),
      );
      if (currentIndex === -1) currentIndex = 0;

      let prevIndex = currentIndex;

      switch (playMode.value) {
        case "random":
          do {
            prevIndex = Math.floor(Math.random() * playQueue.value.length);
          } while (prevIndex === currentIndex);
          break;
        case "sequence":
          prevIndex = currentIndex - 1;
          if (prevIndex < 0) {
            prevIndex = 0; // 顶到头
          }
          break;
        case "single":
        case "loop":
        default:
          prevIndex = currentIndex - 1;
          if (prevIndex < 0) prevIndex = playQueue.value.length - 1;
          break;
      }

      const prevTrack = playQueue.value[prevIndex];
      if (prevTrack) {
        await playTrack(prevTrack);
      }
    }

    function togglePlayMode() {
      const modes: PlayMode[] = ["loop", "sequence", "random", "single"];
      const currentIndex = modes.indexOf(playMode.value);
      playMode.value = modes[(currentIndex + 1) % modes.length] as PlayMode;
    }

    function togglePlay() {
      isPlaying.value = !isPlaying.value;
    }

    return {
      currentTrack,
      isPlaying,
      isLoadingUrl,
      searchSongs,
      lastSearchKeyword,
      searchHistory,
      currentTime,
      totalTime,
      playList: MyplayList,
      recommendationPlayList,
      playQueue,
      playMode,
      MAX_QUEUE_SIZE,
      setSearchSongs,
      setPlayList,
      setRecommendationPlayList,
      setPlayQueue,
      addToQueue,
      playTrack,
      playNext,
      playPrev,
      togglePlayMode,
      togglePlay,
      replaceQueueAndPlay,
      clearQueue,
      clearHistory,
      clearCacheUrls,
      volume,
      isBuffering,
      recentTracks,
      updateLyricForTrack,
    };
  },
  {
    persist: {
      // 只有这些字段需要持久化，像搜索结果、推荐列表等不需要存本地
      pick: [
        "playQueue",
        "currentTrack",
        "playMode",
        "volume",
        "searchHistory",
        "recentTracks",
      ],
    },
  },
);
