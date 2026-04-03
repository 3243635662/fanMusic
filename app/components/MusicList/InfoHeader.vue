<template>
  <div class="flex flex-col md:flex-row items-end gap-6 mb-10 text-left">
    <!-- Album Cover -->
    <div
      class="w-48 h-48 rounded-3xl overflow-hidden shadow-2xl ring-1 ring-white/10 shrink-0 bg-neutral-900 group relative"
    >
      <img
        v-if="info?.cover"
        :src="processedCover"
        class="w-full h-full object-cover"
      />
      <div
        v-else
        class="w-full h-full flex items-center justify-center bg-linear-to-br from-primary/20 to-purple-500/20"
      >
        <UIcon :name="useIcon('music')" class="w-16 h-16 text-primary/40" />
      </div>
    </div>

    <!-- Info -->
    <div class="flex-1 space-y-3 pb-2">
      <div
        class="flex items-center gap-2 text-primary font-bold text-sm tracking-widest uppercase"
      >
        <UIcon :name="useIcon('library')" class="w-4 h-4" />
        Playlist
      </div>
      <h1 class="text-4xl md:text-5xl font-black text-white tracking-tight">
        {{ info?.title || "加载中..." }}
      </h1>
      <div class="flex items-center gap-3 text-white/50 text-sm font-medium">
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

const processedCover = computed(() => {
  if (!props.info?.cover) return "";
  return props.info.cover.replace("{size}", "400");
});
</script>