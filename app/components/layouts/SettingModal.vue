<template>
  <ClientOnly>
    <UModal v-model:open="isSettingsOpen" title="设置" description="管理你的账号与偏好设置" :ui="{
      overlay: 'bg-gray-900/50 backdrop-blur-sm',
      content: 'bg-zinc-100/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-white/20 shadow-2xl'
    }">
      <template #body>
        <div class="space-y-6">

          <!-- 刷新登录卡片 -->
          <LayoutsSettingCard title="登录凭证" description="定期刷新可延长登录有效期" :icon="useIcon('user')">
            <UButton :loading="isRefreshing" variant="ghost" color="neutral"
              class="relative overflow-hidden rounded-xl px-4 py-2 hover:bg-primary-500/10 active:scale-95 group-hover:scale-105 transition-transform"
              :class="{ 'animate-pulse-subtle': !isRefreshing }" @click="handleRefreshClick">
              <template #leading>
                <UIcon :name="useIcon('refresh')"
                  :class="['w-5 h-5 transition-all duration-700 text-gray-900', isRefreshing ? 'rotate-180 ' : 'group-hover:rotate-45']" />
              </template>
              <span class="font-semibold">立即续期</span>
            </UButton>
          </LayoutsSettingCard>

          <!-- 离线缓存卡片 -->
          <LayoutsSettingCard title="离线缓存" :description="`${stats.count} 首歌曲 · ${formatSize(stats.size)}`"
            :icon="useIcon('download')" line-color-class="bg-error">
            <UButton :loading="isClearing" variant="ghost" color="error"
              class="relative overflow-hidden rounded-xl px-4 py-2 hover:bg-error/10 active:scale-95 group-hover:scale-105 transition-transform"
              @click="handleClearClick">
              <template #leading>
                <UIcon :name="useIcon('close')" class="w-5 h-5 text-error" />
              </template>
              <span class="font-semibold">清理空间</span>
            </UButton>
          </LayoutsSettingCard>
        </div>
      </template>
    </UModal>
  </ClientOnly>
</template>

<script lang="ts" setup>
import { audioCache } from "@/utils/audioCache";
const toast = useToast()
const settingsStore = useSettingsStore()
const userStore = useUserStore()
const { isSettingsOpen } = storeToRefs(settingsStore)

const isRefreshing = ref(false)
const isClearing = ref(false)
const stats = ref({ count: 0, size: 0 })

const updateStats = async () => {
  if (import.meta.client && audioCache) {
    stats.value = await audioCache.getStats()
  }
}

const formatSize = (bytes: number) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 监听弹窗打开时刷新统计数据
watch(isSettingsOpen, (val) => {
  if (val) updateStats()
})

const handleRefreshClick = async () => {
  if (isRefreshing.value) return

  isRefreshing.value = true
  try {
    await userStore.refreshTokenAction()

    toast.add({
      icon: useIcon("success"),
      title: "续期成功",
      description: "您的登录状态已更新，音乐旅程继续 ~",
      color: "success",
    })
  } catch (error: any) {
    toast.add({
      icon: useIcon("error"),
      title: "续期失败",
      description: error.message || "请检查网络连接或重新登录",
      color: "error",
    })
  } finally {
    // 延迟 500ms 结束动画，防止闪烁
    setTimeout(() => {
      isRefreshing.value = false
    }, 500)
  }
}

const handleClearClick = async () => {
  if (isClearing.value) return
  isClearing.value = true

  try {
    if (import.meta.client && audioCache) {
      await audioCache.clearAll()
      await updateStats()
      toast.add({
        icon: useIcon("success"),
        title: "清理成功",
        description: "已释放本地缓存空间",
        color: "success",
      })
    }
  } catch (err) {
    toast.add({
      icon: useIcon("error"),
      title: "清理失败",
      description: "无法完全移除缓存数据",
      color: "error",
    })
  } finally {
    setTimeout(() => {
      isClearing.value = false
    }, 500)
  }
}
</script>

<style scoped>
/* 如果你想给按钮增加一个微妙的呼吸灯效果 */
@keyframes pulse-subtle {

  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }

  50% {
    opacity: 0.8;
    transform: scale(0.98);
  }
}

.refresh-btn:not(:disabled):hover {
  animation: pulse-subtle 2s infinite ease-in-out;
}
</style>