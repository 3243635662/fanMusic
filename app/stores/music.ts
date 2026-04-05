import { defineStore } from "pinia";
import type {
  MyPlayListType,
  RecommendationPlayListType,
  PlayQueueTrackType,
} from "#shared/types/music";
import { audioCache } from "@/utils/audioCache";

export const useMusicStore = defineStore("music", () => {
  // --- 状态定义 ---

  // 当前播放歌曲
  const currentTrack = ref<PlayQueueTrackType | null>(null);
  // 播放状态
  const isPlaying = ref(false);
  const isLoadingUrl = ref(false); // 是否正在加载歌曲URL
  const isBuffering = ref(false); // 是否由于网络原因正在缓冲音频
  // 播放模式
  type PlayMode = "loop" | "sequence" | "random" | "single";
  const playMode = ref<PlayMode>("loop");
  // 播放队列
  const playQueue = ref<PlayQueueTrackType[]>([]);

  // 搜索相关的状态
  const searchSongs = ref<any[]>([]);
  const lastSearchKeyword = ref("");

  // 歌单相关的状态
  const MyplayList = ref<MyPlayListType[]>([]);
  const recommendationPlayList = ref<RecommendationPlayListType[]>([]);

  // 音量控制 (0-1)
  const volume = ref(0.4);

  // 配置项
  const MAX_QUEUE_SIZE = 500;

  // --- 持久化逻辑 ---

  // 在客户端初始化时恢复数据
  onMounted(() => {
    if (import.meta.client) {
      const savedQueue = localStorage.getItem("fan_music_queue");
      const savedTrack = localStorage.getItem("fan_music_current_track");
      const savedMode = localStorage.getItem("fan_music_mode");
      const savedVolume = localStorage.getItem("fan_music_volume");

      if (savedQueue) playQueue.value = JSON.parse(savedQueue);
      if (savedTrack) {
        currentTrack.value = JSON.parse(savedTrack);
        isPlaying.value = false; // 初始进入不自动播放
      }
      if (savedMode) playMode.value = savedMode as PlayMode;
      if (savedVolume) volume.value = parseFloat(savedVolume);
    }
  });

  // 深度监听变化并写入缓存
  watch(
    [playQueue, currentTrack, playMode, volume],
    ([newQueue, newTrack, newMode, newVolume]) => {
      if (import.meta.client) {
        localStorage.setItem("fan_music_queue", JSON.stringify(newQueue));
        localStorage.setItem(
          "fan_music_current_track",
          JSON.stringify(newTrack),
        );
        localStorage.setItem("fan_music_mode", newMode as string);
        localStorage.setItem("fan_music_volume", newVolume.toString());
      }
    },
    { deep: true },
  );

  function setSearchSongs(songs: any[], keyword: string) {
    searchSongs.value = songs;
    lastSearchKeyword.value = keyword;
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

    // [极速缓存] 1. 优先尝试从本地强存储 (IndexedDB) 中加载二进制数据
    if (import.meta.client && audioCache) {
      try {
        const cachedBlob = await audioCache.get(track.hash);
        if (cachedBlob) {
          console.log(`[Cache-DB] 命中本地强缓存: ${track.name}`);
          const localUrl = URL.createObjectURL(cachedBlob);
          currentTrack.value = { ...track, url: localUrl };
          isPlaying.value = true;
          preloadNextTrack();
          return;
        }
      } catch (err) {
        console.warn('缓存读取异常:', err);
      }
    }

    // [优化] 2. 尝试从当前运行时的队列中寻找
    const existingTrack = playQueue.value.find(t => t.hash === track.hash);
    
    // 如果队列里已经有这首歌且有播放链接，直接使用
    if (existingTrack && existingTrack.url) {
      currentTrack.value = { ...existingTrack };
      isPlaying.value = true;
      // 依然触发预加载下一首
      preloadNextTrack();
      return;
    }

    // 立即设置当前轨道数据（用于 UI 即时显示封面、标题等）
    currentTrack.value = { ...track };

    // 如果没有播放链接，则去获取
    if (currentTrack.value && !currentTrack.value.url) {
      isLoadingUrl.value = true;
      try {
        const res: any = await $fetch("/api/music/musicUrl", {
          query: { hash: track.hash },
        });

        if (res.code === 0 && res.result) {
          // 更新当前轨道的 URL
          currentTrack.value.url = res.result;

          // [后台静默下载并缓存二进制]
          if (import.meta.client && audioCache) {
            fetch(res.result).then(r => r.blob()).then(blob => {
               audioCache?.set(track.hash, blob);
               console.log(`[Cache-DB] 已将歌曲同步到本地磁盘: ${track.name}`);
            }).catch(e => console.warn('后台下载缓存失败:', e));
          }

          // 同步更新到队列中
          const queueIndex = playQueue.value.findIndex(
            (t) => t.hash === track.hash,
          );
          if (queueIndex !== -1) {
            const queueItem = playQueue.value[queueIndex];
            if (queueItem) queueItem.url = res.result;
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

    // 4. [新增] 预加载下一首
    preloadNextTrack();
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

    // [优化] 如果本地已经有二进制强缓存，连预加载 URL 的 API 都不用了
    if (import.meta.client && audioCache) {
      const hasCache = await audioCache.get(nextTrack.hash);
      if (hasCache) {
        console.log(`[Preload] ${nextTrack.name} 已存在本地缓存，跳过 URL 预加载`);
        return;
      }
    }

    // 如果下一首还没有 URL，则静默加载
    if (!nextTrack.url) {
      try {
        const res: any = await $fetch("/api/music/musicUrl", {
          query: { hash: nextTrack.hash },
        });
        if (res.code === 0 && res.result) {
          nextTrack.url = res.result;
          console.log(`[Preload] 已预加载下一首: ${nextTrack.name}`);
        }
      } catch (e) {
        // 预加载失败不需要打断用户
        console.warn("[Preload] 预加载失败", e);
      }
    }
  }

  // [新增] 替换整个队列并播放
  function replaceQueueAndPlay(tracks: PlayQueueTrackType[]) {
    if (!tracks.length) return;
    // 清空并替换新队列
    playQueue.value = tracks.map(t => ({ ...t })).slice(0, MAX_QUEUE_SIZE);
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
    volume,
    isBuffering,
  };
});
