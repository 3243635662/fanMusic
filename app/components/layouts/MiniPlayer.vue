<template>
  <div v-if="musicStore.currentTrack"
    class="fixed left-0 right-0 z-50 bg-black/70 backdrop-blur-2xl border-t border-white/10 transition-all duration-300 safe-area-player"
    :style="{ bottom: '56px' }"
    @click="navigateTo('/lyric')">
    <!-- 进度条指示器 -->
    <div class="h-[2px] bg-white/5 w-full">
      <div class="h-full bg-primary transition-all duration-300" :style="{ width: progressPercent + '%' }"></div>
    </div>

    <div class="flex items-center gap-3 px-4 py-2.5">
      <!-- 封面 -->
      <div class="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-white/5 shadow-md"
        :class="{ 'animate-spin-slow': musicStore.isPlaying, 'animation-paused': !musicStore.isPlaying }">
        <img v-if="processCover(musicStore.currentTrack?.cover || '')"
          :src="processCover(musicStore.currentTrack?.cover || '')" referrerpolicy="no-referrer"
          class="w-full h-full object-cover" alt="Cover" />
        <div v-else class="w-full h-full flex items-center justify-center">
          <UIcon :name="useIcon('music')" class="w-4 h-4 text-white/10" />
        </div>
      </div>

      <!-- 歌曲信息 -->
      <div class="flex-1 min-w-0">
        <div class="text-[13px] font-bold text-white truncate">{{ musicStore.currentTrack?.name }}</div>
        <div class="text-[11px] text-white/40 truncate">{{ musicStore.currentTrack?.artist }}</div>
      </div>

      <!-- 播放/暂停 -->
      <button
        class="w-9 h-9 rounded-full bg-primary text-black flex items-center justify-center shrink-0 active:scale-90 transition-transform shadow-[0_2px_10px_rgba(var(--color-primary-rgb),0.3)]"
        @click.stop="musicStore.togglePlay()">
        <UIcon v-if="musicStore.isLoadingUrl || musicStore.isBuffering" name="lucide:loader-circle"
          class="w-4 h-4 animate-spin" />
        <UIcon v-else :name="musicStore.isPlaying ? useIcon('PlayerPause') : useIcon('PlayerPlay')" class="w-4 h-4" />
      </button>

      <!-- 下一首 -->
      <button class="text-white/40 hover:text-white active:scale-90 transition-all shrink-0"
        @click.stop="musicStore.playNext()">
        <UIcon :name="useIcon('PlayerSkipForward')" class="w-5 h-5" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
const musicStore = useMusicStore()

const progressPercent = computed(() => {
  if (!musicStore.totalTime) return 0
  return (musicStore.currentTime / musicStore.totalTime) * 100
})
</script>

<style scoped>
.safe-area-player {
  /* 位于底部导航栏之上，导航栏高度 56px */
}

.animate-spin-slow {
  animation: spin-slow 25s linear infinite;
}

.animation-paused {
  animation-play-state: paused;
}

@keyframes spin-slow {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
