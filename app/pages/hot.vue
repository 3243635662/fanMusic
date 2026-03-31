<template>
  <div>
    <div class="flex items-start justify-between mb-5">
      <div>
        <h1 class="text-3xl font-bold tracking-tight mb-0.5">热门</h1>
        <p class="text-[13px] text-white/50">Audius上最热门的歌曲</p>
      </div>
    </div>

    <!-- 内容区域 -->
    <div v-if="musicStore.hotSongs.length">
      <div v-for="song in musicStore.hotSongs" :key="song.id" class="p-2 border-b border-white/10">
        {{ song.title }}
      </div>
    </div>
    <div v-else class="text-white/50">
      正在加载热门歌曲...
    </div>
  </div>
</template>

<script lang="ts" setup>
import { onMounted } from 'vue'
import { useMyMusicStore } from '~/stores/music'

definePageMeta({
  layout: 'main'
})

const musicStore = useMyMusicStore()

onMounted(() => {
  musicStore.fetchHotSongs()
})
</script>

<style></style>