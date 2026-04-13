<script setup lang="ts">
interface Props {
  title?: string
  description?: string
  marginBottom?: string
}

const props = withDefaults(defineProps<Props>(), {
  marginBottom: 'mb-8'
})
</script>

<template>
  <div class="flex items-start justify-between" :class="props.marginBottom">
    <div>
      <h1 class="text-xl md:text-3xl font-bold tracking-tight mb-0.5 text-white">
        <slot name="title">
          {{ title }}
        </slot>
      </h1>
      <p v-if="description || $slots.description" class="text-[11px] md:text-[13px] text-white/50">
        <slot name="description">
          {{ description }}
        </slot>
      </p>
    </div>
    <div v-if="$slots.extra" class="flex items-center gap-2">
      <slot name="extra" />
    </div>
  </div>
</template>
