<template>
  <div class="h-screen w-screen relative overflow-hidden bg-black font-sans text-white/90 selection:bg-white/30">
    <LayoutsVisualizer />
    <!-- 背景蒙版 -->
    <div class="absolute inset-0 bg-black/20 z-0 backdrop-blur-[1px]"></div>

    <div class="relative z-10 w-full h-full flex flex-col">
      <div class="flex-1 flex items-center justify-center p-4 md:p-8 relative">

        <LayoutsFloatingMenu />

        <!-- 面板 -->
        <div
          class="max-w-[1100px] w-full h-[90vh] md:h-[660px] rounded-4xl bg-black/10 backdrop-blur-3xl border border-white/20 shadow-2xl flex relative overflow-visible transition-all duration-500">

          <ClientOnly>
            <AppleMusicSidebar v-show="isSidebarVisible" />
          </ClientOnly>

          <!-- 右侧面板内容区域 -->
          <div
            class="flex-1 flex flex-col pt-8 px-4 md:px-8 pb-4 relative overflow-hidden bg-linear-to-br from-white/6 to-transparent transition-all duration-500"
            :class="dynamicPanelClasses">
            <LayoutsPageHeader v-show="!isLyricPage" />
            <slot />
          </div>

          <!-- 右侧纵向控制中心 (Player) -->
          <ClientOnly>
            <LayoutsThePlayer />
          </ClientOnly>
        </div>
      </div>
    </div>

    <LayoutsSettingModal />
  </div>
</template>

<script lang="ts" setup>
const musicStore = useMusicStore()
const settingsStore = useSettingsStore()
const route = useRoute()
const isLyricPage = computed(() => route.path === '/lyric')

// 精确控制侧边栏的显隐时机，用于弥补布局拉伸时的视觉突兀
const isSidebarVisible = ref(true)
const isLayoutResizing = ref(false)

const isMounted = ref(false)
onMounted(() => {
  isMounted.value = true
})

const dynamicPanelClasses = computed(() => {
  if (!isMounted.value) {
    return 'rounded-4xl opacity-100 blur-0 scale-100'
  }
  return [
    (isLyricPage.value || !musicStore.currentTrack || settingsStore.isHiddenPlayer) ? 'rounded-4xl' : 'border-r border-white/10',
    isLayoutResizing.value ? 'opacity-0 blur-2xl scale-[0.98]' : 'opacity-100 blur-0 scale-100'
  ]
})

watch(() => route.path, (newPath, oldPath) => {
  // 进入歌词页：延迟收起侧边栏，等旧页面淡出后再拉伸布局
  if (newPath === '/lyric') {
    isLayoutResizing.value = true
    setTimeout(() => {
      isSidebarVisible.value = false
      setTimeout(() => { isLayoutResizing.value = false }, 300)
    }, 280) 
  } else if (oldPath === '/lyric') {
    // 离开歌词页：瞬间拉回侧边栏，让布局回正后再显示新内容
    isSidebarVisible.value = true
    isLayoutResizing.value = true
    setTimeout(() => { isLayoutResizing.value = false }, 400)
  }
}, { immediate: true })

// settings modal logic has been extracted into SettingModal component
</script>

<style>
body {
  margin: 0;
  padding: 0;
  overflow: hidden;
  background: #000;
}

/* 全局滚动条美化：平时隐藏，鼠标移入才显示 */
.custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.1) transparent;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 5px;
  height: 5px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0);
  border-radius: 20px;
  transition: background 0.3s ease;
}

.custom-scrollbar:hover::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.15);
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}

/* 隐藏部分浏览器默认滚动条 */
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>