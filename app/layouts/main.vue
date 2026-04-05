<template>
  <div class="h-screen w-screen relative overflow-hidden bg-black font-sans text-white/90 selection:bg-white/30">
    <LayoutsVisualizer />
    <!-- 背景蒙版 -->
    <div class="absolute inset-0 bg-black/20 z-0 backdrop-blur-[1px]"></div>

    <div class="relative z-10 w-full h-full flex flex-col">
      <div class="flex-1 flex items-center justify-center p-8 relative">

        <LayoutsFloatingMenu />

        <!-- 面板 -->
        <div
          class="w-[1100px] h-[660px] rounded-4xl bg-black/10 backdrop-blur-3xl border border-white/20 shadow-2xl flex relative overflow-visible">

          <AppleMusicSidebar />

          <!-- 右侧面板内容区域 -->
          <div
            class="flex-1 flex flex-col pt-8 px-8 pb-4 relative overflow-hidden bg-linear-to-br from-white/6 to-transparent border-r border-white/10">
            <LayoutsPageHeader />
            <slot />
          </div>

          <!-- 右侧纵向控制中心 (Player) -->
          <LayoutsThePlayer />
        </div>
      </div>
    </div>

    <LayoutsSettingModal />
  </div>
</template>

<script lang="ts" setup>
// settings modal logic has been extracted into SettingModal component
</script>

<style>
body {
  margin: 0;
  padding: 0;
  overflow: hidden;
}
</style>