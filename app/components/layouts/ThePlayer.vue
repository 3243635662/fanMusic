<script lang="ts" setup>
import { useMusicStore } from '@/stores/music'
import { usePixi } from '@/composables/usePixi'
import { Graphics } from 'pixi.js'

const musicStore = useMusicStore()
const settingsStore = useSettingsStore()
const route = useRoute()
const { isFoldPlayer, isHiddenPlayer } = storeToRefs(settingsStore)

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
  if (audioRef.value) {
    duration.value = audioRef.value.duration
    musicStore.totalTime = duration.value
  }
}

// 播放时间更新
const onTimeUpdate = () => {
  if (audioRef.value) {
    currentTime.value = audioRef.value.currentTime
    musicStore.currentTime = currentTime.value
  }
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

watch(() => musicStore.currentTrack, (newTrack) => {
  if (newTrack) {
    isHiddenPlayer.value = false;
    // 触发气泡爆发特效
    triggerBurst();
  }
});

let triggerBurst = () => { }; // 预定义占位符函数

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
  const count = Math.floor(Math.random() * 4) + 4
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
      let burstFactor = 1.0; // 本地爆发因子

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
        // 爆发衰减：每一帧向 1.0 靠拢
        if (burstFactor > 1) burstFactor -= 0.6;
        if (burstFactor < 1) burstFactor = 1;

        particles.forEach(p => {
          // 在折叠/展开瞬间享受加速快感
          p.y -= p.speedY * burstFactor;
          p.x += p.speedX;
          if (p.y < -10) {
            p.y = 800;
            p.x = Math.random() * 300;
          }
          p.sprite.x = p.x;
          p.sprite.y = p.y;
        });
      });

      // 监听折叠动作，触发气泡爆发
      watch(isFoldPlayer, () => {
        burstFactor = 20.0;
      });

      triggerBurst = () => {
        burstFactor = 25.0;
      };
    } catch (err) {
      console.warn("PixiJS bubbles initialization failed:", err);
    }
  }
})

onBeforeUnmount(() => {
  if (import.meta.client) {
    destroyApp(); // 销毁并清理资源
  }
})
</script>

