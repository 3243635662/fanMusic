<template>
  <div class="h-full overflow-y-auto pb-24 scrollbar-hide">
    <!-- Header -->
    <MusicListInfoHeader :info="playlistInfo" />

    <!-- Actions -->
    <MusicListInfoActions @play-all="trackListRef?.playAll()" />

    <!-- Track List -->
    <MusicListInfoTrackList ref="trackListRef" :listid="route.params.id as string" />
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

// 从 Store 中寻找歌单基础信息 (通过 listid 匹配)  用来进行图片或者是一些基础信息的回显
const playlistInfo = computed(() => {
  return musicStore.playList.find(
    (p) => String(p.listid) === String(route.params.id),
  );
});

// 刷新页面会导致 Store 丢失，这里自动补全
const fetchInfoIfNeeded = async () => {
  if (musicStore.playList.length === 0) {
    try {
      const res: any = await $fetch("/api/music/playlist");
      if (res.status === 1 && res.data?.info) {
        musicStore.setPlayList(res.data.info);
      }
    } catch (err) {
      toast.add({
        icon: useIcon("error"),
        title: "恢复元数据失败",
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
