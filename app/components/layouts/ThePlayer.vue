<script lang="ts" setup>
import { useMusicStore } from '@/stores/music'
import { usePixi } from '@/composables/usePixi'
import { Graphics } from 'pixi.js'

const musicStore = useMusicStore()

// 控制展开/收起状态
const isFold = ref(false)

// PixiJS 背景画布
const pixiCanvas = ref<HTMLCanvasElement | null>(null)
const { initApp, destroyApp } = usePixi()

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

// 调整音量
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

// === 喜爱/收藏 特效逻辑 ===
const likedTracks = reactive<Set<string>>(new Set())
const floatingHearts = ref<{ id: number, x: number, y: number, color: string, scale: number, rotation: number }[]>([])
let heartIdCounter = 0

const isLiked = computed(() => {
  if (!musicStore.currentTrack || !musicStore.currentTrack.hash) return false
  return likedTracks.has(musicStore.currentTrack.hash)
})

const toggleLike = (e: MouseEvent) => {
  if (!musicStore.currentTrack || !musicStore.currentTrack.hash) return
  const hash = musicStore.currentTrack.hash

  if (likedTracks.has(hash)) {
    likedTracks.delete(hash) // 取消喜欢
  } else {
    likedTracks.add(hash) // 添加喜欢
    triggerFloatingHearts(e)
  }
}

const triggerFloatingHearts = (e: MouseEvent) => {
  const count = Math.floor(Math.random() * 4) + 4 // 生成 4 到 7 个心心
  const colors = ['text-red-500', 'text-pink-500', 'text-rose-400', 'text-red-400']

  for (let i = 0; i < count; i++) {
    floatingHearts.value.push({
      id: heartIdCounter++,
      x: e.clientX + (Math.random() - 0.5) * 30 - 12, // 修正鼠标居中
      y: e.clientY + (Math.random() - 0.5) * 20 - 12,
      color: colors[Math.floor(Math.random() * colors.length)] || 'text-red-500',
      scale: Math.random() * 0.4 + 0.6,
      rotation: (Math.random() - 0.5) * 60
    })
  }

  // 清理
  setTimeout(() => {
    floatingHearts.value.splice(0, count)
  }, 1500)
}

const processCover = (url: string) => {
  if (!url) return "";
  if (url.includes("{size}")) return url.replace("{size}", "400");
  return url;
};

onMounted(async () => {
  if (import.meta.client && pixiCanvas.value) {
    try {
      // 初始化 PixiJS 获得优雅上升的气泡特效
      const app = await initApp({
        canvas: pixiCanvas.value,
        backgroundAlpha: 0,
        resizeTo: pixiCanvas.value.parentElement || window,
      });

      const particles: any[] = [];
      // 清新梦幻的多彩色系
      const colors = [
        0xffffff, // 纯白
        0x1DB954, // Primary绿
        0xff007f, // 赛博粉
        0x00f0ff, // 霓虹青
        0xffd700, // 晨曦黄
        0x8a2be2  // 梦幻紫
      ];

      // 泡泡数翻三倍，增加至 60 个
      for (let i = 0; i < 200; i++) {
        const circle = new Graphics();
        // 泡泡大小也更有层次感
        circle.circle(0, 0, Math.random() * 4 + 1);
        circle.fill({ color: colors[Math.floor(Math.random() * colors.length)], alpha: Math.random() * 0.4 + 0.1 });

        const particle = {
          sprite: circle,
          x: Math.random() * 300,
          y: Math.random() * 800,
          speedY: Math.random() * 0.6 + 0.2,
          speedX: (Math.random() - 0.5) * 0.3,
        };

        circle.x = particle.x;
        circle.y = particle.y;

        app.stage.addChild(circle);
        particles.push(particle);
      }

      app.ticker.add(() => {
        particles.forEach(p => {
          p.y -= p.speedY;
          p.x += p.speedX;
          if (p.y < -10) {
            p.y = 800;
            p.x = Math.random() * 300;
          }
          p.sprite.x = p.x;
          p.sprite.y = p.y;
        });
      });
    } catch (err) {
      console.warn("PixiJS bubbles initialization failed:", err);
    }
  }
})

onBeforeUnmount(() => {
  destroyApp();
})
</script>

