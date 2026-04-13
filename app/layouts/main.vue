<template>
  <div class="h-screen w-screen relative overflow-hidden font-sans text-white/90 selection:bg-white/30">
    <!-- 背景蒙版 -->
    <div class="absolute inset-0 bg-black/20 z-0 backdrop-blur-[1px]"></div>

    <div class="relative z-10 w-full h-full flex flex-col">

      <!-- 盒子模式：CoverFlow 全屏覆盖 -->
      <ClientOnly>
        <Transition enter-active-class="transition duration-500 ease-out" enter-from-class="opacity-0 scale-95"
          leave-active-class="transition duration-300 ease-in" leave-from-class="opacity-100 scale-100"
          leave-to-class="opacity-0 scale-95">
          <div v-if="settingsStore.boxMode" class="absolute inset-0 z-50">
            <LayoutsCoverFlow />
          </div>
        </Transition>
      </ClientOnly>

      <!-- 普通模式 -->
      <div v-show="!settingsStore.boxMode" class="flex-1 flex items-center justify-center p-2 md:p-8 relative">

        <!-- 桌面端浮动菜单 / 移动端隐藏（由底部导航替代） -->
        <LayoutsFloatingMenu class="hidden md:flex" />

        <!-- 面板：移动端全屏无边框，桌面端卡片式 -->
        <div
          class="max-w-[1100px] w-full h-full md:h-[660px] rounded-none md:rounded-4xl bg-black/10 backdrop-blur-3xl border-0 md:border border-white/0 md:border-white/20 shadow-none md:shadow-2xl flex flex-col md:flex-row relative overflow-hidden transition-all duration-500">

          <ClientOnly>
            <!-- 桌面端：内嵌侧边栏 / 移动端：隐藏（由抽屉替代） -->
            <AppleMusicSidebar v-show="isSidebarVisible" class="hidden md:flex" />
          </ClientOnly>

          <!-- 右侧面板内容区 -->
          <div id="fan-main-app-box"
            class="flex-1 flex flex-col relative overflow-hidden bg-linear-to-br from-white/6 to-transparent transition-all duration-500"
            :class="[dynamicPanelClasses, isLyricPage ? '' : 'pt-2 px-3 md:pt-8 md:px-8 pb-20 md:pb-4']">
            <LayoutsPageHeader v-show="!isLyricPage" />
            <slot />
          </div>

          <!-- 桌面端：右侧纵向控制中心 / 移动端：隐藏（由底部迷你播放条替代） -->
          <ClientOnly>
            <LayoutsThePlayer class="hidden md:flex" />
          </ClientOnly>
        </div>
      </div>

      <!-- 移动端底部导航栏（JS媒体查询 + v-if 双重保障） -->
      <ClientOnly>
        <LayoutsMobileNavBar v-if="isMobile && !settingsStore.boxMode" />
      </ClientOnly>

      <!-- 移动端底部迷你播放条 -->
      <ClientOnly>
        <LayoutsMiniPlayer v-if="isMobile && !settingsStore.boxMode" />
      </ClientOnly>

      <!-- 移动端抽屉式侧边栏 -->
      <ClientOnly>
        <LayoutsMobileSidebar v-if="isMobile" />
      </ClientOnly>
    </div>

    <LayoutsSettingModal />
    <LayoutsLoginModal />
  </div>
</template>

<!-- UI Connect Defect Fixed Flag: V2 -->
<script lang="ts" setup>
const musicStore = useMusicStore()
const settingsStore = useSettingsStore()
const route = useRoute()
const isLyricPage = computed(() => route.path === '/lyric')

// 移动端检测 + 挂载标记
const isMobile = ref(false)
const isMounted = ref(false)
let mql: MediaQueryList | null = null

onMounted(() => {
  isMounted.value = true
  mql = window.matchMedia('(max-width: 767px)')
  isMobile.value = mql.matches
  mql.addEventListener('change', (e) => { isMobile.value = e.matches })
})

onBeforeUnmount(() => {
  if (mql) mql.removeEventListener('change', () => {})
})

// 精确控制侧边栏的显隐时机
const isSidebarVisible = ref(true)
const isLayoutResizing = ref(false)

const dynamicPanelClasses = computed(() => {
  if (!isMounted.value) {
    return 'opacity-100 blur-0 scale-100'
  }
  return [
    (!musicStore.currentTrack || settingsStore.isHiddenPlayer) ? '' : 'border-r border-white/10',
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
  background: transparent;
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