<template>
  <div class="space-y-1">
    <div v-for="i in count" :key="i" class="flex items-center p-3 animate-pulse rounded-xl">
      <div v-if="showIndex" class="w-8 text-[12px] bg-white/5 h-4 rounded mr-4"></div>
      <div class="w-12 h-12 bg-white/5 rounded-lg mr-4 shrink-0"></div>
      <div class="flex-1 space-y-2">
        <div class="h-4 bg-white/10 rounded w-1/3"></div>
        <div class="h-3 bg-white/5 rounded w-1/4"></div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
withDefaults(defineProps<{
  count?: number;
  showIndex?: boolean;
}>(), {
  count: 10,
  showIndex: true,
});
</script>