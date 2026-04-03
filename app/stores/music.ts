import { defineStore } from "pinia";
import type {
  MyPlayListType,
  RecommendationPlayListType,
  PlayQueueTrackType,
} from "#shared/types/music";

export const useMusicStore = defineStore("music", () => {
  // --- 状态定义 ---

  // 当前播放歌曲
  const currentTrack = ref<PlayQueueTrackType | null>(null);
  // 播放状态
  const isPlaying = ref(false);
  const isLoadingUrl = ref(false); // 是否正在加载歌曲URL
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
  const volume = ref(0.7);

  // 配置项
  const MAX_QUEUE_SIZE = 500;

  // --- 持久化逻辑 ---

  // 在客户端初始化时恢复数据
  onMounted(() => {
    if (process.client) {
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
      if (process.client) {
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
    // 1. 立即设置当前轨道数据（用于 UI 即时显示封面、标题等）
    currentTrack.value = { ...track };

    // 2. 如果没有播放链接，则去获取
    if (currentTrack.value && !currentTrack.value.url) {
      isLoadingUrl.value = true;
      try {
        const res: any = await $fetch("/api/music/musicUrl", {
          query: { hash: track.hash },
        });

        if (res.code === 0 && res.result) {
          // 更新当前轨道的 URL
          currentTrack.value.url = res.result;

          // 同步更新到队列中，这样以后切回这首歌就不需要重新请求 URL 了
          const queueIndex = playQueue.value.findIndex(
            (t) => t.hash === track.hash,
          );
          const queueItem = playQueue.value[queueIndex];
          if (queueItem) {
            queueItem.url = res.result;
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

    // 4. 如果播放的是一首不在队列的歌，自动追加到队列最后
    addToQueue(track);
  }

  async function playNext() {
    if (playQueue.value.length === 0) return;
    if (playQueue.value.length === 1 && playQueue.value[0]) {
      // 只有一首歌直接重播它
      await playTrack(playQueue.value[0]);
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
    if (playQueue.value.length === 1 && playQueue.value[0]) {
      await playTrack(playQueue.value[0]);
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
    volume,
  };
});
