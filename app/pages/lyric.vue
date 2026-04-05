<template>
  <div class="w-full h-full p-8 md:p-16 flex relative overflow-hidden group/page">
    <!-- 1. 极致背景：多重动态光晕 -->
    <div class="absolute inset-0 z-0 opacity-40">
      <div
        class="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-primary/20 rounded-full blur-[160px] animate-pulse">
      </div>
      <div
        class="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] bg-purple-600/10 rounded-full blur-[160px] animation-delay-2000 animate-pulse">
      </div>
    </div>

    <!-- 2. PixiJS 交互画布 (粒子与波纹层) -->
    <ClientOnly>
      <canvas ref="pixiOverlay" class="absolute inset-0 pointer-events-none z-1 mix-blend-screen opacity-50"></canvas>
    </ClientOnly>

    <!-- 返回按钮 (移至右上角) -->
    <LayoutsTipsButton @click="router.back()" text="收起歌词" :icon="useIcon('foldUp')"
      class="absolute top-10 right-10 w-12 h-12 rounded-full bg-white/5 hover:bg-white/10 text-white/30 hover:text-white backdrop-blur-md transition-all z-50 border border-white/5 hover:scale-110 active:scale-95" />

    <!-- 3. 核心歌词内容区 -->
    <div class="flex-1 flex flex-col justify-center max-w-[1000px] mx-auto z-10 w-full transition-all duration-1000"
      :class="isEntering ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'">
      <!-- 歌曲 Meta 信息 (增加 ClientOnly 防止水合报错) -->
      <ClientOnly>
        <div v-if="musicStore.currentTrack"
          class="mb-14 space-y-5 transition-all duration-500 overflow-visible relative">
          <div class="flex items-end gap-10">
            <div class="space-y-2 flex-1 min-w-0">
              <div class="flex items-center gap-3 mb-1">
                <span
                  class="px-2 py-0.5 text-[10px] bg-primary/20 text-primary border border-primary/30 rounded-sm font-bold tracking-tighter uppercase">High
                  Resolution</span>
                <div class="h-px bg-white/10 flex-1"></div>
              </div>
              <h1
                class="text-3xl md:text-5xl font-black tracking-tight text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] truncate">
                {{ musicStore.currentTrack?.name }}
              </h1>
              <p class="text-[14px] md:text-[16px] font-medium text-white/30 uppercase tracking-[0.5em] truncate">
                {{ musicStore.currentTrack?.artist || "Unknown Artist" }}
              </p>
            </div>

            <!-- 极简波形器 -->
            <div v-if="musicStore.isPlaying" class="flex gap-1.5 h-8 items-end pb-2 px-6">
              <div v-for="i in 5" :key="i" class="w-1.5 bg-primary/40 rounded-full animate-music-bar"
                :style="{ animationDelay: `${i * 0.1}s`, height: `${20 + Math.random() * 80}%` }"></div>
            </div>
          </div>
        </div>
      </ClientOnly>

      <!-- 4. 歌词容器 (容器精简，字体缩小) -->
      <div class="flex-1 w-full h-[65vh] flex flex-col justify-start overflow-hidden relative">
        <div ref="lyricContainer"
          class="pl-6 md:pl-10 space-y-10 md:space-y-12 select-none pr-10 custom-scrollbar overflow-y-auto pb-[45vh] transition-all duration-700 ease-out"
          @scroll="handleScroll">
          <div v-for="(line, index) in lyrics" :key="index" :id="'lyric-line-' + index"
            class="transition-all duration-700 transform origin-left relative" :class="[
              activeIndex === index
                ? 'text-xl md:text-3xl font-black text-white translate-x-6 md:translate-x-10 scale-[1.03] z-20'
                : index < activeIndex
                  ? 'text-base md:text-lg font-medium text-white/20 blur-[1px] translate-x-0 grayscale opacity-50'
                  : 'text-base md:text-lg font-medium text-white/20 hover:text-white/40 cursor-pointer transition-colors duration-300'
            ]" @click="seekToLine(line)">
            <!-- 逐字解析与精细着色 -->
            <div class="flex flex-wrap gap-x-[0.25em] relative">
              <span v-for="(word, wIdx) in line.words" :key="wIdx"
                class="relative inline-block transition-all duration-500"
                :class="{ 'text-primary drop-shadow-[0_0_30px_rgba(var(--color-primary-rgb),0.6)]': isWordActive(line, word) }">
                {{ word.text }}
                <!-- 歌词着色层：仅对当前激活行展示变色动画 -->
                <span v-if="activeIndex === index"
                  class="absolute inset-0 text-primary pointer-events-none whitespace-nowrap overflow-hidden transition-all duration-75 ease-linear mix-blend-plus-lighter"
                  :style="{ width: getWordProgress(line, word) + '%' }">
                  {{ word.text }}
                </span>
              </span>
            </div>
          </div>

          <!-- 加载/空状态 -->
          <div v-if="lyrics.length === 0" class="h-full flex flex-col items-center justify-center space-y-6">
            <div class="w-16 h-16 border-t-2 border-primary rounded-full animate-spin"></div>
            <p class="text-white/20 tracking-[1em] font-light">{{ isLoading ? 'ASYNC LOADING' : 'LYRICS NOT FOUND' }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { parseKrc } from "@/utils/krcParser";
import { usePixi } from "@/composables/usePixi";
import { Graphics, BlurFilter, Container, Sprite, Texture, ParticleContainer } from "pixi.js";

definePageMeta({
  layout: "main",
});

const router = useRouter();
const musicStore = useMusicStore();
const lyricContainer = ref<HTMLElement | null>(null);
const pixiOverlay = ref<HTMLCanvasElement | null>(null);

const lyrics = ref<any[]>([]);
const activeIndex = ref(-1);
const isLoading = ref(false);
const isEntering = ref(false);

const { initApp, destroyApp } = usePixi();

// --- 基础进度逻辑 ---
let lastTime = 0;
const updateActiveLine = () => {
  const currentMs = musicStore.currentTime * 1000;
  
  // 检测是否发生了跳转 (Seek)，偏差超过 1000ms 判定为跳转
  const isSeeking = Math.abs(currentMs - lastTime * 1000) > 1000;
  lastTime = musicStore.currentTime;

  const index = lyrics.value.findIndex((line, i) => {
    const nextLine = lyrics.value[i + 1];
    return currentMs >= line.startTime && (!nextLine || currentMs < nextLine.startTime);
  });

  if (index !== -1) {
    // 如果行号变了，或者刚刚发生了进度条跳转
    if (index !== activeIndex.value || isSeeking) {
      activeIndex.value = index;
      
      // 如果是手动跳转，强制解除“用户滚动”的锁定，让自动滚动生效
      if (isSeeking) isUserScrolling.value = false;
      
      scrollToActive();
      
      // 只有行号真的变了才触发光波特效
      if (index !== activeIndex.value) {
        triggerShockwave();
      }
    }
  }
};

const isWordActive = (line: any, word: any) => {
  return (musicStore.currentTime * 1000) >= line.startTime + word.startTime;
};

const getWordProgress = (line: any, word: any) => {
  const currentMs = musicStore.currentTime * 1000;
  const absStart = line.startTime + word.startTime;
  if (currentMs < absStart) return 0;
  if (currentMs >= absStart + word.duration) return 100;
  return ((currentMs - absStart) / word.duration) * 100;
};

// --- 位移与视觉交互 ---
// 滚动逻辑 (检测用户手动滚动)
const isUserScrolling = ref(false)
let scrollTimer: any = null
const handleScroll = () => {
  isUserScrolling.value = true
  if (scrollTimer) clearTimeout(scrollTimer)
  scrollTimer = setTimeout(() => {
    isUserScrolling.value = false
  }, 3000)
}

const scrollToActive = () => {
  if (!lyricContainer.value || activeIndex.value === -1 || isUserScrolling.value) return;
  const activeEl = document.getElementById(`lyric-line-${activeIndex.value}`);
  if (activeEl) {
    lyricContainer.value.scrollTo({
      top: activeEl.offsetTop - lyricContainer.value.clientHeight / 2 + activeEl.clientHeight / 2,
      behavior: "smooth",
    });
  }
};

const seekToLine = (line: any) => {
  // 可以实现点击歌词跳转播放的功能
  // musicStore.seek(line.startTime / 1000)
};

// --- 极致视觉：PixiJS 粒子流与波纹系统 ---
let triggerShockwave = () => { };
let lastActiveY = 0;

onMounted(async () => {
  setTimeout(() => (isEntering.value = true), 100);
  await loadLyrics();

  if (pixiOverlay.value) {
    const app = await initApp({
      canvas: pixiOverlay.value,
      backgroundAlpha: 0,
      resizeTo: window,
    });

    // 粒子系统基础容器
    const particles: any[] = [];
    app.ticker.add((ticker) => {
      // 找到当前激活行在屏幕上的垂直位置
      const activeEl = document.getElementById(`lyric-line-${activeIndex.value}`);
      if (activeEl) {
        const rect = activeEl.getBoundingClientRect();
        lastActiveY = rect.top + rect.height / 2;
      }

      // 1. 发射粒子 (随随机流动)
      if (musicStore.isPlaying && Math.random() > 0.6) {
        const p = new Graphics();
        p.circle(0, 0, 1 + Math.random() * 3);
        p.fill({ color: 0x1db954, alpha: 0.8 });
        p.filters = [new BlurFilter({ strength: 2 })];
        p.x = 100 + Math.random() * 100;
        p.y = lastActiveY + (Math.random() - 0.5) * 50;
        p.alpha = 0.6;
        (p as any).vx = 2 + Math.random() * 5;
        (p as any).vy = (Math.random() - 0.5) * 1;
        app.stage.addChild(p);
        particles.push(p);
      }

      // 2. 更新粒子位置
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.005;
        if (p.alpha <= 0 || p.x > app.screen.width) {
          app.stage.removeChild(p);
          particles.splice(i, 1);
        }
      }
    });

    // 波纹效果函数
    triggerShockwave = () => {
      const ring = new Graphics();
      ring.circle(0, 0, 10);
      ring.stroke({ width: 2, color: 0x1db954, alpha: 0.4 });
      ring.x = 150;
      ring.y = lastActiveY;
      app.stage.addChild(ring);

      let scale = 1;
      const animate = (ticker: any) => {
        scale += 0.05 * ticker.deltaTime;
        ring.scale.set(scale);
        ring.alpha -= 0.02 * ticker.deltaTime;
        if (ring.alpha <= 0) {
          app.stage.removeChild(ring);
          app.ticker.remove(animate);
        }
      };
      app.ticker.add(animate);
    }
  }
});

