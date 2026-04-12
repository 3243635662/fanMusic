<script setup lang="ts">
import { useMusicStore } from '@/stores/music'

const musicStore = useMusicStore()
const audioRef = ref<HTMLAudioElement | null>(null)

// 将音频实例挂载到 store 或全局状态，以便其他组件可以控制
onMounted(() => {
  if (audioRef.value) {
    // 注入音频实例到 store 供操作（如 seek）
    (musicStore as any)._audio = audioRef.value
  }
})

const onLoadedMetadata = () => {
  if (audioRef.value) musicStore.totalTime = audioRef.value.duration
}

const onTimeUpdate = () => {
  if (audioRef.value) musicStore.currentTime = audioRef.value.currentTime
}

const onEnded = () => {
  musicStore.playNext()
}

// 核心播放逻辑：监听 Store 状态变化
watch([() => musicStore.currentTrack?.url, () => musicStore.isPlaying], ([url, playing]) => {
  if (!audioRef.value) return

  if (url && playing) {
    // 异步执行播放，避免阻塞
    nextTick(() => {
      audioRef.value?.play().catch(e => {
        if (e.name !== 'AbortError') console.error('GlobalAudio 播放失败:', e)
      })
    })
  } else {
    audioRef.value.pause()
  }
}, { immediate: true })

// 监听音量
watch(() => musicStore.volume, (v) => {
  if (audioRef.value) audioRef.value.volume = v
}, { immediate: true })
</script>

<template>
  <!-- 全局唯一音频引擎：不渲染 UI，仅负责逻辑 -->
  <audio
    ref="audioRef"
    :src="musicStore.currentTrack?.url || ''"
    class="hidden"
    referrerpolicy="no-referrer"
    @ended="onEnded"
    @timeupdate="onTimeUpdate"
    @loadedmetadata="onLoadedMetadata"
    @waiting="musicStore.isBuffering = true"
    @playing="musicStore.isBuffering = false"
    @canplay="musicStore.isBuffering = false"
    @pause="musicStore.isBuffering = false"
  />
</template>
