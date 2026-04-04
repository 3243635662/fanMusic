<script lang="ts" setup>
import { useMusicStore } from '@/stores/music'
const musicStore = useMusicStore()

// 音频引用
const audioRef = ref<HTMLAudioElement | null>(null)

// 播放进度
const currentTime = ref(0)
const duration = ref(0)

// 格式化时间 00:00
const formatTime = (seconds: number) => {
  if (!seconds) return '00:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

// 进度条百分比
const progressPercent = computed(() => {
  if (!duration.value) return 0
  return (currentTime.value / duration.value) * 100
})

// 音频元数据加载完成
const onLoadedMetadata = () => {
  if (audioRef.value) duration.value = audioRef.value.duration
}

// 播放时间更新
const onTimeUpdate = () => {
  if (audioRef.value) currentTime.value = audioRef.value.currentTime
}

// 拖动进度条
const handleSeek = (e: Event) => {
  const val = (e.target as HTMLInputElement).value
  if (audioRef.value) {
    audioRef.value.currentTime = (parseFloat(val) / 100) * duration.value
  }
}

// 调整音量 (直接获取 0-1 的值)
const handleVolume = (e: Event) => {
  const val = (e.target as HTMLInputElement).value
  musicStore.volume = parseFloat(val)
}

// 监听 Store 音量变化同步到 audio 标签
watch(() => musicStore.volume, (newVol) => {
  if (audioRef.value) audioRef.value.volume = newVol
}, { immediate: true })

// 控制核心播放逻辑
watch([() => musicStore.currentTrack?.url, () => musicStore.isPlaying], ([url, isPlaying]) => {
  if (!audioRef.value) return;

  if (url && isPlaying) {
    nextTick(() => {
      audioRef.value?.play().catch(e => {
        if (e.name !== 'AbortError') console.error('播放失败:', e);
      });
    });
  } else {
    audioRef.value.pause();
  }
}, { immediate: true });

// 获取播放模式图标
const getModeIcon = computed(() => {
  switch (musicStore.playMode) {
    case 'single': return 'i-solar:repeat-one-bold'
    case 'random': return 'i-solar:shuffle-bold'
    case 'sequence': return 'i-solar:playlist-bold'
    case 'loop': default: return 'i-solar:repeat-bold'
  }
})
</script>

<template>
  <Transition enter-active-class="transform transition duration-500 ease-out"
    enter-from-class="translate-y-full opacity-0" enter-to-class="translate-y-0 opacity-100"
    leave-active-class="transform transition duration-300 ease-in" leave-from-class="translate-y-0 opacity-100"
    leave-to-class="translate-y-full opacity-0">
    <div v-if="musicStore.currentTrack"
      class="fixed bottom-10 left-1/2 -translate-x-1/2 w-[90%] max-w-[900px] h-24 bg-black/40 backdrop-blur-3xl border border-white/10 rounded-3xl shadow-[0_30px_60px_-12px_rgba(0,0,0,0.8)] z-50 px-6 flex items-center gap-8 group hover:cursor-pointer">

      <!-- [隐藏] 核心音频播放器 -->
      <audio ref="audioRef" :src="musicStore.currentTrack?.url || ''" @ended="musicStore.playNext"
        @timeupdate="onTimeUpdate" @loadedmetadata="onLoadedMetadata" class="hidden"></audio>

      <!-- Track Info -->
      <div class="flex items-center gap-4 min-w-[180px] w-1/4">
        <!-- CD Vinyl Style Cover -->
        <div
          class="w-16 h-16 rounded-full overflow-hidden shadow-[0_0_20px_rgba(0,0,0,0.5)] bg-black relative group/art shrink-0 border-2 border-white/5"
          :class="{ 'animate-spin-slow': musicStore.isPlaying, 'animation-paused': !musicStore.isPlaying }">
          <img v-if="processCover(musicStore.currentTrack?.cover)" :src="processCover(musicStore.currentTrack.cover)"
            class="w-full h-full object-cover transition-all duration-700" />
          <div v-else class="w-full h-full flex items-center justify-center">
            <UIcon :name="useIcon('music')" class="w-6 h-6 text-white/20" />
          </div>
          <!-- Center Hole Effect -->
          <div class="absolute inset-0 flex items-center justify-center">
            <div class="w-4 h-4 rounded-full bg-black/90 border border-white/10 shadow-inner"></div>
          </div>
        </div>
        <div class="flex-1 min-w-0 pr-2">
          <h4 class="text-[15px] font-black text-white truncate mb-0.5">
            {{ musicStore.currentTrack?.name }}
          </h4>
          <p class="text-[12px] text-white/40 font-medium truncate">
            {{ musicStore.currentTrack?.artist }}
          </p>
        </div>
      </div>

      <!-- Controls & Progress -->
      <div class="flex-1 flex flex-col items-center gap-2 max-w-[400px]">
        <!-- Buttons -->
        <div class="flex items-center gap-7">
          <button @click="musicStore.togglePlayMode"
            class="text-white/30 hover:text-primary transition-all active:scale-90">
            <UIcon :name="getModeIcon" class="w-5 h-5" />
          </button>

          <button @click="musicStore.playPrev" class="text-white/60 hover:text-white transition-all active:scale-90">
            <UIcon :name="useIcon('PlayerSkipBack')" class="w-6 h-6 fill-current" />
          </button>

          <button @click="musicStore.togglePlay"
            class="w-12 h-12 rounded-2xl bg-primary text-black flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-[0_0_20px_rgba(var(--color-primary-rgb),0.3)]">
            <UIcon :name="musicStore.isPlaying ? useIcon('PlayerPause') : useIcon('PlayerPlay')"
              class="w-7 h-7 fill-current" />
          </button>

          <button @click="musicStore.playNext" class="text-white/60 hover:text-white transition-all active:scale-90">
            <UIcon :name="useIcon('PlayerSkipForward')" class="w-6 h-6 fill-current" />
          </button>

          <button class="text-white/30 hover:text-white transition-all">
            <UIcon name="i-solar:heart-bold" class="w-5 h-5" />
          </button>
        </div>

        <!-- Progress Bar -->
        <div class="w-full flex items-center gap-3">
          <span class="text-[10px] font-mono text-white/30 w-10 text-right">{{ formatTime(currentTime) }}</span>
          <div class="relative flex-1 group/progress h-6 flex items-center px-1">
            <input type="range" min="0" max="100" step="0.1" :value="progressPercent" @input="handleSeek"
              class="custom-slider w-full" :style="{ '--progress': progressPercent + '%' }" />
          </div>
          <span class="text-[10px] font-mono text-white/30 w-10">{{ formatTime(duration) }}</span>
        </div>
      </div>

      <!-- Extra (Volume) -->
      <div class="hidden lg:flex items-center gap-4 w-1/4 justify-end shrink-0">
        <button @click="musicStore.volume = musicStore.volume > 0 ? 0 : 0.7">
          <UIcon :name="musicStore.volume > 0 ? 'i-solar:volume-loud-bold' : 'i-solar:volume-cross-bold'"
            class="w-5 h-5 text-white/40 hover:text-white transition-colors" />
        </button>
        <div class="w-24 group/vol flex items-center">
          <input type="range" min="0" max="1" step="0.01" :value="musicStore.volume" @input="handleVolume"
            class="custom-slider w-full" :style="{ '--progress': (musicStore.volume * 100) + '%' }" />
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
/* 核心自定义滑动条样式 - 针对所有 Range Input 统一优化 */
.custom-slider {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 4px;
  /* 轨道高度 */
  background: linear-gradient(to right,
      rgba(255, 255, 255, 0.4) 0%,
      rgba(255, 255, 255, 0.4) var(--progress),
      rgba(255, 255, 255, 0.1) var(--progress),
      rgba(255, 255, 255, 0.1) 100%);
  border-radius: 2px;
  outline: none;
  cursor: pointer;
  transition: background 0.2s;
}

/* 针对音量条特殊的 Hover 变色逻辑 */
.group\/vol:hover .custom-slider {
  background: linear-gradient(to right,
      #fff 0%,
      #fff var(--progress),
      rgba(255, 255, 255, 0.1) var(--progress),
      rgba(255, 255, 255, 0.1) 100%);
}

/* 进度条特殊的 Hover 变色逻辑 */
.group\/progress:hover .custom-slider {
  background: linear-gradient(to right,
      var(--color-primary, #fff) 0%,
      var(--color-primary, #fff) var(--progress),
      rgba(255, 255, 255, 0.1) var(--progress),
      rgba(255, 255, 255, 0.1) 100%);
}

/* 滑块样式 (Webkit) */
.custom-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 12px;
  height: 12px;
  background: #fff;
  border-radius: 50%;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
  opacity: 0;
  transition: opacity 0.2s, transform 0.2s;
}

/* Hover 时显现滑块并轻微放大 */
.group\/vol:hover .custom-slider::-webkit-slider-thumb,
.group\/progress:hover .custom-slider::-webkit-slider-thumb {
  opacity: 1;
}

.custom-slider:active::-webkit-slider-thumb {
  transform: scale(1.2);
}

/* 移除播放条原有的样式 */
@keyframes spin-slow {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

.animate-spin-slow {
  animation: spin-slow 15s linear infinite;
}

.animation-paused {
  animation-play-state: paused;
}
</style>
