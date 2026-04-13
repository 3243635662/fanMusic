<template>
  <div class="flex flex-col md:flex-row items-start md:items-end gap-4 md:gap-6 mb-6 md:mb-10 text-left">
    <!-- Album Cover -->
    <div
      class="w-28 h-28 md:w-48 md:h-48 rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl ring-1 ring-white/10 shrink-0 bg-neutral-900 group relative"
    >
      <NuxtImg
        v-if="info?.cover"
        :src="processedCover"
        class="w-full h-full object-cover"
        alt="Playlist Cover"
      />
      <div
        v-else
        class="w-full h-full flex items-center justify-center bg-linear-to-br from-primary/20 to-purple-500/20"
      >
        <UIcon :name="useIcon('music')" class="w-8 h-8 md:w-16 md:h-16 text-primary/40" />
      </div>
    </div>

    <!-- Info -->
    <div class="flex-1 space-y-2 md:space-y-3 pb-0 md:pb-2">
      <div
        class="flex items-center gap-2 text-primary font-bold text-xs md:text-sm tracking-widest uppercase"
      >
        <UIcon :name="useIcon('library')" class="w-3.5 h-3.5 md:w-4 md:h-4" />
        Playlist
      </div>
      <h1 class="text-2xl md:text-5xl font-black text-white tracking-tight">
        {{ info?.title || "加载中..." }}
      </h1>
      <div class="flex items-center gap-2 md:gap-3 text-white/50 text-xs md:text-sm font-medium">
        <span class="text-white/80">{{
          info?.list_create_username || "未知用户"
        }}</span>
        <span class="w-1 h-1 rounded-full bg-white/20"></span>
        <span>{{ info?.count || "未知" }} 首歌曲</span>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
const props = defineProps<{
  info?: any;
}>();

const processedCover = computed(() => processCover(props.info?.cover));
</script>