<template>
  <AppleMusicInfiniteScrollContainer :hasMore="hasMore" :loading="loading" @loadMore="fetchTracks">
    <!-- 骨架屏-->
    <MusicListSkeletonForList v-if="loading && page === 1" />


    <div v-else-if="trackList.length" class="space-y-1">
      <!-- Table Header -->
      <div
        class="flex items-center px-3 py-2 text-[11px] font-black text-white/20 uppercase tracking-widest border-b border-white/5 mb-2">
        <div class="w-8 flex justify-center">#</div>
        <div class="flex-1 pl-4">歌曲</div>
        <div class="w-20 text-right">时长</div>
      </div>

      <div v-for="(song, index) in trackList" :key="song.hash"
        class="flex items-center p-3 rounded-2xl group transition-all cursor-pointer relative" :class="[
          musicStore.currentTrack?.hash === song.hash
            ? 'bg-primary/10 border border-primary/20'
            : 'hover:bg-white/5 border border-transparent',
        ]" @click="playSong(song)">
        <!-- Index -->
        <div class="w-8 text-[12px] font-bold flex items-center justify-center shrink-0">
          <template v-if="
            musicStore.currentTrack?.hash === song.hash && musicStore.isPlaying
          ">
            <div class="flex items-end gap-0.5 h-3">
              <div class="w-0.5 bg-primary animate-music-bar-1"></div>
              <div class="w-0.5 bg-primary animate-music-bar-2"></div>
              <div class="w-0.5 bg-primary animate-music-bar-3"></div>
            </div>
          </template>
          <span v-else :class="musicStore.currentTrack?.hash === song.hash
            ? 'text-primary'
            : 'text-white/20'
            ">
            {{ String(index + 1).padStart(2, '0') }}
          </span>
        </div>

        <!-- Album Art Style List -->
        <div
          class="w-12 h-12 rounded-xl bg-white/5 mx-4 overflow-hidden relative shadow-lg group-hover:scale-105 transition-transform duration-300">
          <img v-if="song.cover" :src="processCover(song.cover)" class="w-full h-full object-cover" />
          <div v-else class="w-full h-full flex items-center justify-center">
            <UIcon :name="useIcon('music')" class="w-5 h-5 text-white/10" />
          </div>
          <div
            class="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <UIcon :name="useIcon('PlayerPlay')" class="w-5 h-5 text-white fill-current" />
          </div>
        </div>

        <!-- Song Info -->
        <div class="flex-1 min-w-0 pr-4">
          <h3 class="text-[14px] font-bold truncate transition-colors" :class="musicStore.currentTrack?.hash === song.hash
            ? 'text-primary'
            : 'text-white group-hover:text-primary'
            ">
            {{ song.name }}
          </h3>
          <p class="text-[12px] text-white/40 truncate">
            {{ song.artist }}
          </p>
        </div>

        <!-- Duration -->
        <div class="w-20 text-[12px] text-white/20 font-mono text-right">
          {{ song.duration }}
        </div>
      </div>
    </div>
  </AppleMusicInfiniteScrollContainer>
</template>

<script lang="ts" setup>
import type { MyTrackType, RecommendationTrackType } from "../../../shared/types/music";

const props = withDefaults(defineProps<{
  id: string | number;
  type?: "my" | "recommendation";
}>(), {
  type: "my" // 默认是my模块
});

const toast = useToast();
const musicStore = useMusicStore();
const trackList = ref<(MyTrackType | RecommendationTrackType)[]>([]);
const fullTrackList = ref<(MyTrackType | RecommendationTrackType)[]>([]); // 内部存储完整列表 (用于伪分页)
const loading = ref(false);
const page = ref(1);
const pagesize = 20;
const hasMore = ref(true);

const fetchTracks = async () => {
  if (loading.value || !hasMore.value) return;

  loading.value = true;
  try {
    const isRecommendation = props.type === "recommendation";

    // 如果是推荐模式且已有完整列表，直接进行伪分页展示
    if (isRecommendation && fullTrackList.value.length > 0) {
      const start = (page.value - 1) * pagesize;
      const end = start + pagesize;
      const nextBatch = fullTrackList.value.slice(start, end);

      if (nextBatch.length > 0) {
        trackList.value = [...trackList.value, ...nextBatch];
        page.value++;
      }

      if (trackList.value.length >= fullTrackList.value.length) {
        hasMore.value = false;
      }
      return;
    }

    const endpoint = isRecommendation ? "/api/music/recommendationTrack" : "/api/music/playlistTrack";

    // 构造请求参数
    const query: any = { page: page.value, pagesize };
    if (isRecommendation) {
      query.theme_id = props.id;
    } else {
      query.listid = props.id;
    }

    const res: any = await $fetch(endpoint, { query });

    if (res.code === 0) {
      const newTracks = res.result || [];

      if (isRecommendation) {
        // 推荐模式：存储完整列表并展示第一页
        fullTrackList.value = newTracks;
        const firstBatch = fullTrackList.value.slice(0, pagesize);
        trackList.value = firstBatch;

        if (fullTrackList.value.length <= pagesize) {
          hasMore.value = false;
        } else {
          page.value = 2; // 下一次从第2页开始
        }
      } else {
        // 普通模式：真实分页追加
        trackList.value = [...trackList.value, ...newTracks];

        if (newTracks.length < pagesize) {
          hasMore.value = false;
        } else {
          page.value++;
        }
      }
    }
  } catch (err: any) {
    toast.add({
      icon: "i-solar:close-circle-bold",
      title: "获取歌曲列表失败",
      description: err.data?.message || "未知错误",
      color: "error",
    });
  } finally {
    loading.value = false;
  }
};

const playSong = (song: MyTrackType | RecommendationTrackType) => {
  musicStore.playTrack(song as any);
};

const playAll = () => {
  if (trackList.value.length > 0) {
    musicStore.playTrack(trackList.value[0] as any);
  }
};

const processCover = (url: string) => {
  if (!url) return "";
  return url.replace("{size}", "400");
};

onMounted(() => {
  fetchTracks();
});

defineExpose({
  playAll,
});
</script>

<style scoped>
@keyframes music-bar {

  0%,
  100% {
    height: 4px;
  }

  50% {
    height: 12px;
  }
}

.animate-music-bar-1 {
  animation: music-bar 0.6s infinite ease-in-out;
}

.animate-music-bar-2 {
  animation: music-bar 0.8s infinite ease-in-out;
}

.animate-music-bar-3 {
  animation: music-bar 0.7s infinite ease-in-out;
}
</style>