<template>
  <!-- ?全局套用过渡 -->
  <Transition enter-active-class="transform transition duration-700 ease-out"
    enter-from-class="translate-x-full opacity-0" enter-to-class="translate-x-0 opacity-100"
    leave-active-class="transform transition duration-300 ease-in" leave-from-class="translate-x-0 opacity-100"
    leave-to-class="translate-x-full opacity-0">

    <div v-show="musicStore.currentTrack && !isHiddenPlayer"
      class="h-full flex flex-col py-6 bg-white/5 border-l border-white/10 rounded-r-4xl relative overflow-hidden backdrop-blur-2xl transition-all duration-300 ease-in-out shrink-0"
      :class="isFoldPlayer ? 'w-[75px] px-2' : 'w-[260px] px-5'">

      <!-- Pixi Canvas 背景特效 -->
      <canvas ref="pixiCanvas" class="absolute inset-0 pointer-events-none z-0 transition-all duration-700"
        :class="isFoldPlayer ? 'opacity-0 scale-90 blur-lg' : 'opacity-60 scale-100 blur-0'"></canvas>

      <div class="relative z-10 flex flex-col h-full items-center min-w-0 w-full">
        <!-- ?[隐藏] 核心音频播放器 -->
        <audio ref="audioRef" :src="musicStore.currentTrack?.url || ''" @ended="musicStore.playNext"
          @timeupdate="onTimeUpdate" @loadedmetadata="onLoadedMetadata" class="hidden"
          @waiting="musicStore.isBuffering = true" @playing="musicStore.isBuffering = false"
          @canplay="musicStore.isBuffering = false" @pause="musicStore.isBuffering = false"></audio>

        <!-- ?收起展开按钮 -->
        <div class="flex items-center mb-6 w-full shrink-0 gap-3"
          :class="isFoldPlayer ? 'justify-center' : 'justify-end'">
          <LayoutsTipsButton v-if="!isFoldPlayer" @click="isHiddenPlayer = true" text="彻底隐藏" :icon="useIcon('close')"
            icon-class="w-3.5 h-3.5 text-white/80"
            class="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 shadow-sm" />

          <LayoutsTipsButton v-if="!isFoldPlayer && route.path !== '/lyric'" @click="navigateTo('/lyric')" text="歌词" :icon="useIcon('lyric')"
            icon-class="w-3.5 h-3.5 text-white/80"
            class="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 shadow-sm" />

          <LayoutsTipsButton v-if="!isFoldPlayer" @click="isFoldPlayer = true" text="收起面板" :icon="useIcon('foldUp')"
            icon-class="w-4 h-4 text-white/80 rotate-90"
            class="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 shadow-sm" />

          <LayoutsTipsButton v-else @click="isFoldPlayer = false" text="展开面板" :icon="useIcon('foldDown')"
            icon-class="w-4 h-4 text-white/80 -rotate-90"
            class="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 shadow-sm" />
        </div>


        <!-- ?专辑区域 -->
        <!-- Section 1: Artwork & Info -->
        <div class="flex flex-col items-center text-center transition-all duration-300 w-full shrink-0"
          :class="isFoldPlayer ? 'space-y-4' : 'space-y-5'">
          <!-- CD Vinyl Style Cover -->
          <div
            class="rounded-full overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] bg-black relative shrink-0 border-4 border-white/5 transition-all duration-500"
            :class="[
              { 'animate-spin-slow': musicStore.isPlaying, 'animation-paused': !musicStore.isPlaying },
              isFoldPlayer ? 'w-12 h-12 border-2 mt-4' : 'w-48 h-48'
            ]">
            <NuxtImg v-if="processCover(musicStore.currentTrack?.cover || '')"
              :src="processCover(musicStore.currentTrack?.cover || '')"
              class="w-full h-full object-cover transition-all duration-700" alt="Track Cover" />
            <div v-else class="w-full h-full flex items-center justify-center">
              <UIcon :name="useIcon('music')" class="text-white/5" :class="isFoldPlayer ? 'w-4 h-4' : 'w-10 h-10'" />
            </div>
            <!-- Center Hole -->
            <div class="absolute inset-0 flex items-center justify-center">
              <div class="rounded-full bg-black border border-white/10 shadow-inner"
                :class="isFoldPlayer ? 'w-2 h-2 border-0' : 'w-6 h-6'"></div>
            </div>
          </div>

          <!-- ?歌曲信息 -->
          <Transition name="fade">
            <div v-if="!isFoldPlayer" key="info" class="space-y-1 w-full flex flex-col items-center min-w-0 mt-3">
              <h4 class="text-[18px] font-black text-white truncate max-w-full px-2 leading-tight">
                {{ musicStore.currentTrack?.name }}
              </h4>
              <p class="text-[14px] text-white/50 font-bold tracking-tight">
                {{ musicStore.currentTrack?.artist }}
              </p>
            </div>
          </Transition>
        </div>

        <!-- ?控制中心 -->
        <div class="flex-1 w-full flex flex-col justify-end relative">
          <Transition name="fade" mode="out-in">
            <!-- Folded View Controls (Just Play/Pause) -->
            <div v-if="isFoldPlayer" key="folded"
              class="absolute inset-x-0 bottom-0 flex flex-col items-center gap-6 pb-2">
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

            <!-- Expanded View Controls -->
            <div v-else key="expanded" class="w-full space-y-5 pb-6">
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
                  <LayoutsTipsButton @click="musicStore.togglePlayMode" text="切换播放模式"
                    class="text-white/40 hover:text-primary transition-all" :icon="getModeIcon" icon-class="w-5 h-5" />

                  <div class="flex items-center gap-3 group/vol flex-1">
                    <UIcon :name="musicStore.volume > 0 ? 'i-solar:volume-loud-bold' : 'i-solar:volume-cross-bold'"
                      class="w-5 h-5 text-white/20 group-hover/vol:text-primary transition-colors" />
                    <input type="range" min="0" max="1" step="0.01" :value="musicStore.volume" @input="handleVolume"
                      class="custom-slider" :style="{ '--progress': (musicStore.volume * 100) + '%' }" />
                  </div>

                  <LayoutsTipsButton @click="toggleLike" :text="isLiked ? '取消喜欢' : '添加到喜欢'"
                    :class="isLiked ? 'text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.6)]' : 'text-white/40 hover:text-white'"
                    icon="i-solar:heart-bold"
                    :icon-class="['w-5 h-5 transition-transform duration-300', { 'animate-heart-pop': isLiked }]" />
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

.fade-enter-active {
  transition: all 0.45s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.fade-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(12px) scale(0.3);
  filter: blur(4px);
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