<template>
  <Transition enter-active-class="transform transition duration-700 ease-out"
    enter-from-class="translate-x-full opacity-0" enter-to-class="translate-x-0 opacity-100"
    leave-active-class="transform transition duration-500 ease-in" leave-from-class="translate-x-0 opacity-100"
    leave-to-class="translate-x-full opacity-0">
    <div v-show="musicStore.currentTrack"
      class="h-full flex flex-col py-6 bg-white/5 border-l border-white/10 rounded-r-4xl relative overflow-hidden backdrop-blur-2xl transition-all duration-300 ease-in-out shrink-0"
      :class="isFold ? 'w-[75px] px-2' : 'w-[260px] px-5'">

      <!-- Pixi Canvas 背景特效 -->
      <canvas ref="pixiCanvas" class="absolute inset-0 pointer-events-none opacity-40 z-0"></canvas>

      <div class="relative z-10 flex flex-col h-full items-center min-w-0 w-full">
        <!-- [隐藏] 核心音频播放器 -->
        <audio ref="audioRef" :src="musicStore.currentTrack?.url || ''" @ended="musicStore.playNext"
          @timeupdate="onTimeUpdate" @loadedmetadata="onLoadedMetadata" class="hidden"
          @waiting="musicStore.isBuffering = true" @playing="musicStore.isBuffering = false"
          @canplay="musicStore.isBuffering = false" @pause="musicStore.isBuffering = false"></audio>

        <!-- Fold Toggle 按钮 -->
        <div class="flex items-center mb-6 w-full shrink-0" :class="isFold ? 'justify-center' : 'justify-end'">
          <button v-if="!isFold" @click="isFold = true"
            class="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition cursor-pointer shadow-sm">
            <UIcon :name="useIcon('foldUp')" class="w-4 h-4 text-white/80 rotate-90" />
          </button>
          <button v-else @click="isFold = false"
            class="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition cursor-pointer shadow-sm">
            <UIcon :name="useIcon('foldDown')" class="w-4 h-4 text-white/80 -rotate-90" />
          </button>
        </div>

        <!-- Section 1: Artwork & Info -->
        <div class="flex flex-col items-center text-center transition-all duration-300 w-full shrink-0"
          :class="isFold ? 'space-y-4' : 'space-y-5'">
          <!-- CD Vinyl Style Cover -->
          <div
            class="rounded-full overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] bg-black relative shrink-0 border-4 border-white/5 transition-all duration-500"
            :class="[
              { 'animate-spin-slow': musicStore.isPlaying, 'animation-paused': !musicStore.isPlaying },
              isFold ? 'w-12 h-12 border-2 mt-4' : 'w-48 h-48'
            ]">
            <NuxtImg v-if="processCover(musicStore.currentTrack?.cover || '')"
              :src="processCover(musicStore.currentTrack?.cover || '')"
              class="w-full h-full object-cover transition-all duration-700" alt="Track Cover" />
            <div v-else class="w-full h-full flex items-center justify-center">
              <UIcon :name="useIcon('music')" class="text-white/5" :class="isFold ? 'w-4 h-4' : 'w-10 h-10'" />
            </div>
            <!-- Center Hole -->
            <div class="absolute inset-0 flex items-center justify-center">
              <div class="rounded-full bg-black border border-white/10 shadow-inner"
                :class="isFold ? 'w-2 h-2 border-0' : 'w-6 h-6'"></div>
            </div>
          </div>

          <Transition name="fade">
            <div v-show="!isFold" class="space-y-1 w-full flex flex-col items-center min-w-0 mt-3">
              <h4 class="text-[18px] font-black text-white truncate max-w-full px-2 leading-tight">
                {{ musicStore.currentTrack?.name }}
              </h4>
              <p class="text-[14px] text-white/50 font-bold tracking-tight">
                {{ musicStore.currentTrack?.artist }}
              </p>
            </div>
          </Transition>
        </div>

        <!-- Section 2: Progress & Main Controls -->
        <div class="flex-1 w-full flex flex-col justify-end relative">
          <!-- Folded View Controls (Just Play/Pause) -->
          <Transition name="fade">
            <div v-show="isFold" class="absolute inset-x-0 bottom-0 flex flex-col items-center gap-6 pb-2">
              <button @click="musicStore.playNext"
                class="text-white/30 hover:text-white transition-all active:scale-90 pb-3 border-b border-white/10">
                <UIcon :name="useIcon('PlayerSkipForward')" class="w-5 h-5" />
              </button>
              <button @click="musicStore.togglePlay"
                class="w-10 h-10 rounded-xl bg-primary text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-[0_5px_15px_rgba(var(--color-primary-rgb),0.3)]">
                <UIcon v-if="musicStore.isLoadingUrl || musicStore.isBuffering" name="lucide:loader-circle"
                  class="w-5 h-5 animate-spin" />
                <UIcon v-else :name="musicStore.isPlaying ? useIcon('PlayerPause') : useIcon('PlayerPlay')"
                  class="w-5 h-5" />
              </button>
            </div>
          </Transition>

          <!-- Expanded View Controls -->
          <Transition name="fade">
            <div v-show="!isFold" class="w-full space-y-5 pb-6">
              <!-- Progress Bar -->
              <div class="space-y-2">
                <div class="relative group/progress h-4 flex items-center">
                  <input type="range" min="0" max="100" step="0.1" :value="progressPercent" @input="handleSeek"
                    class="custom-slider w-full" :style="{ '--progress': progressPercent + '%' }" />
                </div>
                <div
                  class="flex justify-between text-[14px] font-bold font-mono text-white/70 uppercase tracking-tight px-2">
                  <span>{{ formatTime(currentTime) }}</span>
                  <span>{{ formatTime(duration) }}</span>
                </div>
              </div>

              <!-- Buttons Grid -->
              <div class="flex flex-col gap-6">
                <div class="flex items-center justify-between px-2">
                  <button @click="musicStore.playPrev"
                    class="text-white/40 hover:text-white transition-all active:scale-90">
                    <UIcon :name="useIcon('PlayerSkipBack')" class="w-9 h-9" />
                  </button>

                  <button @click="musicStore.togglePlay"
                    class="w-16 h-16 rounded-[22px] bg-primary text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-[0_12px_30px_rgba(var(--color-primary-rgb),0.4)]">
                    <UIcon v-if="musicStore.isLoadingUrl || musicStore.isBuffering" name="lucide:loader-circle"
                      class="w-8 h-8 animate-spin" />
                    <UIcon v-else :name="musicStore.isPlaying ? useIcon('PlayerPause') : useIcon('PlayerPlay')"
                      class="w-8 h-8" />
                  </button>

                  <button @click="musicStore.playNext"
                    class="text-white/40 hover:text-white transition-all active:scale-90">
                    <UIcon :name="useIcon('PlayerSkipForward')" class="w-9 h-9" />
                  </button>
                </div>

                <div class="flex items-center justify-between px-3 pt-4 gap-4">
                  <button @click="musicStore.togglePlayMode" class="text-white/40 hover:text-primary transition-all">
                    <UIcon :name="getModeIcon" class="w-5 h-5" />
                  </button>

                  <div class="flex items-center gap-3 group/vol flex-1">
                    <UIcon :name="musicStore.volume > 0 ? 'i-solar:volume-loud-bold' : 'i-solar:volume-cross-bold'"
                      class="w-5 h-5 text-white/20 group-hover/vol:text-primary transition-colors" />
                    <input type="range" min="0" max="1" step="0.01" :value="musicStore.volume" @input="handleVolume"
                      class="custom-slider" :style="{ '--progress': (musicStore.volume * 100) + '%' }" />
                  </div>

                  <button @click="toggleLike" class="transition-all duration-300 relative outline-none"
                    :class="isLiked ? 'text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.6)]' : 'text-white/40 hover:text-white'">
                    <UIcon name="i-solar:heart-bold" class="w-5 h-5 transition-transform duration-300"
                      :class="{ 'animate-heart-pop': isLiked }" />
                  </button>
                </div>
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </div>
  </Transition>

  <!-- 飘动爱心挂载点 -->
  <Teleport to="body">
    <div v-for="heart in floatingHearts" :key="heart.id" class="fixed pointer-events-none z-99999"
      :style="{ left: heart.x + 'px', top: heart.y + 'px', transform: `scale(${heart.scale}) rotate(${heart.rotation}deg)` }">
      <UIcon name="i-solar:heart-bold" class="w-6 h-6 drop-shadow-md animate-float-up" :class="heart.color" />
    </div>
  </Teleport>
