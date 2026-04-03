<template>
  <div class="flex items-center gap-4 mb-8">
    <UButton
      @click="$emit('playAll')"
      :icon="useIcon('PlayerPlay')"
      color="primary"
      class="rounded-full px-8 h-12 font-bold text-lg"
    >
      播放全部
    </UButton>
    <UButton
      @click="$emit('favorite')"
      :icon="useIcon('heart')"
      variant="ghost"
      color="neutral"
      class="rounded-full w-12 h-12 p-0 flex items-center justify-center border border-white/10 hover:bg-white/5"
    />
  </div>
</template>

<script lang="ts" setup>
defineEmits<{
  (e: "playAll"): void;
  (e: "favorite"): void;
}>();
</script>