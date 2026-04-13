<template>
  <div
    class="fixed bottom-0 left-0 right-0 z-40 bg-black/60 backdrop-blur-2xl border-t border-white/10 safe-area-bottom">
    <nav class="flex items-center justify-around h-14 max-w-screen-sm mx-auto">
      <NuxtLink v-for="link in navLinks" :key="link.to" :to="link.to"
        class="flex flex-col items-center justify-center gap-0.5 flex-1 py-1 transition-all duration-200 no-underline"
        :class="isActive(link.to) ? 'text-primary' : 'text-white/40 active:text-white/70'">
        <UIcon :name="link.icon" class="w-5 h-5" />
        <span class="text-[10px] font-medium">{{ link.label }}</span>
      </NuxtLink>

      <!-- 更多功能按钮 -->
      <button
        class="flex flex-col items-center justify-center gap-0.5 flex-1 py-1 text-white/40 active:text-white/70 transition-all duration-200"
        @click="isMobileMenuOpen = !isMobileMenuOpen">
        <UIcon name="lucide:menu" class="w-5 h-5" />
        <span class="text-[10px] font-medium">更多</span>
      </button>
    </nav>
  </div>

  <!-- 更多功能弹出面板 -->
  <ClientOnly>
    <UModal v-model:open="isMobileMenuOpen" :ui="{
      overlay: 'bg-gray-900/50 backdrop-blur-sm',
      content: 'bg-zinc-900/90 backdrop-blur-xl border border-white/10 shadow-2xl',
    }">
      <template #body>
        <div class="grid grid-cols-4 gap-4 p-4">
          <button v-for="item in moreMenuItems" :key="item.label"
            class="flex flex-col items-center gap-2 p-3 rounded-2xl bg-white/5 hover:bg-white/10 active:scale-95 transition-all"
            @click="handleMoreAction(item.action)">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center" :class="item.bgClass">
              <UIcon :name="item.icon" class="w-5 h-5" :class="item.iconClass" />
            </div>
            <span class="text-[11px] text-white/60 font-medium">{{ item.label }}</span>
          </button>
        </div>
      </template>
    </UModal>
  </ClientOnly>
</template>

<script setup lang="ts">
const settingsStore = useSettingsStore()
const { isMobileMenuOpen } = storeToRefs(settingsStore)
const route = useRoute()

// 底部导航栏只显示 4 个核心入口 + 更多按钮
const navLinks = [
  { label: '推荐', icon: useIcon('recommend'), to: '/recommendation' },
  { label: '搜索', icon: useIcon('search'), to: '/search' },
  { label: '我的', icon: useIcon('user'), to: '/mine' },
]

function isActive(to: string) {
  if (to === '/') return route.path === '/'
  if (to === '/recommendation' && route.path === '/') return true
  return route.path.startsWith(to)
}

const moreMenuItems = [
  {
    label: '盒子模式',
    icon: useIcon('tv'),
    iconClass: 'text-purple-400',
    bgClass: 'bg-purple-500/10',
    action: 'boxMode'
  },
  {
    label: '播放队列',
    icon: useIcon('list'),
    iconClass: 'text-blue-400',
    bgClass: 'bg-blue-500/10',
    action: 'queue'
  },
  {
    label: '听歌历史',
    icon: useIcon('history'),
    iconClass: 'text-amber-400',
    bgClass: 'bg-amber-500/10',
    action: 'history'
  },
  {
    label: '设置',
    icon: 'lucide:settings',
    iconClass: 'text-white/60',
    bgClass: 'bg-white/5',
    action: 'settings'
  },
  {
    label: '登录',
    icon: 'material-symbols:login',
    iconClass: 'text-green-400',
    bgClass: 'bg-green-500/10',
    action: 'login'
  },
  {
    label: '歌词',
    icon: useIcon('lyric'),
    iconClass: 'text-pink-400',
    bgClass: 'bg-pink-500/10',
    action: 'lyric'
  },
]

const router = useRouter()

function handleMoreAction(action: string) {
  isMobileMenuOpen.value = false
  nextTick(() => {
    switch (action) {
      case 'boxMode':
        settingsStore.boxMode = true
        break
      case 'queue':
        // 展开移动端侧边栏到待播清单
        settingsStore.isMobileSidebarOpen = true
        settingsStore.mobileSidebarTab = 'queue'
        break
      case 'history':
        router.push('/history')
        break
      case 'settings':
        settingsStore.isSettingsOpen = true
        break
      case 'login':
        settingsStore.showLoginModal = true
        break
      case 'lyric':
        router.push('/lyric')
        break
    }
  })
}
</script>

<style scoped>
.safe-area-bottom {
  padding-bottom: env(safe-area-inset-bottom, 0px);
}
</style>
