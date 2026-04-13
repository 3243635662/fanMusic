<template>
  <!-- 遮罩层 -->
  <Transition enter-active-class="transition-opacity duration-300" enter-from-class="opacity-0"
    leave-active-class="transition-opacity duration-200" leave-to-class="opacity-0">
    <div v-if="isMobileSidebarOpen" class="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
      @click="isMobileSidebarOpen = false"></div>
  </Transition>

  <!-- 抽屉面板 -->
  <Transition enter-active-class="transition-transform duration-300 ease-out"
    enter-from-class="-translate-x-full" leave-active-class="transition-transform duration-200 ease-in"
    leave-to-class="-translate-x-full">
    <div v-if="isMobileSidebarOpen"
      class="fixed left-0 top-0 bottom-0 z-50 w-[280px] bg-black/80 backdrop-blur-3xl border-r border-white/10 flex flex-col overflow-hidden safe-area-left">

      <!-- 头部 -->
      <div class="flex items-center justify-between px-5 py-5 border-b border-white/5">
        <div class="flex items-center gap-3">
          <UAvatar src="/logo.webp" alt="Fan音乐" size="sm" :ui="{ root: 'rounded-lg bg-white/5' }"
            class="ring-1 ring-white/10" />
          <h2 class="text-lg font-bold text-white">Fan音乐</h2>
        </div>
        <button @click="isMobileSidebarOpen = false"
          class="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/60 active:scale-90 transition-transform">
          <UIcon name="lucide:x" class="w-4 h-4" />
        </button>
      </div>

      <!-- 标签切换 -->
      <div class="flex border-b border-white/5">
        <button v-for="tab in tabs" :key="tab.key" @click="mobileSidebarTab = tab.key"
          class="flex-1 py-3 text-sm font-medium transition-all relative"
          :class="mobileSidebarTab === tab.key ? 'text-primary' : 'text-white/40'">
          {{ tab.label }}
          <div v-if="mobileSidebarTab === tab.key"
            class="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-[2px] bg-primary rounded-full"></div>
        </button>
      </div>

      <!-- 歌单列表 -->
      <div v-show="mobileSidebarTab === 'playlist'" class="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1">
        <div v-for="item in musicStore.playList" :key="item.listid"
          class="flex items-center gap-3 p-3 rounded-xl transition-all active:scale-[0.98] cursor-pointer hover:bg-white/5"
          @click="navigateTo(`/playlist/${item.listid}`); isMobileSidebarOpen = false">
          <div class="w-10 h-10 rounded-lg overflow-hidden bg-white/5 shrink-0 border border-white/5">
            <img :src="processCover(item.cover)" @error="($event.target as HTMLImageElement).src = processCover('')"
              referrerpolicy="no-referrer" class="w-full h-full object-cover" alt="Playlist Cover" />
          </div>
          <div class="flex-1 min-w-0">
            <div class="text-[13px] font-medium text-white/80 truncate">{{ item.title }}</div>
            <div class="text-[11px] text-white/30">{{ item.count || 0 }} 首</div>
          </div>
        </div>
        <div v-if="musicStore.playList.length === 0" class="py-10 text-center">
          <p class="text-[12px] text-white/20 italic">暂无歌单</p>
        </div>
      </div>

      <!-- 播放队列 -->
      <div v-show="mobileSidebarTab === 'queue'" class="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1">
        <div v-for="track in musicStore.playQueue" :key="track.hash"
          class="flex items-center gap-3 p-2.5 rounded-xl transition-all cursor-pointer active:scale-[0.98]"
          :class="musicStore.currentTrack?.hash === track.hash ? 'bg-primary/10' : 'hover:bg-white/5'"
          @click="musicStore.playTrack(track)">
          <div class="w-9 h-9 rounded-lg overflow-hidden bg-white/5 shrink-0 relative border border-white/5">
            <img :src="processCover(track.cover || '')"
              @error="($event.target as HTMLImageElement).src = processCover('')" referrerpolicy="no-referrer"
              class="w-full h-full object-cover" alt="Track Cover" />
            <div v-if="musicStore.currentTrack?.hash === track.hash"
              class="absolute inset-0 bg-primary/20 flex items-center justify-center">
              <div class="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></div>
            </div>
          </div>
          <div class="flex-1 min-w-0">
            <div class="text-[12px] font-bold truncate leading-tight"
              :class="musicStore.currentTrack?.hash === track.hash ? 'text-primary' : 'text-white/80'">
              {{ track.name }}
            </div>
            <div class="text-[10px] text-zinc-500 font-medium truncate">{{ track.artist }}</div>
          </div>
        </div>
        <div v-if="musicStore.playQueue.length === 0" class="py-10 text-center">
          <p class="text-[12px] text-white/20 italic">队列为空</p>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
const settingsStore = useSettingsStore()
const musicStore = useMusicStore()
const { isMobileSidebarOpen, mobileSidebarTab } = storeToRefs(settingsStore)

const tabs = [
  { key: 'playlist', label: '歌单' },
  { key: 'queue', label: '队列' },
]
</script>

<style scoped>
.safe-area-left {
  padding-left: env(safe-area-inset-left, 0px);
}
</style>
