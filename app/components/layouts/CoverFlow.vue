<script setup lang="ts">
import { useMusicStore } from '@/stores/music'
import { usePixi } from '@/composables/usePixi'
import { Graphics } from 'pixi.js'
import type { PlayQueueTrackType } from '#shared/types/music'

const musicStore = useMusicStore()
const settingsStore = useSettingsStore()


// ===== 内置进度控制 (使用全局音频实例) =====
const handleSeek = (e: Event) => {
  const val = (e.target as HTMLInputElement).value
  const audio = (musicStore as any)._audio as HTMLAudioElement
  if (audio && musicStore.totalTime) {
    audio.currentTime = (parseFloat(val) / 100) * musicStore.totalTime
  }
}

// ===== PixiJS 全局特效联动 =====
const { globalApp, atmosphereLayer, isGlobalReady } = usePixi()
let triggerBurst = () => { }
let localTicker: ((ticker: any) => void) | null = null

// ===== Cover Flow 核心状态 =====
const activeIndex = ref(0)
const isDragging = ref(false)
const dragStartX = ref(0)
const dragDelta = ref(0)
const tracks = computed(() => musicStore.playQueue)

watch(() => musicStore.currentTrack?.hash, (hash) => {
  if (!hash) return
  const idx = tracks.value.findIndex(t => t.hash === hash)
  if (idx !== -1) activeIndex.value = idx
}, { immediate: true })

watch(activeIndex, () => { triggerBurst() })

// ===== 3D 参数 =====
const config = reactive({
  perspective: 1200, xOffset: 180, zOffset: 140, rotateY: 48,
  maxVisible: 4, cardWidth: 280, cardHeight: 340,
})

function getCardStyle(index: number) {
  const rawOffset = index - activeIndex.value
  const absOffset = Math.abs(rawOffset)
  if (absOffset > config.maxVisible) {
    return { transform: `translateX(${rawOffset > 0 ? 800 : -800}px) translateZ(-600px) rotateY(0deg)`, opacity: 0, zIndex: 0, pointerEvents: 'none' as const, transition: 'all 0.5s cubic-bezier(0.23, 1, 0.32, 1)' }
  }
  const drag = isDragging.value ? dragDelta.value * 0.3 : 0
  const ease = isDragging.value ? 'none' : 'all 0.65s cubic-bezier(0.23, 1, 0.32, 1)'
  if (rawOffset === 0) {
    return { transform: `translateX(${drag}px) translateZ(60px) rotateY(0deg) scale(1)`, zIndex: 100, opacity: 1, filter: 'brightness(1.05)', transition: ease }
  }
  const sign = Math.sign(rawOffset)
  const x = sign * (config.xOffset + (absOffset - 1) * 90) + drag
  const z = -absOffset * config.zOffset
  const ry = -sign * config.rotateY
  return { transform: `translateX(${x}px) translateZ(${z}px) rotateY(${ry}deg) scale(${Math.max(0.6, 1 - absOffset * 0.08)})`, zIndex: 100 - absOffset * 10, opacity: Math.max(0, 1 - absOffset * 0.2), filter: `brightness(${Math.max(0.5, 1 - absOffset * 0.15)})`, transition: ease }
}

function getReflectionOpacity(index: number) { return Math.max(0, 0.3 - Math.abs(index - activeIndex.value) * 0.08) }

function handleCardClick(index: number, track: PlayQueueTrackType) {
  if (index === activeIndex.value) {
    musicStore.currentTrack?.hash === track.hash ? musicStore.togglePlay() : musicStore.playTrack(track)
  } else { activeIndex.value = index }
}

function handleKeydown(e: KeyboardEvent) {
  switch (e.key) {
    case 'ArrowLeft': e.preventDefault(); prev(); break
    case 'ArrowRight': e.preventDefault(); next(); break
    case ' ': case 'Enter': e.preventDefault(); if (tracks.value[activeIndex.value]) handleCardClick(activeIndex.value, tracks.value[activeIndex.value]!); break
    case 'Escape': e.preventDefault(); exitCoverFlow(); break
  }
}

function onPointerDown(e: PointerEvent) { isDragging.value = true; dragStartX.value = e.clientX; dragDelta.value = 0 }
function onPointerMove(e: PointerEvent) { if (!isDragging.value) return; dragDelta.value = e.clientX - dragStartX.value }
function onPointerUp() { if (!isDragging.value) return; isDragging.value = false; if (dragDelta.value > 60) prev(); else if (dragDelta.value < -60) next(); dragDelta.value = 0 }

