<template>
  <div ref="container" class="h-full overflow-y-auto pb-24 scrollbar-hide">
    <slot />
    
    <!-- 加载更多状态提示 -->
    <div v-if="hasMore && loading" class="py-8 flex justify-center items-center text-white/40 text-sm">
      <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white/40" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      加载中...
    </div>
    <!-- 只有当真正开始渲染列表且没有更多数据时，才显示到底啦 -->
    <div v-else-if="!hasMore && showEndMessage" class="py-8 text-center text-white/30 text-xs">
      — 已经到底啦 —
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useInfiniteScroll } from '@vueuse/core'
import { ref } from 'vue'

const props = withDefaults(defineProps<{
  hasMore: boolean
  loading?: boolean
  showEndMessage?: boolean // 初始未加载或搜索为空时，可控制不显示“已经到底啦”
}>(), {
  loading: false,
  showEndMessage: true
})

const emit = defineEmits<{
  (e: 'loadMore'): void
}>()

const container = ref<HTMLElement | null>(null)

useInfiniteScroll(
  container,
  () => {
    if (props.hasMore && !props.loading) {
      emit('loadMore')
    }
  },
  { distance: 100 }
)
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