const loadLyrics = async () => {
  const current = musicStore.currentTrack;
  if (!current?.hash) return;
  if (current.lyrics?.length) {
    lyrics.value = current.lyrics;
    return;
  }

  isLoading.value = true;
  try {
    const idRes: any = await $fetch("/api/music/getLyricId", { query: { hash: current.hash } });
    if (idRes.code === 0 && idRes.result) {
      current.lyricId = idRes.result.id;
      current.lyricAccessKey = idRes.result.accesskey;
      const infoRes: any = await $fetch("/api/music/getLyricInfo", {
        query: { id: current.lyricId, accesskey: current.lyricAccessKey }
      });
      if (infoRes.code === 0 && infoRes.result?.decodeContent) {
        current.lyrics = parseKrc(infoRes.result.decodeContent);
        lyrics.value = current.lyrics;
      }
    }
  } catch (err) { console.error(err); } finally { isLoading.value = false; }
};

onUnmounted(() => destroyApp());
watch(() => musicStore.currentTime, updateActiveLine);
watch(() => musicStore.currentTrack?.hash, loadLyrics);
watch(() => musicStore.currentTrack?.lyrics, (n) => { if (n?.length) { lyrics.value = n; isLoading.value = false; } });
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  display: none;
}

/* 字体呼吸动效 */
.font-black {
  text-shadow: 0 0 40px rgba(255, 255, 255, 0.15);
}

.animate-music-bar {
  animation: music-bar 1.2s ease-in-out infinite alternate;
}

@keyframes music-bar {
  from {
    height: 10%;
    opacity: 0.2;
  }

  to {
    height: 100%;
    opacity: 0.8;
  }
}

.animation-delay-2000 {
  animation-delay: 2s;
}
</style>