let wheelLock: ReturnType<typeof setTimeout> | null = null
function handleWheel(e: WheelEvent) {
  e.preventDefault(); if (wheelLock) return
  e.deltaY > 0 || e.deltaX > 0 ? next() : prev()
  wheelLock = setTimeout(() => { wheelLock = null }, 200)
}
function prev() { if (activeIndex.value > 0) activeIndex.value-- }
function next() { if (activeIndex.value < tracks.value.length - 1) activeIndex.value++ }
function exitCoverFlow() { settingsStore.boxMode = false }

const activeTrack = computed(() => tracks.value[activeIndex.value] || null)
const isActiveTrackPlaying = computed(() => musicStore.currentTrack?.hash === activeTrack.value?.hash && musicStore.isPlaying)
const progressPercent = computed(() => musicStore.totalTime ? (musicStore.currentTime / musicStore.totalTime) * 100 : 0)
const formatTime = (s: number) => s ? `${Math.floor(s / 60).toString().padStart(2, '0')}:${Math.floor(s % 60).toString().padStart(2, '0')}` : '00:00'


// ===== 核心 PixiJS 逻辑：挂载到全局 Layer =====
const isComponentMounted = ref(true)
let mountCheckTimer: any = null

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
  if (import.meta.client) {
    // 轮询检查全局 App 是否就绪，但增加组件存活检查
    mountCheckTimer = setInterval(() => {
      if (!isComponentMounted.value) {
        clearInterval(mountCheckTimer)
        return
      }
      if (globalApp.value && atmosphereLayer.value) {
        clearInterval(mountCheckTimer)
        initAtmosphericBubbles(globalApp.value, atmosphereLayer.value)
      }
    }, 100)
    setTimeout(() => { if (mountCheckTimer) clearInterval(mountCheckTimer) }, 5000)
  }
})

onBeforeUnmount(() => {
  isComponentMounted.value = false
  window.removeEventListener('keydown', handleKeydown)
  if (wheelLock) clearTimeout(wheelLock)
  if (mountCheckTimer) clearInterval(mountCheckTimer)

  // 彻底清理 Ticker
  if (globalApp.value && localTicker) {
    globalApp.value.ticker.remove(localTicker)
    localTicker = null
  }
  // atmosphereLayer 是全局共享的，只清理子元素，不销毁容器本身
  // 使用延迟销毁避免在渲染管线中销毁 GPU 资源导致 BindGroup 错误
  if (atmosphereLayer.value) {
    const children = atmosphereLayer.value.removeChildren()
    queueMicrotask(() => {
      children.forEach(c => c.destroy({ children: true }))
    })
  }
})

