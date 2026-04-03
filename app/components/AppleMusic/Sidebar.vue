<template>
  <div
    class="shrink-0 bg-white/5 border-r border-white/10 flex flex-col py-6 rounded-l-4xl transition-all duration-300 ease-in-out overflow-hidden"
    :class="isFold ? 'w-[72px] px-2.5' : 'w-[220px] px-4'">
    <!-- Sidebar Header -->
    <div class="flex items-center mb-7 px-2" :class="isFold ? 'justify-center' : 'justify-between'">
      <div class="flex items-center gap-2.5 overflow-hidden">
        <UAvatar src="/logo.webp" alt="Fan音乐" size="sm" :ui="{ root: 'rounded-lg bg-white/5' }"
          class="ring-1 ring-white/10 shrink-0" />
        <h2
          class="text-[20px] font-bold tracking-tight bg-linear-to-r from-white to-white/70 bg-clip-text text-transparent whitespace-nowrap transition-all duration-300"
          :class="isFold ? 'opacity-0 w-0 ml-0' : 'opacity-100 w-auto'">
          Fan音乐
        </h2>
      </div>

      <button v-show="!isFold"
        class="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition cursor-pointer shrink-0"
        @click="isFold = true">
        <UIcon :name="useIcon('foldUp')" class="w-4 h-4 text-white/80" />
      </button>
    </div>

    <button v-if="isFold"
      class="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition cursor-pointer mx-auto mb-5"
      @click="isFold = false">
      <UIcon :name="useIcon('foldDown')" class="w-4 h-4 text-white/80" />
    </button>

    <div
      class="text-[11px] font-medium text-white/40 px-2 mb-2 uppercase tracking-wide whitespace-nowrap transition-opacity duration-300"
      :class="isFold ? 'opacity-0 h-0 mb-0 overflow-hidden' : 'opacity-100'">
      All Music
    </div>

    <nav class="flex flex-col gap-0.5">
      <NuxtLink v-for="link in libraryLinks" :key="link.to" :to="link.to"
        class="flex items-center gap-3 py-2 rounded-xl transition-all duration-200 no-underline" :class="[
          isFold ? 'justify-center px-0' : 'px-2.5',
          isActive(link.to) ? 'bg-white/20 text-white shadow-sm' : 'text-white/70 hover:bg-white/10'
        ]">
        <UIcon :name="link.icon" class="w-[18px] h-[18px] shrink-0" />
        <span class="text-[14px] font-medium whitespace-nowrap transition-all duration-300 overflow-hidden"
          :class="isFold ? 'opacity-0 w-0' : 'opacity-100 w-auto'">
          {{ link.label }}
        </span>
      </NuxtLink>
    </nav>

    <!-- Playlists Section -->
    <div class="mt-8 flex items-center px-2 cursor-pointer group transition-all duration-200"
      :class="isFold ? 'justify-center' : 'justify-between'">
      <div class="flex items-center gap-2.5 overflow-hidden">
        <UIcon :name="useIcon('musicList')"
          class="w-[20px] h-[20px] text-white/60 group-hover:text-white/80 transition shrink-0" />
        <h3
          class="text-[15px] font-medium text-white group-hover:text-white/80 transition whitespace-nowrap overflow-hidden"
          :class="isFold ? 'opacity-0 w-0' : 'opacity-100 w-auto'">
          Playlists
        </h3>
      </div>
      <UIcon v-show="!isFold" name="i-lucide-chevron-right"
        class="w-[18px] h-[18px] text-white/40 group-hover:text-white/80 transition shrink-0" />
    </div>

    <!-- Play Queue Section -->
    <div class="mt-6 flex flex-col flex-1 min-h-0">
      <div @click="isQueueOpen = !isQueueOpen"
        class="flex items-center px-2 cursor-pointer group transition-all duration-200 mb-2"
        :class="isFold ? 'justify-center' : 'justify-between'">
        <div class="flex items-center gap-2.5 overflow-hidden">
          <UIcon name="i-solar:playlist-2-bold-duotone"
            class="w-[20px] h-[20px] text-primary/60 group-hover:text-primary transition shrink-0" />
          <h3
            class="text-[15px] font-medium text-white/80 group-hover:text-white transition whitespace-nowrap overflow-hidden"
            :class="isFold ? 'opacity-0 w-0' : 'opacity-100 w-auto'">
            Next Up
          </h3>
        </div>
        <UIcon v-show="!isFold" name="i-lucide-chevron-down"
          class="w-[16px] h-[16px] text-white/40 group-hover:text-white/80 transition transform duration-300 shrink-0"
          :class="{ 'rotate-180': isQueueOpen }" />
      </div>

      <!-- Queue List -->
      <div v-show="isQueueOpen && !isFold" class="flex-1 overflow-y-auto custom-scrollbar px-1 space-y-1">
        <TransitionGroup name="list">
          <div v-for="track in musicStore.playQueue" :key="track.hash"
            class="group flex items-center gap-3 p-2 rounded-xl transition-all cursor-pointer relative" :class="[
              musicStore.currentTrack?.hash === track.hash ? 'bg-primary/10' : 'hover:bg-white/5'
            ]" @click="musicStore.playTrack(track)">

            <!-- Small Cover -->
            <div class="w-8 h-8 rounded-lg overflow-hidden bg-white/5 shrink-0 relative">
              <img v-if="processCover(track.cover)" :src="processCover(track.cover)" class="w-full h-full object-cover" />
              <div v-if="musicStore.currentTrack?.hash === track.hash"
                class="absolute inset-0 bg-primary/20 flex items-center justify-center">
                <div class="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
              </div>
            </div>

            <div class="flex-1 min-w-0">
              <div class="text-[12px] font-bold truncate transition-colors"
                :class="musicStore.currentTrack?.hash === track.hash ? 'text-primary' : 'text-white/90'">
                {{ track.name }}
              </div>
              <div class="text-[10px] text-white/40 truncate">{{ track.artist }}</div>
            </div>
          </div>
        </TransitionGroup>

        <div v-if="musicStore.playQueue.length === 0" class="py-10 text-center">
          <UIcon name="i-solar:music-note-broken" class="w-8 h-8 text-white/5 mx-auto mb-2" />
          <p class="text-[11px] text-white/20">Queue is empty</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia";
const route = useRoute();
const settingsStore = useSettingsStore();
const musicStore = useMusicStore();
const { isFold } = storeToRefs(settingsStore);

const { libraryLinks } = useMenu();

// 播放队列展开状态
const isQueueOpen = ref(true);

function isActive(to: string) {
  // 基础路径匹配，如果是根路径 '/' 则必须完全匹配，否则使用前缀匹配（如详情页也算激活状态）
  if (to === '/') return route.path === '/';
  if (to === '/recommendation' && route.path === '/') return true; // 如果首页即推荐页
  return route.path.startsWith(to);
}
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.1);
}

.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}

.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(-10px);
}
</style>
