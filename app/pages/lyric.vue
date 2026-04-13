<template>
  <div class="w-full h-full p-4 md:p-16 flex relative overflow-hidden group/page">
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

    <!-- 返回按钮 -->
    <LayoutsTipsButton @click="router.back()" text="收起歌词" :icon="useIcon('foldUp')"
      class="absolute top-4 right-4 md:top-10 md:right-10 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/5 hover:bg-white/10 text-white/30 hover:text-white backdrop-blur-md transition-all z-50 border border-white/5 hover:scale-110 active:scale-95" />

    <!-- 3. 核心歌词内容区 -->
    <div class="flex-1 flex flex-col justify-center max-w-[1000px] mx-auto z-10 w-full transition-all duration-1000"
      :class="isEntering ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'">
      <!-- 歌曲 Meta 信息 -->
      <ClientOnly>
        <div v-if="musicStore.currentTrack"
          class="mb-6 md:mb-14 space-y-3 md:space-y-5 transition-all duration-500 overflow-visible relative">
          <div class="flex items-end gap-4 md:gap-10">
            <div class="space-y-1.5 md:space-y-2 flex-1 min-w-0">
              <div class="flex items-center gap-3 mb-1">
                <span
                  class="px-2 py-0.5 text-[9px] md:text-[10px] bg-primary/20 text-primary border border-primary/30 rounded-sm font-bold tracking-tighter uppercase">High
                  Resolution</span>
                <div class="h-px bg-white/10 flex-1"></div>
              </div>
              <h1
                class="text-2xl md:text-5xl font-black tracking-tight text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] truncate">
                {{ musicStore.currentTrack?.name }}
              </h1>
              <p class="text-[12px] md:text-[16px] font-medium text-white/30 uppercase tracking-[0.3em] md:tracking-[0.5em] truncate">
                {{ musicStore.currentTrack?.artist || "Unknown Artist" }}
              </p>
            </div>

            <!-- 极简波形器 -->
            <div v-if="musicStore.isPlaying" class="flex gap-1 md:gap-1.5 h-6 md:h-8 items-end pb-2 px-3 md:px-6">
              <div v-for="i in 5" :key="i" class="w-1 md:w-1.5 bg-primary/40 rounded-full animate-music-bar"
                :style="{ animationDelay: `${i * 0.1}s`, height: `${20 + Math.random() * 80}%` }"></div>
            </div>
          </div>
        </div>
      </ClientOnly>

      <!-- 4. 歌词容器 -->
      <div class="flex-1 w-full h-[60vh] md:h-[65vh] flex flex-col justify-start overflow-hidden relative">
        <div ref="lyricContainer"
          class="pl-3 md:pl-10 select-none pr-4 md:pr-10 custom-scrollbar overflow-y-auto pb-[45vh] transition-all duration-700 ease-out"
          @scroll="handleScroll">
          <div v-for="(line, index) in lyrics" :key="index" :id="'lyric-line-' + index"
            class="transition-all duration-500 transform-gpu origin-left relative mb-5 md:mb-12 cursor-pointer" :class="[
              activeIndex === index
                ? 'scale-105 z-20 opacity-100'
                : index < activeIndex
                  ? 'scale-100 opacity-30 grayscale'
                  : 'scale-100 opacity-40 hover:opacity-60'
            ]" @click="seekToLine(line)">

            <div class="flex flex-wrap gap-x-[0.2em] relative">
              <span v-for="(word, wIdx) in line.words" :key="wIdx"
                class="relative inline-block text-lg md:text-4xl font-black tracking-tight"
                :class="activeIndex === index ? 'text-white' : 'text-white/80'">

                <span class="opacity-30">{{ word.text }}</span>

                <span v-if="activeIndex === index"
                  class="absolute left-0 top-0 text-primary whitespace-nowrap overflow-hidden mix-blend-screen drop-shadow-[0_0_15px_rgba(29,185,84,0.5)] will-change-[width] transform-gpu"
                  :style="{ width: getWordProgress(line, word) + '%' }">
                  {{ word.text }}
                </span>
              </span>
            </div>
          </div>

          <!-- 加载/空状态 -->
          <div v-if="lyrics.length === 0" class="h-full flex flex-col items-center justify-center space-y-6">
            <div class="w-16 h-16 border-t-2 border-primary rounded-full animate-spin"></div>
            <p class="text-white/20 tracking-[1em] font-light text-sm md:text-base">{{ isLoading ? 'ASYNC LOADING' : 'LYRICS NOT FOUND' }}
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

// --- 高精度虚拟时间补帧逻辑 ---
const realtimeMs = ref(0);
let rafId = 0;
let lastFrameTime = 0;