const initAtmosphericBubbles = (app: any, layer: any) => {
  interface Bubble { sprite: Graphics, x: number, y: number, speedY: number, wobbleSpeed: number, wobbleAmp: number, phaseOffset: number, baseAlpha: number, radius: number, isBurst: boolean, life: number }
  const bubbles: Bubble[] = []; let burstFactor = 1.0; let globalTime = 0
  // 延迟销毁队列：不在 ticker 回调中直接销毁精灵，避免渲染管线中 BindGroup 引用已释放的 GPU 资源
  const pendingDestroy: Graphics[] = []
  const colors = [0x88e0ef, 0x00f0ff, 0xffffff, 0xa8edea, 0x60a5fa, 0x4ade80, 0xc4b5fd, 0x67e8f9]
  const createG = (radius: number, color: number, alpha: number) => {
    const g = new Graphics(); g.circle(0, 0, radius); g.stroke({ color, alpha: Math.min(alpha * 3, 0.8), width: radius > 14 ? 2 : 1.2 }); g.circle(0, 0, radius * 0.9); g.fill({ color, alpha: alpha * 0.5 }); g.circle(-radius * 0.28, -radius * 0.28, radius * 0.25); g.fill({ color: 0xffffff, alpha: Math.min(alpha * 2.5, 0.7) }); return g
  }
  for (let i = 0; i < 50; i++) {
    const r = Math.random() * 20 + 5; const c = colors[Math.floor(Math.random() * colors.length)]!; const a = Math.random() * 0.3 + 0.15; const g = createG(r, c, a)
    const b = { sprite: g, x: Math.random() * app.screen.width, y: Math.random() * app.screen.height + app.screen.height, speedY: Math.random() * 0.35 + 0.1, wobbleSpeed: Math.random() * 1.5 + 0.5, wobbleAmp: Math.random() * 30 + 10, phaseOffset: Math.random() * Math.PI * 2, baseAlpha: a, radius: r, isBurst: false, life: -1 }
    g.x = b.x; g.y = b.y; layer.addChild(g); bubbles.push(b)
  }
  const spawn = () => {
    for (let i = 0; i < 20; i++) {
      const r = Math.random() * 14 + 6; const c = colors[Math.floor(Math.random() * colors.length)]!; const a = Math.random() * 0.45 + 0.25; const g = createG(r, c, a)
      const b = { sprite: g, x: Math.random() * app.screen.width, y: app.screen.height + 50, speedY: Math.random() * 3 + 1.5, wobbleSpeed: Math.random() * 2 + 1, wobbleAmp: Math.random() * 40 + 20, phaseOffset: Math.random() * Math.PI * 2, baseAlpha: a, radius: r, isBurst: true, life: 300 }
      layer.addChild(g); bubbles.push(b)
    }
  }
  triggerBurst = () => { burstFactor = 5.0; spawn() }
  localTicker = (ticker: any) => {
    // 安全检查：确保全局 app 仍然有效
    if (!app.renderer || (app as any)._destroyed) return
    globalTime += ticker.deltaTime * 0.016; const w = app.screen.width; const h = app.screen.height; if (burstFactor > 1) burstFactor *= 0.97
    for (let i = bubbles.length - 1; i >= 0; i--) {
      const b = bubbles[i]!; b.y -= b.speedY * (b.isBurst ? 1 : burstFactor); b.x += Math.sin(globalTime * b.wobbleSpeed + b.phaseOffset) * 0.5
      let alpha = b.baseAlpha * (0.7 + (Math.sin(globalTime * 2 + b.phaseOffset) * 0.5 + 0.5) * 0.3)
      if (b.isBurst) { b.life--; if (b.life < 60) alpha *= b.life / 60; b.speedY *= 0.998 }
      b.sprite.alpha = alpha; b.sprite.scale.set(1 + Math.sin(globalTime * 1.2 + b.phaseOffset) * 0.05)
      if (b.y < -b.radius * 3) { if (b.isBurst) { layer.removeChild(b.sprite); pendingDestroy.push(b.sprite); bubbles.splice(i, 1); continue }; b.y = h + b.radius + Math.random() * 50; b.x = Math.random() * w }
      if (b.isBurst && b.life <= 0) { layer.removeChild(b.sprite); pendingDestroy.push(b.sprite); bubbles.splice(i, 1); continue }
      b.sprite.x = b.x; b.sprite.y = b.y
    }
    // 安全销毁：在渲染帧结束后批量销毁已标记的精灵，避免 BindGroup 引用已释放资源
    if (pendingDestroy.length > 0) {
      const toDestroy = pendingDestroy.splice(0)
      queueMicrotask(() => { toDestroy.forEach(g => g.destroy({ children: true })) })
    }
  }
  app.ticker.add(localTicker)
}
</script>

