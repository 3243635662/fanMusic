<template>
  <div class="h-full overflow-y-auto pb-24 scrollbar-hide p-6">
    <AppleMusicPageHeader title="最近播放" :description="`你最近听过的 ${musicStore.recentTracks.length} 首歌曲`"
      margin-bottom="mb-8">
      <template #extra>
        <LayoutsTipsButton @click="clearHistory" text="清空历史" :icon="useIcon('close')" icon-class="w-4 h-4 text-error"
          class="w-8 h-8 rounded-xl bg-error/10 hover:bg-error/20" />
      </template>
    </AppleMusicPageHeader>

    <div v-if="musicStore.recentTracks.length" class="space-y-1 mt-4">
      <!-- 表头 -->
      <div
        class="flex items-center px-4 py-2 text-[11px] font-black text-white/20 uppercase tracking-widest border-b border-white/5 mb-2">
        <div class="w-8 flex justify-center">#</div>
        <div class="flex-1 pl-4">歌曲</div>
        <div class="w-24 text-right">上次收听</div>
      </div>

      <!-- 歌曲列表 -->
      <div v-for="(song, index) in musicStore.recentTracks" :key="song.hash"
        class="flex items-center p-3 px-4 rounded-2xl group transition-all cursor-pointer relative" :class="[
          musicStore.currentTrack?.hash === song.hash
            ? 'bg-primary/10 border border-primary/20'
            : 'hover:bg-white/5 border border-transparent',
        ]" @click="musicStore.playTrack(song)">

        <!-- 序号 -->
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
        <div
          class="w-11 h-11 rounded-lg bg-white/5 mx-4 overflow-hidden relative shadow-lg group-hover:scale-105 transition-transform duration-300">
          <NuxtImg :src="processCover(song.cover || '', '150')"
            @error="(e: any) => (e.target as HTMLImageElement).src = processCover('', '150')"
            class="w-full h-full object-cover" alt="Track Cover" />
          <div
            class="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <UIcon :name="useIcon('PlayerPlay')" class="w-5 h-5 text-white fill-current" />
          </div>
        </div>

        <!-- Song Info -->
        <div class="flex-1 min-w-0 pr-4">
          <h3 class="text-[14px] font-bold truncate transition-colors"
            :class="musicStore.currentTrack?.hash === song.hash ? 'text-primary' : 'text-white group-hover:text-primary'">
            {{ song.name }}
          </h3>
          <p class="text-[12px] text-white/40 truncate">
            {{ song.artist }}
          </p>
        </div>

        <!-- Status -->
        <div class="w-24 text-[12px] text-white/20 text-right">
          <UIcon v-if="musicStore.currentTrack?.hash === song.hash" :name="useIcon('music')"
            class="w-4 h-4 text-primary animate-pulse" />
          <span v-else class="italic font-light">Recently</span>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <AppleMusicEmptyState v-else :icon="useIcon('history')" title="历史空空如也" description="快去探索你喜欢的音乐吧，听过的歌曲会出现在这里。">
      <UButton to="/recommendation" color="primary" class="rounded-xl px-6" variant="soft">
        发现新音乐
      </UButton>
    </AppleMusicEmptyState>
  </div>
</template>

<script lang="ts" setup>
definePageMeta({
  layout: "main",
});

const musicStore = useMusicStore();
const toast = useToast();

const clearHistory = () => {
  musicStore.recentTracks = [];
  toast.add({
    icon: useIcon('success'),
    title: "已清空",
    description: "听歌历史已全部清除",
    color: "success"
  });
};
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