</template>

<style scoped>
/* 核心自定义滑动条样式 - 针对所有 Range Input 统一美化 */
.custom-slider {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 2.5px;
  background: linear-gradient(to right,
      var(--ui-primary) 0%,
      var(--ui-primary) var(--progress),
      rgba(255, 255, 255, 0.08) var(--progress),
      rgba(255, 255, 255, 0.08) 100%);
  border-radius: 4px;
  outline: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

/* 滑块样式 (Webkit) */
.custom-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 10px;
  height: 10px;
  background: #fff;
  border-radius: 50%;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
  opacity: 0;
  transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.custom-slider:hover::-webkit-slider-thumb {
  opacity: 1;
  transform: scale(1.2);
}

.custom-slider:active::-webkit-slider-thumb {
  transform: scale(1.1);
  box-shadow: 0 0 10px var(--ui-primary);
}

.custom-scrollbar::-webkit-scrollbar {
  width: 2px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
}

@keyframes spin-slow {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

.animate-spin-slow {
  animation: spin-slow 25s linear infinite;
}

.animation-paused {
  animation-play-state: paused;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* === 爱心爆动特效 === */
@keyframes heart-pop {
  0% {
    transform: scale(1);
  }

  50% {
    transform: scale(1.5);
  }

  100% {
    transform: scale(1);
  }
}

.animate-heart-pop {
  animation: heart-pop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes float-up {
  0% {
    transform: translateY(0);
    opacity: 1;
  }

  100% {
    transform: translateY(-90px) scale(1.3);
    opacity: 0;
  }
}

.animate-float-up {
  animation: float-up 1.2s cubic-bezier(0.25, 1, 0.5, 1) forwards;
}
</style>