<template>
  <div
    class="w-full h-full flex flex-col items-center justify-center relative overflow-hidden select-none cursor-grab active:cursor-grabbing"
    @pointerdown="onPointerDown" @pointermove="onPointerMove" @pointerup="onPointerUp" @pointerleave="onPointerUp"
    @wheel.prevent="handleWheel">

    <button
      class="absolute top-8 left-9 z-200 flex items-center gap-2 px-5 py-2.5 rounded-[14px] bg-white/8 backdrop-blur-xl border border-white/10 text-white/70 text-sm font-semibold cursor-pointer transition-all duration-300 hover:bg-white/15 hover:text-white hover:-translate-x-0.5 hover:shadow-[0_8px_30px_rgba(0,0,0,0.3)]"
      @click="exitCoverFlow">
      <UIcon name="lucide:arrow-left" class="w-5 h-5" />
      <span>返回</span>
    </button>

    <div v-if="tracks.length === 0" class="flex flex-col items-center justify-center h-full gap-1 z-10">
      <UIcon name="lucide:disc-3" class="w-16 h-16 text-white/10" />
      <p class="text-white/30 mt-4 text-lg">播放队列为空</p>
    </div>

    <div v-else class="relative w-full flex-1 flex items-center justify-center z-10"
      :style="{ perspective: config.perspective + 'px' }">
      <div class="relative"
        :style="{ width: config.cardWidth + 'px', height: (config.cardHeight + 80) + 'px', transformStyle: 'preserve-3d' }">
        <div v-for="(track, index) in tracks" :key="track.hash" class="absolute top-0 left-0 cursor-pointer"
          :style="{ width: config.cardWidth + 'px', ...getCardStyle(index) }" @click="handleCardClick(index, track)">
          <div class="w-full rounded-2xl overflow-hidden relative bg-[#1a1a1a] transition-shadow duration-500" :class="isActiveTrackPlaying && index === activeIndex
            ? 'shadow-[0_25px_60px_rgba(0,0,0,0.6),0_0_1px_rgba(255,255,255,0.15)_inset,0_0_40px_rgba(74,222,128,0.2)]'
            : 'shadow-[0_25px_60px_rgba(0,0,0,0.6),0_0_1px_rgba(255,255,255,0.1)_inset]'"
            :style="{ height: config.cardHeight + 'px' }">
            <img :src="processCover(track.cover, '400')" referrerpolicy="no-referrer"
              class="w-full h-full object-cover transition-transform duration-500 hover:scale-105" :alt="track.name" />
            <div
              class="absolute bottom-0 inset-x-0 h-1/2 bg-gradient-to-t from-black/70 to-transparent pointer-events-none" />
            <Transition name="icon-fade">
              <div v-if="index === activeIndex"
                class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-black/50 backdrop-blur-lg flex items-center justify-center border border-white/15">
                <div v-if="isActiveTrackPlaying" class="flex items-end gap-[3px] h-6">
                  <span class="w-1 rounded-sm bg-primary eq-bar-1" /><span
                    class="w-1 rounded-sm bg-primary eq-bar-2" /><span
                    class="w-1 rounded-sm bg-primary eq-bar-3" /><span class="w-1 rounded-sm bg-primary eq-bar-4" />
                </div>
                <UIcon v-else name="lucide:play" class="w-8 h-8 text-white drop-shadow-lg" />
              </div>
            </Transition>
            <Transition name="info-slide">
              <div v-if="index === activeIndex" class="absolute bottom-0 inset-x-0 p-5 pointer-events-none">
                <p class="text-base font-extrabold text-white truncate drop-shadow-md">{{ track.name }}</p>
                <p class="text-[13px] font-semibold text-white/65 truncate mt-1 drop-shadow-sm">{{ track.artist }}</p>
              </div>
            </Transition>
          </div>
          <div class="w-full overflow-hidden pointer-events-none mt-0.5 rounded-2xl reflection-mask"
            :style="{ height: config.cardHeight + 'px', opacity: getReflectionOpacity(index) }">
            <img :src="processCover(track.cover, '400')" referrerpolicy="no-referrer"
              class="w-full h-full object-cover scale-y-[-1] blur-[2px] brightness-[0.4]" alt="" />
          </div>
        </div>
      </div>
    </div>

    <Transition name="bottom-slide">
      <div v-if="musicStore.currentTrack"
        class="absolute bottom-9 left-1/2 -translate-x-1/2 z-200 flex items-center py-3.5 px-8 rounded-[24px] bg-[rgba(20,20,20,0.6)] backdrop-blur-[40px] saturate-[1.8] border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.6)] min-w-[560px] gap-8"
        @pointerdown.stop>

        <!-- [左] 歌曲信息：显示当前播放的歌曲 -->
        <div class="w-32 shrink-0 min-w-0" @pointerdown.stop>
          <h2 class="text-[14px] font-extrabold text-white truncate leading-tight">{{ musicStore.currentTrack.name }}
          </h2>
          <p class="text-[11px] font-semibold text-white/45 truncate mt-0.5">{{ musicStore.currentTrack.artist }}</p>
        </div>

        <!-- [中] 进度条：与正在播放的歌曲同步 -->
        <div class="flex-1 flex items-center gap-3 min-w-0" @pointerdown.stop>
          <span class="w-[34px] text-right text-[10px] font-bold text-white/25 tabular-nums shrink-0">
            {{ formatTime(musicStore.currentTime) }}
          </span>
          <div class="flex-1 relative h-6 flex items-center">
            <input type="range" min="0" max="100" step="0.1" :value="progressPercent" class="coverflow-slider w-full"
              :style="{ '--progress': progressPercent + '%' }" @input="handleSeek" @pointerdown.stop />
          </div>
          <span class="text-[10px] w-[34px] text-left font-bold text-white/25 tabular-nums shrink-0">
            {{ formatTime(musicStore.totalTime) }}
          </span>
        </div>

        <!-- [右] 控制按钮 -->
        <div class="flex items-center gap-4 shrink-0">
          <div class="flex items-center gap-2">
            <button
              class="w-8 h-8 rounded-full flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all active:scale-90"
              @click.stop="musicStore.playPrev">
              <UIcon name="lucide:skip-back" class="w-4 h-4" />
            </button>
            <button
              class="w-11 h-11 rounded-full bg-primary text-black flex items-center justify-center transition-all shadow-[0_4px_15px_rgba(74,222,128,0.3)] hover:scale-105 active:scale-95"
              @click.stop="musicStore.togglePlay()">
              <UIcon v-if="musicStore.isBuffering" name="lucide:loader-circle" class="w-5 h-5 animate-spin" />
              <UIcon v-else :name="musicStore.isPlaying ? 'lucide:pause' : 'lucide:play'" class="w-5 h-5" />
            </button>
            <button
              class="w-8 h-8 rounded-full flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all active:scale-90"
              @click.stop="musicStore.playNext">
              <UIcon name="lucide:skip-forward" class="w-4 h-4" />
            </button>
          </div>

          <div class="h-4 w-[1px] bg-white/10" />

          <!-- 这里显示的是 CoverFlow 当前浏览的位置 -->
          <span class="text-[10px] font-bold text-white/25 tabular-nums tracking-widest shrink-0">
            {{ activeIndex + 1 }} / {{ tracks.length }}
          </span>
        </div>
      </div>
    </Transition>

    <div
      class="absolute top-8 right-9 z-200 flex gap-3 text-[11px] text-white/50 px-4 py-2 rounded-full bg-black/30 backdrop-blur-xl border border-white/8">
      <span><kbd class="kbd-hint">←</kbd> <kbd class="kbd-hint">→</kbd> 切换</span>
      <span class="text-white/15">|</span>
      <span><kbd class="kbd-hint">Space</kbd> 播放</span>
      <span class="text-white/15">|</span>
      <span><kbd class="kbd-hint">Esc</kbd> 退出</span>
    </div>
  </div>
