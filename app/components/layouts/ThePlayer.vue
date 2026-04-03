<template>
  <Transition enter-active-class="transform transition duration-500 ease-out"
    enter-from-class="translate-y-full opacity-0" enter-to-class="translate-y-0 opacity-100"
    leave-active-class="transform transition duration-300 ease-in" leave-from-class="translate-y-0 opacity-100"
    leave-to-class="translate-y-full opacity-0">
    <div v-if="musicStore.currentTrack"
      class="fixed bottom-10 left-1/2 -translate-x-1/2 w-[90%] max-w-[800px] h-20 bg-black/40 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-3lx z-50 px-5 flex items-center gap-6 group">
      <!-- Track Info -->
      <div class="flex items-center gap-4 min-w-[200px] flex-1">
        <div class="w-14 h-14 rounded-lg overflow-hidden shadow-lg bg-white/5 relative group/art">
          <img v-if="musicStore.currentTrack?.image" :src="musicStore.currentTrack.image"
            class="w-full h-full object-cover transition-transform duration-500 group-hover/art:scale-110" />
          <div v-else class="w-full h-full flex items-center justify-center">
            <UIcon :name="useIcon('music')" class="w-6 h-6 text-white/20" />
          </div>
        </div>
        <div class="flex-1 min-w-0 pr-2">
          <h4 class="text-[14px] font-bold text-white truncate mb-0.5">
            {{ musicStore.currentTrack?.name }}
          </h4>
          <p class="text-[12px] text-white/40 truncate">
            {{ musicStore.currentTrack?.artist }}
          </p>
        </div>
      </div>

      <!-- Controls -->
      <!-- 上一首 -->
      <div class="flex items-center gap-6 shrink-0">
        <button class="text-white/40 hover:text-white transition-colors">
          <UIcon :name="useIcon('PlayerSkipBack')" class="w-5 h-5 fill-current" />
        </button>

        <!-- 播放/暂停 -->
        <button @click="musicStore.togglePlay"
          class="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-xl">
          <UIcon :name="musicStore.isPlaying ? useIcon('PlayerPause') : useIcon('PlayerPlay')"
            class="w-6 h-6 fill-current" />
        </button>

        <!-- 下一首 -->
        <button class="text-white/40 hover:text-white transition-colors">
          <UIcon :name="useIcon('PlayerSkipForward')" class="w-5 h-5 fill-current" />
        </button>
      </div>

      <!-- Extra -->
      <div class="hidden md:flex items-center gap-4 shrink-0 min-w-[150px] justify-end">
        <UIcon :name="useIcon('PlayerVolume')" class="w-4 h-4 text-white/40" />
        <div class="w-24 h-1 bg-white/10 rounded-full overflow-hidden">
          <div class="w-2/3 h-full bg-white/40"></div>
        </div>
        <button class="text-white/40 hover:text-white ml-2">
          <UIcon name="i-lucide-more-horizontal" class="w-5 h-5" />
        </button>
      </div>

      <!-- Mini Progress -->
      <div class="absolute top-0 left-0 right-0 h-[3px] bg-white/5 rounded-t-2xl overflow-hidden">
        <div class="h-full bg-primary/60 w-1/3 transition-all duration-300"></div>
      </div>
    </div>
  </Transition>
</template>

<script lang="ts" setup>
import { useMusicStore } from '@/stores/music'
const musicStore = useMusicStore()
</script>

<style scoped>
.shadow-3lx {
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
}
</style>
