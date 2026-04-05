<script setup lang="ts">
import { useBattery } from '@vueuse/core'
import { useSettingsStore } from '~/stores/settings'

const settingsStore = useSettingsStore()

// 1. 获取电量状态
const { level, charging } = useBattery()

// 2. 计算电量显示数值，放在脚本层处理避免模板类型报错
const displayLevel = computed(() => Math.round((level.value ?? 0) * 100))


</script>

<template>
  <div
    class="absolute left-10 top-1/2 -translate-y-1/2 flex flex-col items-center gap-4 py-6 px-2.5 rounded-full bg-black/40 backdrop-blur-3xl border border-white/10 shadow-2xl z-50">

    <!-- 进入盒子模式 -->
    <button
      class="p-2.5 text-white/60 hover:text-white transition transform hover:scale-110 active:scale-95 duration-300">
      <UIcon name="i-lucide-tv" class="w-[22px] h-[22px]" />
    </button>

    <!-- 搜索 -->
    <button
      class="p-2.5 text-white/60 hover:text-white transition transform hover:scale-110 active:scale-95 duration-300">
      <UIcon name="i-lucide-search" class="w-5 h-5" />
    </button>

    <!-- 设置 -->
    <button @click="settingsStore.isSettingsOpen = true"
      class="p-2.5 text-white/60 hover:text-white transition transform hover:scale-110 active:scale-95 duration-300">
      <UIcon name="i-lucide-settings" class="w-5 h-5" />
    </button>

    <!-- 呼出播放器 (Open Player) -->
    <button @click="settingsStore.isHiddenPlayer = false"
      class="p-2.5 text-white/60 hover:text-white transition transform hover:scale-110 active:scale-95 duration-300">
      <UIcon name="i-lucide-play-circle" class="w-5 h-5" />
    </button>

    <div class="w-6 h-px bg-white/10 my-1"></div>

    <!-- 登录 -->
    <NuxtLink to="/login"
      class="p-2.5 text-white/60 hover:text-white transition transform hover:scale-110 duration-300">
      <UIcon name="material-symbols:login" class="w-5 h-5" />
    </NuxtLink>

    <!-- 电量展示 (图标 + 底部百分比) -->
    <div class="flex flex-col items-center gap-0.5 p-2 bg-white/10 rounded-full border border-white/10 shadow-inner">
      <UIcon :name="charging ? 'i-lucide-battery-charging' : 'i-lucide-battery'"
        class="w-[18px] h-[18px] transition-colors" :class="charging ? 'text-green-400' : 'text-white'" />
      <span class="text-[8px] font-black text-white/80 tabular-nums">
        {{ displayLevel }}%
      </span>
    </div>
  </div>
</template>

<style scoped>
/* 可以在这里添加一些发光效果 */
button:hover {
  filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.4));
}
</style>
