<template>
  <div
    class="group relative overflow-hidden rounded-2xl bg-white/40 dark:bg-white/5 p-4 border border-white/20 transition-all hover:bg-white/60">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="p-2 rounded-lg" :class="iconBgClass">
          <UIcon v-if="icon" :name="icon" class="w-6 h-6" :class="iconColorClass" />
        </div>
        <div>
          <p class="text-sm font-medium text-zinc-700 dark:text-zinc-200">{{ title }}</p>
          <p class="text-xs text-zinc-500">{{ description }}</p>
        </div>
      </div>

      <!-- 右侧操作区 / 数值区插槽 -->
      <slot />
    </div>

    <div
      class="absolute bottom-0 left-0 h-[2px] w-0 transition-all duration-500 group-hover:w-full opacity-50"
      :class="lineColorClass" />
  </div>
</template>

<script lang="ts" setup>
defineProps({
  title: { type: String, required: true },
  description: { type: String, required: true },
  icon: { type: String, default: '' },
  iconColorClass: { type: String, default: 'text-primary-500' },
  iconBgClass: { type: String, default: 'bg-primary-500/10' },
  lineColorClass: { type: String, default: 'bg-primary-500' }
})
</script>