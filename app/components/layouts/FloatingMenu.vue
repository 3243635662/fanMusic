<template>
  <div
    class="absolute left-12 top-1/2 -translate-y-1/2 flex flex-col items-center gap-5 py-6 px-2.5 rounded-full bg-black/30 backdrop-blur-2xl border border-white/10 shadow-2xl z-20">
    <button class="p-2.5 text-white/60 hover:text-white transition transform hover:scale-105">
      <UIcon name="i-lucide-play-circle" class="w-[22px] h-[22px]" />
    </button>
    <button class="p-2.5 text-white/60 hover:text-white transition transform hover:scale-105">
      <UIcon name="i-lucide-layout-grid" class="w-[20px] h-[20px]" />
    </button>
    <button class="p-2.5 text-white/60 hover:text-white transition transform hover:scale-105">
      <UIcon name="i-lucide-tv" class="w-[20px] h-[20px]" />
    </button>
    <div class="w-6 h-px bg-white/10 my-1"></div>
    <NuxtLink to="/login" class="p-2.5 text-white/60 hover:text-white transition transform hover:scale-105">
      <UIcon name="material-symbols:login" class="w-[20px] h-[20px]" />
    </NuxtLink>
    <button class="p-2.5 text-white transition bg-white/20 rounded-full shadow-inner transform hover:scale-105">
      <UIcon name="i-lucide-battery-charging" class="w-[20px] h-[20px]" />
    </button>
    <button class="p-2.5 text-white/60 hover:text-white transition transform hover:scale-105">
      <UIcon name="i-lucide-search" class="w-[20px] h-[20px]" />
    </button>
  </div>
</template>