const tickTime = (time: number) => {
  if (!lastFrameTime) lastFrameTime = time;
  const delta = time - lastFrameTime;
  lastFrameTime = time;

  if (musicStore.isPlaying) {
    realtimeMs.value += delta;

    // 高频检查行号切换，确保滚动秒级同步
    const currentMs = realtimeMs.value;
    const index = lyrics.value.findIndex((line, i) => {
      const nextLine = lyrics.value[i + 1];
      return currentMs >= line.startTime && (!nextLine || currentMs < nextLine.startTime);
    });

    if (index !== -1 && index !== activeIndex.value) {
      activeIndex.value = index;
      scrollToActive();
      triggerShockwave();
    }
  }

  rafId = requestAnimationFrame(tickTime);
};

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
  const currentMs = realtimeMs.value;
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

  const container = lyricContainer.value;
  const activeEl = document.getElementById(`lyric-line-${activeIndex.value}`);

  if (activeEl) {
    // 几何中心对齐公式：不受 CSS 缩放干扰
    const targetScrollTop = activeEl.offsetTop - (container.clientHeight / 2) + (activeEl.clientHeight / 2);

    container.scrollTo({
      top: targetScrollTop,
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

  // 开启高频渲染循环
  rafId = requestAnimationFrame(tickTime);

  if (pixiOverlay.value) {
    const app = await initApp({
      canvas: pixiOverlay.value,
      backgroundAlpha: 0,
      resizeTo: window,
    });

    // 1. 全局只创建一个滤镜
    const globalBlurFilter = new BlurFilter({ strength: 2 });

    // 2. 预先绘制一个粒子材质（Texture），而不是每帧新建 Graphics
    const particleGraphics = new Graphics();
    particleGraphics.circle(0, 0, 4); // 画稍微大一点，靠 scale 缩放
    particleGraphics.fill({ color: 0x1db954, alpha: 1 });
    const particleTexture = app.renderer.generateTexture(particleGraphics);

    // 3. 使用一个专门的容器存放粒子，统一应用滤镜
    const particleContainer = new Container();
    particleContainer.filters = [globalBlurFilter];
    app.stage.addChild(particleContainer);

    const particles: any[] = [];

    app.ticker.add((ticker) => {
      const activeEl = document.getElementById(`lyric-line-${activeIndex.value}`);
      if (activeEl) {
        const rect = activeEl.getBoundingClientRect();
        lastActiveY = rect.top + rect.height / 2;
      }

      // 发射粒子：复用 Texture
      if (musicStore.isPlaying && Math.random() > 0.6) {
        const p = new Sprite(particleTexture); // 使用 Sprite 性能极高
        const scale = 0.2 + Math.random() * 0.8;
        p.scale.set(scale);
        p.x = 100 + Math.random() * 100;
        p.y = lastActiveY + (Math.random() - 0.5) * 50;
        p.alpha = 0.6;
        (p as any).vx = 2 + Math.random() * 5;
        (p as any).vy = (Math.random() - 0.5) * 1;

        particleContainer.addChild(p);
        particles.push(p);
      }

      // 更新粒子位置
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx * ticker.deltaTime; // 引入 deltaTime 保证帧率独立
        p.y += p.vy * ticker.deltaTime;
        p.alpha -= 0.005 * ticker.deltaTime;
        if (p.alpha <= 0 || p.x > app.screen.width) {
          particleContainer.removeChild(p);
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
    nextTick(() => {
      updateActivePosition();
    });
    return;
  }

  isLoading.value = true;
  try {
    await musicStore.updateLyricForTrack(current);
    if (current.lyrics?.length) {
      lyrics.value = current.lyrics;
      nextTick(() => {
        updateActivePosition();
      });
    }
  } catch (err) {
    console.error(err);
  } finally {
    isLoading.value = false;
  }
};

// 辅助：加载后的初始定位
const updateActivePosition = () => {
  const currentMs = musicStore.currentTime * 1000;
  realtimeMs.value = currentMs;
  const index = lyrics.value.findIndex((line, i) => {
    const nextLine = lyrics.value[i + 1];
    return currentMs >= line.startTime && (!nextLine || currentMs < nextLine.startTime);
  });
  if (index !== -1) {
    activeIndex.value = index;
    scrollToActive();
  }
};

onUnmounted(() => {
  destroyApp();
  cancelAnimationFrame(rafId);
});

watch(() => musicStore.currentTime, (newVal) => {
  // 1. 同步行信息
  updateActiveLine();

  // 2. 高精度虚拟时间纠偏
  const targetMs = newVal * 1000;
  const diff = Math.abs(realtimeMs.value - targetMs);

  if (diff > 500) {
    // 偏差过大 (跳转/切歌)
    realtimeMs.value = targetMs;
  } else if (diff > 30) {
    // 平滑同步
    realtimeMs.value = (realtimeMs.value + targetMs) / 2;
  }
});
watch(() => musicStore.currentTrack?.hash, loadLyrics);
watch(() => musicStore.currentTrack?.lyrics, (n) => { if (n?.length) { lyrics.value = n; isLoading.value = false; } });
</script>

<style scoped>
.custom-scrollbar {
  scroll-behavior: smooth;
  /* 开启原生丝滑滚动 */
  scroll-padding-top: 50vh;
  /* 配合居中对齐 */
  padding-bottom: 50vh !important;
  /* 确保最后一行也能居中 */
  /* 优化蒙版：扩大中间清晰区 */
  -webkit-mask-image: linear-gradient(to bottom,
      transparent 0%,
      black 20%,
      black 80%,
      transparent 100%);
  mask-image: linear-gradient(to bottom,
      transparent 0%,
      black 20%,
      black 80%,
      transparent 100%);
}

.custom-scrollbar::-webkit-scrollbar {
  display: none;
}

.transform-gpu {
  transform: translateZ(0);
  /* 强制开启 GPU 渲染层 */
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
