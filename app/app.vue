<script setup lang="ts">

</script>

<template>
  <NuxtLoadingIndicator />
  <LayoutsSplashScreen />
  <UApp>
    <NuxtLayout>
      <NuxtPage :keepalive="{ max: 8 }" />
    </NuxtLayout>
    <UToaster />
  </UApp>
</template>
<style>
.switch-enter-active,
.switch-leave-active {
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}

.switch-enter-from {
  opacity: 0;
  transform: translateY(30px);
  filter: blur(10px);
}

.switch-leave-to {
  opacity: 0;
  transform: translateY(-30px);
  filter: blur(10px);
}
</style>