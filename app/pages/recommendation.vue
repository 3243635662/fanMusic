<template>
  <div class="flex flex-col h-full overflow-y-auto pb-24 scrollbar-hide">
    <!-- Header -->
    <div class="flex items-start justify-between mb-5">
      <div>
        <h1 class="text-3xl font-bold tracking-tight mb-0.5">为你推荐</h1>
        <p class="text-[13px] text-white/50">发现你的专属旋律</p>
      </div>
    </div>



    <!-- Skeleton Grid (保留样式骨架) -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-6">
      <div v-for="i in 8" :key="i" class="space-y-3 animate-pulse">
        <div class="aspect-square bg-white/5 rounded-2xl ring-1 ring-white/10"></div>
        <div class="h-4 bg-white/10 rounded w-3/4"></div>
        <div class="h-3 bg-white/5 rounded w-1/2"></div>
      </div>
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