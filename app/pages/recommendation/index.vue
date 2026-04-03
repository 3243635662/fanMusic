<template>
  <InfiniteScrollContainer :has-more="displayCount < totalCount" :loading="loading"
    :show-end-message="displayList.length > 0" @load-more="onLoadMore">
    <AppleMusicPageHeader title="为你推荐" description="发现你的专属旋律" margin-bottom="mb-5">

      <template #extra>
        <UButton :icon="useIcon('refresh')" color="primary" variant="soft" class="rounded-xl"
          @click="fetchRecommendation"></UButton>
      </template>


    </AppleMusicPageHeader>


    <!-- 骨架屏) -->
    <AppleMusicSkeletonForGrid v-if="loading && displayList.length === 0" :count="8" />

    <!-- 数据 -->
    <div v-else-if="displayList.length > 0" class="grid grid-cols-2 lg:grid-cols-4 gap-6">
      <AppleMusicGridCard v-for="item in displayList" :key="item.id" :cover="item.cover" :title="item.title"
        :subtitle="item.intro" :title-tooltip="item.title" :subtitle-tooltip="item.intro"
        @click="navigateTo(`/recommendation/${item.id}`)" />
    </div>

    <AppleMusicEmptyState v-else :icon="useIcon('music')" title="暂无推荐" description="暂时没有为你找到推荐内容，过会儿再来看看吧" />
  </InfiniteScrollContainer>
</template>

<script lang="ts" setup>
import InfiniteScrollContainer from '~/components/AppleMusic/InfiniteScrollContainer.vue'
const toast = useToast()
definePageMeta({
  layout: 'main'
})

const musicStore = useMusicStore()
const loading = ref(false)

// 每次加载的数量
const PAGE_SIZE = 10
const displayCount = ref(PAGE_SIZE)

// 获取推荐数据
const fetchRecommendation = async () => {
  // 如果已有数据则不重新加载，避免骨架屏闪烁（缓存策略一致性）
  if (musicStore.recommendationPlayList.length > 0) return

  loading.value = true
  try {
    const res = await $fetch<any>('/api/music/recommendation')
    if (res.code === 0 && res.result) {
      musicStore.setRecommendationPlayList(res.result)
    }
  } catch (error: any) {
    toast.add({
      icon: useIcon('error'),
      title: "获取推荐歌单失败",
      description: error.data.message || "未知错误",
      color: "error",
    })
  } finally {
    loading.value = false
  }
}

// 总数量
const totalCount = computed(() => musicStore.recommendationPlayList.length)

// 当前显示的数据列表
const displayList = computed(() => {
  return musicStore.recommendationPlayList.slice(0, displayCount.value)
})

const onLoadMore = () => {
  if (displayCount.value < totalCount.value) {
    displayCount.value += PAGE_SIZE
  }
}


onMounted(() => {
  fetchRecommendation()
})
</script>