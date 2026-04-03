<template>
  <ClientOnly>
    <UModal v-model:open="isSettingsOpen" title="设置" description="管理你的账号与偏好设置" :ui="{
      overlay: 'bg-gray-900/50 backdrop-blur-sm',
      content: 'bg-zinc-100/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-white/20 shadow-2xl'
    }">
      <template #body>
        <div class="space-y-6">
          <div
            class="group relative overflow-hidden rounded-2xl bg-white/40 dark:bg-white/5 p-4 border border-white/20 transition-all hover:bg-white/60">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="p-2 bg-primary-500/10 rounded-lg">
                  <UIcon :name="useIcon('user')" class="w-6 h-6 text-primary-500" />
                </div>
                <div>
                  <p class="text-sm font-medium text-zinc-700 dark:text-zinc-200">登录凭证</p>
                  <p class="text-xs text-zinc-500">定期刷新可延长登录有效期</p>
                </div>
              </div>

              <UButton :loading="isRefreshing" variant="ghost" color="neutral"
                class="relative overflow-hidden rounded-xl px-4 py-2 hover:bg-primary-500/10 active:scale-95 group-hover:scale-105 transition-transform"
                :class="{ 'animate-pulse-subtle': !isRefreshing }" @click="handleRefreshClick">
                <template #leading>
                  <UIcon :name="useIcon('refresh')"
                    :class="['w-5 h-5 transition-all duration-700 text-gray-900', isRefreshing ? 'rotate-180 ' : 'group-hover:rotate-45']" />
                </template>
                <span class="font-semibold">立即续期</span>
              </UButton>
            </div>

            <div
              class="absolute bottom-0 left-0 h-[2px] w-0 bg-primary-500 transition-all duration-500 group-hover:w-full opacity-50" />
          </div>
        </div>
      </template>
    </UModal>
  </ClientOnly>
</template>

<script lang="ts" setup>
const toast = useToast()
const settingsStore = useSettingsStore()
const userStore = useUserStore()
const { isSettingsOpen } = storeToRefs(settingsStore)

const isRefreshing = ref(false)

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