</template>

<style scoped>
.reflection-mask {
  mask-image: linear-gradient(to bottom, rgba(0, 0, 0, 0.35) 0%, transparent 50%);
  -webkit-mask-image: linear-gradient(to bottom, rgba(0, 0, 0, 0.35) 0%, transparent 50%);
}

.eq-bar-1 {
  animation: eq-bar 0.6s infinite ease-in-out;
}

.eq-bar-2 {
  animation: eq-bar 0.8s infinite ease-in-out 0.1s;
}

.eq-bar-3 {
  animation: eq-bar 0.5s infinite ease-in-out 0.2s;
}

.eq-bar-4 {
  animation: eq-bar 0.7s infinite ease-in-out 0.15s;
}

@keyframes eq-bar {

  0%,
  100% {
    height: 6px;
  }

  50% {
    height: 22px;
  }
}

.kbd-hint {
  display: inline-block;
  padding: 1px 5px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.15);
  font-size: 10px;
  margin: 0 1px;
  color: rgba(255, 255, 255, 0.6);
}

.coverflow-slider {
  -webkit-appearance: none;
  appearance: none;
  height: 3px;
  background: linear-gradient(to right, var(--ui-primary) 0%, var(--ui-primary) var(--progress), rgba(255, 255, 255, 0.1) var(--progress), rgba(255, 255, 255, 0.1) 100%);
  border-radius: 4px;
  outline: none;
  cursor: pointer;
}

.coverflow-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 10px;
  height: 10px;
  background: #fff;
  border-radius: 50%;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.coverflow-slider:hover::-webkit-slider-thumb {
  opacity: 1;
}

.icon-fade-enter-active,
.info-slide-enter-active,
.bottom-slide-enter-active {
  transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);
}

.icon-fade-enter-from,
.info-slide-enter-from,
.bottom-slide-enter-from {
  opacity: 0;
  transform: translateY(10px);
}
</style>
