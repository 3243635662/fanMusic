<template>
  <div
    class="absolute -bottom-8 left-1/2 -translate-x-1/2 w-[380px] h-[52px] bg-[rgba(50,50,50,0.5)] backdrop-blur-3xl border border-white/20 rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] flex items-center px-4 z-20 overflow-hidden transform transition hover:scale-[1.02]">

    <!-- Inner fill effect for bg -->
    <div class="absolute inset-0 bg-linear-to-r from-white/10 to-transparent pointer-events-none"></div>

    <!-- Controls Left -->
    <div class="flex items-center gap-4 text-white/90 mr-4 relative z-10 w-[70px]">
      <button class="hover:text-white transition">
        <UIcon name="i-lucide-skip-back" class="w-4 h-4 fill-current text-white/80" />
      </button>
      <button class="hover:text-white transition">
        <UIcon name="i-lucide-pause" class="w-5 h-5 fill-current" />
      </button>
      <button class="hover:text-white transition">
        <UIcon name="i-lucide-skip-forward" class="w-4 h-4 fill-current text-white/80" />
      </button>
    </div>

    <!-- Song Info Box inside Player -->
    <div
      class="flex-1 flex items-center bg-black/40 rounded-xl px-2 py-1 relative z-10 border border-black/20 shadow-inner h-[38px] max-w-[190px]">
      <div
        class="w-[26px] h-[26px] rounded border border-white/10 bg-linear-to-tr from-yellow-600 to-yellow-300 shrink-0 flex items-center justify-center">
        <span class="text-white text-[5px] font-bold leading-[0.8]">T<br />BB</span>
      </div>
      <div class="flex flex-col ml-2 overflow-hidden flex-1 justify-center h-full">
        <div class="text-[12px] font-medium truncate leading-none mb-0.5 text-center px-1">Kokomo</div>
        <div class="text-[9px] text-white/50 truncate leading-none text-center px-1">The Beach Boys</div>
      </div>
      <!-- progress small indicator -->
      <div class="absolute bottom-0 left-0 h-[2px] bg-white/40 rounded-b-xl w-[45%]"></div>
    </div>

    <!-- Controls Right -->
    <div class="flex items-center justify-end gap-3.5 text-white/80 ml-auto relative z-10 w-[70px]">
      <button class="hover:text-white transition">
        <UIcon name="i-lucide-message-square" class="w-[14px] h-[14px]" />
      </button>
      <button class="hover:text-white transition">
        <UIcon name="i-lucide-list" class="w-[15px] h-[15px]" />
      </button>
      <button class="hover:text-white transition">
        <UIcon name="i-lucide-volume-2" class="w-[15px] h-[15px]" />
      </button>
    </div>
  </div>

  <!-- Track visual indicator on bottom outside of bar -->
  <div class="absolute -bottom-11 left-1/2 -translate-x-1/2 w-8 h-1 bg-white/40 rounded-full shadow-lg"></div>
</template>
