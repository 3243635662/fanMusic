<template>
  <div class="h-full overflow-y-auto pb-24 scrollbar-hide">
    <!-- Header -->
    <div class="flex items-start justify-between mb-5">
      <div>
        <h1 class="text-3xl font-bold tracking-tight mb-0.5 text-white">搜索</h1>
        <p class="text-[13px] text-white/50">发现全球顶尖的音乐旋律</p>
      </div>
    </div>

    <!-- Search Bar -->
    <div class="relative mb-8 group">
      <UIcon name="i-lucide-search"
        class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20 group-focus-within:text-primary transition-colors" />
      <input v-model="searchKeyword" type="text" placeholder="搜索热门歌曲..." @keyup.enter="handleSearch"
        class="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-[14px] outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white/10 placeholder:text-white/20 transition-all font-medium text-white" />
    </div>

    <!-- Song List -->
    <div v-if="loading" class="space-y-1">
      <div v-for="i in 10" :key="i" class="flex items-center p-3 animate-pulse rounded-xl">
        <div class="w-12 h-12 bg-white/5 rounded-lg mr-4 shrink-0"></div>
        <div class="flex-1 space-y-2">
          <div class="h-4 bg-white/10 rounded w-1/3"></div>
          <div class="h-3 bg-white/5 rounded w-1/4"></div>
        </div>
      </div>
    </div>

    <div v-else-if="songs.length" class="space-y-1">
      <div v-for="(song, index) in songs" :key="song.hash"
        class="flex items-center p-3 rounded-2xl group transition-all cursor-pointer relative" :class="[
          musicStore.currentTrack?.hash === song.hash
            ? 'bg-primary/10 border border-primary/20'
            : 'hover:bg-white/5 border border-transparent'
        ]" @click="playSong(song)">
        <!-- Index -->
        <div class="w-8 text-[12px] font-bold flex items-center justify-center shrink-0">
          <template v-if="musicStore.currentTrack?.hash === song.hash && musicStore.isPlaying">
            <div class="flex items-end gap-0.5 h-3">
              <div class="w-0.5 bg-primary animate-music-bar-1"></div>
              <div class="w-0.5 bg-primary animate-music-bar-2"></div>
              <div class="w-0.5 bg-primary animate-music-bar-3"></div>
            </div>
          </template>
          <span v-else :class="musicStore.currentTrack?.hash === song.hash ? 'text-primary' : 'text-white/20'">
            {{ String(index + 1).padStart(2, '0') }}
          </span>
        </div>

        <!-- Album Art -->
        <div class="w-12 h-12 rounded-xl bg-white/5 mr-4 overflow-hidden relative shadow-lg">
          <img v-if="song.image" :src="song.image" class="w-full h-full object-cover" />
          <div v-else class="w-full h-full flex items-center justify-center">
            <UIcon name="i-lucide-music" class="w-5 h-5 text-white/10" />
          </div>
          <!-- VIP Badge -->
          <div v-if="song.isVip" class="absolute top-0 right-0 p-0.5 animate-pulse">
            <div
              class="w-4 h-4 bg-primary rounded-full flex items-center justify-center text-[8px] font-bold text-white">
              VIP</div>
          </div>
        </div>

        <!-- Song Info -->
        <div class="flex-1 min-w-0 pr-4">
          <h3 class="text-[14px] font-bold truncate"
            :class="musicStore.currentTrack?.hash === song.hash ? 'text-primary' : 'text-white'">
            {{ song.name }}
          </h3>
          <p class="text-[12px] text-white/40 truncate">
            {{ song.artist }}
          </p>
        </div>

        <!-- Tag -->
        <div v-if="song.tag" class="mr-4 hidden sm:block">
          <span class="text-[9px] px-1.5 py-0.5 rounded-sm bg-white/5 border border-white/5 text-white/30">{{ song.tag
          }}</span>
        </div>

        <div class="text-[12px] text-white/20 font-mono pl-4">
          {{ formatDuration(song.duration) }}
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="!loading" class="text-center py-20">
      <!-- Search Suggestions -->
      <div v-if="!songs.length" class="flex flex-wrap justify-center gap-2 mb-8">
        <span v-for="tag in ['周杰伦', 'NewJeans', '告白气球', '轻音乐']" :key="tag" @click="searchKeyword = tag; handleSearch()"
          class="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-white/50 hover:bg-primary/20 hover:text-primary transition-all cursor-pointer">
          {{ tag }}
        </span>
      </div>
      <UIcon name="i-lucide-inbox" class="w-16 h-16 text-white/5 mx-auto mb-4" />
      <p class="text-white/20">搜索不到结果，换个词试试？</p>
    </div>
  </div>
</template>

<script lang="ts" setup>
definePageMeta({
  layout: "main",
});
import { useDebounceFn } from '@vueuse/core'
const musicStore = useMusicStore();
const searchKeyword = ref(musicStore.lastSearchKeyword || "aespa");
const songs = ref<any[]>([]);
const loading = ref(false);

const handleSearch = useDebounceFn(async () => {
  const keyword = searchKeyword.value.trim();
  if (!keyword) {
    songs.value = [];
    return;
  }

  loading.value = true;
  try {
    const res: any = await $fetch("/api/music/search", {
      query: { keyword },
    });

    // 防止竞态：如果请求返回时，搜索关键词已经改变，则忽略此次结果
    if (searchKeyword.value.trim() !== keyword) return;

    if (res && res.success) {
      songs.value = res.data;
      musicStore.setHotSongs(res.data, searchKeyword.value);
    } else {
      songs.value = [];
    }
  } catch (err) {
    console.error("搜索失败:", err);
    songs.value = [];
  } finally {
    loading.value = false;
  }
}, 500);

watch(searchKeyword, (val) => {
  if (!val.trim()) {
    songs.value = [];
  } else {
    handleSearch();
  }
});

const playSong = (song: any) => {
  musicStore.playTrack(song);
};

const formatDuration = (seconds: number) => {
  if (!seconds) return "00:00";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
};

onMounted(() => {
  handleSearch();
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

/* 针对移动端优化，点击时不要有蓝色高亮 */
div {
  -webkit-tap-highlight-color: transparent;
}

.scrollbar-hide::-webkit-scrollbar {
  display: none;
}

.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>