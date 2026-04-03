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
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia";
const route = useRoute();
const settingsStore = useSettingsStore();
const { isFold } = storeToRefs(settingsStore);

const { libraryLinks } = useMenu();

function isActive(to: string) {
  return route.path === to;
}
</script>
