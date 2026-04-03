<template>
  <div class="grid grid-cols-2 lg:grid-cols-4 gap-6">
    <div v-for="i in count" :key="i" class="space-y-4">
      <!-- Cover Art Skeleton -->
      <div class="relative aspect-square overflow-hidden rounded-2xl bg-white/3 ring-1 ring-white/10">
        <!-- Shimmer Effect -->
        <div class="shimmer-overlay absolute inset-0"></div>
      </div>
      
      <!-- Text Skeleton -->
      <div class="space-y-2 px-1">
        <div class="h-4 bg-white/10 rounded-md w-3/4 overflow-hidden relative">
          <div class="shimmer-overlay absolute inset-0"></div>
        </div>
        <div class="h-3 bg-white/5 rounded-md w-1/2 overflow-hidden relative">
          <div class="shimmer-overlay absolute inset-0"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
defineProps({
  count: {
    type: Number,
    default: 8
  }
})
</script>

<style scoped>
.shimmer-overlay {
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0) 0%,
    rgba(255, 255, 255, 0.03) 50%,
    rgba(255, 255, 255, 0) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 2s infinite linear;
}

@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}
</style>