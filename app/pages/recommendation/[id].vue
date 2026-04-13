<template>
  <div class="pb-24 scrollbar-hide">
    <!-- Header -->
    <MusicListInfoHeader :info="recommendationInfo" />

    <!-- Actions -->
    <MusicListInfoActions @play-all="trackListRef?.playAll()" />

    <!-- Track List -->
    <MusicListInfoTrackList ref="trackListRef" :id="route.params.id as string" type="recommendation" />
  </div>
</template>

<script lang="ts" setup>
definePageMeta({
  layout: "main",
});

const toast = useToast()
const route = useRoute();
const musicStore = useMusicStore();
const trackListRef = ref();

// 从 Store 中寻找推荐歌单基础信息 (通过 id 匹配)
const recommendationInfo = computed(() => {
  return musicStore.recommendationPlayList.find(
    (p) => String(p.id) === String(route.params.id),
  );
});

// 刷新页面会导致 Store 丢失，这里自动补全
const fetchInfoIfNeeded = async () => {
  if (musicStore.recommendationPlayList.length === 0) {
    try {
      const res: any = await $fetch("/api/music/recommendation");
      if (res.code === 0 && res.result) {
        musicStore.setRecommendationPlayList(res.result);
      }
    } catch (err) {
      toast.add({
        icon: useIcon("error"),
        title: "恢复推荐元数据失败",
        color: "error"
      })
    }
  }
};

onMounted(async () => {
  // 先尝试恢复基础信息
  await fetchInfoIfNeeded();
});
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