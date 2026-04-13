<template>
  <InfiniteScrollContainer :has-more="hasMore" :loading="appendLoading" :show-end-message="songs.length > 0"
    @load-more="loadNextPage">
    <AppleMusicPageHeader title="搜索" description="发现全球顶尖的音乐旋律" margin-bottom="mb-5" />


    <!-- Search Bar -->
    <div class="relative mb-6 md:mb-8 group">
      <UIcon :name="useIcon('search')"
        class="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-white/20 group-focus-within:text-primary transition-colors" />
      <input v-model="searchKeyword" type="text" placeholder="搜索热门歌曲..." @keyup.enter="doSearch(false)"
        class="w-full bg-white/5 border border-white/10 rounded-xl md:rounded-2xl py-3 pl-10 md:pl-12 pr-4 text-[13px] md:text-[14px] outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white/10 placeholder:text-white/20 transition-all font-medium text-white" />
    </div>

    <MusicListSkeletonForList v-if="loading" :show-index="false" />


    <div v-else-if="songs.length" class="space-y-1">
      <div v-for="(song, index) in songs" :key="song.hash"
        class="flex items-center p-2.5 md:p-3 rounded-xl md:rounded-2xl group transition-all cursor-pointer relative" :class="[
          musicStore.currentTrack?.hash === song.hash
            ? 'bg-primary/10 border border-primary/20'
            : 'hover:bg-white/5 border border-transparent'
        ]" @click="playSong(song)">
        <!-- Index -->
        <div class="w-6 md:w-8 text-[11px] md:text-[12px] font-bold flex items-center justify-center shrink-0">
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
        <div class="w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-white/5 mr-3 md:mr-4 overflow-hidden relative shadow-lg">
          <NuxtImg v-if="song.image" :src="song.image" class="w-full h-full object-cover" alt="Song Cover" />
          <div v-else class="w-full h-full flex items-center justify-center">
            <UIcon :name="useIcon('music')" class="w-4 h-4 md:w-5 md:h-5 text-white/10" />
          </div>
          <!-- VIP Badge -->
          <div v-if="song.isVip" class="absolute top-0 right-0 p-0.5 animate-pulse">
            <div
              class="w-3 h-3 md:w-4 md:h-4 bg-primary rounded-full flex items-center justify-center text-[7px] md:text-[8px] font-bold text-white">
              VIP</div>
          </div>
        </div>

        <!-- Song Info -->
        <div class="flex-1 min-w-0 pr-2 md:pr-4">
          <h3 class="text-[13px] md:text-[14px] font-bold truncate"
            :class="musicStore.currentTrack?.hash === song.hash ? 'text-primary' : 'text-white'">
            {{ song.name }}
          </h3>
          <p class="text-[11px] md:text-[12px] text-white/40 truncate">
            {{ song.artist }}
          </p>
        </div>

        <!-- Tag -->
        <div v-if="song.tag" class="mr-3 md:mr-4 hidden sm:block">
          <span class="text-[9px] px-1.5 py-0.5 rounded-sm bg-white/5 border border-white/5 text-white/30">{{ song.tag
            }}</span>
        </div>

        <div class="text-[11px] md:text-[12px] text-white/20 font-mono pl-2 md:pl-4">
          {{ formatDuration(song.duration) }}
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="!loading" class="text-center py-20">
      <!-- Search Suggestions -->
      <div v-if="!songs.length" class="flex flex-wrap justify-center gap-2 mb-6 md:mb-8">
        <span v-for="tag in ['周杰伦', 'NewJeans', '告白气球', '轻音乐']" :key="tag" @click="searchKeyword = tag; doSearch(false)"
          class="px-3 py-1 md:px-4 md:py-1.5 rounded-full bg-white/5 border border-white/10 text-[11px] md:text-xs text-white/50 hover:bg-primary/20 hover:text-primary transition-all cursor-pointer active:scale-95">
          {{ tag }}
        </span>
      </div>
      <UIcon :name="useIcon('empty')" class="w-16 h-16 text-white/5 mx-auto mb-4" />
      <p class="text-white/20">搜索不到结果，换个词试试？</p>
    </div>
  </InfiniteScrollContainer>
</template>

<script lang="ts" setup>
definePageMeta({
  layout: "main",
});
import { useDebounceFn } from '@vueuse/core'
import InfiniteScrollContainer from '~/components/AppleMusic/InfiniteScrollContainer.vue'

const musicStore = useMusicStore();
const searchKeyword = ref(musicStore.lastSearchKeyword);
const songs = ref<any[]>(musicStore.searchSongs);

const loading = ref(false);
const appendLoading = ref(false);
const currentPage = ref(1);
const hasMore = ref(musicStore.searchSongs.length >= 10); // 如果已有缓存数据且数量不小于10，假定还有更多

const doSearch = async (isAppend = false) => {
  const keyword = searchKeyword.value.trim();
  if (!keyword) return;

  if (!isAppend) {
    loading.value = true;
    currentPage.value = 1;
    hasMore.value = true;
  } else {
    if (loading.value || appendLoading.value) return;
    appendLoading.value = true;
    currentPage.value++;
  }

  try {
    const res: any = await $fetch("/api/music/search", {
      query: { keyword, page: currentPage.value },
    });

    // 防止竞态：如果请求返回时，搜索关键词已经改变，则忽略此次结果
    if (searchKeyword.value.trim() !== keyword) return;

    if (res && res.code === 0 && res.result) {
      if (!isAppend) {
        songs.value = res.result;
      } else {
        songs.value.push(...res.result);
      }
      musicStore.setSearchSongs(songs.value, keyword);

      // kugou API pagesize 设为 10，由于可能返回少于 10 则没有下一页
      if (res.result.length < 10) {
        hasMore.value = false;
      }
    } else {
      hasMore.value = false;
      if (!isAppend) songs.value = [];
    }
  } catch (err) {
    console.error("搜索失败:", err);
    if (isAppend) currentPage.value--; // 回退由于失败增加的页码
  } finally {
    loading.value = false;
    appendLoading.value = false;
  }
};

const handleSearchDebounced = useDebounceFn(() => {
  doSearch(false);
}, 500);

watch(searchKeyword, (val) => {
  if (val.trim()) {
    handleSearchDebounced();
  }
});

const loadNextPage = () => {
  if (hasMore.value && !loading.value && !appendLoading.value) {
    doSearch(true)
  }
}

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
  // 如果 Store 里已经有当前关键词的结果了，就不再重复请求第一页
  if (songs.value.length === 0 && searchKeyword.value) {
    doSearch(false);
  } else if (searchKeyword.value !== musicStore.lastSearchKeyword) {
    doSearch(false);
  }
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

div {
  -webkit-tap-highlight-color: transparent;
}
</style>