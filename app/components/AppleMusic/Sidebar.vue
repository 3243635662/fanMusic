<template>
  <div
    class="shrink-0 bg-white/5 border-r border-white/10 flex flex-col py-6 rounded-l-4xl transition-all duration-300 ease-in-out overflow-hidden"
    :class="isFoldSidebar ? 'w-[72px] px-2.5' : 'w-[220px] px-4'">
    <!-- Sidebar Header -->
    <div class="flex items-center mb-7 px-2" :class="isFoldSidebar ? 'justify-center' : 'justify-between'">
      <div class="flex items-center gap-2.5 overflow-hidden">
        <UAvatar src="/logo.webp" alt="Fan音乐" size="sm" :ui="{ root: 'rounded-lg bg-white/5' }"
          class="ring-1 ring-white/10 shrink-0" />
        <h2
          class="text-[20px] font-bold tracking-tight bg-linear-to-r from-white to-white/70 bg-clip-text text-transparent whitespace-nowrap transition-all duration-300"
          :class="isFoldSidebar ? 'opacity-0 w-0 ml-0' : 'opacity-100 w-auto'">
          Fan音乐
        </h2>
      </div>

      <LayoutsTipsButton v-if="!isFoldSidebar" @click="isFoldSidebar = true" text="收起侧边栏" :icon="useIcon('foldUp')"
        icon-class="w-4 h-4 text-white/80" class="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 shrink-0" />
    </div>

    <LayoutsTipsButton v-if="isFoldSidebar" @click="isFoldSidebar = false" text="展开侧边栏" :icon="useIcon('foldDown')"
      icon-class="w-4 h-4 text-white/80"
      class="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 mx-auto mb-5 text-white/80" />

    <div
      class="text-[11px] font-medium text-white/40 px-2 mb-2 uppercase tracking-wide whitespace-nowrap transition-opacity duration-300"
      :class="isFoldSidebar ? 'opacity-0 h-0 mb-0 overflow-hidden' : 'opacity-100'">
      All Music
    </div>

    <nav class="flex flex-col gap-0.5">
      <NuxtLink v-for="link in libraryLinks" :key="link.to" :to="link.to"
        class="flex items-center gap-3 py-2 rounded-xl transition-all duration-200 no-underline" :class="[
          isFoldSidebar ? 'justify-center px-0' : 'px-2.5',
          isActive(link.to) ? 'bg-white/20 text-white shadow-sm' : 'text-white/70 hover:bg-white/10'
        ]">
        <UIcon :name="link.icon" class="w-[18px] h-[18px] shrink-0" />
        <span class="text-[14px] font-medium whitespace-nowrap transition-all duration-300 overflow-hidden"
          :class="isFoldSidebar ? 'opacity-0 w-0' : 'opacity-100 w-auto'">
          {{ link.label }}
        </span>
      </NuxtLink>
    </nav>

    <!-- Main Grouping Divider -->
    <div class="h-px bg-white/5 mx-2 my-6"></div>

    <!-- Group 2: User Data -->
    <div class="flex flex-col flex-1 min-h-0 gap-1">
      <!-- My Playlists Section -->
      <div class="flex flex-col min-h-0 shrink-0">
        <div @click="isPlaylistOpen = !isPlaylistOpen"
          class="flex items-center gap-3 py-2 px-2.5 rounded-xl transition-all cursor-pointer group hover:bg-white/10"
          :class="[
            isFoldSidebar ? 'justify-center px-0' : 'justify-between',
            isPlaylistOpen ? 'text-white' : 'text-white/60'
          ]">
          <div class="flex items-center gap-3 overflow-hidden">
            <UIcon :name="useIcon('musicList')" class="w-[18px] h-[18px] shrink-0"
              :class="isPlaylistOpen ? 'text-primary' : 'text-white/70'" />
            <span class="text-[14px] font-medium whitespace-nowrap transition-all duration-300 overflow-hidden"
              :class="isFoldSidebar ? 'opacity-0 w-0' : 'opacity-100 w-auto'">
              我的歌单
            </span>
          </div>
          <UIcon v-show="!isFoldSidebar" name="i-lucide-chevron-right"
            class="w-4 h-4 text-white/20 transition-transform duration-300" :class="{ 'rotate-90': isPlaylistOpen }" />
        </div>

        <!-- Playlists List -->
        <Transition name="fade-slide">
          <div v-show="isPlaylistOpen && !isFoldSidebar"
            class="max-h-[200px] overflow-y-auto custom-scrollbar px-2 mt-1 space-y-0.5">
            <div v-for="item in musicStore.playList" :key="item.listid"
              class="group flex items-center gap-3 p-2 rounded-xl transition-all hover:bg-white/5 cursor-pointer"
              @click="navigateTo(`/playlist/${item.listid}`)">

              <div
                class="w-8 h-8 rounded-lg overflow-hidden bg-white/5 shrink-0 border border-white/5 group-hover:border-white/10 transition-colors">
                <img :src="processCover(item.cover)" @error="($event.target as HTMLImageElement).src = processCover('')"
                  class="w-full h-full object-cover" alt="Playlist Cover" />
              </div>

              <div class="flex-1 min-w-0 text-left">
                <div class="text-[13px] font-medium truncate text-white/80 group-hover:text-white transition-colors">
                  {{ item.title }}
                </div>
              </div>
            </div>
          </div>
        </Transition>
      </div>

      <!-- Next Up (Queue) Section -->
      <div class="flex flex-col flex-1 min-h-0 pt-1">
        <div @click="isQueueOpen = !isQueueOpen"
          class="flex items-center gap-3 py-2 px-2.5 rounded-xl transition-all cursor-pointer group hover:bg-white/10"
          :class="[
            isFoldSidebar ? 'justify-center px-0' : 'justify-between',
            isQueueOpen ? 'text-white' : 'text-white/60'
          ]">
          <div class="flex items-center gap-3 overflow-hidden">
            <UIcon :name="useIcon('play')" class="w-[18px] h-[18px] shrink-0"
              :class="isQueueOpen ? 'text-primary' : 'text-white/70'" />
            <span class="text-[14px] font-medium whitespace-nowrap transition-all duration-300 overflow-hidden"
              :class="isFoldSidebar ? 'opacity-0 w-0' : 'opacity-100 w-auto'">
              待播清单
            </span>
          </div>
          <UIcon v-show="!isFoldSidebar" name="i-lucide-chevron-right"
            class="w-4 h-4 text-white/20 transition-transform duration-300" :class="{ 'rotate-90': isQueueOpen }" />
        </div>

        <!-- Queue List -->
        <Transition name="fade-slide">
          <div v-show="isQueueOpen && !isFoldSidebar"
            class="flex-1 overflow-y-auto custom-scrollbar px-2 mt-1 space-y-0.5">
            <div v-for="track in musicStore.playQueue" :key="track.hash"
              class="group/item flex items-center gap-3 p-2 rounded-xl transition-all cursor-pointer relative" :class="[
                musicStore.currentTrack?.hash === track.hash ? 'bg-primary/10' : 'hover:bg-white/5'
              ]" @click="musicStore.playTrack(track)">

              <div class="w-8 h-8 rounded-lg overflow-hidden bg-white/5 shrink-0 relative border border-white/5">
                <img :src="processCover(track.cover || '')"
                  @error="($event.target as HTMLImageElement).src = processCover('')" class="w-full h-full object-cover"
                  alt="Track Cover" />
                <div v-if="musicStore.currentTrack?.hash === track.hash"
                  class="absolute inset-0 bg-primary/20 flex items-center justify-center">
                  <div class="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_var(--ui-primary)]">
                  </div>
                </div>
              </div>

              <div class="flex-1 min-w-0">
                <div class="text-[12px] font-bold truncate leading-tight transition-colors"
                  :class="musicStore.currentTrack?.hash === track.hash ? 'text-primary' : 'text-white/80 group-hover/item:text-white'">
                  {{ track.name }}
                </div>
                <div class="text-[10px] text-zinc-500 font-medium truncate uppercase tracking-tighter">{{ track.artist
                  }}</div>
              </div>
            </div>

            <div v-if="musicStore.playQueue.length === 0" class="py-10 text-center">
              <p class="text-[11px] text-white/10 italic">队列为空</p>
            </div>
          </div>
        </Transition>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia";
const route = useRoute();
const settingsStore = useSettingsStore();
const musicStore = useMusicStore();
const { isFoldSidebar } = storeToRefs(settingsStore);

const { libraryLinks } = useMenu();

// 控制展开状态
const isPlaylistOpen = ref(false);
const isQueueOpen = ref(false);

function isActive(to: string) {
  if (to === '/') return route.path === '/';
  if (to === '/recommendation' && route.path === '/') return true;
  return route.path.startsWith(to);
}
</script>

<style scoped>
/* 使用布局中的全局 custom-scrollbar */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  max-height: 0 !important;
  transform: translateY(-10px);
}
</style>
