<template>
  <div class="h-full overflow-y-auto pb-24 scrollbar-hide">
    <AppleMusicPageHeader title="我的音乐" description="自建歌单与收藏">
      <template #extra>
        <UButton :icon="useIcon('refresh')" color="primary" variant="soft" class="rounded-xl hover:cursor-pointer"
          @click="fetchPlaylists">
        </UButton>
      </template>
    </AppleMusicPageHeader>



    <!-- 骨架屏 -->
    <AppleMusicSkeletonForGrid v-if="loading && musicStore.playList.length === 0" :count="8" />

    <div v-else-if="musicStore.playList.length" class="grid grid-cols-2 lg:grid-cols-4 gap-6">
      <AppleMusicGridCard v-for="item in musicStore.playList" :key="item.listid" :cover="item.cover" :title="item.title"
        :subtitle="`${item.count || 0} 首歌曲`" @click="navigateTo(`/playlist/${item.listid}`)" />
    </div>

    <AppleMusicEmptyState v-else :icon="useIcon('library')" title="空空的曲库" description="如果获取失败尝试去设置刷新登录再试试吧">
      <UButton to="/search" color="primary" class="rounded-xl px-6" variant="soft">
        去搜索歌曲
      </UButton>
    </AppleMusicEmptyState>
  </div>
</template>

<script lang="ts" setup>
definePageMeta({
  layout: "main",
});

const musicStore = useMusicStore();
const loading = ref(false);
const toast = useToast()
const fetchPlaylists = async () => {
  if (musicStore.playList.length > 0) return; // 简单缓存

  loading.value = true;
  try {
    const res = await $fetch("/api/music/playlist", {
      query: { page: 1, pagesize: 10 }
    });
    if (res.code === 0 && res.result) {


      musicStore.setPlayList(res.result);

    }
  } catch (error: any) {
    toast.add({
      icon: useIcon('error'),
      title: "获取歌单失败",
      description: error.data.message || "未知错误",
      color: "error",
    })
  } finally {
    loading.value = false;
  }
};


onMounted(() => {
  fetchPlaylists();
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