<template>
  <div class="group cursor-pointer transition-all duration-300" @click="$emit('click')">
    <div
      class="relative aspect-square mb-4 transition-all duration-300 group-hover:-translate-y-2 group-hover:scale-[1.02]">
      <div
        class="w-full h-full rounded-2xl overflow-hidden ring-1 ring-white/10 group-hover:ring-white/30 shadow-2xl relative bg-neutral-500">
        <img v-if="cover" :src="processedPic"
          class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
        <div v-else
          class="w-full h-full flex items-center justify-center bg-linear-to-br from-primary/10 to-purple-500/10">
          <UIcon :name="useIcon('music')" class="w-10 h-10 text-primary/40" />
        </div>

        <!-- 悬浮按钮以及蒙版 -->
        <div
          class="absolute inset-0 bg-black/0 group-hover:bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center backdrop-blur-0 group-hover:backdrop-blur-[2px]">
          <div
            class="w-14 h-14 rounded-full bg-primary/90 text-white flex items-center justify-center shadow-xl transform scale-50 group-hover:scale-100 transition-all duration-300 hover:bg-primary">
            <UIcon :name="useIcon('play')" class="w-7 h-7 fill-current" />
          </div>
        </div>
      </div>
    </div>

    <!-- Info -->
    <div class="space-y-0.5">
      <h3 class="text-[14px] font-bold text-white truncate group-hover:text-primary transition-colors"
        :title="String(titleTooltip || title || '')">
        {{ title }}
      </h3>
      <p class="text-[12px] text-white/40 font-medium truncate" :title="String(subtitleTooltip || subtitle || '')">
        {{ subtitle }}
      </p>
    </div>
  </div>
</template>

<script lang="ts" setup>
const props = defineProps<{
  cover?: string
  title: string
  subtitle?: string | number
  titleTooltip?: string
  subtitleTooltip?: string
}>()

defineEmits(['click'])

const processedPic = computed(() => {
  if (!props.cover) return ""
  return props.cover.replace("{size}", "400")
})
</script>