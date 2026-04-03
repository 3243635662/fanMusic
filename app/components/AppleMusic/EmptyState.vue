<template>
  <div class="flex flex-col items-center justify-center py-20 text-center">
    <div
      class="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center mb-6 ring-1 ring-white/10 shadow-inner">
      <UIcon :name="icon" class="w-10 h-10 text-white/10" />
    </div>
    <h3 class="text-lg font-bold text-white mb-2">{{ title }}</h3>
    <p class="text-white/30 max-w-[240px] text-sm leading-relaxed">
      {{ description }}
    </p>
    <div v-if="$slots.default" class="mt-8">
      <slot />
    </div>
  </div>
</template>

<script lang="ts" setup>
interface Props {
  icon?: string
  title: string
  description: string
}

withDefaults(defineProps<Props>(), {
  icon: 'i-lucide-music'
})
</script>