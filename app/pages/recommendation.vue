<template>
  <div class="flex flex-col h-full">
    <!-- Header -->
    <div class="flex items-start justify-between mb-5">
      <div>
        <h1 class="text-3xl font-bold tracking-tight mb-0.5">今日推荐歌单</h1>
        <p class="text-[13px] text-white/50">48 个歌单</p>
      </div>
    </div>

    <!-- Search Bar -->
    <div class="relative mb-6">
      <UIcon name="i-lucide-search" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
      <input type="text" placeholder="Search in Albums"
        class="w-full bg-black/20 border border-transparent rounded-[10px] py-1.5 pl-9 pr-4 text-[13px] outline-none focus:ring-1 focus:ring-white/30 focus:bg-black/30 focus:border-white/10 placeholder:text-white/40 transition-all font-medium" />
    </div>

    <!-- Grid -->
    <div class="grid grid-cols-3 gap-x-5 gap-y-7 overflow-y-auto pr-2 pb-24 scrollbar-hide">



    </div>
  </div>
</template>

<script lang="ts" setup>
definePageMeta({
  layout: 'main'
})
</script>

<style scoped>
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}

.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>