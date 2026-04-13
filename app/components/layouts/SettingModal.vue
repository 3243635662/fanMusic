<template>
  <ClientOnly>
    <UModal
      v-model:open="isSettingsOpen"
      title="设置"
      description="管理你的账号与偏好设置"
      :ui="{
        overlay: 'bg-gray-900/50 backdrop-blur-sm',
        content:
          'bg-zinc-100/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-white/20 shadow-2xl md:max-w-md md:mx-auto',
      }"
    >
      <template #body>
        <div class="space-y-6">
          <!-- 刷新登录卡片 -->
          <LayoutsSettingCard
            title="登录凭证"
            description="定期刷新可延长登录有效期"
            :icon="useIcon('user')"
          >
            <UButton
              :loading="isRefreshing"
              variant="ghost"
              color="neutral"
              class="relative overflow-hidden rounded-xl px-4 py-2 hover:bg-primary-500/10 active:scale-95 group-hover:scale-105 transition-transform"
              :class="{ 'animate-pulse-subtle': !isRefreshing }"
              @click="handleRefreshClick"
            >
              <template #leading>
                <UIcon
                  :name="useIcon('refresh')"
                  :class="[
                    'w-5 h-5 transition-all duration-700 text-gray-900',
                    isRefreshing ? 'rotate-180 ' : 'group-hover:rotate-45',
                  ]"
                />
              </template>
              <span class="font-semibold">立即续期</span>
            </UButton>
          </LayoutsSettingCard>

          <!-- 播放清单卡片 -->
          <LayoutsSettingCard
            title="待播清单"
            :description="`${musicStore.playQueue.length} 首歌曲在队列中`"
            :icon="useIcon('list')"
            line-color-class="bg-blue-500"
          >
            <UButton
              :loading="isClearingQueue"
              variant="ghost"
              color="neutral"
              class="relative overflow-hidden rounded-xl px-4 py-2 hover:bg-blue-500/10 active:scale-95 group-hover:scale-105 transition-transform"
              @click="handleClearQueueClick"
            >
              <template #leading>
                <UIcon :name="useIcon('close')" class="w-5 h-5 text-blue-500" />
              </template>
              <span class="font-semibold text-blue-500">清空队列</span>
            </UButton>
          </LayoutsSettingCard>

          <!-- 盒子模式卡片 -->
          <LayoutsSettingCard
            title="盒子模式"
            description="以 3D 卡片流浏览播放队列"
            :icon="useIcon('tv')"
            line-color-class="bg-purple-500"
            iconColorClass="text-purple-500"
            iconBgClass="bg-purple-500/10"
          >
            <UButton
              variant="ghost"
              color="neutral"
              class="relative overflow-hidden rounded-xl px-4 py-2 transition-transform active:scale-95"
              :class="
                settingsStore.boxMode
                  ? 'bg-purple-500/20'
                  : 'hover:bg-purple-500/10'
              "
              @click="settingsStore.boxMode = !settingsStore.boxMode"
            >
              <template #leading>
                <UIcon
                  :name="
                    settingsStore.boxMode ? useIcon('close') : useIcon('tv')
                  "
                  class="w-5 h-5 text-purple-500"
                />
              </template>
              <span
                class="font-semibold"
                :class="settingsStore.boxMode ? 'text-purple-500' : ''"
              >
                {{ settingsStore.boxMode ? "退出" : "开启" }}
              </span>
            </UButton>
          </LayoutsSettingCard>

          <!-- 歌词缓存清理卡片 -->
          <LayoutsSettingCard
            title="歌词缓存"
            description="清理本地歌词缓存数据"
            :icon="useIcon('download')"
            line-color-class="bg-error"
          >
            <UButton
              :loading="isClearingLyric"
              variant="ghost"
              color="error"
              class="relative overflow-hidden rounded-xl px-4 py-2 hover:bg-error/10 active:scale-95 group-hover:scale-105 transition-transform"
              @click="handleClearLyricClick"
            >
              <template #leading>
                <UIcon :name="useIcon('close')" class="w-5 h-5 text-error" />
              </template>
              <span class="font-semibold">清理缓存</span>
            </UButton>
          </LayoutsSettingCard>

          <!-- 免责声明 -->
          <div class="rounded-2xl bg-white/5 border border-white/10 p-4 space-y-2.5">
            <div class="flex items-center gap-2 text-amber-400/80">
              <UIcon name="lucide:shield-alert" class="w-5 h-5 shrink-0" />
              <span class="text-sm font-bold">免责声明</span>
            </div>
            <div class="text-xs text-gray-500/70 dark:text-white/30 leading-relaxed space-y-1.5">
              <p>该音乐源来自 <a href="https://github.com/MakcRe/KuGouMusicApi" target="_blank" rel="noopener noreferrer" class="text-primary/60 hover:text-primary underline underline-offset-2 transition-colors">KuGouMusicApi</a>，仅为学习使用，无商业情景，使用时请登录！</p>
              <p>本 Demo 源码地址 <a href="https://github.com/3243635662/fanMusic" target="_blank" rel="noopener noreferrer" class="text-primary/60 hover:text-primary underline underline-offset-2 transition-colors">fanMusic</a></p>
            </div>
          </div>
        </div>
      </template>
    </UModal>
  </ClientOnly>
</template>

<script lang="ts" setup>
import { lyricCache } from "@/utils/lyricCache";
import { audioUrlCache } from "@/utils/audioUrlCache";
const toast = useToast();
const musicStore = useMusicStore();
const settingsStore = useSettingsStore();
const userStore = useUserStore();
const { isSettingsOpen } = storeToRefs(settingsStore);

const isRefreshing = ref(false);
const isClearingQueue = ref(false);

const handleRefreshClick = async () => {
  if (isRefreshing.value) return;

  isRefreshing.value = true;
  try {
    await userStore.refreshTokenAction();

    toast.add({
      icon: useIcon("success"),
      title: "续期成功",
      description: "您的登录状态已更新，音乐旅程继续 ~",
      color: "success",
    });
  } catch (error: any) {
    toast.add({
      icon: useIcon("error"),
      title: "续期失败",
      description: error.message || "请检查网络连接或重新登录",
      color: "error",
    });
  } finally {
    // 延迟 500ms 结束动画，防止闪烁
    setTimeout(() => {
      isRefreshing.value = false;
    }, 500);
  }
};

const isClearingLyric = ref(false);

const handleClearLyricClick = async () => {
  if (isClearingLyric.value) return;
  isClearingLyric.value = true;
  try {
    if (import.meta.client && lyricCache) {
      await lyricCache.clearAll();
      if (audioUrlCache) await audioUrlCache.clearAll();
      musicStore.clearCacheUrls();
      toast.add({
        icon: useIcon("success"),
        title: "清理成功",
        description: "歌词缓存已清除",
        color: "success",
      });
    }
  } catch (err) {
    toast.add({
      icon: useIcon("error"),
      title: "清理失败",
      description: "无法完全移除缓存数据",
      color: "error",
    });
  } finally {
    setTimeout(() => {
      isClearingLyric.value = false;
    }, 500);
  }
};

const handleClearQueueClick = async () => {
  if (isClearingQueue.value) return;
  isClearingQueue.value = true;

  try {
    musicStore.clearQueue();
    toast.add({
      icon: useIcon("success"),
      title: "已清空",
      description: "播放队列已全部清除",
      color: "success",
    });
  } catch (err) {
    //
  } finally {
    setTimeout(() => {
      isClearingQueue.value = false;
    }, 500);
  }
};
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
